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

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4500;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false })); // Needed for Twilio Webhooks
app.use(express.static(path.join(__dirname, "public")));

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

// 1. Real-time Server-Sent Events (SSE)
app.get(["/api/events", "/events"], (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  channels.registerSseClient(res);

  res.write(`event: connected\ndata: {"status":"ok","time":"${new Date().toISOString()}"}\n\n`);
});

// 2. Real Twilio Webhook (SMS & WhatsApp Gateway)
app.post(["/api/webhooks/twilio", "/webhooks/twilio"], async (req, res) => {
  try {
    const rawFrom = req.body.From || "";
    const bodyText = (req.body.Body || "").trim();
    const isWhatsApp = rawFrom.startsWith("whatsapp:");
    const cleanPhone = rawFrom.replace("whatsapp:", "").trim();
    const channel = isWhatsApp ? "WHATSAPP" : "SMS";

    console.log(`[TWILIO WEBHOOK] Inbound ${channel} from ${cleanPhone}: "${bodyText}"`);

    // 1. Check if sender is a registered provider
    const provider = db.getProviderByPhone(cleanPhone);

    if (provider) {
      const waitingReq = db.getActiveWaitingRequestForPhone(cleanPhone) || (await db.recoverActiveRequestForProvider(provider));
      const activeProviderId = (waitingReq && waitingReq.matched_provider_id) ? waitingReq.matched_provider_id : provider.id;
      const resolvedProvider = db.getProviderById(activeProviderId) || provider;
      console.log(`[TWILIO WEBHOOK] Inbound identified as Provider: ${resolvedProvider.name} (${cleanPhone}) for request: ${waitingReq?.id || 'none'}`);
      await cascadingEngine.handleProviderResponse(activeProviderId, bodyText, waitingReq?.id);
    } else {
      console.log(`[TWILIO WEBHOOK] Processing as Customer request: "${bodyText}"`);
      await stateMachine.processCustomerInput(bodyText, channel, cleanPhone);
    }

    // Return empty TwiML response
    res.type("text/xml").send("<Response></Response>");
  } catch (err) {
    console.error("[TWILIO WEBHOOK ERROR]", err);
    res.status(500).type("text/xml").send("<Response></Response>");
  }
});

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

// 4. Provider Response Gateway (Web Simulator Gateway)
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

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  DAME LA LETRA (DML) - Core Engine Running on Port ${PORT}`);
  console.log(`  Twilio Louisville Inbound Webhook: /api/webhooks/twilio`);
  console.log(`  Louisville Network Operational (+1 502-673-1333)`);
  console.log(`  - Customer Portal:     http://localhost:${PORT}/`);
  console.log(`  - Concierge Admin:     http://localhost:${PORT}/admin.html`);
  console.log(`  - Provider Simulator:  http://localhost:${PORT}/provider.html`);
  console.log(`======================================================\n`);
});

export default app;
