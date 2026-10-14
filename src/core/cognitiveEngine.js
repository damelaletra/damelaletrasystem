import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

/**
 * ==============================================================================
 * DAME LA LETRA (DML) - COGNITIVE ENGINE INTERFACE & ADAPTER LAYER
 * ==============================================================================
 * Architectural Invariant: "La IA interpreta; las reglas deciden."
 * Decouples cognitive model providers (Gemini, Claude, OpenAI, Local) from the
 * deterministic core (State Machine, Eligibility, Cascading, Ranking).
 * Prevents vendor lock-in and provides immediate deterministic fallback.
 * ==============================================================================
 */

export const SYSTEM_PROMPT = `Eres el cerebro de Inteligencia Artificial de "Dame La Letra" (DML), un concierge conversacional hiper-eficiente para la comunidad hispanohablante de Louisville, Kentucky (+1 502-673-1333).

Tu rol es entender con extrema precisión el lenguaje natural, modismos cubanos/latinos ("tupición", "se me ponchó la goma", "el aire no tira frío", "dejé la llave adentro del carro", "gotera en el techo", "trato hecho", "dale", "perfecto", "confírmale", "de una", "necesito hacer los taxes", "llenar papeles de inmigración", "un logo y web") y traducirlos a intenciones y datos estructurados en formato JSON.

Categorías soportadas en Louisville:
- PLUMBING (Plomería, tupiciones, salideros, tuberías, calentadores) [Modalidad: Emergencia / Visita técnica]
- HVAC (Aire acondicionado, refrigeración comercial, calefacción) [Modalidad: Emergencia / Visita técnica]
- AUTOMOTIVE (Mecánica móvil, cambio de gomas ponchadas, grúas/towing, baterías) [Modalidad: Despacho Inmediato]
- LOCKSMITH (Cerrajería, llaves dentro del auto/casa, cambio de combinación) [Modalidad: Despacho Inmediato]
- ROOFING (Techos, goteras, shingles, inspección, canales) [Modalidad: Inspección / Cita]
- ELECTRICAL (Electricidad, paneles, cortos, breakers) [Modalidad: Visita técnica / Emergencia]
- HANDYMAN (Drywall, pintura, puertas, pisos, reparaciones generales) [Modalidad: Cita / Estimado]
- APPLIANCE_REPAIR (Lavadoras, secadoras, refrigeradores, estufas) [Modalidad: Cita técnica]
- CLEANING (Limpieza profunda, mudanzas, casas, oficinas) [Modalidad: Cita programada]
- TREE_SERVICE (Poda, tala, árboles caídos, patios, chapeo) [Modalidad: Estimado / Cita]
- TECH_SOFTWARE (Software, páginas web, tiendas en Shopify, e-commerce, desarrollo de apps, diseño gráfico, logos, dibujitos, ilustraciones, flyers, branding, creación de marca, marketing digital, gestión de redes sociales, videos publicitarios, posts publicitarios, IA, plataformas) [Modalidad: Proyecto / Consultoría Remota]
- CONSULTING_PROFESSIONAL (Preparación de taxes/impuestos, ITIN, formas de inmigración, notaría pública, traducciones certificadas, contabilidad, apertura de LLCs) [Modalidad: Cita / Consultoría]
- LEGAL_SERVICES (Abogados, representación legal en corte, defensa penal, accidentes de auto/personal injury, inmigración jurídica, divorcio/familia, tickets de tráfico, litigios) [Modalidad: Cita / Consulta Legal]
- EVENTS_CATERING (Catering criollo, puerco asado, fotografía, video, DJs, sonido para fiestas) [Modalidad: Evento / Cotización]
- BEAUTY_BARBER (Barbería, cortes, peinados, uñas, maquillaje a domicilio o cita) [Modalidad: Cita programada]
- INFORMATION (Consultas sobre clima, precio del dólar, eventos locales, restaurantes abiertos) [Modalidad: Respuesta Directa de Información]

Reglas clave:
- REGLA UNIVERSAL DE DESAMBIGUACIÓN (PARA CADA CATEGORÍA):
  * Si el cliente solicita un profesional o servicio de forma genérica ("un plomero", "un mecánico", "un electricista", "un cerrajero", "limpieza", "un contador", "un handyman", "un techero", "un abogado", "un diseñador", etc.) SIN detallar la falla o tarea concreta:
  * NO asumas el sub-servicio ni la urgencia.
  * Clasifica la categoría correspondiente y marca service_type: "UNKNOWN", needs_clarification: true.
  * Formula un "clarification_prompt" cordial y conciso (ej. "¿Qué tipo de problema de plomería necesitas resolver?", "¿Qué falla presenta tu vehículo?", "¿Necesitas ayuda con taxes personales, de negocio o contabilidad?", "¿Qué tipo de asunto legal necesitas resolver?").
  * AISLAMIENTO ESTRICTO DE CATEGORÍAS: NUNCA hagas matching con categorías no afines (ej. no emparejar contables con abogados, ni mecánicos con cerrajeros, ni diseño con HVAC).
  * UNKNOWN ≠ INELIGIBLE: Si un proveedor no tiene registrado un subtipo específico, se marca UNKNOWN y se verifica, no se le descarta automáticamente.
  * Solo asigna service_type específico cuando el cliente lo indique explícitamente ("se me ponchó la goma", "tubo botando agua", "abogado de inmigración", "hacer un logo").
- Modalidad del Servicio: No todos los servicios son emergencias viales. Para servicios profesionales, legales, software, diseño, contabilidad, impuestos o trámites, la respuesta del proveedor es disponibilidad para cita/proyecto y tarifa por hora o proyecto (NO "en cuántos minutos llega a la carretera").
- Si mencionan vías locales de Louisville (Dixie Hwy, Preston Hwy, Bardstown Rd, Hurstbourne, Shively, Okolona, St. Matthews, Valley Station), asigna la ubicación precisa.
- Respuestas de cotizaciones de proveedores:
  * Si el proveedor indica que el precio es personalizado, relativo, a convenir, según el caso o que se hace un estimado en consulta/oficina: "price": null, "price_display": "Estimado personalizado en la oficina" o "Estimado personalizado en consulta" (NUNCA inventar un precio numérico fijo arbitrario).
  * Extrae con precisión fechas y horarios de citas ("el martes a las 2:00 PM", "mañana a las 10am", "en 20 minutos").
  * Si el proveedor declina explícitamente ("no puedo", "no tengo tiempo", "hoy no trabajo", "estoy ocupado"): "intent": "PROVIDER_DECLINED" o "PROVIDER_OFF_DUTY".
`;

/**
 * Abstract Cognitive Interface Contract
 */
export class BaseCognitiveEngine {
  isAvailable() {
    return false;
  }
  async transcribeAudio(audioBuffer, mimeType) {
    throw new Error("transcribeAudio must be implemented");
  }
  async analyzeDamagePhoto(imageBuffer, mimeType) {
    throw new Error("analyzeDamagePhoto must be implemented");
  }
  async understandCustomerMessage(rawText, conversationState) {
    throw new Error("understandCustomerMessage must be implemented");
  }
  async analyzeProviderResponse(rawText, requestDetails, providerDetails) {
    throw new Error("analyzeProviderResponse must be implemented");
  }
  async extractProviderProfileUpdates(rawText, currentProfile) {
    throw new Error("extractProviderProfileUpdates must be implemented");
  }
}

/**
 * Deterministic Heuristic Fallback Adapter
 * Guarantees zero-downtime execution without external API dependencies.
 */
export class DeterministicFallbackCognitiveAdapter extends BaseCognitiveEngine {
  isAvailable() {
    return true; // Always operational locally
  }

  async transcribeAudio(audioBuffer, mimeType = "audio/ogg") {
    console.warn("[COGNITIVE ENGINE] Audio transcription requested in deterministic fallback mode.");
    return "[Audio no procesable en modo offline]";
  }

  async analyzeDamagePhoto(imageBuffer, mimeType = "image/jpeg") {
    console.warn("[COGNITIVE ENGINE] Photo analysis requested in deterministic fallback mode.");
    return null;
  }

  async understandCustomerMessage(rawText, conversationState = null) {
    // Returns null to signal the deterministic regex/semantic pipeline in semantic.js
    return null;
  }

  async analyzeProviderResponse(rawText, requestDetails = null, providerDetails = null) {
    const text = (rawText || "").trim();
    const lower = text.toLowerCase();

    // 1. Off Duty / Availability Decline
    const isOffDuty =
      lower.includes("hoy no trabajo") ||
      lower.includes("no trabajo hoy") ||
      lower.includes("estoy libre hoy") ||
      lower.includes("estoy ocupado") ||
      lower.includes("ya cerré") ||
      lower.includes("ya cerre") ||
      lower.includes("cerrado") ||
      lower.includes("no puedo hoy") ||
      lower.includes("off duty");

    if (isOffDuty) {
      return {
        intent: "PROVIDER_OFF_DUTY",
        confidence: 0.95,
        price: null,
        priceDisplay: null,
        eta: null,
        question: null,
        commercialLearned: null,
        text
      };
    }

    // 2. Direct Decline
    const isDeclined =
      lower === "no" ||
      lower.startsWith("no ") ||
      lower.includes("no puedo") ||
      lower.includes("no tengo tiempo") ||
      lower.includes("muy lejos") ||
      lower.includes("no hago ese trabajo") ||
      lower.includes("no me da tiempo") ||
      lower.includes("cancela");

    if (isDeclined) {
      return {
        intent: "PROVIDER_DECLINED",
        confidence: 0.95,
        price: null,
        priceDisplay: null,
        eta: null,
        question: null,
        commercialLearned: null,
        text
      };
    }

    // 3. Clarifying Question
    const isQuestion =
      text.includes("?") ||
      lower.includes("qué tipo") ||
      lower.includes("que tipo") ||
      lower.includes("cuántos cuartos") ||
      lower.includes("cuantos cuartos") ||
      lower.includes("dónde está") ||
      lower.includes("donde esta") ||
      lower.includes("qué carro es") ||
      lower.includes("que carro es");

    if (isQuestion) {
      const cleanQ = text.replace(/^hola\s*,?\s*/i, "").trim();
      return {
        intent: "PROVIDER_ASK_QUESTION",
        confidence: 0.92,
        price: null,
        priceDisplay: null,
        eta: null,
        question: cleanQ,
        question_to_customer: cleanQ,
        commercialLearned: null,
        text
      };
    }

    // 4. Quote Extraction
    let numericPrice = null;
    let priceDisplay = null;
    let eta = "lo antes posible";

    // Detect price patterns ($XX, son XX, cobro XX)
    const priceMatch = text.match(/\$\s*(\d{2,4})/) || text.match(/(?:cobro|son|serian|serían|cuesta|por)\s*\$?(\d{2,4})/i) || text.match(/\b(\d{2,4})\b/);
    if (priceMatch) {
      numericPrice = parseFloat(priceMatch[1]);
      priceDisplay = `$${numericPrice}`;
    }

    // Detect ETA / Arrival
    const etaMatch = text.match(/(?:en|de|a)?\s*(\d{1,3})\s*(minutos?|mins?|horas?|hrs?)/i) ||
                     text.match(/(?:el|este)?\s*(lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)/i) ||
                     text.match(/(?:mañana|hoy)\s*(?:a\s+las?|en\s+la\s+tarde|en\s+la\s+mañana)?/i);

    if (etaMatch) {
      eta = etaMatch[0].trim();
    }

    return {
      intent: "PROVIDER_GIVE_QUOTE",
      confidence: 0.88,
      price: numericPrice,
      priceDisplay: priceDisplay || (numericPrice ? `$${numericPrice}` : "Estimado personalizado"),
      eta: eta,
      question: null,
      commercialLearned: null,
      text
    };
  }

  async extractProviderProfileUpdates(rawText, currentProfile = {}) {
    const textLower = (rawText || "").toLowerCase();
    const isCustomerNeed =
      /(necesito|busco|quiero contratar|me urge|se me rompió|se me rompio|se me ponchó|se me poncho|tengo una fuga|tengo una gotera|dejé la llave|deje la llave|no enciende|no enfría|no enfria|quién hace|quien hace|tienes algún|tienes algun|algún plomero|algun plomero|algún mecánico|algun mecanico|algún abogado|algun abogado|algún contador|algun contador|una consulta|hacer mis taxes|precio del dólar|precio del dolar|cómo está el clima|como esta el clima)/i.test(textLower) &&
      !/(agrégame|agregame|añádeme|anademe|mi perfil|mis servicios|mi horario|yo hago|yo cobro|ponme disponible)/i.test(textLower);

    if (isCustomerNeed) {
      return { is_customer_request: true };
    }

    const updates = {};
    const changes = [];

    const priceMatch = rawText.match(/\$(\d+)(\s*(?:la\s*hora|\/hr|\/hora|por\s*hora|base|mínimo))?/i);
    if (priceMatch) {
      updates.pricing_notes = `Tarifa: ${priceMatch[0]}`;
      changes.push(`Tarifa: ${priceMatch[0]}`);
    }

    if (textLower.includes("no puedo") || textLower.includes("ocupado") || textLower.includes("off duty")) {
      updates.availability_status = "OFF_DUTY";
      changes.push("Estado: Ocupado / Fuera de servicio");
    }

    return {
      is_customer_request: false,
      updated_fields: updates,
      summary_changes: changes.join(", ") || "Perfil revisado",
      reply_message: Object.keys(updates).length > 0
        ? `¡Listo, ${currentProfile.name || "Colega"}! Ya actualicé tu perfil (${changes.join(", ")}).`
        : `¡Hola ${currentProfile.name || "Colega"}! Qué gusto saludarte. ¿Necesitas solicitar algún servicio o consulta hoy, o deseas actualizar algún dato de tu negocio?`
    };
  }
}

/**
 * Gemini Cognitive Adapter
 * Implementation using Google Gen AI SDK (@google/genai, Gemini 2.5 Flash).
 */
export class GeminiCognitiveAdapter extends BaseCognitiveEngine {
  constructor(apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY, modelName = process.env.GEMINI_MODEL || "gemini-3.8-flash") {
    super();
    this.fallbackAdapter = new DeterministicFallbackCognitiveAdapter();
    this.modelName = modelName;
    this.client = null;

    if (apiKey) {
      try {
        this.client = new GoogleGenAI({ apiKey });
        console.log(`[COGNITIVE ENGINE] Gemini Adapter active using model ${this.modelName}.`);
      } catch (err) {
        console.warn("[COGNITIVE ENGINE] Gemini initialization warning:", err.message);
      }
    } else {
      console.log("[COGNITIVE ENGINE] No Gemini API Key found. Operating with Deterministic Fallback Adapter.");
    }
  }

  isAvailable() {
    return !!this.client;
  }

  async transcribeAudio(audioBuffer, mimeType = "audio/ogg") {
    if (!this.isAvailable()) {
      return this.fallbackAdapter.transcribeAudio(audioBuffer, mimeType);
    }

    try {
      const cleanMime = (mimeType || "audio/ogg").split(";")[0].trim();
      console.log(`[COGNITIVE ENGINE -> GEMINI] Transcribing audio buffer (${cleanMime}, ${audioBuffer.length} bytes)...`);

      const response = await this.client.models.generateContent({
        model: this.modelName,
        contents: [
          "Por favor, escucha cuidadosamente este audio que es un mensaje de voz enviado por un cliente o proveedor en Louisville, Kentucky (posiblemente con acento cubano o latino). Transcribe palabra por palabra exactamente lo que dice manteniendo los modismos locales. Solo responde con la transcripción, sin ningún otro comentario.",
          {
            inlineData: {
              data: audioBuffer.toString("base64"),
              mimeType: cleanMime
            }
          }
        ]
      });

      const transcription = response.text ? response.text.trim() : "[Transcripción vacía]";
      console.log(`[COGNITIVE ENGINE -> GEMINI] Audio transcribed: "${transcription}"`);
      return transcription;
    } catch (err) {
      console.error("[COGNITIVE ENGINE -> GEMINI] Audio transcription failed:", err.message);
      return `[Error al transcribir el audio: ${err.message}]`;
    }
  }

  async analyzeDamagePhoto(imageBuffer, mimeType = "image/jpeg") {
    if (!this.isAvailable()) {
      return this.fallbackAdapter.analyzeDamagePhoto(imageBuffer, mimeType);
    }

    try {
      const cleanMime = (mimeType || "image/jpeg").split(";")[0].trim();
      console.log(`[COGNITIVE ENGINE -> GEMINI] Analyzing damage image (${cleanMime}, ${imageBuffer.length} bytes)...`);

      const promptText = `Analiza detalladamente esta fotografía enviada por un cliente a la plataforma "Dame La Letra" en Louisville, Kentucky.
Tu misión es identificar la avería o trabajo necesario para los técnicos locales (plomeros, electricistas, mecánicos, techeros, etc.).

Devuelve ÚNICAMENTE un objeto JSON válido con este formato:
{
  "detected_problem": "descripción técnica y concisa de la avería o trabajo que se observa",
  "suggested_category": "PLUMBING" | "HVAC" | "AUTOMOTIVE" | "LOCKSMITH" | "ROOFING" | "ELECTRICAL" | "HANDYMAN" | "APPLIANCE_REPAIR" | "CLEANING" | "TREE_SERVICE" | "TECH_SOFTWARE",
  "suggested_service_type": "string específico (ej. WATER_LEAK, FLAT_TIRE, AC_COIL, WATER_HEATER, BREAKER_PANEL, ROOF_LEAK, APPLIANCE_ISSUE)",
  "urgency": "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY",
  "summary_for_technician": "resumen técnico de 1 o 2 oraciones sobre qué herramientas, materiales o repuestos se observan necesarios"
}`;

      const response = await this.client.models.generateContent({
        model: this.modelName,
        contents: [
          promptText,
          {
            inlineData: {
              data: imageBuffer.toString("base64"),
              mimeType: cleanMime
            }
          }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const parsed = JSON.parse(response.text.trim());
      console.log(`[COGNITIVE ENGINE -> GEMINI] Damage photo analysis:`, parsed);
      return parsed;
    } catch (err) {
      console.error("[COGNITIVE ENGINE -> GEMINI] Damage photo analysis failed:", err.message);
      return null;
    }
  }

  async understandCustomerMessage(rawText, conversationState = null) {
    if (!this.isAvailable()) {
      return this.fallbackAdapter.understandCustomerMessage(rawText, conversationState);
    }

    try {
      const prompt = `Analiza el siguiente mensaje de un cliente en Louisville, KY:
Mensaje: "${rawText}"
Estado previo de la conversación: ${JSON.stringify(conversationState || {})}

Devuelve ÚNICAMENTE un JSON con:
{
  "is_affirmation": boolean (true si el cliente dice sí, dale, perfecto, confirma, conéctalo, etc.),
  "is_decline": boolean (true si dice no, cancela, no quiero, busca otro),
  "is_clarification_answer": boolean,
  "service_category": "PLUMBING" | "HVAC" | "AUTOMOTIVE" | "LOCKSMITH" | "ROOFING" | "ELECTRICAL" | "HANDYMAN" | "APPLIANCE_REPAIR" | "CLEANING" | "TREE_SERVICE" | "TECH_SOFTWARE" | "CONSULTING_PROFESSIONAL" | "LEGAL_SERVICES" | "EVENTS_CATERING" | "BEAUTY_BARBER" | "INFORMATION" | null,
  "service_type": string | null,
  "legal_specialty": "IMMIGRATION" | "PERSONAL_INJURY" | "CRIMINAL" | "FAMILY" | "TRAFFIC_TICKET" | "REAL_ESTATE_LEGAL" | "LABOR_EMPLOYMENT" | "BUSINESS_CORPORATE" | "UNKNOWN" | null,
  "needs_clarification": boolean,
  "clarification_prompt": string | null,
  "location_raw": string,
  "urgency": "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY",
  "property_type": "RESIDENTIAL" | "COMMERCIAL" | "UNKNOWN",
  "confidence": number (0.0 a 1.0),
  "explanation": string
}`;

      const response = await this.client.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: "application/json"
        }
      });

      const parsed = JSON.parse(response.text.trim());
      return parsed;
    } catch (err) {
      console.warn("[COGNITIVE ENGINE -> GEMINI] Customer understanding fallback:", err.message);
      return this.fallbackAdapter.understandCustomerMessage(rawText, conversationState);
    }
  }

  async analyzeProviderResponse(rawText, requestDetails = null, providerDetails = null) {
    if (!this.isAvailable()) {
      return this.fallbackAdapter.analyzeProviderResponse(rawText, requestDetails, providerDetails);
    }

    try {
      const prompt = `Analiza la respuesta de un proveedor de servicios en Louisville a una solicitud de trabajo:
Mensaje del proveedor: "${rawText}"
Solicitud del cliente: ${JSON.stringify(requestDetails || {})}
Proveedor: ${JSON.stringify(providerDetails ? { name: providerDetails.name, category: providerDetails.category } : {})}

Instrucciones para clasificar:
1. Si el proveedor declina explícitamente ("no puedo", "no tengo tiempo", "muy lejos", "cancela"):
   * "intent": "PROVIDER_DECLINED"
2. Si el proveedor indica que hoy no labora o está fuera de servicio ("hoy no trabajo", "no trabajo hoy", "estoy libre", "estoy ocupado", "ya cerré"):
   * "intent": "PROVIDER_OFF_DUTY"
3. Si el proveedor hace una pregunta aclaratoria antes de cotizar ("¿qué tamaño tiene la casa?", "¿dónde es?", "¿qué carro es?"):
   * "intent": "PROVIDER_ASK_QUESTION"
   * "question_to_customer": "texto limpio de la pregunta para el cliente"
4. Si el proveedor propone una cotización o estimado:
   * "intent": "PROVIDER_GIVE_QUOTE"
   * Si indica precio personalizable o relativo en oficina ("el precio es personalizable", "es relativo", "hacemos un estimado en la oficina"):
     "price": null, "price_display": "Estimado personalizado en la oficina"
   * Si da un precio numérico fijo o rango ("son 65", "cobro 80", "150-200"):
     "price": número numérico, "price_display": "$XX" o "$XX - $YY"
   * Extrae el tiempo de llegada o cita en "estimated_arrival" ("20 minutos", "mañana a las 10am", "el martes a las 2:00 PM")

Devuelve ÚNICAMENTE un JSON con:
{
  "intent": "PROVIDER_GIVE_QUOTE" | "PROVIDER_ASK_QUESTION" | "PROVIDER_DECLINED" | "PROVIDER_OFF_DUTY",
  "price": number | null,
  "price_display": string | null,
  "estimated_arrival": string | null,
  "question_to_customer": string | null,
  "commercial_learned": 1 | 0 | null,
  "confidence": number
}`;

      const response = await this.client.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: "application/json"
        }
      });

      const parsed = JSON.parse(response.text.trim());
      if (parsed) {
        parsed.question = parsed.question_to_customer || parsed.question;
        parsed.question_to_customer = parsed.question || parsed.question_to_customer;
      }
      return parsed;
    } catch (err) {
      console.warn("[COGNITIVE ENGINE -> GEMINI] Provider response fallback:", err.message);
      return this.fallbackAdapter.analyzeProviderResponse(rawText, requestDetails, providerDetails);
    }
  }

  async extractProviderProfileUpdates(rawText, currentProfile = {}) {
    if (!this.isAvailable()) {
      return this.fallbackAdapter.extractProviderProfileUpdates(rawText, currentProfile);
    }

    try {
      const prompt = `Eres el asistente de gestión de negocios y proveedores de "Dame La Letra".
Un negocio/proveedor registrado está conversando contigo, pero RECUERDA: un negocio o proveedor también es persona/empresa en Louisville y en cualquier momento puede necesitar solicitar un servicio, reparación, trámite o consulta COMO CLIENTE.

Mensaje recibido: "${rawText}"
Perfil actual del negocio: ${JSON.stringify(currentProfile, null, 2)}

REGLAS CRÍTICAS DE CLASIFICACIÓN:
1. Si la persona está pidiendo un servicio, ayuda con una avería, un profesional (plomero, mecánico, electricista, aire, abogado, contador/taxes, limpieza, grúa, cerrajero, diseño, marketing, etc.), una consulta para él o su negocio, o haciendo una pregunta de información general (clima, precio del dólar, etc.):
   -> DEBES marcar "is_customer_request": true.
2. Si la persona está actualizando datos de SU propio negocio (agregar/quitar servicios que él ofrece, cambiar su horario/disponibilidad, cambiar sus tarifas, bio o sitio web):
   -> Marca "is_customer_request": false y extrae los cambios en "updated_fields".
3. Si la persona SOLO saluda ("Hola", "Buenas", "Qué tal") sin especificar aún:
   -> Marca "is_customer_request": false, deja "updated_fields" en null, y en "reply_message" respóndele cordialmente ofreciéndole AMBAS opciones: "¡Hola ${currentProfile.name || ""}! Qué gusto saludarte. ¿Necesitas solicitar algún servicio o consulta hoy, o deseas actualizar algún dato de tu perfil de negocio?"

Devuelve ÚNICAMENTE un JSON con este formato:
{
  "is_customer_request": boolean,
  "updated_fields": {
    "bio": string | null,
    "services": array de strings | null,
    "pricing_notes": string | null,
    "website": string | null,
    "availability_status": "AVAILABLE" | "OFF_DUTY" | "BUSY" | null,
    "base_location_name": string | null,
    "preferred_channel": "WHATSAPP" | "SMS" | null
  },
  "summary_changes": string | null,
  "reply_message": string | null
}`;

      const response = await this.client.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: "application/json"
        }
      });

      const parsed = JSON.parse(response.text.trim());
      return parsed;
    } catch (err) {
      console.warn("[COGNITIVE ENGINE -> GEMINI] Profile extraction fallback:", err.message);
      return this.fallbackAdapter.extractProviderProfileUpdates(rawText, currentProfile);
    }
  }
}

/**
 * Cognitive Engine Manager (Singleton & Interface Hub)
 * Allows hot-swapping cognitive models (Gemini, Claude, OpenAI, Local) with full anti-vendor-lock-in.
 */
export class CognitiveEngineManager extends BaseCognitiveEngine {
  constructor(defaultAdapter = null) {
    super();
    this.adapter = defaultAdapter || new GeminiCognitiveAdapter();
  }

  setAdapter(newAdapter) {
    if (!(newAdapter instanceof BaseCognitiveEngine)) {
      throw new Error("Adapter must extend BaseCognitiveEngine");
    }
    console.log(`[COGNITIVE ENGINE] Switched active cognitive adapter to: ${newAdapter.constructor.name}`);
    this.adapter = newAdapter;
  }

  isAvailable() {
    return this.adapter.isAvailable();
  }

  async transcribeAudio(audioBuffer, mimeType) {
    return this.adapter.transcribeAudio(audioBuffer, mimeType);
  }

  async analyzeDamagePhoto(imageBuffer, mimeType) {
    return this.adapter.analyzeDamagePhoto(imageBuffer, mimeType);
  }

  async understandCustomerMessage(rawText, conversationState) {
    return this.adapter.understandCustomerMessage(rawText, conversationState);
  }

  async analyzeProviderResponse(rawText, requestDetails, providerDetails) {
    return this.adapter.analyzeProviderResponse(rawText, requestDetails, providerDetails);
  }

  async extractProviderProfileUpdates(rawText, currentProfile) {
    return this.adapter.extractProviderProfileUpdates(rawText, currentProfile);
  }
}

// Global Canonical Cognitive Engine
export const cognitiveEngine = new CognitiveEngineManager();
