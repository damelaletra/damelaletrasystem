import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { initialBusinesses, initialProviders, externalPublicDirectory } from "./seedData.js";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = (process.env.VERCEL || process.env.NODE_ENV === "production")
  ? path.join("/tmp", "dml_database.json")
  : path.join(__dirname, "../../data/dml_database.json");

class Database {
  constructor() {
    this.data = {
      businesses: [],
      providers: [],
      requests: [],
      quotes: [],
      connections: [],
      external_discoveries: [],
      event_logs: [],
      affiliates: []
    };
    
    const supabaseUrl = process.env.SUPABASE_URL || "https://flzkesblrmtlqtdmnnpg.supabase.co";
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsemtlc2Jscm10bHF0ZG1ubnBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDYxNDY5MywiZXhwIjoyMTA2MTkwNjkzfQ.aF8fp_7Juc98uzJNL2hRg3XKiyLkrojDTc3CjJbajd4";
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async initDb() {
    console.log("[DB] Connecting to Supabase and pulling persistent state...");
    try {
      const tables = ['providers', 'businesses', 'requests', 'quotes', 'connections', 'external_discoveries', 'event_logs', 'affiliates'];
      for (const table of tables) {
        const { data, error } = await this.supabase.from(table).select('*');
        if (!error && data) {
           this.data[table] = data.map(row => row.data);
        }
      }

      if (this.data.providers.length === 0) {
        console.log("[DB] Supabase is empty. Seeding founding providers...");
        this.data.providers = JSON.parse(JSON.stringify(initialProviders));
        this.data.businesses = JSON.parse(JSON.stringify(initialBusinesses));
        for (const p of this.data.providers) await this.syncRecord('providers', p);
        for (const b of this.data.businesses) await this.syncRecord('businesses', b);
      } else {
        console.log(`[DB] Successfully loaded state from Supabase (${this.data.requests.length} requests, ${this.data.providers.length} providers).`);
      }
    } catch (err) {
      console.error("[DB] Supabase init error:", err.message);
    }
  }

  async syncRecord(table, record) {
    if (!record || !record.id) return;
    this.supabase.from(table).upsert({ id: record.id, data: record }).then(({error}) => {
       if (error) console.error(`[DB] Supabase sync error for ${table}:`, error.message);
    });
  }

  save() {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.promises.writeFile(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8").catch(()=>{});
    } catch (err) {}
  }

  // Providers
  getProviders(filterFn = null) {
    if (filterFn) return this.data.providers.filter(filterFn);
    return this.data.providers;
  }

  getProviderById(id) {
    return this.data.providers.find(p => p.id === id);
  }

  getProviderByPhone(phone) {
    return this.data.providers.find(p => p.phone === phone);
  }

  getProvidersByPhone(phone) {
    return this.data.providers.filter(p => p.phone === phone);
  }

  getActiveWaitingRequestForPhone(phone) {
    return this.data.requests.find(r => {
      if (r.status !== "WAITING_PROVIDER" && r.status !== "WAITING_CUSTOMER_CLARIFICATION") return false;
      const provider = this.getProviderById(r.matched_provider_id);
      return provider && provider.phone === phone;
    });
  }

  getRecentRequestsForPhone(phone, limit = 5) {
    return this.data.requests
      .filter(r => r.conversation_reference === phone)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);
  }

  async recoverActiveRequestForProvider(provider) {
    const existing = this.data.requests.find(
      r => r.status === "WAITING_PROVIDER" || r.status === "WAITING_CUSTOMER_CLARIFICATION" || r.status === "WAITING_CUSTOMER"
    );
    if (existing) {
      if (!existing.matched_provider_id) existing.matched_provider_id = provider.id;
      return existing;
    }

    try {
      const { channels } = await import("./channels.js");
      if (channels.twilioClient && process.env.TWILIO_PHONE_NUMBER) {
        const msgs = await channels.twilioClient.messages.list({
          to: process.env.TWILIO_PHONE_NUMBER,
          limit: 10
        });
        const providerPhones = new Set(this.data.providers.map(p => p.phone));
        const customerMsg = msgs.find(m => !providerPhones.has(m.from));
        if (customerMsg) {
          const req = this.createRequest({
            channel: "SMS",
            conversation_reference: customerMsg.from,
            raw_message: customerMsg.body,
            service_category: provider.category,
            matched_provider_id: provider.id,
            status: "WAITING_PROVIDER"
          });
          return req;
        }
      }
    } catch (e) {
      console.warn("[DB] recoverActiveRequest error:", e.message);
    }
    return null;
  }

  updateProvider(id, updates) {
    const idx = this.data.providers.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.data.providers[idx] = {
        ...this.data.providers[idx],
        ...updates,
        updated_at: new Date().toISOString()
      };
      this.save();
      this.syncRecord('providers', this.data.providers[idx]);
      return this.data.providers[idx];
    }
    return null;
  }

  // Requests
  getRequests(filterFn = null) {
    if (filterFn) return this.data.requests.filter(filterFn);
    return this.data.requests;
  }

  getRequestById(id) {
    return this.data.requests.find(r => r.id === id);
  }

  createRequest(requestData) {
    const now = new Date().toISOString();
    const req = {
      id: requestData.id || "req-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
      channel: requestData.channel || "WEB",
      conversation_reference: requestData.conversation_reference || "conv-" + Date.now(),
      language: requestData.language || "es",
      raw_message: requestData.raw_message,
      normalized_intent: requestData.normalized_intent || null,
      service_category: requestData.service_category || null,
      service_type: requestData.service_type || null,
      description: requestData.description || null,
      location_raw: requestData.location_raw || null,
      latitude: requestData.latitude || null,
      longitude: requestData.longitude || null,
      property_type: requestData.property_type || "UNKNOWN", // UNKNOWN, RESIDENTIAL, COMMERCIAL
      urgency: requestData.urgency || "MEDIUM",
      preferred_time: requestData.preferred_time || null,
      customer_constraints: requestData.customer_constraints || {},
      status: requestData.status || "NEW",
      matched_provider_id: null,
      candidate_provider_ids: [],
      contacted_provider_ids: [],
      cascade_step: 0,
      cascade_expires_at: null,
      quoted_price: null,
      estimated_arrival: null,
      customer_confirmation: 0,
      connection_status: "NOT_STARTED",
      created_at: now,
      updated_at: now,
      completed_at: null
    };
    this.data.requests.unshift(req);
    this.save();
    this.syncRecord('requests', req);
    this.logEvent(req.id, "REQUEST_CREATED", "CUSTOMER", { raw_message: req.raw_message });
    return req;
  }

  updateRequest(id, updates) {
    const idx = this.data.requests.findIndex(r => r.id === id);
    if (idx !== -1) {
      this.data.requests[idx] = {
        ...this.data.requests[idx],
        ...updates,
        updated_at: new Date().toISOString()
      };
      this.save();
      this.syncRecord('requests', this.data.requests[idx]);
      return this.data.requests[idx];
    }
    return null;
  }

  // Quotes
  createQuote(quoteData) {
    const quote = {
      id: "quote-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
      request_id: quoteData.request_id,
      provider_id: quoteData.provider_id,
      quoted_price: quoteData.quoted_price,
      quoted_price_display: quoteData.quoted_price_display || (quoteData.quoted_price ? `$${quoteData.quoted_price}` : null),
      estimated_arrival: quoteData.estimated_arrival,
      notes: quoteData.notes || "",
      status: "PENDING",
      created_at: new Date().toISOString(),
      expires_at: quoteData.expires_at || null
    };
    this.data.quotes.push(quote);
    this.save();
    this.syncRecord('quotes', quote);
    this.logEvent(quote.request_id, "QUOTE_RECEIVED", "PROVIDER", {
      provider_id: quote.provider_id,
      price: quote.quoted_price,
      eta: quote.estimated_arrival
    });
    return quote;
  }

  // Connections
  createConnection(connData) {
    const conn = {
      id: "conn-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
      request_id: connData.request_id,
      provider_id: connData.provider_id,
      channel: connData.channel || "WHATSAPP",
      customer_contact: connData.customer_contact || "Customer",
      provider_contact: connData.provider_contact,
      status: "CONNECTED",
      connected_at: new Date().toISOString(),
      completed_at: null
    };
    this.data.connections.push(conn);
    this.save();
    this.syncRecord('connections', conn);
    this.logEvent(conn.request_id, "CONNECTION_CREATED", "SYSTEM", {
      provider_id: conn.provider_id
    });
    return conn;
  }

  // External discoveries
  createExternalDiscovery(discoveryData) {
    const item = {
      id: "ext-" + Date.now(),
      request_id: discoveryData.request_id,
      business_name: discoveryData.business_name,
      phone: discoveryData.phone,
      address: discoveryData.address,
      service_indicated: discoveryData.service_indicated,
      source: discoveryData.source || "PUBLIC_DIRECTORY",
      disclaimer_sent: 1,
      created_at: new Date().toISOString()
    };
    this.data.external_discoveries.push(item);
    this.save();
    this.syncRecord('external_discoveries', item);
    this.logEvent(item.request_id, "EXTERNAL_DISCOVERY_PRESENTED", "SYSTEM", item);
    return item;
  }

  // Affiliates
  getAffiliateById(id) {
    return this.data.affiliates.find(a => a.id === id);
  }

  createAffiliate(affiliateData) {
    const affiliate = {
      id: affiliateData.id, // e.g. 'KENTU24'
      name: affiliateData.name,
      contact: affiliateData.contact || null,
      commission_type: affiliateData.commission_type || "RESIDUAL", // RESIDUAL or BOUNTY
      commission_amount: affiliateData.commission_amount || 10,
      created_at: new Date().toISOString()
    };
    this.data.affiliates.push(affiliate);
    this.save();
    this.syncRecord('affiliates', affiliate);
    return affiliate;
  }

  // Event & Observability Logging
  logEvent(requestId, eventType, actor, payload = {}) {
    const event = {
      id: "ev-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
      request_id: requestId,
      event_type: eventType,
      actor: actor, // CUSTOMER, PROVIDER, SYSTEM, OPERATOR
      payload: payload,
      created_at: new Date().toISOString()
    };
    this.data.event_logs.unshift(event);
    if (this.data.event_logs.length > 500) {
      this.data.event_logs.pop(); // keep last 500
    }
    this.save();
    this.syncRecord('event_logs', event);
    return event;
  }

  getEventLogs(requestId = null) {
    if (requestId) {
      return this.data.event_logs.filter(e => e.request_id === requestId);
    }
    return this.data.event_logs;
  }

  // Louisville Public Directory Search
  searchPublicDirectory(queryCategory) {
    return externalPublicDirectory.filter(
      item => item.category === queryCategory || (item.services && Array.isArray(item.services) && item.services.includes(queryCategory))
    );
  }
}

export const db = new Database();
