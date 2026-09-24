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
}

export const geminiService = new GeminiConciergeService();
