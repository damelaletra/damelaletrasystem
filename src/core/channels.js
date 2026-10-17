import EventEmitter from "events";
import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

class ChannelHub extends EventEmitter {
  constructor() {
    super();
    this.sseClients = new Set();
    this.twilioClient = null;

    this.enableRealTwilio = process.env.ENABLE_REAL_TWILIO === "true";

    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      try {
        this.twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        if (this.enableRealTwilio) {
          console.log("[TWILIO] Client initialized for LIVE external dispatch:", process.env.TWILIO_PHONE_NUMBER);
        } else {
          console.log("[TWILIO] Client initialized in SIMULATION/LOCAL mode (Real external SMS is MUTED). Set ENABLE_REAL_TWILIO=true to enable live SMS.");
        }
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

  isRealDeliverablePhone(phone) {
    if (!phone || typeof phone !== "string" || !phone.startsWith("+1")) return false;
    if (
      phone.startsWith("+1502555") ||
      phone.startsWith("+1502999") ||
      phone.startsWith("+1502444") ||
      phone.startsWith("+1502888")
    ) {
      return false;
    }
    return true;
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

    // Real Twilio Dispatch to Customer (Only when ENABLE_REAL_TWILIO=true)
    const isRealExternalCustomer = request.channel === "SMS" || request.channel === "WHATSAPP";
    if (
      this.enableRealTwilio &&
      process.env.NODE_ENV !== "test" &&
      !this.disableTwilioForTesting &&
      this.twilioClient &&
      isRealExternalCustomer &&
      this.isRealDeliverablePhone(request.conversation_reference)
    ) {
      try {
        const isWhatsApp = request.channel === "WHATSAPP";
        const toNumber = isWhatsApp
          ? `whatsapp:${request.conversation_reference}`
          : request.conversation_reference;
        const fromNumber = isWhatsApp
          ? (process.env.TWILIO_WHATSAPP_NUMBER || `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`)
          : process.env.TWILIO_PHONE_NUMBER;

        let twilioMsg;
        if (isWhatsApp && meta.promptConfirmation) {
          const providerName = meta.providerName || "un profesional verificado";
          const eta = meta.eta || "lo antes posible";
          const price = meta.price || "estimado personalizado";
          try {
            twilioMsg = await this.twilioClient.messages.create({
              from: fromNumber,
              to: toNumber,
              contentSid: process.env.TWILIO_CONTENT_CONFIRM_SID || "HX687eda3abb375ebc420d32e5792d287d",
              contentVariables: JSON.stringify({
                "1": providerName,
                "2": eta,
                "3": price
              })
            });
            console.log(`[TWILIO -> CUSTOMER WHATSAPP BUTTONS SUCCESS] SID: ${twilioMsg.sid} to ${toNumber}`);
            if (twilioMsg && twilioMsg.sid) {
              this.verifyCustomerTemplateOrFallbackToText(twilioMsg.sid, fromNumber, toNumber, text);
            }
          } catch (tplErr) {
            console.warn(`[TWILIO -> WHATSAPP BUTTONS FALLBACK] ${tplErr.message}`);
            twilioMsg = await this.twilioClient.messages.create({
              body: text,
              from: fromNumber,
              to: toNumber
            });
            console.log(`[TWILIO -> CUSTOMER SUCCESS] SID: ${twilioMsg.sid} from ${fromNumber} to ${toNumber}`);
          }
        } else {
          twilioMsg = await this.twilioClient.messages.create({
            body: text,
            from: fromNumber,
            to: toNumber
          });
          console.log(`[TWILIO -> CUSTOMER SUCCESS] SID: ${twilioMsg.sid} from ${fromNumber} to ${toNumber}`);
        }
      } catch (err) {
        console.error(`[TWILIO -> CUSTOMER ERROR] Failed to send to ${request.conversation_reference}:`, err.message);
      }
    }

    return messageObj;
  }

  verifyCustomerTemplateOrFallbackToText(messageSid, fromNumber, toNumber, text) {
    if (!this.twilioClient || !messageSid) return;
    setTimeout(async () => {
      try {
        const msg = await this.twilioClient.messages(messageSid).fetch();
        if (msg.status === "undelivered" || msg.status === "failed" || msg.errorCode) {
          console.warn(`[TWILIO CUSTOMER TEMPLATE FALLBACK] Template ${messageSid} failed (${msg.status}/${msg.errorCode}). Sending plain WhatsApp text...`);
          await this.twilioClient.messages.create({
            body: text,
            from: fromNumber,
            to: toNumber
          });
        }
      } catch (err) {
        console.warn(`[TWILIO CUSTOMER TEMPLATE CHECK WARNING] ${err.message}`);
      }
    }, 2500);
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

    // Real Twilio Dispatch to Provider (Only when ENABLE_REAL_TWILIO=true)
    const isRealExternalRequest = request && (request.channel === "SMS" || request.channel === "WHATSAPP");
    if (
      this.enableRealTwilio &&
      process.env.NODE_ENV !== "test" &&
      !this.disableTwilioForTesting &&
      this.twilioClient &&
      isRealExternalRequest &&
      this.isRealDeliverablePhone(provider.phone)
    ) {
      try {
        const isWhatsApp = provider.preferred_channel === "WHATSAPP";
        const toNumber = isWhatsApp
          ? `whatsapp:${provider.phone}`
          : provider.phone;
        const fromNumber = isWhatsApp
          ? (process.env.TWILIO_WHATSAPP_NUMBER || `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`)
          : process.env.TWILIO_PHONE_NUMBER;

        let twilioMsg;
        const msgPayload = {
          body: briefingText,
          from: fromNumber,
          to: toNumber
        };
        if (request && request.media_url && isWhatsApp) {
          msgPayload.mediaUrl = [request.media_url];
        }

        try {
          twilioMsg = await this.twilioClient.messages.create(msgPayload);
          console.log(`[TWILIO -> PROVIDER SUCCESS] SID: ${twilioMsg.sid} to ${provider.name} (${toNumber})`);
          if (isWhatsApp && twilioMsg && twilioMsg.sid) {
            this.verifyWhatsAppDeliveryOrFallbackToSms(twilioMsg.sid, provider, briefingText, request);
          }
        } catch (waErr) {
          if (isWhatsApp) {
            console.warn(`[TWILIO -> PROVIDER BRIEFING] WhatsApp sender failed, falling back to SMS:`, waErr.message);
            twilioMsg = await this.twilioClient.messages.create({
              body: briefingText,
              from: process.env.TWILIO_PHONE_NUMBER,
              to: provider.phone
            });
            console.log(`[TWILIO -> PROVIDER BRIEFING SMS FALLBACK SUCCESS] SID: ${twilioMsg.sid} to ${provider.name} (${provider.phone})`);
          } else {
            throw waErr;
          }
        }
      } catch (err) {
        console.error(`[TWILIO -> PROVIDER ERROR] Failed to send to ${provider.phone}:`, err.message);
      }
    }

    return briefingObj;
  }

  verifyWhatsAppDeliveryOrFallbackToSms(messageSid, provider, text, request = null) {
    if (!this.twilioClient || !messageSid || !provider || !provider.phone) return;

    const sendSmsFallback = async () => {
      try {
        const smsFallback = await this.twilioClient.messages.create({
          body: `${text}\n\n💬 (Nota: Tu ventana de 24h de WhatsApp estaba cerrada; puedes responder por aquí en SMS o por WhatsApp al +1 502-673-1333)`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: provider.phone
        });
        console.log(`[TWILIO WHATSAPP -> SMS AUTO-FALLBACK SUCCESS] SID: ${smsFallback.sid} to ${provider.phone}`);
      } catch (smsErr) {
        console.error(`[TWILIO SMS FALLBACK ERROR] Could not send SMS fallback to ${provider.phone}:`, smsErr.message);
      }
    };

    const checkDelivery = async (attempt = 1) => {
      try {
        const msg = await this.twilioClient.messages(messageSid).fetch();
        if (msg.status === "undelivered" || msg.status === "failed" || msg.errorCode) {
          console.warn(`[TWILIO WHATSAPP 24H WINDOW] Freeform WhatsApp ${messageSid} to ${provider.name} (${provider.phone}) rejected (${msg.status}/${msg.errorCode}). Attempting official WhatsApp Template HX9d7dc23006b7016855694efa0c4f6ab7...`);
          const fromWhatsApp = process.env.TWILIO_WHATSAPP_NUMBER || `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`;
          const toWhatsApp = `whatsapp:${provider.phone}`;
          const providerTemplateSid = process.env.TWILIO_CONTENT_PROVIDER_SID || "HX9d7dc23006b7016855694efa0c4f6ab7";
          const locationLabel = (request && request.location_zone) || "Louisville, KY";
          const serviceSummary = (request && (request.raw_message || request.subcategory)) || text.slice(0, 140);

          try {
            const tplMsg = await this.twilioClient.messages.create({
              from: fromWhatsApp,
              to: toWhatsApp,
              contentSid: providerTemplateSid,
              contentVariables: JSON.stringify({
                "1": provider.name || "Socio",
                "2": String(locationLabel),
                "3": String(serviceSummary)
              })
            });
            console.log(`[TWILIO WHATSAPP TEMPLATE SENT] SID: ${tplMsg.sid} to ${toWhatsApp}`);
            // Verify template delivery after 2.5s (in case template is still pending Meta approval)
            setTimeout(async () => {
              try {
                const checkTpl = await this.twilioClient.messages(tplMsg.sid).fetch();
                if (checkTpl.status === "undelivered" || checkTpl.status === "failed" || checkTpl.errorCode) {
                  console.warn(`[TWILIO WHATSAPP TEMPLATE NOT READY] (${checkTpl.status}/${checkTpl.errorCode}) -> Falling back to SMS`);
                  await sendSmsFallback();
                }
              } catch (e) {
                await sendSmsFallback();
              }
            }, 2500);
          } catch (tplErr) {
            console.warn(`[TWILIO WHATSAPP TEMPLATE ERROR] ${tplErr.message} -> Falling back to SMS`);
            await sendSmsFallback();
          }
          return;
        }
        if ((msg.status === "queued" || msg.status === "sending" || msg.status === "accepted") && attempt < 2) {
          setTimeout(() => checkDelivery(attempt + 1), 3000);
        }
      } catch (err) {
        console.warn(`[TWILIO DELIVERY CHECK WARNING] Could not verify ${messageSid}:`, err.message);
      }
    };

    setTimeout(() => checkDelivery(1), 2500);
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
      this.enableRealTwilio &&
      process.env.NODE_ENV !== "test" &&
      !this.disableTwilioForTesting &&
      this.twilioClient &&
      this.isRealDeliverablePhone(provider.phone)
    ) {
      try {
        const isWhatsApp = provider.preferred_channel === "WHATSAPP";
        const toNumber = isWhatsApp
          ? `whatsapp:${provider.phone}`
          : provider.phone;
        const fromNumber = isWhatsApp
          ? (process.env.TWILIO_WHATSAPP_NUMBER || `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`)
          : process.env.TWILIO_PHONE_NUMBER;

        let twilioMsg;
        try {
          twilioMsg = await this.twilioClient.messages.create({
            body: text,
            from: fromNumber,
            to: toNumber
          });
          console.log(`[TWILIO -> PROVIDER DIRECT SUCCESS] SID: ${twilioMsg.sid} to ${provider.name} (${toNumber})`);
          if (isWhatsApp && twilioMsg && twilioMsg.sid) {
            this.verifyWhatsAppDeliveryOrFallbackToSms(twilioMsg.sid, provider, text);
          }
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
