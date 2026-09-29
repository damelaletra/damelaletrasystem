import fs from 'fs';

const semanticPath = 'src/core/semantic.js';
let content = fs.readFileSync(semanticPath, 'utf8');

// 1. Add CATEGORY_CLARIFICATION_PROMPTS and GENERIC_CATEGORY_TRIGGERS
const genericDefinitions = `
export const CATEGORY_CLARIFICATION_PROMPTS = {
  LEGAL_SERVICES: "Claro. ¿Qué tipo de asunto legal necesitas resolver?",
  PLUMBING: "Claro. ¿Qué tipo de problema o trabajo de plomería necesitas resolver?",
  AUTOMOTIVE: "Claro. ¿Qué problema o falla presenta tu vehículo?",
  ELECTRICAL: "Claro. ¿Qué trabajo o problema eléctrico necesitas resolver?",
  HVAC: "Claro. ¿Tu sistema no está enfriando o calentando, o necesitas mantenimiento?",
  ROOFING: "Claro. ¿Tienes una gotera activa o necesitas inspección o reemplazo de techo?",
  LOCKSMITH: "Claro. ¿Se quedaron las llaves adentro o necesitas cambiar/reparar una cerradura?",
  CLEANING: "Claro. ¿Qué tipo de limpieza necesitas? (casa, oficina, mudanza o profunda)",
  HANDYMAN: "Claro. ¿Qué tipo de arreglo o reparación necesitas en la propiedad?",
  CONSULTING_PROFESSIONAL: "Claro. ¿Necesitas ayuda con taxes personales, de negocio, contabilidad o trámites?",
  TECH_SOFTWARE: "Claro. ¿Qué tipo de proyecto digital, web o diseño necesitas desarrollar?",
  TREE_SERVICE: "Claro. ¿Necesitas podar, retirar un árbol o cortar ramas caídas?",
  APPLIANCE_REPAIR: "Claro. ¿Qué electrodoméstico necesitas reparar y qué falla presenta?",
  EVENTS_CATERING: "Claro. ¿Para qué tipo de evento necesitas el servicio y cuántos invitados estimas?",
  BEAUTY_BARBER: "Claro. ¿Qué servicio buscas (corte, barba, uñas o peinado) y para cuándo?"
};

const GENERIC_CATEGORY_TRIGGERS = [
  {
    category: "LEGAL_SERVICES",
    triggers: ["abogado", "abogados", "abogada", "abogadas", "lawyer", "lawyers", "attorney", "attorneys", "bufete", "despacho legal", "servicios legales", "asesoría legal", "asesoria legal", "defensa legal", "representación legal", "representacion legal", "litigio"],
    symptoms: ["inmigra", "asilo", "deportaci", "green card", "residencia", "parole", "visa", "peticion", "petición", "papeles", "accidente", "choque", "choqué", "lesion", "lesión", "injury", "golpe", "caída", "caida", "compensacion", "compensación", "criminal", "carcel", "cárcel", "arresto", "arrestaron", "fianza", "delito", "dui", "dwi", "cargos", "penal", "divorcio", "custodia", "manutencion", "manutención", "pension", "pensión", "ticket", "multa", "trafico", "tráfico", "desahucio", "eviction", "despido"]
  },
  {
    category: "PLUMBING",
    triggers: ["plomero", "plomeros", "plomería", "plomeria", "fontanero", "fontanería", "fontaneria", "gasfitero", "plumber"],
    symptoms: ["fuga", "botadera", "salidero", "tubo", "tubería", "tuberia", "goteo", "inundando", "inundó", "tupición", "tupicion", "tupido", "destupir", "atasco", "inodoro", "fregadero", "drenaje", "drain", "clogged", "calentador", "water heater", "grifo", "llave de agua", "desagüe", "desague"]
  },
  {
    category: "AUTOMOTIVE",
    triggers: ["mecánico", "mecanico", "mecánicos", "mecanicos", "taller", "taller mecánico", "taller mecanico", "taller de carros", "taller de autos", "reparar mi carro", "reparar el carro", "mecánica", "mecanica", "mechanic"],
    symptoms: ["goma", "llanta", "tire", "ponchó", "poncho", "flat", "batería", "bateria", "no arranca", "prende", "jump", "cables", "corriente", "grúa", "grua", "towing", "remolque", "remolcar", "freno", "frenos", "aceite", "radiador", "transmisión", "transmision", "motor"]
  },
  {
    category: "ELECTRICAL",
    triggers: ["electricista", "electricistas", "electricidad", "trabajo eléctrico", "servicio eléctrico", "electrician"],
    symptoms: ["se fue la luz", "breaker", "breakers", "corto", "corto circuito", "chispa", "tomacorriente", "panel eléctrico", "panel electrico", "cableado", "cables pelados", "enchufe"]
  },
  {
    category: "HVAC",
    triggers: ["aire acondicionado", "hvac", "técnico de aire", "reparar el aire", "servicio de aire", "tecnico de aire"],
    symptoms: ["no enfría", "no enfria", "no tira frío", "no tira frio", "caliente", "freón", "freon", "hielo", "máquina de hielo", "maquina de hielo", "ice machine", "refrigeración", "calefacción", "calefaccion", "termostato"]
  },
  {
    category: "ROOFING",
    triggers: ["techero", "techeros", "roofing", "arreglar techo", "reparar techo", "servicio de techo", "roofer"],
    symptoms: ["gotera", "goteras", "salidero", "filtración", "filtracion", "shingle", "shingles", "tejas", "canal", "canales", "tormenta", "viento", "viga"]
  },
  {
    category: "LOCKSMITH",
    triggers: ["cerrajero", "cerrajeros", "cerrajería", "cerrajeria", "locksmith"],
    symptoms: ["adentro", "quedé", "quede", "adentro del carro", "adentro de la casa", "trancada", "trancado", "cerrado", "cerradura", "candado", "cambiar", "rekey", "copia"]
  },
  {
    category: "CLEANING",
    triggers: ["limpieza", "limpiar", "alguien que limpie", "servicio de limpieza", "cleaning service", "cleaner"],
    symptoms: ["casa", "apartamento", "oficina", "local", "restaurante", "profunda", "deep cleaning", "deep", "mudanza", "move out", "move-out", "alfombra", "alfombras", "tapicería", "cuartos"]
  },
  {
    category: "HANDYMAN",
    triggers: ["handyman", "mantenimiento de casa", "arreglos de la casa", "arreglos en la casa", "un señor para arreglos", "trabajador para arreglos"],
    symptoms: ["drywall", "yeso", "pladur", "hueco", "pared", "puerta", "puertas", "piso", "pisos", "azulejo", "azulejos", "losas", "pintar", "pintura", "carpintería", "carpinteria"]
  },
  {
    category: "CONSULTING_PROFESSIONAL",
    triggers: ["contador", "contable", "contadores", "contables", "asesor de taxes", "asesor contable", "asesoría profesional", "asesoria profesional", "accountant"],
    symptoms: ["taxes", "impuestos", "w2", "1099", "itin", "declaración", "declaracion", "nómina", "nomina", "payroll", "quickbooks", "asilo", "inmigración", "inmigracion", "papeles", "permiso", "notario", "notaria", "notarizar", "llc", "abrir negocio", "empresa", "traducción", "traduccion"]
  },
  {
    category: "TECH_SOFTWARE",
    triggers: ["programador", "programadores", "desarrollador", "desarrolladores", "diseñador", "diseñadores", "hacer software", "servicio digital", "developer"],
    symptoms: ["logo", "logos", "dibujito", "dibujitos", "dibujo", "dibujos", "diseño gráfico", "diseno grafico", "flyer", "flyers", "página web", "pagina web", "website", "tienda online", "app", "aplicación", "aplicacion", "ecommerce", "bot", "branding"]
  },
  {
    category: "TREE_SERVICE",
    triggers: ["servicio de árboles", "servicio de arboles", "árboles", "arboles", "tree service"],
    symptoms: ["podar", "poda", "cortar", "talar", "tala", "rama", "ramas", "tronco", "chapear", "chapeo", "pasto", "césped", "cesped", "patio", "yerba"]
  },
  {
    category: "APPLIANCE_REPAIR",
    triggers: ["electrodomésticos", "electrodomesticos", "reparar equipo", "técnico de electrodomésticos", "tecnico de electrodomesticos", "reparación de electrodomésticos"],
    symptoms: ["lavadora", "secadora", "refrigerador", "nevera", "estufa", "horno", "dishwasher", "lavavajillas"]
  },
  {
    category: "EVENTS_CATERING",
    triggers: ["servicio para fiesta", "servicio para evento", "catering para fiesta", "catering", "banquetes"],
    symptoms: ["puerco", "lechón", "lechon", "comida", "buffet", "fotos", "fotógrafo", "fotografo", "video", "dj", "música", "musica", "sonido", "animación", "animacion"]
  },
  {
    category: "BEAUTY_BARBER",
    triggers: ["barbería", "barberia", "servicio de belleza", "estética", "estetica", "barbero", "peluquería", "peluqueria"],
    symptoms: ["corte", "fade", "degradado", "barba", "uñas", "unas", "manicura", "pedicura", "peinado", "maquillaje", "acrílicas", "acrilicas"]
  }
];

export function understandClarification(rawText, category) {
  const text = (rawText || "").toLowerCase().trim();

  if (category === "LEGAL_SERVICES") {
    const specialty = detectLegalSpecialty(text);
    return {
      service_type: specialty !== "LEGAL_GENERAL" ? specialty : "LEGAL_GENERAL",
      legal_specialty: specialty !== "LEGAL_GENERAL" ? specialty : "LEGAL_GENERAL"
    };
  }

  if (category === "PLUMBING") {
    if (text.includes("fuga") || text.includes("tubo") || text.includes("salidero") || text.includes("botadera") || text.includes("goteo") || text.includes("agua corriendo")) {
      return { service_type: "PIPE_LEAK" };
    }
    if (text.includes("tupido") || text.includes("destupir") || text.includes("inodoro") || text.includes("fregadero") || text.includes("desagüe") || text.includes("atasco") || text.includes("no baja")) {
      return { service_type: "DRAIN_CLEARING" };
    }
    if (text.includes("calentador") || text.includes("agua caliente") || text.includes("water heater")) {
      return { service_type: "WATER_HEATER" };
    }
    return { service_type: "PLUMBING_GENERAL" };
  }

  if (category === "AUTOMOTIVE") {
    if (text.includes("goma") || text.includes("llanta") || text.includes("tire") || text.includes("ponchó") || text.includes("ponche") || text.includes("pinchazo")) {
      return { service_type: "TIRE_CHANGE" };
    }
    if (text.includes("batería") || text.includes("bateria") || text.includes("arranca") || text.includes("prende") || text.includes("jump") || text.includes("corriente")) {
      return { service_type: "BATTERY_JUMP" };
    }
    if (text.includes("grúa") || text.includes("grua") || text.includes("towing") || text.includes("remolque") || text.includes("quedé botado") || text.includes("quede botado")) {
      return { service_type: "TOWING" };
    }
    if (text.includes("freno") || text.includes("frenos") || text.includes("pastillas")) {
      return { service_type: "BRAKE_SERVICE" };
    }
    return { service_type: "MECHANICAL_REPAIR" };
  }

  if (category === "CLEANING") {
    if (text.includes("oficina") || text.includes("local") || text.includes("comercial") || text.includes("restaurante")) {
      return { service_type: "COMMERCIAL_CLEANING" };
    }
    if (text.includes("mudanza") || text.includes("move out") || text.includes("entregar")) {
      return { service_type: "MOVE_OUT_CLEANING" };
    }
    if (text.includes("profunda") || text.includes("deep")) {
      return { service_type: "DEEP_CLEANING" };
    }
    return { service_type: "HOUSE_CLEANING" };
  }

  if (category === "CONSULTING_PROFESSIONAL") {
    if (text.includes("tax") || text.includes("impuesto") || text.includes("1099") || text.includes("w2") || text.includes("itin") || text.includes("declaración") || text.includes("declaracion")) {
      return { service_type: "TAX_PREPARATION" };
    }
    if (text.includes("asilo") || text.includes("inmigra") || text.includes("papel") || text.includes("permiso") || text.includes("parole")) {
      return { service_type: "IMMIGRATION_FORMS" };
    }
    if (text.includes("notar") || text.includes("carta poder") || text.includes("jurada")) {
      return { service_type: "NOTARY_PUBLIC" };
    }
    if (text.includes("conta") || text.includes("nómina") || text.includes("nomina") || text.includes("payroll") || text.includes("quickbooks")) {
      return { service_type: "ACCOUNTING_BOOKKEEPING" };
    }
    if (text.includes("llc") || text.includes("empresa") || text.includes("negocio")) {
      return { service_type: "BUSINESS_CONSULTING" };
    }
    return { service_type: "TAX_PREPARATION" };
  }

  if (category === "ROOFING") {
    if (text.includes("gotera") || text.includes("filtración") || text.includes("agua") || text.includes("salidero")) {
      return { service_type: "ROOF_LEAK" };
    }
    if (text.includes("cambio") || text.includes("nuevo") || text.includes("reemplazo") || text.includes("inspección")) {
      return { service_type: "ROOF_REPLACEMENT" };
    }
    return { service_type: "ROOF_REPAIR" };
  }

  if (category === "LOCKSMITH") {
    if (text.includes("adentro") || text.includes("carro") || text.includes("auto")) {
      return { service_type: "AUTO_LOCKOUT" };
    }
    if (text.includes("cambiar") || text.includes("cerradura") || text.includes("llavín") || text.includes("llavin")) {
      return { service_type: "LOCK_REPLACEMENT" };
    }
    return { service_type: "LOCKSMITH_SERVICE" };
  }

  if (category === "ELECTRICAL") {
    if (text.includes("breaker") || text.includes("corto") || text.includes("chispa") || text.includes("luz")) {
      return { service_type: "CIRCUIT_REPAIR" };
    }
    return { service_type: "PANEL_UPGRADE" };
  }

  if (category === "HVAC") {
    if (text.includes("hielo") || text.includes("ice machine") || text.includes("refrigeración") || text.includes("cuarto frío")) {
      return { service_type: "ICE_MACHINE" };
    }
    return { service_type: "AC_REPAIR" };
  }

  if (category === "HANDYMAN") {
    if (text.includes("drywall") || text.includes("yeso") || text.includes("pared") || text.includes("pladur")) {
      return { service_type: "DRYWALL_REPAIR" };
    }
    if (text.includes("puerta") || text.includes("ventana")) {
      return { service_type: "DOOR_INSTALLATION" };
    }
    if (text.includes("piso") || text.includes("losas") || text.includes("azulejo")) {
      return { service_type: "FLOORING" };
    }
    return { service_type: "DRYWALL_REPAIR" };
  }

  if (category === "TECH_SOFTWARE") {
    if (text.includes("logo") || text.includes("dibujo") || text.includes("dibujito") || text.includes("diseño") || text.includes("flyer")) {
      return { service_type: "GRAPHIC_DESIGN" };
    }
    return { service_type: "SOFTWARE_DEVELOPMENT" };
  }

  return { service_type: "GENERAL_SERVICE" };
}
`;

// Insert genericDefinitions before understandRequest
content = content.replace('export function understandRequest', genericDefinitions + '\nexport function understandRequest');

// Now replace the legal block with Universal Generic Disambiguation in understandRequest
const oldLegalBlock = `  // 2.5 Legal Services Detection & Strict Specialty Disambiguation
  const isLegalIntent =
    matchesKeyword(normalizedText, "abogado") ||
    matchesKeyword(normalizedText, "abogados") ||
    matchesKeyword(normalizedText, "abogada") ||
    matchesKeyword(normalizedText, "abogadas") ||
    matchesKeyword(normalizedText, "lawyer") ||
    matchesKeyword(normalizedText, "lawyers") ||
    matchesKeyword(normalizedText, "attorney") ||
    matchesKeyword(normalizedText, "attorneys") ||
    matchesKeyword(normalizedText, "bufete") ||
    matchesKeyword(normalizedText, "despacho legal") ||
    matchesKeyword(normalizedText, "servicios legales") ||
    matchesKeyword(normalizedText, "asesoría legal") ||
    matchesKeyword(normalizedText, "asesoria legal") ||
    matchesKeyword(normalizedText, "defensa legal") ||
    matchesKeyword(normalizedText, "representación legal") ||
    matchesKeyword(normalizedText, "representacion legal") ||
    matchesKeyword(normalizedText, "litigio");

  if (isLegalIntent) {
    let legalSpecialty = "UNKNOWN";
    const detected = detectLegalSpecialty(normalizedText);
    if (detected !== "LEGAL_GENERAL") {
      legalSpecialty = detected;
    }

    const needsClarification = legalSpecialty === "UNKNOWN";

    return {
      raw_message: rawMessage,
      confidence: 0.95,
      intent: legalSpecialty === "UNKNOWN" ? "LEGAL_INQUIRY" : \`LEGAL_\${legalSpecialty}\`,
      service_category: "LEGAL_SERVICES",
      service_type: legalSpecialty === "UNKNOWN" ? "UNKNOWN" : legalSpecialty,
      legal_specialty: legalSpecialty,
      needs_clarification: needsClarification,
      clarification_prompt: needsClarification ? "Claro. ¿Qué tipo de asunto legal necesitas resolver?" : null,
      urgency: (legalSpecialty === "CRIMINAL" || legalSpecialty === "IMMIGRATION") ? "HIGH" : "MEDIUM",
      property_type: property_type,
      location_raw: location.name,
      latitude: location.lat,
      longitude: location.lng,
      location_detected: location.matched
    };
  }`;

const newUniversalBlock = `  // 2.5 Universal Generic Disambiguation (REGLA: PARA CADA CASO)
  // If the user requests a trade/professional generically without stating the specific symptom/job:
  for (const item of GENERIC_CATEGORY_TRIGGERS) {
    const hasTrigger = item.triggers.some(t => matchesKeyword(normalizedText, t));
    if (hasTrigger) {
      // Check if specific symptom/sub-specialty is already present
      let hasSymptom = item.symptoms.some(s => normalizedText.includes(s));
      let legalSpecialty = null;

      if (item.category === "LEGAL_SERVICES") {
        const detected = detectLegalSpecialty(normalizedText);
        if (detected !== "LEGAL_GENERAL") {
          hasSymptom = true;
          legalSpecialty = detected;
        } else {
          hasSymptom = false;
          legalSpecialty = "UNKNOWN";
        }
      }

      if (!hasSymptom) {
        return {
          raw_message: rawMessage,
          confidence: 0.95,
          intent: \`\${item.category}_INQUIRY\`,
          service_category: item.category,
          service_type: "UNKNOWN",
          legal_specialty: legalSpecialty,
          needs_clarification: true,
          clarification_prompt: CATEGORY_CLARIFICATION_PROMPTS[item.category] || "Claro. ¿Qué trabajo o problema necesitas resolver?",
          urgency: "MEDIUM",
          property_type: property_type,
          location_raw: location.name,
          latitude: location.lat,
          longitude: location.lng,
          location_detected: location.matched
        };
      } else if (item.category === "LEGAL_SERVICES" && legalSpecialty && legalSpecialty !== "UNKNOWN") {
        return {
          raw_message: rawMessage,
          confidence: 0.95,
          intent: \`LEGAL_\${legalSpecialty}\`,
          service_category: "LEGAL_SERVICES",
          service_type: legalSpecialty,
          legal_specialty: legalSpecialty,
          needs_clarification: false,
          clarification_prompt: null,
          urgency: (legalSpecialty === "CRIMINAL" || legalSpecialty === "IMMIGRATION") ? "HIGH" : "MEDIUM",
          property_type: property_type,
          location_raw: location.name,
          latitude: location.lat,
          longitude: location.lng,
          location_detected: location.matched
        };
      }
    }
  }`;

content = content.replace(oldLegalBlock, newUniversalBlock);

fs.writeFileSync(semanticPath, content, 'utf8');
console.log('Successfully updated src/core/semantic.js with Universal Disambiguation');
