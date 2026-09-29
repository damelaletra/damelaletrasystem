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

export function getServiceModality(category, serviceType) {
  const cat = (category || "").toUpperCase();
  const st = (serviceType || "").toUpperCase();

  // 1. Digital, Creative, Software, Consulting, Remote & Professional Services
  if (
    cat === "TECH_SOFTWARE" ||
    cat === "CONSULTING_PROFESSIONAL" ||
    cat === "LEGAL_IMMIGRATION" ||
    cat === "ACCOUNTING_TAXES" ||
    cat === "MARKETING_DIGITAL" ||
    cat === "TRANSLATION_SERVICES" ||
    st.includes("DESIGN") ||
    st.includes("SOFTWARE") ||
    st.includes("DEVELOPMENT") ||
    st.includes("CONSULTING") ||
    st.includes("TAX") ||
    st.includes("LOGO") ||
    st.includes("BRANDING") ||
    st.includes("WEB") ||
    st.includes("APP") ||
    st.includes("TRANSLATION")
  ) {
    return "CONSULTING_PROJECT";
  }

  // 2. Scheduled Appointments & Scheduled In-Person Visits (Estimates, Cleaning, Inspections, Events)
  if (
    cat === "CLEANING" ||
    cat === "TREE_SERVICE" ||
    cat === "ROOFING" ||
    cat === "HANDYMAN" ||
    cat === "EVENTS_CATERING" ||
    cat === "BEAUTY_BARBER" ||
    st.includes("CLEANING") ||
    st.includes("MOWING") ||
    st.includes("INSPECTION") ||
    st.includes("PAINTING") ||
    st.includes("PHOTOGRAPHY") ||
    st.includes("CATERING") ||
    st.includes("BARBER")
  ) {
    return "APPOINTMENT_SCHEDULED";
  }

  // 3. Urgent Field Dispatch (Tires, Towing, Locksmith auto lockout, Burst pipes, Urgent AC repair)
  return "EMERGENCY_DISPATCH";
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
    if (lower.includes("hoy no trabajo") || lower.includes("no trabajo hoy") || lower.includes("no estoy trabajando hoy") || lower.includes("off duty") || lower.includes("fuera de servicio")) {
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

    const isPriceOrAppointmentOffer =
      lower.includes("personaliz") ||
      lower.includes("relativ") ||
      lower.includes("depende") ||
      lower.includes("oficina") ||
      lower.includes("estimado") ||
      lower.includes("presupuesto") ||
      lower.includes("martes") ||
      lower.includes("lunes") ||
      lower.includes("miercoles") ||
      lower.includes("miércoles") ||
      lower.includes("jueves") ||
      lower.includes("viernes") ||
      lower.includes("sabado") ||
      lower.includes("sábado") ||
      lower.includes("domingo") ||
      lower.includes("mañana") ||
      lower.includes("$") ||
      lower.includes("cobro") ||
      lower.includes("costo") ||
      lower.includes("precio");

    if (isQuestion && !isPriceOrAppointmentOffer) {
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

    // 5. Check Quote Offer (Price, Price Range, Conditions, Arrival Time / Appointment)
    let eta = "lo antes posible";
    let textWithoutEta = normalizeSpanishNumberWords(lower);

    // A) Day of week & appointment time matching (e.g. "el martes a las 2", "martes a las 2:00 pm", "este miércoles a las 3", "el viernes por la tarde")
    const dayTimeMatch = textWithoutEta.match(/(?:el|este|próximo|proximo)?\s*(lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)\s*(?:a\s+las?|sobre\s+las?|en\s+la\s+tarde|en\s+la\s+mañana)?\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
    const dayMatch = textWithoutEta.match(/(?:el|este|próximo|proximo)\s+(lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)/i);
    const specificTimeMatch = textWithoutEta.match(/(?:hoy|mañana)\s+a\s+las?\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);

    // B) Time ranges (e.g. 'de 15 a 20 minutos', '15-20 mins', 'entre 1 y 2 horas')
    const timeRangeMatch = textWithoutEta.match(/(?:en|de|entre|a|como en|como a|unos?)\s+(\d{1,3})\s*(?:a|-|y)\s*(\d{1,3})\s*(minutos?|mins?|horas?|hrs?|días?|dias?)/i);

    // C) Single duration (e.g. 'en 20 minutos', 'estoy a diez minutos', '1 hora', 'media hora')
    const singleTimeMatch = textWithoutEta.match(/(?:en|a|como en|como a|unos?|sobre|de|en unos)?\s*(\d{1,3})\s*(minutos?|mins?|horas?|hrs?)/i);

    if (dayTimeMatch) {
      const day = dayTimeMatch[1].charAt(0).toUpperCase() + dayTimeMatch[1].slice(1).toLowerCase();
      let timeStr = dayTimeMatch[2].trim();
      if (/^\d{1,2}$/.test(timeStr)) {
        const hourNum = parseInt(timeStr, 10);
        timeStr = hourNum < 8 ? `${hourNum}:00 PM` : `${hourNum}:00 AM`;
      }
      eta = `el ${day.toLowerCase()} a las ${timeStr}`;
      textWithoutEta = textWithoutEta.replace(dayTimeMatch[0], " ");
    } else if (dayMatch) {
      eta = dayMatch[0];
      textWithoutEta = textWithoutEta.replace(dayMatch[0], " ");
    } else if (specificTimeMatch) {
      let timeStr = specificTimeMatch[1].trim();
      if (/^\d{1,2}$/.test(timeStr)) {
        const hourNum = parseInt(timeStr, 10);
        timeStr = hourNum < 8 ? `${hourNum}:00 PM` : `${hourNum}:00 AM`;
      }
      eta = `${specificTimeMatch[0].includes("mañana") ? "mañana" : "hoy"} a las ${timeStr}`;
      textWithoutEta = textWithoutEta.replace(specificTimeMatch[0], " ");
    } else if (timeRangeMatch) {
      eta = `${timeRangeMatch[1]} a ${timeRangeMatch[2]} ${timeRangeMatch[3]}`;
      textWithoutEta = textWithoutEta.replace(timeRangeMatch[0], " ");
    } else if (singleTimeMatch) {
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

    // Check custom / in-office / consultation indicators
    const isCustomEstimate =
      lower.includes("personaliz") ||
      lower.includes("relativ") ||
      lower.includes("depende") ||
      lower.includes("dependiendo") ||
      lower.includes("según el caso") ||
      lower.includes("segun el caso") ||
      lower.includes("a convenir") ||
      lower.includes("a evaluar") ||
      lower.includes("en la oficina") ||
      lower.includes("en mi oficina") ||
      lower.includes("en consulta") ||
      lower.includes("en una consulta") ||
      lower.includes("cita en la oficina") ||
      lower.includes("consulta en la oficina") ||
      lower.includes("estimado en la oficina") ||
      lower.includes("estimado en consulta") ||
      lower.includes("hacemos un estimado") ||
      lower.includes("le hacemos un estimado") ||
      lower.includes("hacerle un estimado") ||
      lower.includes("hacer un estimado") ||
      lower.includes("hacerle un presupuesto") ||
      lower.includes("darle un presupuesto");

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
      } else if (!isCustomEstimate) {
        const allNums = [...textWithoutEta.matchAll(/\b(\d{2,4})\b/g)];
        for (const numMatch of allNums) {
          numericPrice = parseFloat(numMatch[1]);
          priceDisplay = `$${numMatch[1]}`;
          break;
        }
      }
    }

    if (!priceDisplay && isCustomEstimate) {
      numericPrice = null;
      if (lower.includes("oficina")) {
        priceDisplay = "Estimado personalizado en la oficina";
      } else if (lower.includes("consulta")) {
        priceDisplay = "Estimado personalizado en consulta";
      } else {
        priceDisplay = "Estimado según el caso";
      }
    }

    if (!priceDisplay) {
      const modality = getServiceModality(activeRequest?.service_category || provider?.category, activeRequest?.service_type || provider?.services?.[0]);
      if (modality === "CONSULTING_PROJECT") {
        numericPrice = null;
        priceDisplay = "Estimado personalizado en consulta";
      } else if (modality === "APPOINTMENT_SCHEDULED") {
        numericPrice = null;
        priceDisplay = "Estimado personalizado";
      } else {
        if (provider?.conditional_rules?.default_callout_fee) {
          numericPrice = provider.conditional_rules.default_callout_fee;
          priceDisplay = `$${numericPrice}`;
        } else {
          numericPrice = null;
          priceDisplay = "Estimado en el sitio";
        }
      }
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

  formatQuoteForCustomer(provider, quoteInfo, request = null) {
    const category = request?.service_category || provider?.category;
    const serviceType = request?.service_type || provider?.services?.[0];
    const modality = getServiceModality(category, serviceType);

    const etaText = quoteInfo.eta || quoteInfo.estimated_arrival || "lo antes posible";
    const priceDisplay = quoteInfo.priceDisplay || quoteInfo.quoted_price_display || null;
    const priceNum = (quoteInfo.price !== undefined) ? quoteInfo.price : quoteInfo.quoted_price;

    const isCustomOrNull =
      (priceNum === null && !/^\s*\$\d+/.test(priceDisplay || "")) ||
      (!priceNum && !priceDisplay) ||
      (priceDisplay && (
        priceDisplay.toLowerCase().includes("estimado") ||
        priceDisplay.toLowerCase().includes("personaliz") ||
        priceDisplay.toLowerCase().includes("convenir") ||
        priceDisplay.toLowerCase().includes("según") ||
        priceDisplay.toLowerCase().includes("segun")
      ));

    if (modality === "CONSULTING_PROJECT") {
      if (isCustomOrNull) {
        const placeText = (priceDisplay && priceDisplay.toLowerCase().includes("oficina"))
          ? "en la oficina"
          : "en consulta";
        return `Listo. ${provider.display_name} tiene disponibilidad para tu consulta (${etaText}) y darte un estimado personalizado ${placeText}. ¿Quieres que te lo conecte?`;
      }
      return `Listo. ${provider.display_name} tiene disponibilidad para tu proyecto (${etaText}) con una tarifa de ${priceDisplay || `$${priceNum}`}. ¿Quieres que te lo conecte?`;
    }

    if (modality === "APPOINTMENT_SCHEDULED") {
      if (isCustomOrNull) {
        return `Listo. ${provider.display_name} puede agendar tu cita/visita (${etaText}) para hacerte un estimado personalizado. ¿Quieres que te lo conecte?`;
      }
      return `Listo. ${provider.display_name} puede agendar tu cita/visita (${etaText}) y su estimado es ${priceDisplay || `$${priceNum}`}. ¿Quieres que te lo conecte?`;
    }

    // Default: EMERGENCY_DISPATCH
    if (isCustomOrNull) {
      return `Listo. ${provider.display_name} puede atenderte (${etaText}) y coordinará el estimado directamente contigo en el sitio. ¿Quieres que te lo conecte?`;
    }
    return `Listo. ${provider.display_name} puede atenderte ${etaText} y cobra ${priceDisplay || `$${priceNum}`}. ¿Quieres que te lo conecte?`;
  }

  formatConnectionForCustomer(provider, arrivalTime, request = null) {
    const category = request?.service_category || provider?.category;
    const serviceType = request?.service_type || provider?.services?.[0];
    const modality = getServiceModality(category, serviceType);

    if (modality === "CONSULTING_PROJECT") {
      return `Perfecto. Te conecto con ${provider.name} ahora: Tel. ${provider.phone}.\nYa le pasé los detalles de tu solicitud para coordinar tu cita/consulta (${arrivalTime || 'fecha acordada'}).`;
    }

    if (modality === "APPOINTMENT_SCHEDULED") {
      return `Perfecto. Te conecto con ${provider.name} ahora: Tel. ${provider.phone}.\nYa le pasé la información para coordinar y agendar tu cita/visita (${arrivalTime || 'fecha acordada'}).`;
    }

    return `Perfecto. Te conecto con ${provider.name} ahora: Tel. ${provider.phone}.\nYa le pasé la información de tu solicitud y está en camino (${arrivalTime || 'lo antes posible'}).`;
  }

  formatConnectionForProvider(customerPhone, priceDisplay, request = null) {
    const category = request?.service_category;
    const serviceType = request?.service_type;
    const modality = getServiceModality(category, serviceType);

    const isCustom = !priceDisplay ||
      priceDisplay.toLowerCase().includes("estimado") ||
      priceDisplay.toLowerCase().includes("personaliz") ||
      priceDisplay.toLowerCase().includes("consulta");

    const priceLabel = isCustom
      ? `(${priceDisplay || "Estimado personalizado"})`
      : `por ${priceDisplay}`;

    if (modality === "CONSULTING_PROJECT") {
      return `¡Conexión Confirmada! El cliente aceptó tu propuesta ${priceLabel}. Contacto directo del cliente: ${customerPhone} para coordinar la cita y dar inicio a la consulta.`;
    }

    if (modality === "APPOINTMENT_SCHEDULED") {
      return `¡Conexión Confirmada! El cliente aceptó tu propuesta ${priceLabel}. Contacto directo del cliente: ${customerPhone} para agendar la fecha y hora de la cita.`;
    }

    return `¡Conexión Confirmada! El cliente aceptó tu cotización de ${priceDisplay || "servicio"}. Contacto directo del cliente: ${customerPhone}. ¡Gracias por atender a la comunidad!`;
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
