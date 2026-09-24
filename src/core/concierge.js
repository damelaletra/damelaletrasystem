// Conversational Concierge Engine for Dame La Letra (DML)
// Bridges customer and provider communications with deep natural language comprehension,
// warm Cuban/Latino concierge persona, and multi-turn dialogue state management.

import { understandRequest } from "./semantic.js";
import { geminiService } from "./gemini.js";

export const CUSTOMER_YES_WORDS = [
  "sí", "si", "dale", "dale luz verde", "conéctalo", "conéctame", "conecta",
  "claro", "por favor", "yes", "ok", "okay", "perfecto", "me parece bien", "que venga",
  "mándalo", "mandalo", "está bien", "esta bien", "trato hecho", "de acuerdo", "dale pues",
  "confirmo", "confirma", "confírmale", "confirmale", "adelante", "bien", "vale",
  "bueno", "excelente", "listo", "hecho", "vamos", "avanza", "dale viaje", "seguro", "va", "dale que si", "de una"
];

export const CUSTOMER_NO_WORDS = [
  "no", "cancelar", "cancela", "muy caro", "está caro", "esta caro",
  "no gracias", "déjalo", "dejalo", "no puedo", "busca otro", "otro", "ninguno", "demasiado caro"
];

export function isCustomerAcceptance(rawText) {
  const text = (rawText || "").trim();
  const lower = text.toLowerCase();

  const hasYes = CUSTOMER_YES_WORDS.some(w => {
    if (w.includes(" ")) return lower.includes(w);
    const regex = new RegExp(`(^|\\s|[.,!¿¡])${w}($|\\s|[.,!¿¡])`, "i");
    return regex.test(lower) || lower === w || lower.startsWith(w + " ") || lower.endsWith(" " + w);
  });

  const isExplicitDecline = (lower === "no" || lower === "cancela" || lower === "cancelar" || lower.startsWith("no gracias") || lower.includes("muy caro") || lower.includes("busca otro"));

  if (hasYes && !isExplicitDecline) return true;
  if (hasYes && isExplicitDecline) {
    if (lower.startsWith("si") || lower.startsWith("sí") || lower.includes("confírmale") || lower.includes("confirmale") || lower.includes("dale")) {
      return true;
    }
  }
  return false;
}

export function isCustomerDecline(rawText) {
  const text = (rawText || "").trim();
  const lower = text.toLowerCase();
  if (isCustomerAcceptance(text)) return false;
  return CUSTOMER_NO_WORDS.some(w => {
    if (w.includes(" ")) return lower.includes(w);
    const regex = new RegExp(`(^|\\s|[.,!¿¡])${w}($|\\s|[.,!¿¡])`, "i");
    return regex.test(lower) || lower === w;
  });
}

export function normalizeSpanishNumberWords(str) {
  if (!str) return "";
  let s = str.toLowerCase();
  const map = [
    { word: "cuarenta y cinco", num: "45" },
    { word: "treinta y cinco", num: "35" },
    { word: "veinticinco", num: "25" },
    { word: "cincuenta", num: "50" },
    { word: "cuarenta", num: "40" },
    { word: "treinta", num: "30" },
    { word: "veinte", num: "20" },
    { word: "quince", num: "15" },
    { word: "diez", num: "10" },
    { word: "cinco", num: "5" },
    { word: "cuatro", num: "4" },
    { word: "tres", num: "3" },
    { word: "dos", num: "2" },
    { word: "una", num: "1" },
    { word: "un", num: "1" }
  ];
  for (const item of map) {
    const regex = new RegExp(`\\b${item.word}\\b`, "gi");
    s = s.replace(regex, item.num);
  }
  return s;
}

export class ConversationalConcierge {
  /**
   * Analyze message coming from a Customer
   */
  analyzeCustomerMessage(rawText, activeRequest = null) {
    const text = (rawText || "").trim();
    const lower = text.toLowerCase();

    // 1. If customer is in an active confirmation state (WAITING_CUSTOMER or recent CUSTOMER_DECLINED)
    if (activeRequest && (activeRequest.status === "WAITING_CUSTOMER" || activeRequest.status === "CUSTOMER_DECLINED")) {
      if (isCustomerAcceptance(text)) {
        return {
          intent: "CUSTOMER_ACCEPT_QUOTE",
          confidence: 0.98,
          text
        };
      } else if (isCustomerDecline(text)) {
        const wantsAnother = lower.includes("otro") || lower.includes("busca") || lower.includes("caro");
        return {
          intent: wantsAnother ? "CUSTOMER_REQUEST_ANOTHER" : "CUSTOMER_DECLINE_QUOTE",
          confidence: 0.92,
          text
        };
      }
    }

    // 2. If customer is answering a provider's clarifying question (WAITING_CUSTOMER_CLARIFICATION)
    if (activeRequest && activeRequest.status === "WAITING_CUSTOMER_CLARIFICATION") {
      return {
        intent: "CUSTOMER_ANSWER_CLARIFICATION",
        confidence: 0.92,
        text
      };
    }

    // 3. Otherwise, analyze as a new or modified service request
    const understanding = understandRequest(text);
    return {
      intent: "NEW_SERVICE_REQUEST",
      confidence: understanding.confidence,
      understanding,
      text
    };
  }

  /**
   * Analyze message coming from a Provider
   */
  analyzeProviderMessage(rawText, activeRequest = null, provider = null) {
    const text = (rawText || "").trim();
    const lower = text.toLowerCase();

    // 1. Check availability updates
    if (lower.includes("hoy no trabajo") || lower.includes("no trabajo hoy") || lower.includes("no estoy trabajando hoy")) {
      return {
        intent: "PROVIDER_OFF_DUTY",
        confidence: 0.95,
        text
      };
    }

    // 2. Check commercial capability progressive profiling
    let commercialLearned = null;
    if (lower.includes("hago comercial") || lower.includes("hacemos comercial") || (lower.includes("comercial") && (lower.includes("sí") || lower.includes("si")))) {
      commercialLearned = 1;
    } else if (lower.includes("no hago comercial") || lower.includes("solo residencial") || lower.includes("únicamente residencial")) {
      commercialLearned = 0;
    }

    // 3. Check Decline
    const declineWords = [
      "no puedo", "ocupado", "no llego", "paso", "no hago ese trabajo",
      "imposible", "lleno de trabajo", "no tengo tiempo", "ahora no puedo"
    ];
    if ((declineWords.some(w => lower.includes(w)) || lower === "no") && !lower.includes("sí") && !lower.includes("si")) {
      return {
        intent: "PROVIDER_DECLINED",
        confidence: 0.95,
        commercialLearned,
        text
      };
    }

    // 4. Check Clarification Question to Customer
    const isQuestion =
      text.includes("?") ||
      /^(que|qué|cuanto|cuánto|cuantos|cuántos|donde|dónde|cual|cuál|es de|tiene|dime|pregúntale|preguntale|necesito saber|cuántas|cuantas|cuántos|cuantos)/i.test(lower) ||
      ((lower.includes("tamaño") || lower.includes("cuartos") || lower.includes("pisos") || lower.includes("foto") || lower.includes("marca") || lower.includes("modelo")) && !lower.includes("$") && !lower.includes("cobro") && !lower.includes("costo"));

    const hasPriceKeyword = lower.includes("$") || lower.includes("cobro") || lower.includes("costo") || lower.includes("precio") || lower.includes("entre") || /\b\d{2,4}\b/.test(lower);

    if (isQuestion && !hasPriceKeyword) {
      // Clean up provider prompt prefix if they say "Pregúntale que..." or "Dile que..."
      let cleanQuestion = text;
      cleanQuestion = cleanQuestion.replace(/^(?:pregúntale|preguntale|dile|pregunta)\s+(?:al cliente\s+)?(?:que|si)?\s*/i, "").trim();
      if (cleanQuestion.length > 0) {
        cleanQuestion = cleanQuestion.charAt(0).toUpperCase() + cleanQuestion.slice(1);
      }
      if (!cleanQuestion.includes("?") && isQuestion) {
        cleanQuestion += "?";
      }

      return {
        intent: "PROVIDER_ASK_QUESTION",
        confidence: 0.93,
        question: cleanQuestion,
        commercialLearned,
        text
      };
    }

    // 5. Check Quote Offer (Price, Price Range, Conditions, Arrival Time)
    let eta = "lo antes posible";
    let textWithoutEta = normalizeSpanishNumberWords(lower);

    // A) Time ranges (e.g. 'de 15 a 20 minutos', '15-20 mins', 'entre 1 y 2 horas')
    const timeRangeMatch = textWithoutEta.match(/(?:en|de|entre|a|como en|como a|unos?)\s+(\d{1,3})\s*(?:a|-|y)\s*(\d{1,3})\s*(minutos?|mins?|horas?|hrs?|días?|dias?)/i);
    if (timeRangeMatch) {
      eta = `${timeRangeMatch[1]} a ${timeRangeMatch[2]} ${timeRangeMatch[3]}`;
      textWithoutEta = textWithoutEta.replace(timeRangeMatch[0], " ");
    } else {
      // B) Single duration (e.g. 'en 20 minutos', 'estoy a diez minutos', '1 hora', 'media hora')
      const singleTimeMatch = textWithoutEta.match(/(?:en|a|como en|como a|unos?|sobre|de|en unos)?\s*(\d{1,3})\s*(minutos?|mins?|horas?|hrs?)/i);
      if (singleTimeMatch) {
        eta = `${singleTimeMatch[1]} ${singleTimeMatch[2]}`;
        textWithoutEta = textWithoutEta.replace(singleTimeMatch[0], " ");
      } else if (lower.includes("media hora")) {
        eta = "media hora";
        textWithoutEta = textWithoutEta.replace(/media\s+hora/g, " ");
      } else if (lower.includes("mañana por la mañana") || lower.includes("mañana en la mañana")) {
        eta = "mañana por la mañana";
        textWithoutEta = textWithoutEta.replace(/mañana\s+(?:por|en)\s+la\s+mañana/g, " ");
      } else if (lower.includes("mañana por la tarde") || lower.includes("mañana en la tarde")) {
        eta = "mañana por la tarde";
        textWithoutEta = textWithoutEta.replace(/mañana\s+(?:por|en)\s+la\s+tarde/g, " ");
      } else if (lower.includes("mañana")) {
        eta = "mañana";
        textWithoutEta = textWithoutEta.replace(/mañana/g, " ");
      } else if (lower.includes("hoy en la tarde") || lower.includes("esta tarde")) {
        eta = "esta tarde";
        textWithoutEta = textWithoutEta.replace(/(?:hoy\s+en\s+la\s+tarde|esta\s+tarde)/g, " ");
      } else if (lower.includes("hoy")) {
        eta = "hoy";
      } else if (lower.includes("ahora mismo") || lower.includes("voy saliendo") || lower.includes("ya mismo")) {
        eta = "ahora mismo (en camino)";
      } else if (provider?.conditional_rules?.standard_response_time_min) {
        eta = `${provider.conditional_rules.standard_response_time_min} minutos`;
      }
    }

    // Extract price and price range on textWithoutEta
    let priceDisplay = null;
    let numericPrice = null;

    // A) Price Range: "entre 100 y 200", "de 120 a 160", "100-150"
    const rangeMatch = textWithoutEta.match(/(?:entre|de)\s*\$?(\d{2,4})\s*(?:y|a|-)\s*\$?(\d{2,4})/i);
    const hyphenMatch = textWithoutEta.match(/\$?(\d{2,4})\s*-\s*\$?(\d{2,4})/);

    if (rangeMatch) {
      priceDisplay = `$${rangeMatch[1]} - $${rangeMatch[2]}`;
      numericPrice = (parseFloat(rangeMatch[1]) + parseFloat(rangeMatch[2])) / 2;
    } else if (hyphenMatch) {
      priceDisplay = `$${hyphenMatch[1]} - $${hyphenMatch[2]}`;
      numericPrice = (parseFloat(hyphenMatch[1]) + parseFloat(hyphenMatch[2])) / 2;
    } else {
      // B) Single price
      const dollarMatch = textWithoutEta.match(/\$\s*(\d{2,4})/);
      const verbMatch = textWithoutEta.match(/(?:cobro|son|serian|serían|cuesta|precio|costo|sale en|sale por|por|de)\s*\$?(\d{2,4})/i);

      if (dollarMatch) {
        numericPrice = parseFloat(dollarMatch[1]);
        priceDisplay = `$${dollarMatch[1]}`;
      } else if (verbMatch) {
        numericPrice = parseFloat(verbMatch[1]);
        priceDisplay = `$${verbMatch[1]}`;
      } else {
        const allNums = [...textWithoutEta.matchAll(/\b(\d{2,4})\b/g)];
        for (const numMatch of allNums) {
          numericPrice = parseFloat(numMatch[1]);
          priceDisplay = `$${numMatch[1]}`;
          break;
        }
      }
    }

    if (!priceDisplay) {
      numericPrice = provider?.conditional_rules?.default_callout_fee || 80;
      priceDisplay = `$${numericPrice}`;
    }

    return {
      intent: "PROVIDER_GIVE_QUOTE",
      confidence: 0.94,
      price: numericPrice,
      priceDisplay: priceDisplay,
      eta: eta,
      commercialLearned,
      rawNotes: rawText,
      text
    };
  }

  /**
   * Format warm concierge messages
   */
  formatCustomerFirstResponse() {
    return "Dame un momento.";
  }

  formatProviderClarificationRelay(provider, questionText) {
    return `${provider.name} (${provider.display_name || provider.category}) te pregunta:\n\n"${questionText}"\n\nRespóndele aquí directamente para darte el precio exacto.`;
  }

  formatCustomerAnswerRelay(provider, answerText) {
    return `El cliente te responde:\n\n"${answerText}"\n\n¿Puedes atenderlo? ¿Cuánto le cotizas y cuándo puedes ir?`;
  }

  formatQuoteForCustomer(provider, quoteInfo) {
    return `Listo. ${provider.display_name} puede atenderte ${quoteInfo.eta} y cobra ${quoteInfo.priceDisplay}. ¿Quieres que te lo conecte?`;
  }

  formatConnectionForCustomer(provider, arrivalTime) {
    return `Perfecto. Te conecto con ${provider.name} ahora: Tel. ${provider.phone}.\nYa le pasé la información de tu solicitud y está en camino (${arrivalTime}).`;
  }

  formatConnectionForProvider(customerPhone, priceDisplay) {
    return `¡Conexión Confirmada! El cliente aceptó tu cotización de ${priceDisplay}. Contacto directo del cliente: ${customerPhone}. ¡Gracias por atender a la comunidad!`;
  }

  /**
   * Async analysis leveraging Gemini LLM with instant local fallback
   */
  async analyzeCustomerMessageAsync(rawText, activeRequest = null) {
    if (geminiService.isAvailable()) {
      const llmResult = await geminiService.understandCustomerMessage(rawText, activeRequest);
      if (llmResult && llmResult.confidence >= 0.70) {
        if (llmResult.is_affirmation && activeRequest && (activeRequest.status === "WAITING_CUSTOMER" || activeRequest.status === "CUSTOMER_DECLINED")) {
          return { intent: "CUSTOMER_ACCEPT_QUOTE", confidence: llmResult.confidence, text: rawText };
        }
        if (llmResult.is_decline && activeRequest && activeRequest.status === "WAITING_CUSTOMER") {
          return { intent: "CUSTOMER_DECLINE_QUOTE", confidence: llmResult.confidence, text: rawText };
        }
      }
    }
    return this.analyzeCustomerMessage(rawText, activeRequest);
  }

  async analyzeProviderMessageAsync(rawText, activeRequest = null, provider = null) {
    if (geminiService.isAvailable()) {
      const llmResult = await geminiService.analyzeProviderMessage(rawText, activeRequest, provider);
      if (llmResult && llmResult.confidence >= 0.75) {
        return {
          intent: llmResult.intent,
          confidence: llmResult.confidence,
          price: llmResult.price,
          priceDisplay: llmResult.price_display || (llmResult.price ? `$${llmResult.price}` : null),
          eta: llmResult.estimated_arrival || "lo antes posible",
          question: llmResult.question_to_customer,
          commercialLearned: llmResult.commercial_learned,
          text: rawText
        };
      }
    }
    return this.analyzeProviderMessage(rawText, activeRequest, provider);
  }
}

export const concierge = new ConversationalConcierge();
