import { db } from "./db.js";
import { channels } from "./channels.js";
import { handleExternalFallback } from "./fallback.js";

// Active timers for cascading steps
const activeTimeouts = new Map();

/**
 * Cascading Dispatch Engine
 * Contacts one eligible provider at a time, protecting provider relationships.
 */
export class CascadingEngine {
  constructor(timeoutMs = 60000) {
    this.defaultTimeoutMs = timeoutMs;
  }

  startCascade(request, rankedCandidates) {
    if (!rankedCandidates || rankedCandidates.length === 0) {
      console.log(`[CASCADE] No eligible candidates for request ${request.id}. Triggering fallback.`);
      return handleExternalFallback(request);
    }

    const candidateIds = rankedCandidates.map(c => c.provider.id);

    db.updateRequest(request.id, {
      candidate_provider_ids: candidateIds,
      cascade_step: 0,
      status: "CONTACTING_PROVIDER"
    });

    return this.dispatchNextCandidate(request.id);
  }

  dispatchNextCandidate(requestId) {
    if (activeTimeouts.has(requestId)) {
      clearTimeout(activeTimeouts.get(requestId));
      activeTimeouts.delete(requestId);
    }

    const request = db.getRequestById(requestId);
    if (!request) return;

    const candidateIds = request.candidate_provider_ids || [];
    const step = request.cascade_step || 0;

    if (step >= candidateIds.length) {
      console.log(`[CASCADE] All ${candidateIds.length} candidates exhausted for request ${requestId}.`);
      return handleExternalFallback(request);
    }

    const providerId = candidateIds[step];
    const provider = db.getProviderById(providerId);

    if (!provider) {
      db.updateRequest(requestId, { cascade_step: step + 1 });
      return this.dispatchNextCandidate(requestId);
    }

    let briefing = `Hola ${provider.name}. `;
    if (request.service_type === "TIRE_CHANGE") {
      briefing += `Tenemos un cliente con una goma ponchada en ${request.location_raw}. `;
    } else if (request.service_category === "HVAC") {
      briefing += `Tenemos un cliente con el aire sin enfriar en ${request.location_raw}. `;
    } else if (request.service_category === "PLUMBING") {
      briefing += `Tenemos un cliente con una fuga/problema de plomería en ${request.location_raw}. `;
    } else {
      briefing += `Tenemos un cliente que necesita ayuda con "${request.raw_message}" en ${request.location_raw}. `;
    }

    let progressiveInquiry = null;
    if (request.property_type === "COMMERCIAL" && provider.commercial_capable === -1) {
      progressiveInquiry = {
        field: "commercial_capable",
        question: "¿Trabajas comercial?"
      };
      briefing += `(Es un local comercial/oficina, ¿haces comercial?) `;
    }

    briefing += `¿Puedes atenderlo? ¿Cuánto cobras y en qué tiempo llegarías?`;

    const expiresAt = new Date(Date.now() + this.defaultTimeoutMs).toISOString();

    const contacted = request.contacted_provider_ids || [];
    if (!contacted.includes(provider.id)) {
      contacted.push(provider.id);
    }

    db.updateRequest(requestId, {
      status: "WAITING_PROVIDER",
      matched_provider_id: provider.id,
      contacted_provider_ids: contacted,
      cascade_expires_at: expiresAt
    });

    db.logEvent(requestId, "PROVIDER_CONTACTED", "SYSTEM", {
      provider_id: provider.id,
      provider_name: provider.name,
      step: step,
      briefing: briefing
    });

    channels.sendProviderBriefing(provider, request, briefing, {
      cascadeStep: step,
      totalCandidates: candidateIds.length,
      expiresInSec: Math.round(this.defaultTimeoutMs / 1000),
      progressiveInquiry: progressiveInquiry
    });

    channels.notifyStatusUpdate(request, "WAITING_PROVIDER", {
      providerName: provider.display_name,
      step: step + 1,
      total: candidateIds.length
    });

    const timer = setTimeout(() => {
      console.log(`[CASCADE] Provider ${provider.name} timed out for request ${requestId}. Advancing.`);
      db.logEvent(requestId, "PROVIDER_TIMEOUT", "SYSTEM", {
        provider_id: provider.id,
        step: step
      });
      db.updateRequest(requestId, { cascade_step: step + 1 });
      this.dispatchNextCandidate(requestId);
    }, this.defaultTimeoutMs);

    activeTimeouts.set(requestId, timer);
    return { success: true, provider, step };
  }

  handleProviderResponse(providerId, rawResponse, requestId = null) {
    let request;
    if (requestId) {
      request = db.getRequestById(requestId);
    } else {
      const activeRequests = db.getRequests(r => r.status === "WAITING_PROVIDER" && r.matched_provider_id === providerId);
      request = activeRequests[0];
    }

    const provider = db.getProviderById(providerId);
    if (!provider) return { error: "Provider not found" };

    const text = (rawResponse || "").toLowerCase();

    // 1. Check progressive profile updates (UNKNOWN != NO)
    if (text.includes("hago comercial") || text.includes("hacemos comercial") || (text.includes("comercial") && (text.includes("sí") || text.includes("si")))) {
      db.updateProvider(provider.id, { commercial_capable: 1 });
      db.logEvent(request ? request.id : null, "PROVIDER_PROFILE_LEARNED", "SYSTEM", {
        provider_id: provider.id,
        field: "commercial_capable",
        value: 1
      });
      console.log(`[PROGRESSIVE PROFILE] Learned: Provider ${provider.name} commercial_capable = 1`);
    } else if (text.includes("no hago comercial") || text.includes("solo residencial")) {
      db.updateProvider(provider.id, { commercial_capable: 0 });
      db.logEvent(request ? request.id : null, "PROVIDER_PROFILE_LEARNED", "SYSTEM", {
        provider_id: provider.id,
        field: "commercial_capable",
        value: 0
      });
      console.log(`[PROGRESSIVE PROFILE] Learned: Provider ${provider.name} commercial_capable = 0`);
    }

    // 2. Operational availability rules
    if (text.includes("hoy no trabajo") || text.includes("no trabajo hoy") || text.includes("no puedo hoy")) {
      db.updateProvider(provider.id, { availability_status: "OFF_DUTY" });
      console.log(`[OPERATIONAL AVAILABILITY] ${provider.name} marked OFF_DUTY for today.`);
    }

    if (!request) {
      return { message: "No active request pending for this provider." };
    }

    if (activeTimeouts.has(request.id)) {
      clearTimeout(activeTimeouts.get(request.id));
      activeTimeouts.delete(request.id);
    }

    // 3. Check if declined
    const declineWords = ["no puedo", "ocupado", "no llego", "paso", "no hago ese trabajo", "imposible"];
    const isDecline = declineWords.some(w => text.includes(w)) || text.trim() === "no";

    if (isDecline && !text.includes("sí") && !text.includes("si")) {
      db.logEvent(request.id, "PROVIDER_DECLINED", "PROVIDER", {
        provider_id: provider.id,
        response: rawResponse
      });

      db.updateRequest(request.id, {
        cascade_step: (request.cascade_step || 0) + 1
      });
      return this.dispatchNextCandidate(request.id);
    }

    // 4. Parse Quote (Price & ETA)
    // Extract ETA first to isolate duration numbers
    let eta = "30 minutos";
    const etaMatch = text.match(/(\d{1,3})\s*(minutos?|mins?|horas?|hrs?)/i);
    let matchedEtaNum = null;
    if (etaMatch) {
      matchedEtaNum = etaMatch[1];
      eta = `${etaMatch[1]} ${etaMatch[2]}`;
    } else if (provider.conditional_rules && provider.conditional_rules.standard_response_time_min) {
      eta = `${provider.conditional_rules.standard_response_time_min} minutos`;
    }

    // Extract price
    let price = null;
    const dollarMatch = text.match(/\$\s*(\d{2,4})/);
    if (dollarMatch) {
      price = parseFloat(dollarMatch[1]);
    } else {
      const verbPriceMatch = text.match(/(?:cobro|son|serian|cuesta)\s*\$?(\d{2,4})/i);
      if (verbPriceMatch) {
        price = parseFloat(verbPriceMatch[1]);
      } else {
        const allNums = [...text.matchAll(/\b(\d{2,4})\b/g)];
        for (const numMatch of allNums) {
          if (numMatch[1] !== matchedEtaNum) {
            price = parseFloat(numMatch[1]);
            break;
          }
        }
      }
    }

    if (!price) {
      price = provider.conditional_rules?.default_callout_fee || 80;
    }

    // Create quote
    const quote = db.createQuote({
      request_id: request.id,
      provider_id: provider.id,
      quoted_price: price,
      estimated_arrival: eta,
      notes: rawResponse
    });

    db.updateRequest(request.id, {
      status: "QUOTE_RECEIVED",
      quoted_price: price,
      estimated_arrival: eta
    });

    // Zero-friction Customer Response
    const customerResponse = `Listo. ${provider.display_name} puede atenderte. Está aproximadamente a ${eta} y cobra $${price}. ¿Quieres que te lo conecte?`;

    channels.sendCustomerMessage(request, customerResponse, {
      quoteId: quote.id,
      providerName: provider.display_name,
      price: price,
      eta: eta,
      promptConfirmation: true
    });

    db.updateRequest(request.id, { status: "WAITING_CUSTOMER" });

    return { success: true, quote, request };
  }
}

export const cascadingEngine = new CascadingEngine(45000);
