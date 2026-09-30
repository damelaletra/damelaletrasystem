import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { db } from "./src/core/db.js";
import { stateMachine } from "./src/core/stateMachine.js";
import { cascadingEngine } from "./src/core/cascading.js";
import { channels } from "./src/core/channels.js";
import { getObservabilityMetrics } from "./src/core/observability.js";
import { stripeService } from "./src/core/stripeService.js";

import { providerOnboarding } from "./src/core/providerOnboarding.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4500;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false })); // Needed for Twilio Webhooks
app.use(express.static(path.join(__dirname, "public")));

// Explicit Health Check for Railway
app.get(["/", "/health"], (req, res) => {
  res.status(200).send("DML Engine Online");
});

// Direct Page Routes
app.get(["/simulator", "/simulator.html"], (req, res) => {
  res.sendFile(path.join(__dirname, "public", "simulator.html"));
});
app.get(["/admin", "/admin.html"], (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});
app.get(["/provider", "/provider.html"], (req, res) => {
  res.sendFile(path.join(__dirname, "public", "provider.html"));
});

// Health check
app.get(["/api/health", "/health"], (req, res) => {
  res.json({
    status: "ok",
    twilioReady: !!channels.twilioClient,
    twilioPhone: process.env.TWILIO_PHONE_NUMBER || null,
    accountSidSet: !!process.env.TWILIO_ACCOUNT_SID,
    authTokenSet: !!process.env.TWILIO_AUTH_TOKEN,
    nodeEnv: process.env.NODE_ENV || "development"
  });
});

// Real-time Server-Sent Events (SSE)
app.get(["/api/events", "/events"], (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  channels.registerSseClient(res);

  res.write(`event: connected\ndata: {"status":"ok","time":"${new Date().toISOString()}"}\n\n`);
});

// --- Concurrency & Race Condition Lock (Hueco #5) ---
const processingQueue = new Map();

function enqueueMessageProcessing(phone, processingFunction) {
  if (!processingQueue.has(phone)) {
    processingQueue.set(phone, Promise.resolve());
  }
  const queue = processingQueue.get(phone);
  
  const updatedQueue = queue.then(() => {
    return processingFunction().catch(err => console.error(`[QUEUE ERROR] for ${phone}:`, err));
  });
  
  processingQueue.set(phone, updatedQueue);
  
  updatedQueue.then(() => {
    if (processingQueue.get(phone) === updatedQueue) {
      processingQueue.delete(phone);
    }
  });
}
// ---------------------------------------------------

// --- RATE LIMITER (Anti-Spam Escudo 1) ---
const rateLimitMap = new Map();
const LIMIT_WINDOW_MS = 60000; // 1 minuto
const MAX_MESSAGES_PER_WINDOW = 5;

// 2. Real Twilio Webhook (SMS & WhatsApp Gateway) - Async Decoupled (Hueco #4)
app.post(["/api/webhooks/twilio", "/webhooks/twilio"], (req, res) => {
  try {
    const rawFrom = req.body.From || "";
    const bodyText = (req.body.Body || "").trim();
    const isWhatsApp = rawFrom.startsWith("whatsapp:");
    const cleanPhone = rawFrom.replace("whatsapp:", "").trim();
    const channel = isWhatsApp ? "WHATSAPP" : "SMS";

    // --- ESCUDO RATE LIMITER ---
    const now = Date.now();
    if (!rateLimitMap.has(cleanPhone)) {
      rateLimitMap.set(cleanPhone, []);
    }
    let timestamps = rateLimitMap.get(cleanPhone);
    timestamps = timestamps.filter(t => now - t < LIMIT_WINDOW_MS);
    timestamps.push(now);
    rateLimitMap.set(cleanPhone, timestamps);

    if (timestamps.length > MAX_MESSAGES_PER_WINDOW) {
      console.warn(`[RATE LIMITER] 🛑 Bloqueando a ${cleanPhone} por posible spam (${timestamps.length} msgs en 1 min)`);
      // Ignorar silenciosamente a nivel de servidor HTTP (cero llamadas a IA, cero lecturas de DB)
      return res.type("text/xml").send("<Response></Response>"); 
    }
    // ---------------------------

    // 1. Inmediatamente responder a Twilio (HTTP 200) para evitar Timeouts de 15s de Gemini
    res.type("text/xml").send("<Response></Response>");

    // 2. Encolar el procesamiento en background para evitar Race Conditions
    enqueueMessageProcessing(cleanPhone, async () => {
      console.log(`\n[TWILIO WEBHOOK] Empieza procesamiento de ${channel} desde ${cleanPhone}: "${bodyText}"`);

      const provider = db.getProviderByPhone(cleanPhone);
      const waitingReq = provider ? db.getActiveWaitingRequestForPhone(cleanPhone) : null;

      if (provider && waitingReq) {
        const activeProviderId = waitingReq.matched_provider_id || provider.id;
        const resolvedProvider = db.getProviderById(activeProviderId) || provider;
        console.log(`[TWILIO WEBHOOK] Inbound identified as Provider Quote: ${resolvedProvider.name} (${cleanPhone}) para request: ${waitingReq.id}`);
        await cascadingEngine.handleProviderResponse(activeProviderId, bodyText, waitingReq.id);
      } else if (provider && !waitingReq) {
        console.log(`[TWILIO WEBHOOK] Inbound identified as Provider Direct Message: ${provider.name} (${cleanPhone})`);
        const onboardingResult = await providerOnboarding.handleProviderDirectMessage(provider, bodyText, channel);
        if (onboardingResult && onboardingResult.isCustomerRequest) {
          console.log(`[TWILIO WEBHOOK] Rerouting provider direct message as a Customer request from ${cleanPhone}`);
          await stateMachine.processCustomerInput(bodyText, channel, cleanPhone);
        }
      } else {
        console.log(`[TWILIO WEBHOOK] Processing as Customer request from ${cleanPhone}`);
        await stateMachine.processCustomerInput(bodyText, channel, cleanPhone);
      }
    });

  } catch (err) {
    console.error("[TWILIO WEBHOOK ERROR]", err);
    if (!res.headersSent) res.status(500).type("text/xml").send("<Response></Response>");
  }
});

// --- 2.5 TWILIO VOICE INTEGRATION (Llamadas IA - Demo Fase 2) ---
app.post(["/api/webhooks/voice", "/webhooks/voice"], (req, res) => {
  const twiml = `
    <Response>
      <Gather input="speech" action="/api/webhooks/voice/process" language="es-US" timeout="3" speechTimeout="auto">
        <Say voice="alice" language="es-MX">Hola, estás llamando a Dame La Letra. Por favor, cuéntanos qué servicio necesitas después del tono.</Say>
      </Gather>
    </Response>
  `;
  res.type("text/xml").send(twiml);
});

app.post(["/api/webhooks/voice/process", "/webhooks/voice/process"], (req, res) => {
  const speechText = req.body.SpeechResult || "";
  const rawFrom = req.body.From || "";
  const cleanPhone = rawFrom.replace("+", "").trim();

  if (speechText) {
    console.log(`\n[TWILIO VOICE] Cliente ${cleanPhone} habló por teléfono: "${speechText}"`);
    
    // Procesar usando exactamente el mismo cerebro de la plataforma (cascada)
    enqueueMessageProcessing(cleanPhone, async () => {
      // Pasamos "VOICE" como canal, pero internamente responderemos por SMS
      await stateMachine.processCustomerInput(speechText, "SMS", cleanPhone); 
    });
  }

  const twiml = `
    <Response>
      <Say voice="alice" language="es-MX">Entendido. Estoy buscando a los mejores proveedores en tu área. Por favor, revisa tu celular en unos segundos, te enviaré un mensaje de texto con las opciones. ¡Hasta pronto!</Say>
      <Hangup/>
    </Response>
  `;
  res.type("text/xml").send(twiml);
});
// ----------------------------------------------------------------

// 3. Customer Message Ingestion (Web UI Gateway)
app.post(["/api/customer/message", "/customer/message"], async (req, res) => {
  try {
    const { message, conversationRef = "web-client-1", channel = "WEB" } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message cannot be empty." });
    }

    const result = await stateMachine.processCustomerInput(message, channel, conversationRef);
    return res.json({ success: true, result });
  } catch (err) {
    console.error("[API] Customer message error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// 4. Provider Response Gateway (Web Simulator Gateway for Quotes)
app.post(["/api/provider/response", "/provider/response"], async (req, res) => {
  try {
    const { providerId, response, requestId } = req.body;
    if (!providerId || !response) {
      return res.status(400).json({ error: "providerId and response are required." });
    }

    const result = await cascadingEngine.handleProviderResponse(providerId, response, requestId);
    return res.json({ success: true, result });
  } catch (err) {
    console.error("[API] Provider response error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// 4.1 Provider Direct Conversational Message (Profile Updates & Onboarding)
app.post(["/api/provider/message", "/provider/message"], async (req, res) => {
  try {
    const { providerId, message, channel = "WHATSAPP" } = req.body;
    const provider = db.getProviderById(providerId) || db.getProviderByPhone(providerId) || db.getProviderById("prov-miguel-sosa");
    if (!provider) {
      return res.status(404).json({ error: "Provider not found" });
    }
    const result = await providerOnboarding.handleProviderDirectMessage(provider, message, channel);
    return res.json({ success: true, result });
  } catch (err) {
    console.error("[API] Provider direct message error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// 4.2 Unified Provider Chat (Automated Context Detection: Lead Quote vs Profile Training)
app.post(["/api/provider/chat", "/provider/chat"], async (req, res) => {
  try {
    const { message, providerId = "prov-miguel-sosa", channel = "WHATSAPP" } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message cannot be empty." });
    }

    const provider = db.getProviderById(providerId) || db.getProviderByPhone(providerId) || db.getProviderById("prov-miguel-sosa") || db.getProviders()[0];
    if (!provider) {
      return res.status(404).json({ error: "Provider not found" });
    }

    // Check if there is an active waiting request for this provider or any active waiting request in the system
    let waitingReq = db.getActiveWaitingRequestForPhone(provider.phone) ||
      db.getRequests(r => (r.status === "WAITING_PROVIDER" || r.status === "WAITING_CUSTOMER_CLARIFICATION") && r.matched_provider_id === provider.id)[0];

    // In simulation mode, if no request is matched strictly to this provider id, check if there's any active waiting request
    if (!waitingReq) {
      const anyWaiting = db.getRequests(r => r.status === "WAITING_PROVIDER" || r.status === "WAITING_CUSTOMER_CLARIFICATION");
      if (anyWaiting.length > 0) {
        waitingReq = anyWaiting[0];
      }
    }

    if (waitingReq) {
      const targetProviderId = waitingReq.matched_provider_id || provider.id;
      const targetProvider = db.getProviderById(targetProviderId) || provider;
      console.log(`[PROVIDER CHAT] Identified as Quote/Clarification response for Request ${waitingReq.id} by ${targetProvider.name}`);
      const result = await cascadingEngine.handleProviderResponse(targetProviderId, message, waitingReq.id);
      const updatedReq = db.getRequestById(waitingReq.id);
      const updatedProvider = db.getProviderById(targetProviderId);

      channels.broadcast("ai_intelligence_update", {
        actor: "PROVIDER",
        mode: "QUOTE_RESPONSE",
        provider: updatedProvider,
        request: updatedReq,
        rawMessage: message,
        result: result,
        timestamp: new Date().toISOString()
      });

      return res.json({
        success: true,
        mode: "QUOTE_RESPONSE",
        request: updatedReq,
        provider: updatedProvider,
        result
      });
    } else {
      console.log(`[PROVIDER CHAT] Identified as Conversational Profile Training for ${provider.name}`);
      const result = await providerOnboarding.handleProviderDirectMessage(provider, message, channel);
      const updatedProvider = db.getProviderById(provider.id);

      channels.broadcast("ai_intelligence_update", {
        actor: "PROVIDER",
        mode: "PROFILE_TRAINING",
        provider: updatedProvider,
        rawMessage: message,
        result: result,
        timestamp: new Date().toISOString()
      });

      return res.json({
        success: true,
        mode: "PROFILE_TRAINING",
        provider: updatedProvider,
        result
      });
    }
  } catch (err) {
    console.error("[API] Provider chat error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// 4.3 Get Provider Profile
app.get("/api/provider/profile/:id", (req, res) => {
  const provider = db.getProviderById(req.params.id) || db.getProviderByPhone(req.params.id);
  if (!provider) return res.status(404).json({ error: "Provider not found" });
  return res.json({ provider });
});

// 4.4 Reset Provider Profile for Clean Training from Scratch
app.post("/api/admin/reset-provider-profile", (req, res) => {
  const { providerId = "prov-miguel-sosa" } = req.body;
  const blankState = {
    bio: "Perfil nuevo sin entrenar. Escribe en el chat para cargar servicios y datos.",
    services: [],
    pricing_notes: "Sin tarifas configuradas",
    website: "",
    availability_status: "AVAILABLE",
    base_location_name: "Louisville Metro"
  };
  const updated = db.updateProvider(providerId, blankState);
  
  channels.broadcast("ai_intelligence_update", {
    actor: "SYSTEM",
    mode: "PROFILE_RESET",
    provider: updated,
    message: "Perfil del negocio reiniciado a blanco para entrenamiento desde cero.",
    timestamp: new Date().toISOString()
  });

  return res.json({ success: true, provider: updated, message: "Perfil reiniciado a cero exitosamente." });
});

// 5. Request Queries
app.get("/api/requests", (req, res) => {
  const requests = db.getRequests();
  return res.json({ requests });
});

app.get("/api/requests/:id", (req, res) => {
  const request = db.getRequestById(req.params.id);
  if (!request) return res.status(404).json({ error: "Request not found" });
  const logs = db.getEventLogs(req.params.id);
  return res.json({ request, logs });
});

// 6. Providers Management & Progressive Profiles
app.get("/api/providers", (req, res) => {
  const providers = db.getProviders();
  return res.json({ providers });
});

app.post("/api/providers/:id/availability", (req, res) => {
  const { availability_status, capacity_today, conditional_rules } = req.body;
  const updated = db.updateProvider(req.params.id, {
    ...(availability_status && { availability_status }),
    ...(capacity_today !== undefined && { capacity_today }),
    ...(conditional_rules && { conditional_rules })
  });
  if (!updated) return res.status(404).json({ error: "Provider not found" });
  return res.json({ success: true, provider: updated });
});

// 7. Operator Concierge Overrides
app.post("/api/admin/assign", (req, res) => {
  const { requestId, providerId } = req.body;
  const result = stateMachine.operatorAssignProvider(requestId, providerId);
  return res.json({ success: true, result });
});

app.post("/api/admin/fallback", (req, res) => {
  const { requestId } = req.body;
  const result = stateMachine.operatorForceFallback(requestId);
  return res.json({ success: true, result });
});

app.post("/api/admin/reset", (req, res) => {
  db.seed();
  return res.json({ success: true, message: "Database reseeded to pristine Louisville network." });
});

// 8. Observability & Demand Intelligence
app.get("/api/metrics", (req, res) => {
  const metrics = getObservabilityMetrics();
  return res.json(metrics);
});

// 9. Stripe Payments, Billing, Invoicing & Connect API
app.post("/api/stripe/subscribe", async (req, res) => {
  try {
    const { providerId, planTier } = req.body;
    const provider = db.getProviderById(providerId);
    if (!provider) return res.status(404).json({ error: "Provider not found" });

    const session = await stripeService.createSubscriptionCheckout(provider, planTier);
    return res.json({ success: true, url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("[API STRIPE ERROR]", err);
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/stripe/lead-fee", async (req, res) => {
  try {
    const { providerId, requestId } = req.body;
    const provider = db.getProviderById(providerId);
    const request = db.getRequestById(requestId);
    if (!provider || !request) return res.status(404).json({ error: "Provider or Request not found" });

    const session = await stripeService.createLeadFeeCheckout(provider, request);
    return res.json({ success: true, url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("[API STRIPE ERROR]", err);
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/stripe/connect", async (req, res) => {
  try {
    const { providerId } = req.body;
    const provider = db.getProviderById(providerId);
    if (!provider) return res.status(404).json({ error: "Provider not found" });

    const accountLink = await stripeService.createConnectOnboardingLink(provider);
    return res.json({ success: true, url: accountLink.url });
  } catch (err) {
    console.error("[API STRIPE ERROR]", err);
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/stripe/invoice", async (req, res) => {
  try {
    const { providerId } = req.body;
    const provider = db.getProviderById(providerId);
    if (!provider) return res.status(404).json({ error: "Provider not found" });

    const completed = db.getRequests(r => r.matched_provider_id === providerId && r.status === "CONNECTED");
    const invoice = await stripeService.createMonthlyLeadInvoice(provider, completed);
    return res.json({ success: true, invoice });
  } catch (err) {
    console.error("[API STRIPE ERROR]", err);
    return res.status(500).json({ error: err.message });
  }
});

app.post("/api/webhooks/stripe", async (req, res) => {
  try {
    const event = req.body;
    await stripeService.handleWebhookEvent(event);
    return res.json({ received: true });
  } catch (err) {
    console.error("[STRIPE WEBHOOK ERROR]", err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

db.initDb().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n======================================================`);
    console.log(`  DAME LA LETRA (DML) - Core Engine Running on Port ${PORT} (0.0.0.0)`);
    console.log(`  Twilio Louisville Inbound Webhook: /api/webhooks/twilio`);
    console.log(`  Louisville Network Operational (+1 502-673-1333)`);
    console.log(`  - Customer Portal:     http://localhost:${PORT}/`);
    console.log(`  - Concierge Admin:     http://localhost:${PORT}/admin.html`);
    console.log(`  - Provider Simulator:  http://localhost:${PORT}/provider.html`);
    console.log(`======================================================\n`);
  });
});

export default app;
