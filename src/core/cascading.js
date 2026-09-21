import { db } from "./db.js";
import { channels } from "./channels.js";
import { handleExternalFallback } from "./fallback.js";
import { concierge } from "./concierge.js";

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

  async startCascade(request, rankedCandidates) {
    if (!rankedCandidates || rankedCandidates.length === 0) {
      console.log(`[CASCADE] No eligible candidates for request ${request.id}. Triggering fallback.`);
      return await handleExternalFallback(request);
    }

    const candidateIds = rankedCandidates.map(c => c.provider.id);

    db.updateRequest(request.id, {
      candidate_provider_ids: candidateIds,
      cascade_step: 0,
      status: "CONTACTING_PROVIDER"
    });

    return await this.dispatchNextCandidate(request.id);
  }

  async dispatchNextCandidate(requestId) {
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
      return await handleExternalFallback(request);
    }

    const providerId = candidateIds[step];
    const provider = db.getProviderById(providerId);

    if (!provider) {
      db.updateRequest(requestId, { cascade_step: step + 1 });
      return await this.dispatchNextCandidate(requestId);
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

    await channels.sendProviderBriefing(provider, request, briefing, {
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

    const timer = setTimeout(async () => {
      console.log(`[CASCADE] Provider ${provider.name} timed out for request ${requestId}. Advancing.`);
      db.logEvent(requestId, "PROVIDER_TIMEOUT", "SYSTEM", {
        provider_id: provider.id,
        step: step
      });
      db.updateRequest(requestId, { cascade_step: step + 1 });
      await this.dispatchNextCandidate(requestId);
    }, this.defaultTimeoutMs);

    activeTimeouts.set(requestId, timer);
    return { success: true, provider, step };
  }

  async handleProviderResponse(providerId, rawResponse, requestId = null) {
    let request;
    if (requestId) {
      request = db.getRequestById(requestId);
    } else {
      const activeRequests = db.getRequests(r => r.status === "WAITING_PROVIDER" && r.matched_provider_id === providerId);
      request = activeRequests[0];
    }

    let provider = db.getProviderById(providerId);

    if (!request && provider) {
      request = db.getActiveWaitingRequestForPhone(provider.phone);
      if (request && request.matched_provider_id) {
        provider = db.getProviderById(request.matched_provider_id);
      }
    }

    if (!provider) return { error: "Provider not found" };

    const analysis = concierge.analyzeProviderMessage(rawResponse, request, provider);

    // 1. Check progressive profile updates (UNKNOWN != NO)
    if (analysis.commercialLearned !== null) {
      db.updateProvider(provider.id, { commercial_capable: analysis.commercialLearned });
      db.logEvent(request ? request.id : null, "PROVIDER_PROFILE_LEARNED", "SYSTEM", {
        provider_id: provider.id,
        field: "commercial_capable",
        value: analysis.commercialLearned
      });
      console.log(`[PROGRESSIVE PROFILE] Learned: Provider ${provider.name} commercial_capable = ${analysis.commercialLearned}`);
    }

    // 2. Operational availability rules
    if (analysis.intent === "PROVIDER_OFF_DUTY") {
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
    if (analysis.intent === "PROVIDER_DECLINED") {
      db.logEvent(request.id, "PROVIDER_DECLINED", "PROVIDER", {
        provider_id: provider.id,
        response: rawResponse
      });

      db.updateRequest(request.id, {
        cascade_step: (request.cascade_step || 0) + 1
      });
      return await this.dispatchNextCandidate(request.id);
    }

    // 4. Check if provider is asking a clarifying question to the customer
    if (analysis.intent === "PROVIDER_ASK_QUESTION") {
      db.logEvent(request.id, "PROVIDER_ASKED_CLARIFICATION", "PROVIDER", {
        provider_id: provider.id,
        question: analysis.question
      });

      db.updateRequest(request.id, {
        status: "WAITING_CUSTOMER_CLARIFICATION"
      });

      const questionToCustomer = concierge.formatProviderClarificationRelay(provider, analysis.question);

      await channels.sendCustomerMessage(request, questionToCustomer, {
        isProviderQuestion: true,
        providerId: provider.id
      });

      return { success: true, status: "WAITING_CUSTOMER_CLARIFICATION", question: analysis.question };
    }

    // 5. Provider Gave Quote
    const quote = db.createQuote({
      request_id: request.id,
      provider_id: provider.id,
      quoted_price: analysis.price,
      quoted_price_display: analysis.priceDisplay,
      estimated_arrival: analysis.eta,
      notes: rawResponse
    });

    db.updateRequest(request.id, {
      status: "QUOTE_RECEIVED",
      quoted_price: analysis.price,
      quoted_price_display: analysis.priceDisplay,
      estimated_arrival: analysis.eta
    });

    const customerResponse = concierge.formatQuoteForCustomer(provider, analysis);

    await channels.sendCustomerMessage(request, customerResponse, {
      quoteId: quote.id,
      providerName: provider.display_name,
      price: analysis.priceDisplay,
      eta: analysis.eta,
      promptConfirmation: true
    });

    db.updateRequest(request.id, { status: "WAITING_CUSTOMER" });

    return { success: true, quote, request };
  }
}

export const cascadingEngine = new CascadingEngine(45000);
