import { db } from "./db.js";
import { cognitiveEngine } from "./cognitiveEngine.js";
import { channels } from "./channels.js";

export const CATEGORY_PRICING_TIERS = {
  // Escalón 1: Ticket Diario / Frecuencia
  BEAUTY_BARBER: { tier: 1, label: "Ticket Diario", topup10Price: 45, monthlyTitularPrice: 29 },
  CLEANING: { tier: 1, label: "Ticket Diario", topup10Price: 45, monthlyTitularPrice: 29 },
  HANDYMAN: { tier: 1, label: "Ticket Diario", topup10Price: 45, monthlyTitularPrice: 29 },

  // Escalón 2: Oficios Técnicos y Consultoría
  PLUMBING: { tier: 2, label: "Oficios y Consultoría", topup10Price: 99, monthlyTitularPrice: 59 },
  ELECTRICAL: { tier: 2, label: "Oficios y Consultoría", topup10Price: 99, monthlyTitularPrice: 59 },
  AUTOMOTIVE: { tier: 2, label: "Oficios y Consultoría", topup10Price: 99, monthlyTitularPrice: 59 },
  LOCKSMITH: { tier: 2, label: "Oficios y Consultoría", topup10Price: 99, monthlyTitularPrice: 59 },
  APPLIANCE_REPAIR: { tier: 2, label: "Oficios y Consultoría", topup10Price: 99, monthlyTitularPrice: 59 },
  TREE_SERVICE: { tier: 2, label: "Oficios y Consultoría", topup10Price: 99, monthlyTitularPrice: 59 },
  CONSULTING_PROFESSIONAL: { tier: 2, label: "Oficios y Consultoría", topup10Price: 99, monthlyTitularPrice: 59 },
  EVENTS_CATERING: { tier: 2, label: "Oficios y Consultoría", topup10Price: 99, monthlyTitularPrice: 59 },

  // Escalón 3: Alto Ticket
  LEGAL_SERVICES: { tier: 3, label: "Alto Ticket", topup10Price: 220, monthlyTitularPrice: 149 },
  ROOFING: { tier: 3, label: "Alto Ticket", topup10Price: 220, monthlyTitularPrice: 149 },
  HVAC: { tier: 3, label: "Alto Ticket", topup10Price: 220, monthlyTitularPrice: 149 },
  TECH_SOFTWARE: { tier: 3, label: "Alto Ticket", topup10Price: 220, monthlyTitularPrice: 149 }
};

export function getCategoryPricing(category) {
  return CATEGORY_PRICING_TIERS[category] || { tier: 2, label: "Oficios y Consultoría", topup10Price: 99, monthlyTitularPrice: 59 };
}

/**
 * Conversational Provider Onboarding & Profile Management Engine
 * Enables providers (like Miguel Sosa) to update their business profile, skills, rates,
 * portfolio, and operational availability through natural conversation.
 */
export class ProviderOnboardingEngine {
  async handleProviderDirectMessage(provider, rawMessage, channel = "WHATSAPP") {
    console.log(`[PROVIDER ONBOARDING] Direct message from ${provider.name} (${provider.phone}): "${rawMessage}"`);
    const text = (rawMessage || "").trim();

    // 0A. Direct WhatsApp Command: Recharge +10 Consultations ("recárgame mi cuenta con diez más", "recárgame 10 más", etc.)
    const isRechargeCommand =
      /(?:rec[aá]rgame|recargar|recarga|s[uú]mame|agr[eé]game|ponme|dame)\s+(?:mi\s+cuenta\s+con\s+)?(?:10|diez)\s*(?:consultas?\s*)?(?:m[aá]s)?|(?:rec[aá]rgame|recargar)\s+(?:mi\s+cuenta|mis?\s+consultas?)|(?:10|diez)\s+consultas?\s+m[aá]s/i.test(text);

    if (isRechargeCommand) {
      const currentLimit = provider.monthly_consultation_limit ?? 10;
      const used = provider.monthly_consultations_used ?? 0;
      const newLimit = currentLimit + 10;
      const newRemaining = Math.max(0, newLimit - used);
      const pricing = getCategoryPricing(provider.category);

      const updatedProvider = db.updateProvider(provider.id, {
        monthly_consultation_limit: newLimit,
        availability_status: "AVAILABLE"
      }) || provider;

      db.logEvent(null, "PROVIDER_CONSULTATIONS_RECHARGED", "PROVIDER", {
        provider_id: provider.id,
        provider_name: provider.name,
        category: provider.category,
        added_consultations: 10,
        new_limit: newLimit,
        used: used,
        remaining: newRemaining,
        tier_price_ref: pricing.topup10Price
      });

      const rechargeReply =
        `✅ ¡Listo, ${provider.name}! Ya recargué *+10 consultas* a tu cuenta de *${provider.display_name}*.\n\n` +
        `📊 *Tu saldo actualizado:*\n` +
        `• Consultas disponibles: *${newRemaining}*\n` +
        `• Total acumuladas: *${used} usadas de ${newLimit}*\n\n` +
        `¡Seguimos activos conectándote clientes en Louisville!`;

      await channels.sendProviderDirectMessage(updatedProvider, rechargeReply, {
        recharged: true,
        addedConsultations: 10,
        newLimit
      });

      return {
        success: true,
        provider: updatedProvider,
        recharged: true,
        reply: rechargeReply
      };
    }

    // 0B. Direct WhatsApp Command: Check Consultation Balance ("cuántas consultas me quedan", "mi saldo", "mis consultas")
    const isBalanceQuery =
      /(?:cu[aá]ntas\s+consultas\s+me\s+quedan|saldo\s+de\s+consultas|estado\s+de\s+mi\s+cuenta|mis\s+consultas\s+disponibles)/i.test(text);

    if (isBalanceQuery) {
      const limit = provider.monthly_consultation_limit ?? 10;
      const used = provider.monthly_consultations_used ?? 0;
      const remaining = Math.max(0, limit - used);
      const pricing = getCategoryPricing(provider.category);

      const balanceReply =
        `📊 *Estado de tu cuenta (${provider.display_name}):*\n` +
        `• Consultas disponibles: *${remaining}* (has usado ${used} de ${limit})\n` +
        `• Nivel actual: *${provider.subscription_tier === "TITULAR" ? "Miembro Titular (Primera Fila)" : "Por Paquete de Consultas"}*\n\n` +
        `💡 Cuando quieras sumar más, solo escríbeme aquí: *"Recárgame mi cuenta con diez más"* ($${pricing.topup10Price}) o *"Quiero el plan mensual Titular"* ($${pricing.monthlyTitularPrice}/mes).`;

      await channels.sendProviderDirectMessage(provider, balanceReply);
      return {
        success: true,
        provider,
        reply: balanceReply
      };
    }

    // 0C. Direct WhatsApp Command: Upgrade to Monthly Titular Plan ("quiero el plan mensual", "plan titular")
    const isMonthlyPlanCommand =
      /(?:quiero|activar|act[ií]vame|ponme)\s+(?:el\s+)?(?:plan\s+mensual|plan\s+titular|membres[ií]a\s+mensual|membres[ií]a\s+titular)/i.test(text);

    if (isMonthlyPlanCommand) {
      const pricing = getCategoryPricing(provider.category);
      const updatedProvider = db.updateProvider(provider.id, {
        subscription_tier: "TITULAR",
        monthly_consultation_limit: 9999,
        availability_status: "AVAILABLE"
      }) || provider;

      db.logEvent(null, "PROVIDER_UPGRADED_TITULAR", "PROVIDER", {
        provider_id: provider.id,
        provider_name: provider.name,
        category: provider.category,
        monthly_price_ref: pricing.monthlyTitularPrice
      });

      const monthlyReply =
        `🏆 ¡Excelente, ${provider.name}! Tu cuenta de *${provider.display_name}* quedó activada en el *Plan Mensual Titular* ($${pricing.monthlyTitularPrice}/mes).\n\n` +
        `✨ *Beneficios activos:*\n` +
        `• *Primera Fila (Prioridad Titular):* Recibes primero las solicitudes de tu categoría en Louisville.\n` +
        `• *Consultas ilimitadas* en el mes.`;

      await channels.sendProviderDirectMessage(updatedProvider, monthlyReply);
      return {
        success: true,
        provider: updatedProvider,
        upgraded: true,
        reply: monthlyReply
      };
    }

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
