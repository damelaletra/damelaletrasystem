import EventEmitter from "events";
import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

class ChannelHub extends EventEmitter {
  constructor() {
    super();
    this.sseClients = new Set();
    this.twilioClient = null;

    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      try {
        this.twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        console.log("[TWILIO] Client initialized successfully for Louisville number:", process.env.TWILIO_PHONE_NUMBER);
      } catch (err) {
        console.warn("[TWILIO] Initialization warning:", err.message);
      }
    }
  }

  registerSseClient(res) {
    this.sseClients.add(res);
    res.on("close", () => {
      this.sseClients.delete(res);
    });
  }

  broadcast(event, data) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of this.sseClients) {
      try {
        client.write(payload);
      } catch (err) {
        this.sseClients.delete(client);
      }
    }
  }

  async sendCustomerMessage(request, text, meta = {}) {
    const messageObj = {
      id: "msg-" + Date.now(),
      requestId: request.id,
      recipient: "CUSTOMER",
      channel: request.channel || "WEB",
      conversationRef: request.conversation_reference,
      text: text,
      timestamp: new Date().toISOString(),
      ...meta
    };

    console.log(`[CHANNEL -> CUSTOMER (${request.channel})] To: ${request.conversation_reference} | "${text}"`);
    this.broadcast("customer_message", messageObj);
    this.emit("customer_message", messageObj);

    // Real Twilio Dispatch to Customer (Only for real external inbound channels SMS/WHATSAPP)
    const isRealExternalCustomer = request.channel === "SMS" || request.channel === "WHATSAPP";
    if (
      process.env.NODE_ENV !== "test" &&
      !this.disableTwilioForTesting &&
      this.twilioClient &&
      isRealExternalCustomer &&
      request.conversation_reference &&
      request.conversation_reference.startsWith("+1")
    ) {
      try {
        const isWhatsApp = request.channel === "WHATSAPP";
        const toNumber = isWhatsApp
          ? `whatsapp:${request.conversation_reference}`
          : request.conversation_reference;
        const fromNumber = isWhatsApp
          ? `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`
          : process.env.TWILIO_PHONE_NUMBER;

        const twilioMsg = await this.twilioClient.messages.create({
          body: text,
          from: fromNumber,
          to: toNumber
        });
        console.log(`[TWILIO -> CUSTOMER SUCCESS] SID: ${twilioMsg.sid} from ${fromNumber} to ${toNumber}`);
      } catch (err) {
        console.error(`[TWILIO -> CUSTOMER ERROR] Failed to send to ${request.conversation_reference}:`, err.message);
      }
    }

    return messageObj;
  }

  async sendProviderBriefing(provider, request, briefingText, meta = {}) {
    const briefingObj = {
      id: "brief-" + Date.now(),
      requestId: request.id,
      recipient: "PROVIDER",
      providerId: provider.id,
      providerName: provider.name,
      channel: provider.preferred_channel || "WHATSAPP",
      phone: provider.phone,
      text: briefingText,
      progressiveInquiry: meta.progressiveInquiry || null,
      timestamp: new Date().toISOString(),
      expiresInSec: meta.expiresInSec || 180,
      ...meta
    };

    console.log(`[CHANNEL -> PROVIDER (${provider.preferred_channel})] To: ${provider.name} (${provider.phone}) | "${briefingText}"`);
    this.broadcast("provider_briefing", briefingObj);
    this.emit("provider_briefing", briefingObj);

    // Real Twilio Dispatch to Provider (Only for real external customer requests, NEVER for WEB simulator testing)
    const isRealExternalRequest = request && (request.channel === "SMS" || request.channel === "WHATSAPP");
    if (
      process.env.NODE_ENV !== "test" &&
      !this.disableTwilioForTesting &&
      this.twilioClient &&
      isRealExternalRequest &&
      provider.phone &&
      provider.phone.startsWith("+1")
    ) {
      try {
        const isWhatsApp = provider.preferred_channel === "WHATSAPP";
        const toNumber = isWhatsApp
          ? `whatsapp:${provider.phone}`
          : provider.phone;
        const fromNumber = isWhatsApp
          ? `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`
          : process.env.TWILIO_PHONE_NUMBER;

        const twilioMsg = await this.twilioClient.messages.create({
          body: briefingText,
          from: fromNumber,
          to: toNumber
        });
        console.log(`[TWILIO -> PROVIDER SUCCESS] SID: ${twilioMsg.sid} to ${provider.name} (${toNumber})`);
      } catch (err) {
        console.error(`[TWILIO -> PROVIDER ERROR] Failed to send to ${provider.phone}:`, err.message);
      }
    }

    return briefingObj;
  }

  async sendProviderDirectMessage(provider, text, meta = {}) {
    const msgObj = {
      id: "prov-msg-" + Date.now(),
      recipient: "PROVIDER",
      providerId: provider.id,
      providerName: provider.name,
      channel: provider.preferred_channel || "WHATSAPP",
      phone: provider.phone,
      text: text,
      timestamp: new Date().toISOString(),
      ...meta
    };

    console.log(`[CHANNEL -> PROVIDER DIRECT (${provider.preferred_channel})] To: ${provider.name} (${provider.phone}) | "${text}"`);
    this.broadcast("provider_direct_message", msgObj);
    this.emit("provider_direct_message", msgObj);

    if (
      process.env.NODE_ENV !== "test" &&
      !this.disableTwilioForTesting &&
      this.twilioClient &&
      provider.phone &&
      provider.phone.startsWith("+1")
    ) {
      try {
        const isWhatsApp = provider.preferred_channel === "WHATSAPP";
        const toNumber = isWhatsApp
          ? `whatsapp:${provider.phone}`
          : provider.phone;
        const fromNumber = isWhatsApp
          ? `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`
          : process.env.TWILIO_PHONE_NUMBER;

        let twilioMsg;
        try {
          twilioMsg = await this.twilioClient.messages.create({
            body: text,
            from: fromNumber,
            to: toNumber
          });
          console.log(`[TWILIO -> PROVIDER DIRECT SUCCESS] SID: ${twilioMsg.sid} to ${provider.name} (${toNumber})`);
        } catch (waErr) {
          if (isWhatsApp) {
            console.warn(`[TWILIO -> PROVIDER DIRECT] WhatsApp sender not active yet, falling back to SMS:`, waErr.message);
            twilioMsg = await this.twilioClient.messages.create({
              body: text,
              from: process.env.TWILIO_PHONE_NUMBER,
              to: provider.phone
            });
            console.log(`[TWILIO -> PROVIDER DIRECT SMS FALLBACK SUCCESS] SID: ${twilioMsg.sid} to ${provider.name} (${provider.phone})`);
          } else {
            throw waErr;
          }
        }
      } catch (err) {
        console.error(`[TWILIO -> PROVIDER DIRECT ERROR] Failed to send to ${provider.phone}:`, err.message);
      }
    }

    return msgObj;
  }

  notifyStatusUpdate(request, status, meta = {}) {
    const payload = {
      requestId: request ? request.id : null,
      status: status,
      timestamp: new Date().toISOString(),
      ...meta
    };
    this.broadcast("request_status_update", payload);
  }
}

export const channels = new ChannelHub();
