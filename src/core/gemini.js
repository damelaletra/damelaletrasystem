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

Tu rol es entender con extrema precisión el lenguaje natural, modismos cubanos/latinos ("tupición", "se me ponchó la goma", "el aire no tira frío", "dejé la llave adentro del carro", "gotera en el techo", "trato hecho", "dale", "perfecto", "confírmale", "de una") y traducirlos a intenciones y datos estructurados en formato JSON.

Categorías soportadas en Louisville:
- PLUMBING (Plomería, tupiciones, salideros, tuberías, calentadores)
- HVAC (Aire acondicionado, refrigeración, calefacción)
- AUTOMOTIVE (Mecánica móvil, cambio de gomas ponchadas, roadside, baterías)
- LOCKSMITH (Cerrajería, llaves dentro del auto/casa, cambio de combinación)
- ROOFING (Techos, goteras, shingles, canales)
- ELECTRICAL (Electricidad, paneles, cortos, breakers)
- HANDYMAN (Drywall, pintura, puertas, reparaciones generales)
- APPLIANCE_REPAIR (Lavadoras, secadoras, refrigeradores, estufas)
- CLEANING (Limpieza profunda, mudanzas, casas, oficinas)
- TREE_SERVICE (Poda, tala, árboles caídos, patios)

Reglas clave de Louisville:
- Si mencionan vías locales (Dixie Hwy, Preston Hwy, Bardstown Rd, Hurstbourne, Shively, Okolona, St. Matthews, Valley Station), asigna la ubicación precisa.
- Respuestas de cotizaciones de proveedores: Distingue rigurosamente entre tiempo/duración ("de 15 a 20 minutos", "en 1 hora", "mañana") y precios en dólares ("son 100", "$65", "200").`;

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
  "service_category": "PLUMBING" | "HVAC" | "AUTOMOTIVE" | "LOCKSMITH" | "ROOFING" | "ELECTRICAL" | "HANDYMAN" | "APPLIANCE_REPAIR" | "CLEANING" | "TREE_SERVICE" | null,
  "service_type": string | null,
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

Devuelve ÚNICAMENTE un JSON con:
{
  "intent": "PROVIDER_GIVE_QUOTE" | "PROVIDER_ASK_QUESTION" | "PROVIDER_DECLINED" | "PROVIDER_OFF_DUTY",
  "price": number | null,
  "price_display": string | null (ej: "$100", "$150 - $200"),
  "estimated_arrival": string (ej: "15 a 20 minutos", "mañana por la mañana", "1 hora"),
  "question_to_customer": string | null (si el proveedor hace una pregunta),
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
Un proveedor registrado está conversando contigo para actualizar los datos de su negocio o informarte sobre sus servicios.

Mensaje del proveedor: "${rawText}"
Perfil actual del proveedor: ${JSON.stringify(currentProfile, null, 2)}

Extrae los datos actualizados y redacta una respuesta conversacional cálida, profesional y concisa en español (estilo WhatsApp).
Devuelve ÚNICAMENTE un JSON con este formato:
{
  "updated_fields": {
    "bio": string | null (resumen/descripción profesional si la menciona),
    "services": array de strings | null (servicios nuevos o lista de habilidades como "SOFTWARE_DEVELOPMENT", "WEB_DESIGN", "REACT", "NEXTJS", "FIGMA", "SEO", "APP_DEVELOPMENT", etc.),
    "pricing_notes": string | null (tarifas, costo por hora, costo base, presupuestos),
    "website": string | null (url del portafolio o página web),
    "availability_status": "AVAILABLE" | "OFF_DUTY" | "BUSY" | null,
    "base_location_name": string | null (cobertura geográfica o modalidad remoto/presencial),
    "preferred_channel": "WHATSAPP" | "SMS" | null
  },
  "summary_changes": string (breve frase de qué cambió, ej: "Actualicé tus servicios a diseño web y tus tarifas por hora"),
  "reply_message": string (mensaje natural y profesional para enviarle al proveedor por WhatsApp confirmando lo que se guardó y preguntándole si falta algo más)
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
