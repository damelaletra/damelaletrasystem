import { db } from "./db.js";
import { understandRequest, detectLegalSpecialty, understandClarification, CATEGORY_CLARIFICATION_PROMPTS } from "./semantic.js";
import { filterEligibleProviders } from "./eligibility.js";
import { rankEligibleCandidates } from "./matching.js";
import { cascadingEngine } from "./cascading.js";
import { channels } from "./channels.js";
import { handleExternalFallback } from "./fallback.js";
import { isCustomerAcceptance, isCustomerDecline, concierge } from "./concierge.js";
import { geminiService } from "./gemini.js";

/**
 * Request State Machine & Master Orchestrator
 * Controls the 13-stage lifecycle:
 * NEW -> UNDERSTANDING -> SEARCHING -> ELIGIBILITY_CHECK -> MATCHING ->
 * CONTACTING_PROVIDER -> WAITING_PROVIDER -> QUOTE_RECEIVED -> WAITING_CUSTOMER ->
 * ACCEPTED -> CONNECTING -> CONNECTED -> COMPLETED
 */
export class RequestStateMachine {
  async processCustomerInput(rawMessage, channel = "WEB", conversationRef = "conv-1") {
    const text = (rawMessage || "").trim();

    // 1a. Check if there is an active request waiting for customer confirmation or recent clarification on this conversation
    const activeWaitingCustomer = db.getRequests(
      r => r.conversation_reference === conversationRef && (r.status === "WAITING_CUSTOMER" || r.status === "CUSTOMER_DECLINED")
    )[0];

    // 1b. Check if customer is answering a clarifying question (provider question or legal specialty disambiguation)
    const activeWaitingClarification = db.getRequests(
      r => r.conversation_reference === conversationRef && r.status === "WAITING_CUSTOMER_CLARIFICATION"
    )[0];

    // 1c. Check if customer is answering the soft double-opt-in confirmation
    const activeWaitingDispatch = db.getRequests(
      r => r.conversation_reference === conversationRef && r.status === "WAITING_DISPATCH_CONFIRMATION"
    )[0];

    const customerAnalysis = await concierge.analyzeCustomerMessageAsync(text, activeWaitingCustomer || activeWaitingClarification);

    if (customerAnalysis.intent === "CUSTOMER_ACCEPT_QUOTE" && activeWaitingCustomer) {
      return await this.handleCustomerConfirmation(activeWaitingCustomer, text, true);
    }

    if ((customerAnalysis.intent === "CUSTOMER_DECLINE_QUOTE" || customerAnalysis.intent === "CUSTOMER_REQUEST_ANOTHER") && activeWaitingCustomer) {
      return await this.handleCustomerConfirmation(activeWaitingCustomer, text, false);
    }

    if (activeWaitingDispatch) {
      // Any response is considered a green light, but we can check if it's explicitly negative
      if (customerAnalysis.is_decline) {
        db.updateRequest(activeWaitingDispatch.id, { status: "CANCELLED" });
        await channels.sendCustomerMessage(activeWaitingDispatch, "Entendido, solicitud cancelada. ¡Avísame si necesitas algo más!");
        return { request: db.getRequestById(activeWaitingDispatch.id), status: "CANCELLED" };
      }

      // Extraer zipcode/ubicación si el cliente la proporcionó en lugar de un simple "sí"
      if (!customerAnalysis.is_affirmation && text.trim().length >= 3) {
        db.updateRequest(activeWaitingDispatch.id, { location_raw: text.trim() });
        activeWaitingDispatch.location_raw = text.trim();
      }

      // Proceed to dispatch
      const ranked = activeWaitingDispatch.candidate_cache || [];
      if (ranked.length > 0) {
        db.updateRequest(activeWaitingDispatch.id, {
          status: "CONTACTING_PROVIDER",
          matched_provider_id: ranked[0].provider.id,
          match_score: ranked[0].scores.final
        });
        await channels.sendCustomerMessage(activeWaitingDispatch, "¡Enviado! Te aviso tan pronto me contesten.");
        await cascadingEngine.startCascade(db.getRequestById(activeWaitingDispatch.id), ranked);
        return { request: db.getRequestById(activeWaitingDispatch.id), status: "WAITING_PROVIDER", matchedProvider: ranked[0].provider };
      }
    }

    if (activeWaitingClarification) {
      // Case A: Customer is resolving a Service Disambiguation prompt for ANY category (ESTO DEBERÍA SER PARA CADA CASO)
      if (
        activeWaitingClarification.clarification_type === "SERVICE_DISAMBIGUATION" ||
        activeWaitingClarification.clarification_type === "LEGAL_SPECIALTY" ||
        activeWaitingClarification.service_type === "UNKNOWN"
      ) {
        const clarified = understandClarification(text, activeWaitingClarification.service_category);
        const resolvedServiceType = clarified.service_type || "GENERAL_SERVICE";
        const resolvedLegalSpecialty = activeWaitingClarification.service_category === "LEGAL_SERVICES" ?
          (clarified.legal_specialty || resolvedServiceType) : null;

        db.updateRequest(activeWaitingClarification.id, {
          status: "SEARCHING",
          service_category: activeWaitingClarification.service_category,
          service_type: resolvedServiceType,
          legal_specialty: resolvedLegalSpecialty,
          clarification_type: null
        });

        db.logEvent(activeWaitingClarification.id, "SERVICE_DISAMBIGUATION_RESOLVED", "CUSTOMER", {
          rawAnswer: text,
          resolvedServiceType,
          resolvedLegalSpecialty
        });

        await channels.sendCustomerMessage(activeWaitingClarification, concierge.formatCustomerFirstResponse());

        const allProviders = db.getProviders();
        const updatedReq = db.getRequestById(activeWaitingClarification.id);
        const { eligible, disqualified } = filterEligibleProviders(allProviders, updatedReq);

        db.logEvent(activeWaitingClarification.id, "ELIGIBILITY_CHECK_COMPLETED", "SYSTEM", {
          eligibleCount: eligible.length,
          disqualifiedCount: disqualified.length,
          disqualified
        });

        if (eligible.length === 0) {
          db.updateRequest(activeWaitingClarification.id, { status: "NO_PROVIDER" });
          return await handleExternalFallback(db.getRequestById(activeWaitingClarification.id));
        }

        const ranked = rankEligibleCandidates(eligible, updatedReq);

        // Instead of starting cascade, go to WAITING_DISPATCH_CONFIRMATION
        db.updateRequest(activeWaitingClarification.id, {
          status: "WAITING_DISPATCH_CONFIRMATION",
          candidate_cache: ranked
        });

        const catText = activeWaitingClarification.service_category === "PLUMBING" ? "plomeros" : 
                        activeWaitingClarification.service_category === "AUTOMOTIVE" ? "mecánicos/grúas" : 
                        activeWaitingClarification.service_category === "HVAC" ? "técnicos de aire" : "especialistas";

        const locRaw = activeWaitingClarification.location_raw;
        let promptMsg = `Perfecto, ya tengo a los ${catText} disponibles en tu zona. ¿Me confirmas por favor para pasarles tu solicitud?`;
        if (!locRaw || locRaw === "desconocido" || locRaw === "Louisville Metro") {
          promptMsg = `Perfecto, tengo a los ${catText} disponibles. Para conectar con los más cercanos, ¿me dices tu código postal o zona por favor?`;
        } else {
          promptMsg = `Perfecto, ya tengo a los ${catText} disponibles cerca de ${locRaw}. ¿Me confirmas por favor para pasarles tu solicitud?`;
        }

        await channels.sendCustomerMessage(activeWaitingClarification, promptMsg, { requiresClarification: true });
        
        return { request: db.getRequestById(activeWaitingClarification.id), status: "WAITING_DISPATCH_CONFIRMATION" };
      }

      // Case B: Provider-initiated clarifying question
      const provider = db.getProviderById(activeWaitingClarification.matched_provider_id);
      db.updateRequest(activeWaitingClarification.id, {
        status: "WAITING_PROVIDER"
      });
      db.logEvent(activeWaitingClarification.id, "CUSTOMER_CLARIFICATION_PROVIDED", "CUSTOMER", { text });

      if (provider) {
        const forwardToProvider = concierge.formatCustomerAnswerRelay(provider, text);
        await channels.sendProviderBriefing(provider, activeWaitingClarification, forwardToProvider);
      }

      await channels.sendCustomerMessage(activeWaitingClarification, "Gracias. Ya le pasé los detalles a la especialista para que te dé el precio.");
      return { request: activeWaitingClarification, status: "FORWARDED_TO_PROVIDER" };
    }

    // 2. New Request Pipeline
    const request = db.createRequest({
      channel,
      conversation_reference: conversationRef,
      raw_message: text,
      status: "NEW"
    });

    // 1. Initial heuristic analysis (local baseline)
    let understanding = understandRequest(text);

    // 2. Deep Natural Language Understanding via Gemini LLM
    if (geminiService.isAvailable()) {
      try {
        const recentHistory = db.getRecentRequestsForPhone(conversationRef, 4);
        const contextHistory = recentHistory.map(r => ({ mensaje_usuario: r.raw_message, respuesta_ia: r.ai_explanation || r.service_category })).reverse();
        
        const llmUnderstanding = await geminiService.understandCustomerMessage(text, contextHistory);
        if (llmUnderstanding && llmUnderstanding.service_category && llmUnderstanding.confidence >= 0.65) {
          understanding = {
            ...understanding,
            intent: llmUnderstanding.service_type || understanding.intent,
            service_category: llmUnderstanding.service_category,
            service_type: llmUnderstanding.service_type || understanding.service_type,
            legal_specialty: llmUnderstanding.legal_specialty || understanding.legal_specialty,
            needs_clarification: llmUnderstanding.needs_clarification !== undefined ? llmUnderstanding.needs_clarification : understanding.needs_clarification,
            clarification_prompt: llmUnderstanding.clarification_prompt || understanding.clarification_prompt,
            property_type: (llmUnderstanding.property_type && llmUnderstanding.property_type !== "UNKNOWN") ? llmUnderstanding.property_type : understanding.property_type,
            urgency: llmUnderstanding.urgency || understanding.urgency,
            confidence: Math.max(understanding.confidence, llmUnderstanding.confidence),
            ai_analyzed: true,
            ai_explanation: llmUnderstanding.explanation
          };
          if (llmUnderstanding.location_raw && (!understanding.location_detected || llmUnderstanding.location_raw !== "Louisville Metro")) {
            understanding.location_raw = llmUnderstanding.location_raw;
          }
        }
      } catch (geminiErr) {
        console.warn("[STATE MACHINE] Gemini LLM fallback to deterministic engine:", geminiErr.message);
      }
    }

    // 2.5 Information Query Short-Circuit
    if (understanding.service_category === "INFORMATION") {
      db.updateRequest(request.id, {
        status: "RESOLVED",
        service_category: "INFORMATION",
        normalized_intent: "GENERAL_INFO"
      });
      db.logEvent(request.id, "INFORMATION_PROVIDED", "SYSTEM");
      
      const infoResponse = understanding.ai_explanation || "Aquí tienes la información solicitada. ¿En qué más puedo ayudarte?";
      await channels.sendCustomerMessage(request, infoResponse);
      
      return { request: db.getRequestById(request.id), status: "RESOLVED", message: infoResponse };
    }

    // 3. Universal Rule: Disambiguate when service_type is UNKNOWN or needs_clarification (ESTO DEBERÍA SER PARA CADA CASO)
    if (
      understanding.service_category &&
      (understanding.service_type === "UNKNOWN" || understanding.needs_clarification)
    ) {
      const prompt = CATEGORY_CLARIFICATION_PROMPTS[understanding.service_category] ||
        understanding.clarification_prompt ||
        "Claro. ¿Me podrías detallar un poco más qué tipo de trabajo o problema necesitas resolver?";

      db.updateRequest(request.id, {
        normalized_intent: `${understanding.service_category}_INQUIRY`,
        service_category: understanding.service_category,
        service_type: "UNKNOWN",
        legal_specialty: understanding.service_category === "LEGAL_SERVICES" ? "UNKNOWN" : null,
        status: "WAITING_CUSTOMER_CLARIFICATION",
        clarification_type: "SERVICE_DISAMBIGUATION",
        location_raw: understanding.location_raw,
        latitude: understanding.latitude,
        longitude: understanding.longitude,
        property_type: understanding.property_type,
        urgency: understanding.urgency
      });

      db.logEvent(request.id, "SERVICE_DISAMBIGUATION_REQUESTED", "SYSTEM", {
        category: understanding.service_category,
        rule: "UNIVERSAL_DISAMBIGUATION"
      });

      await channels.sendCustomerMessage(request, prompt, { requiresClarification: true, category: understanding.service_category });
      return { request: db.getRequestById(request.id), status: "WAITING_CUSTOMER_CLARIFICATION", message: prompt };
    }

    // Standard Zero-friction First Customer Experience Response: "Dame un momento."
    await channels.sendCustomerMessage(request, concierge.formatCustomerFirstResponse());

    // Transition -> UNDERSTANDING
    db.updateRequest(request.id, {
      status: "UNDERSTANDING",
      normalized_intent: understanding.intent,
      service_category: understanding.service_category,
      service_type: understanding.service_type,
      legal_specialty: understanding.legal_specialty || null,
      location_raw: understanding.location_raw,
      latitude: understanding.latitude,
      longitude: understanding.longitude,
      property_type: understanding.property_type,
      urgency: understanding.urgency
    });

    db.logEvent(request.id, "INTENT_UNDERSTOOD", "SYSTEM", understanding);

    // Check confidence threshold
    if (understanding.confidence < 0.60 || !understanding.service_category) {
      db.updateRequest(request.id, { status: "HUMAN_REVIEW" });
      const clarifyText = "Quiero asegurarme de entenderte bien para buscar a la persona correcta. ¿Me podrías detallar un poco más lo que necesitas?";
      await channels.sendCustomerMessage(request, clarifyText, { requiresClarification: true });
      return { request, status: "HUMAN_REVIEW" };
    }

    // Transition -> SEARCHING & ELIGIBILITY_CHECK
    db.updateRequest(request.id, { status: "SEARCHING" });

    const allProviders = db.getProviders();
    const { eligible, disqualified } = filterEligibleProviders(allProviders, db.getRequestById(request.id));

    db.logEvent(request.id, "ELIGIBILITY_CHECK_COMPLETED", "SYSTEM", {
      eligibleCount: eligible.length,
      disqualifiedCount: disqualified.length,
      disqualified
    });

    if (eligible.length === 0) {
      db.updateRequest(request.id, { status: "NO_PROVIDER" });
      return await handleExternalFallback(db.getRequestById(request.id));
    }

    // Transition -> MATCHING
    db.updateRequest(request.id, { status: "MATCHING" });
    const rankedCandidates = rankEligibleCandidates(eligible, db.getRequestById(request.id));

    db.logEvent(request.id, "CANDIDATES_RANKED", "SYSTEM", {
      ranked: rankedCandidates.map(c => ({
        id: c.provider.id,
        name: c.provider.name,
        score: c.scores.final
      }))
    });

    // If this is a live voice call, we bypass the confirmation and return the provider immediately for transfer.
    if (channel === "VOICE_CALL") {
      db.updateRequest(request.id, {
        status: "CONTACTING_PROVIDER",
        matched_provider_id: rankedCandidates[0].provider.id,
        match_score: rankedCandidates[0].scores.final
      });
      await cascadingEngine.startCascade(db.getRequestById(request.id), rankedCandidates);
      return {
        request: db.getRequestById(request.id),
        status: "WAITING_PROVIDER",
        matchedProvider: rankedCandidates[0].provider
      };
    }

    // Instead of starting cascade immediately for SMS, we ask for soft confirmation
    db.updateRequest(request.id, {
      status: "WAITING_DISPATCH_CONFIRMATION",
      candidate_cache: rankedCandidates // we stash them in the db object
    });

    // Formatear mensaje sutil basado en la categoría
    const categoriaTexto = {
      "PLUMBING": "plomeros",
      "HVAC": "técnicos de aire",
      "AUTOMOTIVE": "mecánicos/grúas",
      "LOCKSMITH": "cerrajeros",
      "ROOFING": "techeros",
      "ELECTRICAL": "electricistas",
      "HANDYMAN": "handymans",
      "APPLIANCE_REPAIR": "técnicos de electrodomésticos",
      "CLEANING": "servicios de limpieza",
      "TREE_SERVICE": "cortadores de árboles",
      "LEGAL_SERVICES": "abogados",
    }[understanding.service_category] || "especialistas";

    const loc = understanding.location_raw;
    let softPrompt = `Perfecto, ya tengo a los ${categoriaTexto} disponibles en tu zona. ¿Me confirmas por favor para pasarles tu solicitud?`;
    if (!loc || loc === "desconocido" || loc === "Louisville Metro") {
      softPrompt = `Perfecto, tengo a los ${categoriaTexto} disponibles. Para conectar con los más cercanos, ¿me dices tu código postal o zona por favor?`;
    } else {
      softPrompt = `Perfecto, ya tengo a los ${categoriaTexto} disponibles cerca de ${loc}. ¿Me confirmas por favor para pasarles tu solicitud?`;
    }

    await channels.sendCustomerMessage(request, softPrompt, { requiresClarification: true });

    const finalReq = db.getRequestById(request.id);
    channels.broadcast("ai_intelligence_update", {
      actor: "CUSTOMER",
      mode: "SERVICE_REQUEST",
      rawMessage: text,
      request: finalReq,
      understanding: understanding,
      eligibleCount: eligible.length,
      contactedProvider: null,
      action: `Intención clasificada como ${understanding.service_category}. Esperando confirmación final del cliente (Soft Double Opt-in).`,
      timestamp: new Date().toISOString()
    });

    return {
      request: finalReq,
      status: "WAITING_DISPATCH_CONFIRMATION"
    };
  }

  async handleCustomerConfirmation(request, customerReply, isAccepted = null) {
    const isYes = (isAccepted !== null) ? isAccepted : isCustomerAcceptance(customerReply);
    const provider = db.getProviderById(request.matched_provider_id);

    if (isYes && provider) {
      // Transition: ACCEPTED -> CONNECTING -> CONNECTED
      db.updateRequest(request.id, {
        status: "ACCEPTED",
        customer_confirmation: 1
      });

      db.logEvent(request.id, "CUSTOMER_ACCEPTED_QUOTE", "CUSTOMER", {
        price: request.quoted_price,
        eta: request.estimated_arrival
      });

      db.updateRequest(request.id, { status: "CONNECTING" });

      const connection = db.createConnection({
        request_id: request.id,
        provider_id: provider.id,
        channel: request.channel,
        customer_contact: request.conversation_reference,
        provider_contact: provider.phone
      });

      db.updateRequest(request.id, {
        status: "CONNECTED",
        connection_status: "CONNECTED",
        completed_at: new Date().toISOString()
      });

      // Update provider capacity and completed stats
      db.updateProvider(provider.id, {
        capacity_used_today: (provider.capacity_used_today || 0) + 1,
        completed_connections: (provider.completed_connections || 0) + 1
      });

      // Final zero-friction Customer Closing
      const priceDisplay = request.quoted_price_display || `$${request.quoted_price}`;
      const connectMessage = concierge.formatConnectionForCustomer(provider, request.estimated_arrival, request);

      await channels.sendCustomerMessage(request, connectMessage, {
        connected: true,
        providerPhone: provider.phone,
        providerName: provider.name
      });

      // Notify provider of connection
      const providerConfirmMsg = concierge.formatConnectionForProvider(request.conversation_reference, priceDisplay, request);
      await channels.sendProviderBriefing(provider, request, providerConfirmMsg);

      return { status: "CONNECTED", connection };
    } else {
      // Customer declined or requested alternative
      db.updateRequest(request.id, {
        status: "CUSTOMER_DECLINED"
      });

      db.logEvent(request.id, "CUSTOMER_DECLINED_QUOTE", "CUSTOMER", { response: customerReply });

      const declineMessage =
        `Entendido. ¿Deseas que busque otro proveedor en la zona, o prefieres cancelar la solicitud?`;

      await channels.sendCustomerMessage(request, declineMessage, {
        options: ["Buscar otro", "Cancelar"]
      });

      return { status: "CUSTOMER_DECLINED" };
    }
  }

  // Operator manual intervention
  operatorAssignProvider(requestId, providerId) {
    const request = db.getRequestById(requestId);
    const provider = db.getProviderById(providerId);
    if (!request || !provider) return { error: "Request or Provider not found" };

    db.updateRequest(requestId, {
      matched_provider_id: provider.id,
      candidate_provider_ids: [provider.id],
      cascade_step: 0,
      status: "CONTACTING_PROVIDER"
    });

    db.logEvent(requestId, "OPERATOR_ASSIGNED_PROVIDER", "OPERATOR", {
      provider_id: provider.id,
      provider_name: provider.name
    });

    return cascadingEngine.dispatchNextCandidate(requestId);
  }

  operatorForceFallback(requestId) {
    const request = db.getRequestById(requestId);
    if (!request) return { error: "Request not found" };
    db.logEvent(requestId, "OPERATOR_FORCED_FALLBACK", "OPERATOR");
    return handleExternalFallback(request);
  }
}

export const stateMachine = new RequestStateMachine();

