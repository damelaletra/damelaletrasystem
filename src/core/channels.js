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

  sanitizeTemplateVar(val, maxLen = 180) {
    return String(val || "")
      .replace(/[\r\n\t]+/g, " - ")
      .replace(/\s{2,}/g, " ")
      .trim()
      .slice(0, maxLen);
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
          const providerName = this.sanitizeTemplateVar(meta.providerName || "un profesional verificado", 60);
          const eta = this.sanitizeTemplateVar(meta.eta || "lo antes posible", 60);
          const price = this.sanitizeTemplateVar(meta.price || "estimado personalizado", 60);
          try {
            twilioMsg = await this.twilioClient.messages.create({
              from: fromNumber,
              to: toNumber,
              contentSid: process.env.TWILIO_CONTENT_CONFIRM_SID || "HXd7168eb00c510a0ffb3b97f7b7ae73de",
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
        } else if (isWhatsApp && meta.appointmentReminder) {
          const providerName = this.sanitizeTemplateVar(meta.providerName || "tu especialista", 60);
          const serviceLabel = this.sanitizeTemplateVar(meta.serviceLabel || "tu consulta", 80);
          const appointmentTime = this.sanitizeTemplateVar(meta.appointmentTime || "próximamente", 60);
          try {
            twilioMsg = await this.twilioClient.messages.create({
              from: fromNumber,
              to: toNumber,
              contentSid: process.env.TWILIO_CONTENT_REMINDER_CUST_SID || "HXf88ae296c6e1c6702fae16fa31200dbf",
              contentVariables: JSON.stringify({
                "1": providerName,
                "2": serviceLabel,
                "3": appointmentTime
              })
            });
            console.log(`[TWILIO -> CUSTOMER APPOINTMENT REMINDER TEMPLATE SUCCESS] SID: ${twilioMsg.sid} to ${toNumber}`);
            if (twilioMsg && twilioMsg.sid) {
              this.verifyCustomerTemplateOrFallbackToText(twilioMsg.sid, fromNumber, toNumber, text, request.conversation_reference);
            }
          } catch (tplErr) {
            twilioMsg = await this.twilioClient.messages.create({
              body: text,
              from: fromNumber,
              to: toNumber
            });
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

  verifyCustomerTemplateOrFallbackToText(messageSid, fromNumber, toNumber, text, customerPhone = null) {
    if (!this.twilioClient || !messageSid) return;
    const checkCustomerTpl = async (attempt = 1) => {
      try {
        const msg = await this.twilioClient.messages(messageSid).fetch();
        if (msg.status === "delivered" || msg.status === "read") return;
        if (msg.status === "undelivered" || msg.status === "failed" || msg.errorCode) {
          console.warn(`[TWILIO CUSTOMER TEMPLATE FALLBACK] Template ${messageSid} failed (${msg.status}/${msg.errorCode}). Sending plain WhatsApp text...`);
          const fallbackWa = await this.twilioClient.messages.create({
            body: text,
            from: fromNumber,
            to: toNumber
          });
          if (customerPhone && fallbackWa && fallbackWa.sid) {
            setTimeout(async () => {
              try {
                const checkWa = await this.twilioClient.messages(fallbackWa.sid).fetch();
                if (checkWa.status === "undelivered" || checkWa.status === "failed" || checkWa.errorCode) {
                  await this.twilioClient.messages.create({
                    body: text,
                    from: process.env.TWILIO_PHONE_NUMBER,
                    to: customerPhone
                  });
                }
              } catch (e) {}
            }, 5500);
          }
          return;
        }
        if ((msg.status === "queued" || msg.status === "sending" || msg.status === "accepted" || msg.status === "sent") && attempt < 4) {
          setTimeout(() => checkCustomerTpl(attempt + 1), 2500);
        }
      } catch (err) {
        console.warn(`[TWILIO CUSTOMER TEMPLATE CHECK WARNING] ${err.message}`);
      }
    };
    setTimeout(() => checkCustomerTpl(1), 2500);
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

        if (isWhatsApp) {
          const isConnectionConfirmation = meta.connectionConfirmed || (briefingText && briefingText.includes("Conexión Confirmada"));
          const isClarificationRelay = Boolean(meta.isClarificationRelay);

          try {
            if (!isClarificationRelay) {
              // ALWAYS assume the 24h WhatsApp window is closed for initial job outreach and connection confirmations:
              // send the official Meta-approved template directly on the first attempt (zero 63016 delay).
              let templateSid;
              let templateVars;

              if (isConnectionConfirmation) {
                templateSid = process.env.TWILIO_CONTENT_CONNECTED_SID || "HX78ff5d4f4fd9d640d0e174c9f44508ac"; // dame_la_letra_conexion_confirmada
                const phoneMatch = briefingText && briefingText.match(/\+1\d{10}/);
                const customerPhone = meta.customerPhone || (request && request.conversation_reference) || (phoneMatch ? phoneMatch[0] : "en tu panel");
                const quoteSummary = meta.quoteSummary || (request && request.quoted_price_display) || (request && request.quoted_price ? `$${request.quoted_price}` : "tu propuesta");
                templateVars = {
                  "1": this.sanitizeTemplateVar(provider.name || "Socio", 60),
                  "2": this.sanitizeTemplateVar(quoteSummary, 80),
                  "3": this.sanitizeTemplateVar(customerPhone, 40)
                };
              } else {
                templateSid = process.env.TWILIO_CONTENT_PROVIDER_SID || "HX9d7dc23006b7016855694efa0c4f6ab7"; // dame_la_letra_nuevo_trabajo
                const locationLabel = (request && (request.location_raw || request.location_zone)) || "Louisville, KY";
                let rawSummary = (request && (request.raw_message || request.subcategory || request.service_type)) || briefingText;
                if (request && request.visual_analysis && request.visual_analysis.detected_problem && !String(rawSummary).includes(request.visual_analysis.detected_problem)) {
                  rawSummary += ` (Diagnóstico: ${request.visual_analysis.detected_problem})`;
                }
                templateVars = {
                  "1": this.sanitizeTemplateVar(provider.name || "Socio", 60),
                  "2": this.sanitizeTemplateVar(locationLabel, 60),
                  "3": this.sanitizeTemplateVar(rawSummary, 180)
                };
              }

              twilioMsg = await this.twilioClient.messages.create({
                from: fromNumber,
                to: toNumber,
                contentSid: templateSid,
                contentVariables: JSON.stringify(templateVars)
              });
              console.log(`[TWILIO -> PROVIDER WHATSAPP TEMPLATE DIRECT SUCCESS] SID: ${twilioMsg.sid} (${templateSid}) to ${provider.name} (${toNumber})`);
              if (twilioMsg && twilioMsg.sid) {
                this.verifyWhatsAppTemplateOrFallbackToSms(twilioMsg.sid, provider, briefingText);
              }
            } else {
              // Clarification relay: provider just asked a question so 24h window is active, with template/SMS safety net
              const msgPayload = {
                body: briefingText,
                from: fromNumber,
                to: toNumber
              };
              if (request && request.media_url) {
                msgPayload.mediaUrl = [request.media_url];
              }
              twilioMsg = await this.twilioClient.messages.create(msgPayload);
              console.log(`[TWILIO -> PROVIDER SUCCESS] SID: ${twilioMsg.sid} to ${provider.name} (${toNumber})`);
              if (twilioMsg && twilioMsg.sid) {
                this.verifyWhatsAppDeliveryOrFallbackToSms(twilioMsg.sid, provider, briefingText, request, meta);
              }
            }
          } catch (waErr) {
            console.warn(`[TWILIO -> PROVIDER BRIEFING] WhatsApp dispatch failed, falling back to SMS:`, waErr.message);
            twilioMsg = await this.twilioClient.messages.create({
              body: briefingText,
              from: process.env.TWILIO_PHONE_NUMBER,
              to: provider.phone
            });
            console.log(`[TWILIO -> PROVIDER BRIEFING SMS FALLBACK SUCCESS] SID: ${twilioMsg.sid} to ${provider.name} (${provider.phone})`);
          }
        } else {
          twilioMsg = await this.twilioClient.messages.create({
            body: briefingText,
            from: fromNumber,
            to: toNumber
          });
          console.log(`[TWILIO -> PROVIDER SMS SUCCESS] SID: ${twilioMsg.sid} to ${provider.name} (${toNumber})`);
        }
      } catch (err) {
        console.error(`[TWILIO -> PROVIDER ERROR] Failed to send to ${provider.phone}:`, err.message);
      }
    }

    return briefingObj;
  }

  verifyWhatsAppTemplateOrFallbackToSms(messageSid, provider, fallbackText) {
    if (!this.twilioClient || !messageSid || !provider || !provider.phone) return;

    const sendSmsFallback = async () => {
      try {
        const smsFallback = await this.twilioClient.messages.create({
          body: `${fallbackText}\n\n💬 (Puedes responder por aquí en SMS o por WhatsApp al +1 502-673-1333)`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: provider.phone
        });
        console.log(`[TWILIO WHATSAPP TEMPLATE -> SMS AUTO-FALLBACK SUCCESS] SID: ${smsFallback.sid} to ${provider.phone}`);
      } catch (smsErr) {
        console.error(`[TWILIO SMS FALLBACK ERROR] Could not send SMS fallback to ${provider.phone}:`, smsErr.message);
      }
    };

    const verifyTpl = async (attempt = 1) => {
      try {
        const checkTpl = await this.twilioClient.messages(messageSid).fetch();
        if (checkTpl.status === "delivered" || checkTpl.status === "read") return;
        if (checkTpl.status === "undelivered" || checkTpl.status === "failed" || checkTpl.errorCode) {
          console.warn(`[TWILIO WHATSAPP TEMPLATE FAILED] (${checkTpl.status}/${checkTpl.errorCode}) -> Falling back to SMS for ${provider.phone}`);
          await sendSmsFallback();
          return;
        }
        if ((checkTpl.status === "queued" || checkTpl.status === "sending" || checkTpl.status === "accepted" || checkTpl.status === "sent") && attempt < 4) {
          setTimeout(() => verifyTpl(attempt + 1), 2500);
        }
      } catch (err) {
        console.warn(`[TWILIO TEMPLATE CHECK WARNING] Could not verify ${messageSid}:`, err.message);
      }
    };

    setTimeout(() => verifyTpl(1), 2500);
  }

  verifyWhatsAppDeliveryOrFallbackToSms(messageSid, provider, text, request = null, meta = {}) {
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
        if (msg.status === "delivered" || msg.status === "read") {
          return;
        }
        if (msg.status === "undelivered" || msg.status === "failed" || msg.errorCode) {
          const fromWhatsApp = process.env.TWILIO_WHATSAPP_NUMBER || `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`;
          const toWhatsApp = `whatsapp:${provider.phone}`;

          // Choose the right official WhatsApp template based on message context
          const isConnectionConfirmation = meta.connectionConfirmed || (text && text.includes("Conexión Confirmada"));
          const isWelcomeMessage = meta.welcomeProvider || (text && text.includes("bienvenido a la red"));
          const isAppointmentReminder = meta.appointmentReminder || (text && text.toLowerCase().includes("recordatorio de tu cita"));

          let templateSid = process.env.TWILIO_CONTENT_PROVIDER_SID || "HX9d7dc23006b7016855694efa0c4f6ab7"; // dame_la_letra_nuevo_trabajo
          let templateVars = {};

          if (isAppointmentReminder) {
            templateSid = process.env.TWILIO_CONTENT_REMINDER_PROV_SID || "HXa07080e026c6d1b9189e2f43ffce313a"; // dame_la_letra_recordatorio_cita_negocio
            const phoneMatch = text && text.match(/\+1\d{10}/);
            const customerPhone = meta.customerPhone || (phoneMatch ? phoneMatch[0] : "tu cliente");
            templateVars = {
              "1": this.sanitizeTemplateVar(provider.name || "Socio", 60),
              "2": this.sanitizeTemplateVar(meta.serviceLabel || (request && request.raw_message) || "consulta programada", 80),
              "3": this.sanitizeTemplateVar(meta.appointmentTime || "hoy", 60),
              "4": this.sanitizeTemplateVar(customerPhone, 40)
            };
          } else if (isConnectionConfirmation) {
            templateSid = process.env.TWILIO_CONTENT_CONNECTED_SID || "HX78ff5d4f4fd9d640d0e174c9f44508ac"; // dame_la_letra_conexion_confirmada
            const phoneMatch = text && text.match(/\+1\d{10}/);
            const customerPhone = meta.customerPhone || (phoneMatch ? phoneMatch[0] : "en tu panel");
            const quoteSummary = meta.quoteSummary || "tu propuesta";
            templateVars = {
              "1": this.sanitizeTemplateVar(provider.name || "Socio", 60),
              "2": this.sanitizeTemplateVar(quoteSummary, 80),
              "3": this.sanitizeTemplateVar(customerPhone, 40)
            };
          } else if (isWelcomeMessage) {
            templateSid = process.env.TWILIO_CONTENT_WELCOME_SID || "HX85596a48daf08c58d49969cb0a0f9c0a"; // dame_la_letra_bienvenida_negocio
            templateVars = {
              "1": this.sanitizeTemplateVar(provider.name || "Socio", 60),
              "2": this.sanitizeTemplateVar(meta.categoryLabel || provider.category || "Servicios Profesionales", 80)
            };
          } else {
            const locationLabel = (request && (request.location_raw || request.location_zone)) || "Louisville, KY";
            const serviceSummary = (request && (request.raw_message || request.subcategory)) || text.slice(0, 140);
            templateVars = {
              "1": this.sanitizeTemplateVar(provider.name || "Socio", 60),
              "2": this.sanitizeTemplateVar(locationLabel, 60),
              "3": this.sanitizeTemplateVar(serviceSummary, 180)
            };
          }

          console.warn(`[TWILIO WHATSAPP 24H WINDOW] Freeform WhatsApp ${messageSid} to ${provider.name} (${provider.phone}) rejected (${msg.status}/${msg.errorCode}). Attempting official WhatsApp Template ${templateSid}...`);

          try {
            const tplMsg = await this.twilioClient.messages.create({
              from: fromWhatsApp,
              to: toWhatsApp,
              contentSid: templateSid,
              contentVariables: JSON.stringify(templateVars)
            });
            console.log(`[TWILIO WHATSAPP TEMPLATE SENT] SID: ${tplMsg.sid} to ${toWhatsApp}`);
            this.verifyWhatsAppTemplateOrFallbackToSms(tplMsg.sid, provider, text);
          } catch (tplErr) {
            console.warn(`[TWILIO WHATSAPP TEMPLATE ERROR] ${tplErr.message} -> Falling back to SMS`);
            await sendSmsFallback();
          }
          return;
        }
        if ((msg.status === "queued" || msg.status === "sending" || msg.status === "accepted" || msg.status === "sent") && attempt < 4) {
          setTimeout(() => checkDelivery(attempt + 1), 2500);
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
          const isWelcomeMessage = meta.welcomeProvider || (text && text.includes("bienvenido a la red"));
          const isAppointmentReminder = meta.appointmentReminder || (text && text.toLowerCase().includes("recordatorio de tu cita"));

          if (isWhatsApp && (isWelcomeMessage || isAppointmentReminder)) {
            let templateSid;
            let templateVars;
            if (isAppointmentReminder) {
              templateSid = process.env.TWILIO_CONTENT_REMINDER_PROV_SID || "HXa07080e026c6d1b9189e2f43ffce313a";
              const phoneMatch = text && text.match(/\+1\d{10}/);
              const customerPhone = meta.customerPhone || (phoneMatch ? phoneMatch[0] : "tu cliente");
              templateVars = {
                "1": this.sanitizeTemplateVar(provider.name || "Socio", 60),
                "2": this.sanitizeTemplateVar(meta.serviceLabel || "consulta programada", 80),
                "3": this.sanitizeTemplateVar(meta.appointmentTime || "hoy", 60),
                "4": this.sanitizeTemplateVar(customerPhone, 40)
              };
            } else {
              templateSid = process.env.TWILIO_CONTENT_WELCOME_SID || "HX85596a48daf08c58d49969cb0a0f9c0a";
              templateVars = {
                "1": this.sanitizeTemplateVar(provider.name || "Socio", 60),
                "2": this.sanitizeTemplateVar(meta.categoryLabel || provider.category || "Servicios Profesionales", 80)
              };
            }
            twilioMsg = await this.twilioClient.messages.create({
              from: fromNumber,
              to: toNumber,
              contentSid: templateSid,
              contentVariables: JSON.stringify(templateVars)
            });
            console.log(`[TWILIO -> PROVIDER DIRECT TEMPLATE SUCCESS] SID: ${twilioMsg.sid} (${templateSid}) to ${provider.name} (${toNumber})`);
            if (twilioMsg && twilioMsg.sid) {
              this.verifyWhatsAppTemplateOrFallbackToSms(twilioMsg.sid, provider, text);
            }
          } else {
            twilioMsg = await this.twilioClient.messages.create({
              body: text,
              from: fromNumber,
              to: toNumber
            });
            console.log(`[TWILIO -> PROVIDER DIRECT SUCCESS] SID: ${twilioMsg.sid} to ${provider.name} (${toNumber})`);
            if (isWhatsApp && twilioMsg && twilioMsg.sid) {
              this.verifyWhatsAppDeliveryOrFallbackToSms(twilioMsg.sid, provider, text, null, meta);
            }
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
