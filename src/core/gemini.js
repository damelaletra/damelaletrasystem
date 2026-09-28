import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
let aiClient = null;

if (apiKey) {
  try {
    aiClient = new GoogleGenAI({ apiKey });
    console.log("[GEMINI LLM] Google Gen AI initialized with Gemini 2.5 Flash.");
  } catch (err) {
    console.warn("[GEMINI LLM] Initialization warning:", err.message);
  }
} else {
  console.log("[GEMINI LLM] No GEMINI_API_KEY detected in env. Running in deterministic hybrid fallback mode.");
}

/**
 * Prompt system for Louisville Hispanic/Latino service concierge
 */
const SYSTEM_PROMPT = `Eres el cerebro de Inteligencia Artificial de "Dame La Letra" (DML), un concierge conversacional hiper-eficiente para la comunidad hispanohablante de Louisville, Kentucky (+1 502-673-1333).

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
- TECH_SOFTWARE (Software, páginas web, desarrollo de apps, diseño gráfico, logos, dibujitos, ilustraciones, flyers, branding, IA, plataformas) [Modalidad: Proyecto / Consultoría Remota]
- CONSULTING_PROFESSIONAL (Preparación de taxes/impuestos, ITIN, formas de inmigración, notaría pública, traducciones certificadas, contabilidad, apertura de LLCs) [Modalidad: Cita / Consultoría]
- LEGAL_SERVICES (Abogados, representación legal en corte, defensa penal, accidentes de auto/personal injury, inmigración jurídica, divorcio/familia, tickets de tráfico, litigios) [Modalidad: Cita / Consulta Legal]
- EVENTS_CATERING (Catering criollo, puerco asado, fotografía, video, DJs, sonido para fiestas) [Modalidad: Evento / Cotización]
- BEAUTY_BARBER (Barbería, cortes, peinados, uñas, maquillaje a domicilio o cita) [Modalidad: Cita programada]

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
  * Si el proveedor da un precio fijo ("$80", "$150"): extrae el número y formato "$80".
  * Si el proveedor indica que el precio es personalizado, relativo, a convenir, según el caso o que se hace un estimado en consulta/oficina: "price": null, "price_display": "Estimado personalizado en consulta" (NUNCA inventar un precio numérico fijo arbitrario).
  * Extrae con precisión fechas y horarios de citas ("el martes a las 2:00 PM", "mañana a las 10am", "en 20 minutos").`;

export class GeminiConciergeService {
  constructor() {
    this.client = aiClient;
    this.modelName = "models/gemini-flash-latest";
  }

  isAvailable() {
    return !!this.client;
  }

  /**
   * Deep natural language understanding for customer message
   */
  async understandCustomerMessage(rawText, conversationState = null) {
    if (!this.isAvailable()) {
      return null; // Signals fallback to deterministic engine
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
  "service_category": "PLUMBING" | "HVAC" | "AUTOMOTIVE" | "LOCKSMITH" | "ROOFING" | "ELECTRICAL" | "HANDYMAN" | "APPLIANCE_REPAIR" | "CLEANING" | "TREE_SERVICE" | "TECH_SOFTWARE" | "CONSULTING_PROFESSIONAL" | "LEGAL_SERVICES" | "EVENTS_CATERING" | "BEAUTY_BARBER" | null,
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
      console.warn("[GEMINI LLM] understandCustomerMessage error:", err.message);
      return null;
    }
  }

  /**
   * Deep natural language parsing for provider response (quotes, questions, availability)
   */
  async analyzeProviderMessage(rawText, requestDetails = null, providerDetails = null) {
    if (!this.isAvailable()) {
      return null; // Fallback
    }

    try {
      const prompt = `Analiza la respuesta de un proveedor de servicios en Louisville:
Mensaje del proveedor: "${rawText}"
Solicitud del cliente: ${JSON.stringify(requestDetails || {})}
Proveedor: ${JSON.stringify(providerDetails ? { name: providerDetails.name, category: providerDetails.category } : {})}

Instrucciones para precios y consultas:
- Si el proveedor indica que el precio es personalizable, relativo, variable o propone una cita/estimado en oficina ("el precio es personalizable", "es relativo", "en una consulta en la oficina", "le hacemos un estimado aquí el martes a las dos"):
  * "intent": "PROVIDER_GIVE_QUOTE"
  * "price": null (NUNCA inventar un precio numérico si no lo dijeron)
  * "price_display": "Estimado personalizado en la oficina" o "Estimado personalizado en consulta"
  * "estimated_arrival": "el martes a las 2:00 PM" (o la fecha/hora propuesta, o "lo antes posible")
- Si el proveedor hace una pregunta aclaratoria antes de cotizar: "intent": "PROVIDER_ASK_QUESTION", "question_to_customer": "texto de la pregunta"
- Si da un precio fijo en dólares o un rango: "price": número o promedio, "price_display": "$XX" o "$XX - $YY"

Devuelve ÚNICAMENTE un JSON con:
{
  "intent": "PROVIDER_GIVE_QUOTE" | "PROVIDER_ASK_QUESTION" | "PROVIDER_DECLINED" | "PROVIDER_OFF_DUTY",
  "price": number | null,
  "price_display": string | null (ej: "$100", "$150 - $200", "Estimado personalizado en la oficina", "Estimado personalizado en consulta"),
  "estimated_arrival": string (ej: "el martes a las 2:00 PM", "mañana por la mañana", "15 a 20 minutos"),
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
      return parsed;
    } catch (err) {
      console.warn("[GEMINI LLM] analyzeProviderMessage error:", err.message);
      return null;
    }
  }

  /**
   * Conversational Provider Profile Onboarding & Dynamic Updates
   * Understands what business data a provider is communicating (skills, rates, availability, bio, portfolio, etc.)
   */
  async extractProviderProfileUpdates(rawText, currentProfile = {}) {
    if (!this.isAvailable()) {
      return this.heuristicProviderProfileExtraction(rawText, currentProfile);
    }

    try {
      const prompt = `Eres el asistente de gestión de negocios y proveedores de "Dame La Letra".
Un proveedor registrado está conversando contigo. Tu trabajo principal es determinar si el proveedor está buscando un servicio para sí mismo (como cliente, ej: "necesito un plomero", "busco alquilar un local", "me ponché") o si está intentando actualizar su propio perfil de negocio (ej: "ahora también hago diseño web", "mi nueva tarifa es $50", "estoy ocupado").

Mensaje del proveedor: "${rawText}"
Perfil actual del proveedor: ${JSON.stringify(currentProfile, null, 2)}

Extrae los datos actualizados y redacta una respuesta conversacional cálida, profesional y concisa en español (estilo WhatsApp).
Devuelve ÚNICAMENTE un JSON con este formato:
{
  "is_customer_request": boolean (true si el proveedor está pidiendo un servicio para sí mismo como cliente, false si está actualizando su perfil o saludando),
  "updated_fields": {
    "bio": string | null (resumen/descripción profesional si la menciona),
    "services": array de strings | null (servicios nuevos o lista de habilidades como "SOFTWARE_DEVELOPMENT", "WEB_DESIGN", "REACT", "NEXTJS", "FIGMA", "SEO", "APP_DEVELOPMENT", etc.),
    "pricing_notes": string | null (tarifas, costo por hora, costo base, presupuestos),
    "website": string | null (url del portafolio o página web),
    "availability_status": "AVAILABLE" | "OFF_DUTY" | "BUSY" | null,
    "base_location_name": string | null (cobertura geográfica o modalidad remoto/presencial),
    "preferred_channel": "WHATSAPP" | "SMS" | null
  },
  "summary_changes": string | null (breve frase de qué cambió, ej: "Actualicé tus servicios a diseño web", o null si es customer request),
  "reply_message": string | null (mensaje natural confirmando lo que se guardó, o null si es customer request)
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
      console.warn("[GEMINI LLM] extractProviderProfileUpdates error:", err.message);
      return this.heuristicProviderProfileExtraction(rawText, currentProfile);
    }
  }

  heuristicProviderProfileExtraction(rawText, currentProfile = {}) {
    const textLower = rawText.toLowerCase();
    
    // Fallback detection for customer request intent
    if (textLower.includes("necesito un") || textLower.includes("busco un") || textLower.includes("me ponché") || textLower.includes("se me rompió")) {
      return { is_customer_request: true };
    }

    const updates = {};
    const changes = [];

    // 1. Rates
    const priceMatch = rawText.match(/\$(\d+)(\s*(?:la\s*hora|\/hr|\/hora|por\s*hora|base|mínimo))?/i);
    if (priceMatch) {
      updates.pricing_notes = `Tarifa: ${priceMatch[0]}`;
      changes.push(`Tarifa: ${priceMatch[0]}`);
    }

    // 2. Status
    if (textLower.includes("no puedo") || textLower.includes("ocupado") || textLower.includes("off duty") || textLower.includes("no disponible")) {
      updates.availability_status = "OFF_DUTY";
      changes.push("Estado: Ocupado / Fuera de servicio");
    } else if (textLower.includes("disponible") || textLower.includes("libre") || textLower.includes("activo")) {
      updates.availability_status = "AVAILABLE";
      changes.push("Estado: Disponible");
    }

    // 3. Website / Portfolio
    const urlMatch = rawText.match(/(https?:\/\/[^\s]+|[a-zA-Z0-9-]+\.(?:com|dev|io|net|org|app)[^\s]*)/i);
    if (urlMatch) {
      updates.website = urlMatch[0];
      changes.push(`Sitio web: ${urlMatch[0]}`);
    }

    // 4. Bio / Services
    if (rawText.length > 20) {
      updates.bio = rawText;
      changes.push("Descripción actualizada");
    }

    const reply = changes.length > 0
      ? `¡Hola ${currentProfile.name || "Colega"}! He registrado las actualizaciones en tu perfil de Dame La Letra:\n• ${changes.join("\n• ")}\n\n¿Quieres agregar algún otro detalle a tu negocio?`
      : `¡Hola ${currentProfile.name || "Colega"}! Recibí tu mensaje: "${rawText}". Tu perfil está activo en Dame La Letra. Dime si deseas cambiar tarifas, servicios o disponibilidad.`;

    return {
      updated_fields: updates,
      summary_changes: changes.join(", ") || "Perfil revisado",
      reply_message: reply
    };
  }
}

export const geminiService = new GeminiConciergeService();
