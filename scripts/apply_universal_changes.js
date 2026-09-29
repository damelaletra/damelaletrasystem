import fs from 'fs';

// 1. Update stateMachine.js
const smPath = 'src/core/stateMachine.js';
let smContent = fs.readFileSync(smPath, 'utf8');

// Update import in stateMachine.js
smContent = smContent.replace(
  'import { understandRequest, detectLegalSpecialty } from "./semantic.js";',
  'import { understandRequest, detectLegalSpecialty, understandClarification, CATEGORY_CLARIFICATION_PROMPTS } from "./semantic.js";'
);

// Replace Legal check with Universal Disambiguation check
const oldSMCheck = `    // 3. Check Legal Services Rule: Disambiguate when legal specialty is UNKNOWN
    if (
      understanding.service_category === "LEGAL_SERVICES" &&
      (understanding.legal_specialty === "UNKNOWN" || understanding.service_type === "UNKNOWN" || understanding.needs_clarification)
    ) {
      db.updateRequest(request.id, {
        normalized_intent: "LEGAL_INQUIRY",
        service_category: "LEGAL_SERVICES",
        service_type: "UNKNOWN",
        legal_specialty: "UNKNOWN",
        status: "WAITING_CUSTOMER_CLARIFICATION",
        clarification_type: "LEGAL_SPECIALTY",
        location_raw: understanding.location_raw,
        latitude: understanding.latitude,
        longitude: understanding.longitude,
        property_type: understanding.property_type,
        urgency: understanding.urgency
      });

      db.logEvent(request.id, "LEGAL_SPECIALTY_CLARIFICATION_REQUESTED", "SYSTEM", {
        rule: "LEGAL_SERVICES_DISAMBIGUATION",
        legal_specialty: "UNKNOWN"
      });

      const legalPrompt = understanding.clarification_prompt || "Claro. ¿Qué tipo de asunto legal necesitas resolver?";
      await channels.sendCustomerMessage(request, legalPrompt, { requiresClarification: true, isLegalDisambiguation: true });
      return { request: db.getRequestById(request.id), status: "WAITING_CUSTOMER_CLARIFICATION", message: legalPrompt };
    }`;

const newSMCheck = `    // 3. Universal Rule: Disambiguate when service_type is UNKNOWN or needs_clarification (ESTO DEBERÍA SER PARA CADA CASO)
    if (
      understanding.service_category &&
      (understanding.service_type === "UNKNOWN" || understanding.needs_clarification)
    ) {
      const prompt = understanding.clarification_prompt ||
        CATEGORY_CLARIFICATION_PROMPTS[understanding.service_category] ||
        "Claro. ¿Me podrías detallar un poco más qué tipo de trabajo o problema necesitas resolver?";

      db.updateRequest(request.id, {
        normalized_intent: \`\${understanding.service_category}_INQUIRY\`,
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
    }`;

smContent = smContent.replace(oldSMCheck, newSMCheck);

// Replace Case A in activeWaitingClarification with universal resolution
const oldCaseA = `      // Case A: Customer is resolving a Legal Specialty Disambiguation prompt ("Claro. ¿Qué tipo de asunto legal necesitas resolver?")
      if (activeWaitingClarification.clarification_type === "LEGAL_SPECIALTY" || activeWaitingClarification.service_category === "LEGAL_SERVICES") {
        const detectedSpecialty = detectLegalSpecialty(text);
        const resolvedSpecialty = detectedSpecialty !== "LEGAL_GENERAL" ? detectedSpecialty : "LEGAL_GENERAL";

        db.updateRequest(activeWaitingClarification.id, {
          status: "SEARCHING",
          service_category: "LEGAL_SERVICES",
          service_type: resolvedSpecialty,
          legal_specialty: resolvedSpecialty,
          clarification_type: null
        });

        db.logEvent(activeWaitingClarification.id, "LEGAL_SPECIALTY_RESOLVED", "CUSTOMER", {
          rawAnswer: text,
          resolvedSpecialty
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
        const matchedProvider = ranked[0].provider;

        db.updateRequest(activeWaitingClarification.id, {
          status: "CONTACTING_PROVIDER",
          matched_provider_id: matchedProvider.id,
          match_score: ranked[0].scores.final
        });

        await cascadingEngine.startCascade(db.getRequestById(activeWaitingClarification.id), ranked);
        return { request: db.getRequestById(activeWaitingClarification.id), status: "WAITING_PROVIDER", matchedProvider };
      }`;

const newCaseA = `      // Case A: Customer is resolving a Service Disambiguation prompt for ANY category (ESTO DEBERÍA SER PARA CADA CASO)
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
        const matchedProvider = ranked[0].provider;

        db.updateRequest(activeWaitingClarification.id, {
          status: "CONTACTING_PROVIDER",
          matched_provider_id: matchedProvider.id,
          match_score: ranked[0].scores.final
        });

        await cascadingEngine.startCascade(db.getRequestById(activeWaitingClarification.id), ranked);
        return { request: db.getRequestById(activeWaitingClarification.id), status: "WAITING_PROVIDER", matchedProvider };
      }`;

smContent = smContent.replace(oldCaseA, newCaseA);
fs.writeFileSync(smPath, smContent, 'utf8');
console.log('Successfully updated stateMachine.js with Universal Disambiguation');

// 2. Update gemini.js
const geminiPath = 'src/core/gemini.js';
let gContent = fs.readFileSync(geminiPath, 'utf8');
const oldGeminiRule = `- REGLA DE SERVICIOS LEGALES:
  * Si el cliente solicita "un abogado", "un lawyer", "bufete" o términos legales equivalentes, NO asumas la especialidad legal.
  * Clasifica la intención general como "LEGAL_SERVICES" y marca legal_specialty: "UNKNOWN" (y service_type: "UNKNOWN") a menos que el cliente especifique expresamente el área ("abogado de inmigración", "abogado de accidentes", "abogado criminal", "abogado de divorcio/familia", "abogado de tickets").
  * NO asignes a contables, preparadores de taxes o notarios como abogados.
  * Si legal_specialty es "UNKNOWN", marca "needs_clarification": true y "clarification_prompt": "Claro. ¿Qué tipo de asunto legal necesitas resolver?".`;

const newGeminiRule = `- REGLA UNIVERSAL DE DESAMBIGUACIÓN (PARA CADA CATEGORÍA):
  * Si el cliente solicita un profesional o servicio de forma genérica ("un plomero", "un mecánico", "un electricista", "un cerrajero", "limpieza", "un contador", "un handyman", "un techero", "un abogado", "un diseñador", etc.) SIN detallar la falla o tarea concreta:
  * NO asumas el sub-servicio ni la urgencia.
  * Clasifica la categoría correspondiente y marca service_type: "UNKNOWN", needs_clarification: true.
  * Formula un "clarification_prompt" cordial y conciso (ej. "¿Qué tipo de problema de plomería necesitas resolver?", "¿Qué falla presenta tu vehículo?", "¿Necesitas ayuda con taxes personales, de negocio o contabilidad?", "¿Qué tipo de asunto legal necesitas resolver?").
  * AISLAMIENTO ESTRICTO DE CATEGORÍAS: NUNCA hagas matching con categorías no afines (ej. no emparejar contables con abogados, ni mecánicos con cerrajeros, ni diseño con HVAC).
  * UNKNOWN ≠ INELIGIBLE: Si un proveedor no tiene registrado un subtipo específico, se marca UNKNOWN y se verifica, no se le descarta automáticamente.
  * Solo asigna service_type específico cuando el cliente lo indique explícitamente ("se me ponchó la goma", "tubo botando agua", "abogado de inmigración", "hacer un logo").`;

gContent = gContent.replace(oldGeminiRule, newGeminiRule);
fs.writeFileSync(geminiPath, gContent, 'utf8');
console.log('Successfully updated gemini.js with Universal Disambiguation rule');

// 3. Update eligibility.js
const eligPath = 'src/core/eligibility.js';
let eligContent = fs.readFileSync(eligPath, 'utf8');
const oldEligBlock = `  } else if (request.service_category === "LEGAL_SERVICES" && request.legal_specialty && request.legal_specialty !== "UNKNOWN") {
    const hasExplicitSpecialty = provider.legal_specialties && provider.legal_specialties.includes(request.legal_specialty);
    const hasGeneralPractice = provider.legal_specialties && (provider.legal_specialties.includes("GENERAL_PRACTICE") || provider.legal_specialties.includes("ALL"));
    if (!hasExplicitSpecialty && !hasGeneralPractice) {
      // UNKNOWN != INELIGIBLE. Verified via inquiry if needed
      progressiveInquiry = {
        type: "CONFIRM_LEGAL_SPECIALTY",
        question: "Hola " + provider.name + ", tenemos una consulta legal sobre " + request.legal_specialty + ". ¿Tomas casos de esta especialidad?"
      };
    }
  }`;

const newEligBlock = `  } else if (request.service_type && request.service_type !== "UNKNOWN") {
    // Universal Rule: UNKNOWN != INELIGIBLE for any category!
    const hasExplicitService = provider.services && provider.services.includes(request.service_type);
    const hasSpecialty = (request.service_category === "LEGAL_SERVICES" && request.legal_specialty && provider.legal_specialties) ?
      (provider.legal_specialties.includes(request.legal_specialty) || provider.legal_specialties.includes("GENERAL_PRACTICE") || provider.legal_specialties.includes("ALL")) : false;

    if (!hasExplicitService && !hasSpecialty) {
      progressiveInquiry = {
        type: "CONFIRM_SERVICE_SUBTYPE",
        question: "Hola " + provider.name + ", tenemos una solicitud de " + request.service_type + ". ¿Tomas este tipo de trabajo?"
      };
    }
  }`;

eligContent = eligContent.replace(oldEligBlock, newEligBlock);
fs.writeFileSync(eligPath, eligContent, 'utf8');
console.log('Successfully updated eligibility.js with universal UNKNOWN != INELIGIBLE');
