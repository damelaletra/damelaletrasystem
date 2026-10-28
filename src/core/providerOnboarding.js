import { db } from "./db.js";
import { cognitiveEngine } from "./cognitiveEngine.js";
import { channels } from "./channels.js";

/**
 * Conversational Provider Onboarding & Profile Management Engine
 * Enables providers (like Miguel Sosa) to update their business profile, skills, rates,
 * portfolio, and operational availability through natural conversation.
 */
export class ProviderOnboardingEngine {
  async handleProviderDirectMessage(provider, rawMessage, channel = "WHATSAPP") {
    console.log(`[PROVIDER ONBOARDING] Direct message from ${provider.name} (${provider.phone}): "${rawMessage}"`);

    // 1. Extract structured profile updates using Cognitive Engine
    const analysis = await cognitiveEngine.extractProviderProfileUpdates(rawMessage, provider);

    if (analysis && analysis.is_customer_request) {
      console.log(`[PROVIDER ONBOARDING] Detected customer request intent from provider ${provider.name}. Bailing out...`);
      return { isCustomerRequest: true };
    }

    const updates = {};
    if (analysis && analysis.updated_fields) {
      for (const [key, value] of Object.entries(analysis.updated_fields)) {
        if (value !== null && value !== undefined) {
          updates[key] = value;
        }
      }
    }

    if (updates.services && Array.isArray(updates.services) && Array.isArray(provider.services)) {
      updates.services = Array.from(new Set([...provider.services, ...updates.services]));
    }

    // 2. Persist profile changes to database
    let updatedProvider = provider;
    if (Object.keys(updates).length > 0) {
      updatedProvider = db.updateProvider(provider.id, updates) || provider;
      console.log(`[PROVIDER ONBOARDING] Updated ${provider.name} profile:`, updates);
    }

    // 3. Log event
    db.logEvent(null, "PROVIDER_PROFILE_CONVERSATION", "PROVIDER", {
      provider_id: provider.id,
      provider_name: provider.name,
      message: rawMessage,
      updates: updates,
      summary: analysis ? analysis.summary_changes : "Mensaje recibido"
    });

    // 4. Send natural response back to the provider
    const replyText = (analysis && analysis.reply_message)
      ? analysis.reply_message
      : `¡Hola ${provider.name}! Recibí tus datos y tu perfil como ${provider.display_name} está actualizado en Dame La Letra.`;

    await channels.sendProviderDirectMessage(updatedProvider, replyText, {
      updatedFields: updates,
      summaryChanges: analysis ? analysis.summary_changes : null
    });

    return {
      success: true,
      provider: updatedProvider,
      updates,
      reply: replyText
    };
  }

  /**
   * Handles new business registration requests (text inquiry or flyer/card photo).
   * Enforces Free Launch Registration, 10 consultations/month limit, and Contact-Only scope (no scheduling/reminders).
   */
  async handleNewBusinessRegistration(phone, rawMessage, channel = "WHATSAPP", extraMetadata = {}) {
    console.log(`[PROVIDER ONBOARDING] Business registration flow for ${phone}: "${rawMessage}"`);

    const activeRegReq = db.getRequests(
      r => r.conversation_reference === phone && r.status === "WAITING_BUSINESS_REGISTRATION"
    )[0];

    const regAnalysis = await cognitiveEngine.extractBusinessRegistrationInfo(
      rawMessage,
      extraMetadata.visualAnalysis || null
    );

    if (regAnalysis && regAnalysis.has_enough_info && regAnalysis.business_data) {
      const bizData = regAnalysis.business_data;
      const newProvider = db.createProvider({
        name: bizData.name || "Profesional Local",
        display_name: bizData.display_name || bizData.name || "Profesional Local",
        phone: phone,
        preferred_channel: channel === "SMS" ? "SMS" : "WHATSAPP",
        category: bizData.category || "CONSULTING_PROFESSIONAL",
        services: Array.isArray(bizData.services) && bizData.services.length > 0
          ? bizData.services
          : ["GENERAL_SERVICE"],
        legal_specialties: bizData.legal_specialties || null,
        base_location_name: bizData.location_raw || "Louisville, KY",
        bio: bizData.bio || rawMessage,
        flyer_media_url: extraMetadata.mediaUrl || null,
        subscription_tier: "FREE_LAUNCH",
        monthly_consultation_limit: 10,
        monthly_consultations_used: 0,
        scheduling_reminders_enabled: false,
        connection_mode: "CONTACT_ONLY"
      });

      const reqToResolve = activeRegReq || db.createRequest({
        channel,
        conversation_reference: phone,
        raw_message: rawMessage,
        media_url: extraMetadata.mediaUrl || null,
        visual_analysis: extraMetadata.visualAnalysis || null,
        service_category: "BUSINESS_REGISTRATION",
        normalized_intent: "BUSINESS_REGISTRATION_COMPLETED",
        status: "RESOLVED"
      });

      const updatedReq = db.updateRequest(reqToResolve.id, {
        status: "RESOLVED",
        service_category: "BUSINESS_REGISTRATION",
        normalized_intent: "BUSINESS_REGISTRATION_COMPLETED",
        matched_provider_id: newProvider.id,
        media_url: extraMetadata.mediaUrl || reqToResolve.media_url,
        visual_analysis: extraMetadata.visualAnalysis || reqToResolve.visual_analysis,
        completed_at: new Date().toISOString()
      });

      db.logEvent(updatedReq.id, "BUSINESS_REGISTERED_FREE_LAUNCH", "PROVIDER", {
        provider_id: newProvider.id,
        display_name: newProvider.display_name,
        category: newProvider.category,
        services: newProvider.services,
        monthly_consultation_limit: 10,
        connection_mode: "CONTACT_ONLY"
      });

      const confirmText =
        `¡Listo! ✅ Tu negocio *${newProvider.display_name}* ya quedó inscrito y activo en *Dame La Letra* de forma *100% gratuita* (sin ningún costo de inscripción).\n\n` +
        `📋 *Condiciones de tu cuenta:*\n` +
        `• Cuentas con un total de *10 consultas al mes* totalmente gratis.\n` +
        `• *Importante:* No está disponible la opción de recordatorios ni agendamientos de citas; nuestro sistema realiza *solamente el contacto directo* entre el cliente y tú.\n\n` +
        `¡Bienvenido(a)! En cuanto alguien solicite tus servicios en Louisville, te notificaremos por esta misma vía.`;

      await channels.sendCustomerMessage(updatedReq, confirmText);

      return {
        success: true,
        status: "REGISTERED",
        provider: newProvider,
        request: updatedReq,
        message: confirmText
      };
    }

    // Step 1: User asked to register their business but hasn't sent details/flyer yet
    const regReq = activeRegReq
      ? db.updateRequest(activeRegReq.id, {
          raw_message: rawMessage,
          status: "WAITING_BUSINESS_REGISTRATION",
          service_category: "BUSINESS_REGISTRATION",
          normalized_intent: "BUSINESS_REGISTRATION_INQUIRY"
        })
      : db.createRequest({
          channel,
          conversation_reference: phone,
          raw_message: rawMessage,
          service_category: "BUSINESS_REGISTRATION",
          normalized_intent: "BUSINESS_REGISTRATION_INQUIRY",
          status: "WAITING_BUSINESS_REGISTRATION"
        });

    db.logEvent(regReq.id, "BUSINESS_REGISTRATION_INQUIRY", "PROVIDER", {
      phone,
      rawMessage
    });

    const welcomeRegText =
      `¡Con mucho gusto! 🎉 Por lanzamiento, la inscripción de tu negocio en *Dame La Letra* es *100% GRATUITA* (no se te cobrará nada).\n\n` +
      `📋 *Qué incluye tu inscripción:*\n` +
      `• Te damos un total de *10 consultas al mes* sin costo.\n` +
      `• *Alcance del servicio:* No está disponible la opción de recordatorios ni agendamientos de citas; te brindamos *solamente el contacto directo* con el cliente.\n\n` +
      `Para activar tu negocio ahora mismo, envíame por aquí:\n` +
      `1️⃣ El nombre de tu negocio o profesional y qué servicios ofreces\n` +
      `2️⃣ O simplemente envíame una *foto de tu flyer o tarjeta de presentación* para registrarte de inmediato.`;

    await channels.sendCustomerMessage(regReq, welcomeRegText);

    return {
      success: true,
      status: "WAITING_BUSINESS_REGISTRATION",
      request: regReq,
      message: welcomeRegText
    };
  }
}

export const providerOnboarding = new ProviderOnboardingEngine();
