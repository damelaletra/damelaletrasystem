import { db } from "./db.js";
import { understandRequest } from "./semantic.js";
import { filterEligibleProviders } from "./eligibility.js";
import { rankEligibleCandidates } from "./matching.js";
import { cascadingEngine } from "./cascading.js";
import { channels } from "./channels.js";
import { handleExternalFallback } from "./fallback.js";

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
    const lower = text.toLowerCase();

    // 1. Check if there is an active request waiting for customer confirmation on this conversation
    const activeWaitingCustomer = db.getRequests(
      r => r.conversation_reference === conversationRef && r.status === "WAITING_CUSTOMER"
    )[0];

    if (activeWaitingCustomer) {
      return this.handleCustomerConfirmation(activeWaitingCustomer, text);
    }

    // 2. New Request Pipeline
    const request = db.createRequest({
      channel,
      conversation_reference: conversationRef,
      raw_message: text,
      status: "NEW"
    });

    // Zero-friction First Customer Experience Response:
    // "Dame un momento."
    channels.sendCustomerMessage(request, "Dame un momento.");

    // Transition -> UNDERSTANDING
    db.updateRequest(request.id, { status: "UNDERSTANDING" });

    const understanding = understandRequest(text);

    db.updateRequest(request.id, {
      normalized_intent: understanding.intent,
      service_category: understanding.service_category,
      service_type: understanding.service_type,
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
      channels.sendCustomerMessage(request, clarifyText, { requiresClarification: true });
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
      return handleExternalFallback(db.getRequestById(request.id));
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

    // Start cascading dispatch (Contact Candidate #1)
    cascadingEngine.startCascade(db.getRequestById(request.id), rankedCandidates);

    return {
      request: db.getRequestById(request.id),
      rankedCandidates
    };
  }

  handleCustomerConfirmation(request, customerReply) {
    const lower = customerReply.toLowerCase().trim();
    const yesWords = ["sí", "si", "dale", "conéctalo", "conéctame", "claro", "por favor", "yes", "ok", "conecta"];
    const isYes = yesWords.some(w => lower.includes(w));

    const provider = db.getProviderById(request.matched_provider_id);

    if (isYes) {
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

      // Final zero-friction Customer Closing:
      // "Perfecto. Te conecto con José ahora. (+1 502-555-0192)"
      const connectMessage =
        `Perfecto. Te conecto con ${provider.name} ahora: ?? ${provider.phone}.\n` +
        `Ya le pasé la información de tu solicitud y está en camino (${request.estimated_arrival}).`;

      channels.sendCustomerMessage(request, connectMessage, {
        connected: true,
        providerPhone: provider.phone,
        providerName: provider.name
      });

      // Notify provider of connection
      channels.sendProviderBriefing(provider, request,
        `¡Conexión Confirmada! El cliente aceptó tu cotización de $${request.quoted_price}. Contacto: ${request.conversation_reference}. ¡Gracias por atender a la comunidad!`
      );

      return { status: "CONNECTED", connection };
    } else {
      // Customer declined or requested alternative
      db.updateRequest(request.id, {
        status: "CUSTOMER_DECLINED"
      });

      db.logEvent(request.id, "CUSTOMER_DECLINED_QUOTE", "CUSTOMER", { response: customerReply });

      const declineMessage =
        `Entendido. ¿Deseas que busque otro proveedor en la zona, o prefieres cancelar la solicitud?`;

      channels.sendCustomerMessage(request, declineMessage, {
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

