// Semantic Layer: Translates natural human speech into structured intents.

// Louisville landmarks & geo references
const LOUISVILLE_LOCATIONS = [
  { keywords: ["dixie", "dixie hwy", "dixie highway", "south end"], name: "Dixie Hwy, Louisville", lat: 38.1632, lng: -85.8341 },
  { keywords: ["preston", "preston hwy", "preston highway", "okolona", "outer loop", "jefferson mall"], name: "Preston Hwy / Okolona, Louisville", lat: 38.1510, lng: -85.7001 },
  { keywords: ["bardstown", "bardstown rd", "highlands", "fern creek", "buechel"], name: "Bardstown Rd / Highlands, Louisville", lat: 38.2250, lng: -85.6980 },
  { keywords: ["hurstbourne", "hurstbourne pkwy", "stonybrook"], name: "Hurstbourne Pkwy, Louisville", lat: 38.2185, lng: -85.5890 },
  { keywords: ["downtown", "centro", "broadway", "4th st", "market st"], name: "Downtown Louisville", lat: 38.2542, lng: -85.7594 },
  { keywords: ["shively", "crums lane"], name: "Shively, Louisville", lat: 38.1928, lng: -85.8175 },
  { keywords: ["portland", "shawnee", "west end"], name: "West End / Portland, Louisville", lat: 38.2675, lng: -85.7942 },
  { keywords: ["st matthews", "saint matthews", "mall st matthews", "oxmoor", "oxmoor mall", "shelbyville", "shelbyville rd", "mall"], name: "St. Matthews / Mall Area, Louisville", lat: 38.2514, lng: -85.6425 },
  { keywords: ["j-town", "jeffersontown", "bluegrass industrial"], name: "Jeffersontown, Louisville", lat: 38.1945, lng: -85.5686 },
  { keywords: ["middletown", "east end"], name: "Middletown / East End, Louisville", lat: 38.2434, lng: -85.5347 },
  { keywords: ["valley station", "prp", "pleasure ridge park"], name: "Valley Station / PRP, Louisville", lat: 38.1200, lng: -85.8500 },
  { keywords: ["new cut", "taylorsville", "hikes point"], name: "South / East Louisville", lat: 38.1680, lng: -85.7400 },
  { keywords: ["i-65", "i65", "i-264", "i264", "i-71", "i71", "watterson", "gene snyder", "i-265"], name: "Highway Corridor, Louisville", lat: 38.1820, lng: -85.8150 }
];

const SERVICE_PATTERNS = [
  // 1. Automotive / Tires / Roadside
  {
    category: "AUTOMOTIVE",
    service_type: "TIRE_CHANGE",
    keywords: [
      "goma", "llanta", "neumático", "tire", "ponchó", "ponche", "flat tire",
      "explotó", "reventó", "varado", "quedé botao", "quedé tirado", "rueda", "pinchazo"
    ],
    urgency: "HIGH",
    defaultIntent: "TIRE_ASSISTANCE"
  },
  {
    category: "AUTOMOTIVE",
    service_type: "TOWING",
    keywords: ["grúa", "remolque", "towing", "remolcar", "arrastrar el carro"],
    urgency: "HIGH",
    defaultIntent: "TOWING_SERVICE"
  },
  {
    category: "AUTOMOTIVE",
    service_type: "BATTERY_JUMP",
    keywords: ["batería", "no arranca", "jump", "cables", "pasarle corriente", "darle carga"],
    urgency: "HIGH",
    defaultIntent: "BATTERY_JUMP"
  },

  // 1.5. Information Queries (Community Assistant)
  {
    category: "INFORMATION",
    service_type: "GENERAL_INFO",
    keywords: [
      "dólar", "dolar", "clima", "tiempo", "llover", "restaurante", "qué hay", 
      "comida", "feria", "eventos", "precio", "información", "noticias", "hora",
      "empleo", "trabajo", "contratando", "apartamento", "renta", "oferta", "descuento", "promoción",
      "sticker", "chapa", "placa", "dmv", "licencia", "county clerk", "junk yard", "yonke", "clínica", "hospital", "seguro"
    ],
    urgency: "LOW",
    defaultIntent: "GENERAL_INFO"
  },

  // 2. HVAC / AC Repair
  {
    category: "HVAC",
    service_type: "AC_REPAIR",
    keywords: [
      "aire", "aire acondicionado", "a/c", "ac", "no enfría", "no enfria", "no tira frío", "no tira frio", "casa caliente",
      "se jodió el aire", "se jodio el aire", "se apagó el aire", "se apago el aire", "calor adentro", "condensador", "freón", "freon", "frio"
    ],
    urgency: "HIGH",
    defaultIntent: "AC_REPAIR"
  },
  {
    category: "HVAC",
    service_type: "ICE_MACHINE",
    keywords: [
      "máquina de hielo", "maquina de hielo", "ice machine", "refrigeración comercial", "refrigeracion comercial", "cuarto frío", "cuarto frio",
      "walk-in", "enfriador comercial", "restaurante hielo"
    ],
    urgency: "HIGH",
    property_type: "COMMERCIAL",
    defaultIntent: "COMMERCIAL_REFRIGERATION"
  },

  // 3. Plumbing
  {
    category: "PLUMBING",
    service_type: "PIPE_LEAK",
    keywords: [
      "plomero", "plomería", "fuga", "botadera", "botándose el agua", "salidero",
      "tubo roto", "tubo partido", "tubería", "goteo", "inundando", "agua"
    ],
    urgency: "EMERGENCY",
    defaultIntent: "PIPE_LEAK"
  },
  {
    category: "PLUMBING",
    service_type: "DRAIN_CLEARING",
    keywords: [
      "tupición", "tupido", "desagüe", "destupir", "atasco", "inodoro tapado",
      "fregadero no baja", "drenaje", "clogged", "drain"
    ],
    urgency: "HIGH",
    defaultIntent: "DRAIN_CLEARING"
  },

  // 4. Tree Service & Landscaping
  {
    category: "TREE_SERVICE",
    service_type: "TREE_REMOVAL",
    keywords: [
      "árbol", "arbol", "cortar árbol", "poda", "rama caída", "rama sobre el techo",
      "tumbar árbol", "tree service", "tronco", "peligro árbol", "podar"
    ],
    urgency: "HIGH",
    defaultIntent: "TREE_REMOVAL"
  },
  {
    category: "TREE_SERVICE",
    service_type: "LAWN_MOWING",
    keywords: [
      "chapear", "chapeo", "cortar la yerba", "cortar el pasto", "cortar césped",
      "limpieza de patio", "jardinería", "mowing", "lawn", "jardín"
    ],
    urgency: "LOW",
    defaultIntent: "LAWN_MOWING"
  },

  // 5. Electrical
  {
    category: "ELECTRICAL",
    service_type: "CIRCUIT_REPAIR",
    keywords: [
      "electricista", "electricidad", "se fue la luz", "saltó el breaker", "chispa",
      "cables", "corto circuito", "tomacorriente", "panel eléctrico", "breaker", "luz"
    ],
    urgency: "HIGH",
    defaultIntent: "ELECTRICAL_FAULT"
  },

  // 6. Roofing
  {
    category: "ROOFING",
    service_type: "ROOF_LEAK",
    keywords: [
      "techo", "gotera", "roof", "roofing", "tejas", "canal", "canales",
      "filtración en el techo", "shingle", "tormenta techo", "tejado", "reparar techo"
    ],
    urgency: "HIGH",
    defaultIntent: "ROOF_REPAIR"
  },

  // 7. Handyman & Drywall
  {
    category: "HANDYMAN",
    service_type: "DRYWALL_REPAIR",
    keywords: [
      "drywall", "pladur", "yeso", "pintar", "pintura", "handyman", "reparaciones",
      "poner puerta", "azulejo", "piso", "losas", "divisiones", "carpintería", "arreglos"
    ],
    urgency: "MEDIUM",
    defaultIntent: "HANDYMAN_SERVICE"
  },

  // 8. Appliance Repair
  {
    category: "APPLIANCE_REPAIR",
    service_type: "WASHER_DRYER",
    keywords: [
      "lavadora", "secadora", "refrigerador", "nevera", "frigidaire", "estufa",
      "horno", "lavavajillas", "dishwasher", "washer", "dryer", "appliance",
      "no calienta el horno", "no bota agua la lavadora", "electrodoméstico"
    ],
    urgency: "HIGH",
    defaultIntent: "APPLIANCE_REPAIR"
  },

  // 9. Cleaning
  {
    category: "CLEANING",
    service_type: "HOUSE_CLEANING",
    keywords: [
      "limpieza", "limpiar", "clean", "cleaning", "limpieza de casa", "mudanza limpieza",
      "limpieza profunda", "limpieza de alfombras", "deep cleaning", "house cleaning", "limpieza de oficina"
    ],
    urgency: "LOW",
    defaultIntent: "CLEANING_SERVICE"
  },

  // 10. Locksmith
  {
    category: "LOCKSMITH",
    service_type: "AUTO_LOCKOUT",
    keywords: [
      "cerrajero", "cerrajería", "llave", "llaves", "llaven", "candado", "cerradura",
      "abrir carro", "quedé con las llaves adentro", "se me quedaron las llaves", "se me quedaron las llaven",
      "llaves adentro", "puerta trancada", "trancado", "cerrado el carro", "locksmith", "abrir puerta", "cambiar cerradura", "rekey"
    ],
    urgency: "HIGH",
    defaultIntent: "LOCKSMITH_SERVICE"
  },

  // 11. Tech, Graphic Design, Branding & Software Development (Miguel Sosa)
  {
    category: "TECH_SOFTWARE",
    service_type: "GRAPHIC_DESIGN",
    keywords: [
      "dibujito", "dibujitos", "dibujo", "dibujos", "dibujar", "dibujante",
      "logo", "logos", "logotipo", "logotipos", "isotipo", "branding", "identidad visual", "imagen corporativa",
      "diseño", "diseños", "diseño gráfico", "diseño grafico", "diseñador", "diseñadora", "diseñador gráfico", "diseñador grafico",
      "ilustración", "ilustracion", "ilustraciones", "ilustrador", "ilustradora", "vector", "vectores", "vectorizar",
      "flyer", "flyers", "volante", "volantes", "folleto", "folletos", "banner", "banners", "cartel", "carteles",
      "rótulo", "rotulo", "letrero", "tarjeta", "tarjetas", "tarjeta de presentación", "tarjetas de presentación", "tarjetas de presentacion", "tarjetas de negocio",
      "caricatura", "arte digital", "render", "edición de video", "edicion de video", "fotos", "fotografía", "fotografia", "ui/ux", "figma"
    ],
    urgency: "MEDIUM",
    defaultIntent: "GRAPHIC_DESIGN_SERVICE"
  },
  {
    category: "TECH_SOFTWARE",
    service_type: "SOFTWARE_DEVELOPMENT",
    keywords: [
      "software", "programador", "programadora", "developer", "desarrollo", "código", "codigo", "programar",
      "página web", "pagina web", "sitio web", "website", "web", "diseño web", "diseno web",
      "app", "apps", "aplicación", "aplicacion", "aplicaciones", "tienda online", "ecommerce", "shopify", "nextjs", "react",
      "ia", "inteligencia artificial", "sistema", "sistemas", "plataforma", "plataformas",
      "base de datos", "automatización", "automatizacion", "bot", "chatbot", "landing page", "menú digital", "menu qr"
    ],
    urgency: "MEDIUM",
    defaultIntent: "SOFTWARE_DEVELOPMENT"
  },

  // 12. Consulting & Professional Services (Taxes, Immigration, LLCs, Notary, Accounting)
  {
    category: "CONSULTING_PROFESSIONAL",
    service_type: "TAX_PREPARATION",
    keywords: [
      "taxes", "impuestos", "declaración", "declaracion", "preparador de impuestos",
      "w2", "1099", "itin", "declaración de taxes", "tax return", "contribuir"
    ],
    urgency: "LOW",
    defaultIntent: "TAX_PREPARATION"
  },
  {
    category: "CONSULTING_PROFESSIONAL",
    service_type: "IMMIGRATION_FORMS",
    keywords: [
      "inmigración", "inmigracion", "papeles", "asilo", "permiso de trabajo", "residencia",
      "green card", "ciudadanía", "ciudadania", "petición familiar", "peticion familiar",
      "trámite migratorio", "tramite migratorio", "parole", "i-589", "i-765"
    ],
    urgency: "LOW",
    defaultIntent: "IMMIGRATION_ASSISTANCE"
  },
  {
    category: "CONSULTING_PROFESSIONAL",
    service_type: "BUSINESS_CONSULTING",
    keywords: [
      "abrir negocio", "crear llc", "llc", "abrir compañía", "abrir compania",
      "plan de negocio", "consultoría", "consultoria", "asesoría", "asesoria", "registro comercial"
    ],
    urgency: "LOW",
    defaultIntent: "BUSINESS_CONSULTING"
  },
  {
    category: "CONSULTING_PROFESSIONAL",
    service_type: "NOTARY_PUBLIC",
    keywords: [
      "notario", "notaría", "notaria", "notary", "notarizar", "carta poder",
      "declaración jurada", "declaracion jurada", "apostilla", "poder notarial"
    ],
    urgency: "LOW",
    defaultIntent: "NOTARY_SERVICE"
  },
  {
    category: "CONSULTING_PROFESSIONAL",
    service_type: "TRANSLATION_SERVICES",
    keywords: [
      "traducción", "traduccion", "traducciones", "traducir certificado", "traducir documento",
      "traductor certificado", "traducir título", "traducción oficial"
    ],
    urgency: "LOW",
    defaultIntent: "TRANSLATION_SERVICE"
  },
  {
    category: "CONSULTING_PROFESSIONAL",
    service_type: "ACCOUNTING_BOOKKEEPING",
    keywords: [
      "contabilidad", "contable", "bookkeeper", "bookkeeping", "payroll",
      "nómina", "nomina", "quickbooks", "reportes de ventas", "balance general"
    ],
    urgency: "LOW",
    defaultIntent: "ACCOUNTING_SERVICE"
  },

  // 13. Events & Catering
  {
    category: "EVENTS_CATERING",
    service_type: "CATERING",
    keywords: [
      "catering", "comida para fiesta", "puerco asado", "lechón", "lechon",
      "buffet", "banquetes", "comida criolla", "comida para boda", "comida para quince"
    ],
    urgency: "LOW",
    defaultIntent: "CATERING_SERVICE"
  },
  {
    category: "EVENTS_CATERING",
    service_type: "PHOTOGRAPHY",
    keywords: [
      "fotógrafo", "fotografo", "fotografía", "fotografia", "sesión de fotos", "sesion de fotos",
      "fotos para quinceañera", "fotos de boda", "video para fiesta", "videógrafo", "videografo"
    ],
    urgency: "LOW",
    defaultIntent: "EVENT_PHOTOGRAPHY"
  },
  {
    category: "EVENTS_CATERING",
    service_type: "DJ_MUSIC",
    keywords: [
      "dj", "música para fiesta", "musica para fiesta", "sonido para evento",
      "luces para fiesta", "animador", "animación de fiestas"
    ],
    urgency: "LOW",
    defaultIntent: "DJ_SERVICE"
  },

  // 14. Beauty & Barber
  {
    category: "BEAUTY_BARBER",
    service_type: "BARBER_SHOP",
    keywords: [
      "barbero", "barbería", "barberia", "corte de pelo", "corte de cabello",
      "degradado", "fade", "arreglo de barba", "peluqueada"
    ],
    urgency: "LOW",
    defaultIntent: "BARBER_SERVICE"
  },
  {
    category: "BEAUTY_BARBER",
    service_type: "NAILS_SPA",
    keywords: [
      "uñas", "unas", "manicura", "pedicura", "acrílicas", "acrilicas",
      "uñas de gel", "manicura rusa", "arreglar las uñas"
    ],
    urgency: "LOW",
    defaultIntent: "NAIL_SERVICE"
  },
  {
    category: "BEAUTY_BARBER",
    service_type: "HAIR_STYLING",
    keywords: [
      "peluquera", "estilista", "peinado", "tinte", "mechas", "salón de belleza", "salon de belleza", "maquillaje"
    ],
    urgency: "LOW",
    defaultIntent: "HAIR_BEAUTY_SERVICE"
  },

  // 15. Heavy Fallbacks
  {
    category: "CRANE_RIGGING",
    service_type: "CRANE_SERVICE",
    keywords: ["grúa pesada", "crane", "levantar maquinaria", "montacargas pesado", "rigging"],
    urgency: "MEDIUM",
    defaultIntent: "CRANE_SERVICE"
  }
];

export function matchesKeyword(text, keyword) {
  if (!text || !keyword) return false;
  const kw = keyword.toLowerCase().trim();
  const escaped = kw.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  // Enforce boundary matching: Prevents "ac" matching "hacer" or "cotización"
  const regex = new RegExp(`(?:^|[^a-z0-9áéíóúüñ])${escaped}(?:$|[^a-z0-9áéíóúüñ])`, "i");
  return regex.test(text);
}

export function detectLegalSpecialty(rawText) {
  const text = (rawText || "").toLowerCase();
  if (
    text.includes("inmigra") ||
    text.includes("asilo") ||
    text.includes("deportaci") ||
    text.includes("green card") ||
    text.includes("residencia") ||
    text.includes("parole") ||
    text.includes("visa") ||
    text.includes("peticion") ||
    text.includes("petición") ||
    text.includes("corte de inmigra") ||
    text.includes("papeles")
  ) {
    return "IMMIGRATION";
  }
  if (
    text.includes("accidente") ||
    text.includes("choque") ||
    text.includes("choqué") ||
    text.includes("lesion") ||
    text.includes("lesión") ||
    text.includes("injury") ||
    text.includes("golpe") ||
    text.includes("caída") ||
    text.includes("caida") ||
    text.includes("compensacion") ||
    text.includes("compensación") ||
    text.includes("workers comp")
  ) {
    return "PERSONAL_INJURY";
  }
  if (
    text.includes("criminal") ||
    text.includes("carcel") ||
    text.includes("cárcel") ||
    text.includes("arresto") ||
    text.includes("arrestaron") ||
    text.includes("fianza") ||
    text.includes("delito") ||
    text.includes("dui") ||
    text.includes("dwi") ||
    text.includes("cargos") ||
    text.includes("policia") ||
    text.includes("policía") ||
    text.includes("penal")
  ) {
    return "CRIMINAL";
  }
  if (
    text.includes("divorcio") ||
    text.includes("custodia") ||
    text.includes("manutencion") ||
    text.includes("manutención") ||
    text.includes("pension") ||
    text.includes("pensión") ||
    text.includes("familia") ||
    text.includes("adopcion") ||
    text.includes("adopción") ||
    text.includes("matrimonio")
  ) {
    return "FAMILY";
  }
  if (
    text.includes("ticket") ||
    text.includes("multa") ||
    text.includes("trafico") ||
    text.includes("tráfico") ||
    text.includes("transito") ||
    text.includes("tránsito") ||
    text.includes("licencia suspendida") ||
    text.includes("velocidad")
  ) {
    return "TRAFFIC_TICKET";
  }
  if (
    text.includes("desahucio") ||
    text.includes("eviction") ||
    text.includes("inquilino") ||
    text.includes("renta legal") ||
    text.includes("arrendamiento")
  ) {
    return "REAL_ESTATE_LEGAL";
  }
  if (
    text.includes("despido") ||
    text.includes("salario no pagado") ||
    text.includes("abuso laboral") ||
    text.includes("empleador")
  ) {
    return "LABOR_EMPLOYMENT";
  }
  if (
    text.includes("empresa") ||
    text.includes("corporativo") ||
    text.includes("sociedad legal") ||
    text.includes("contrato mercantil")
  ) {
    return "BUSINESS_CORPORATE";
  }
  return "LEGAL_GENERAL";
}


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

export function understandRequest(rawMessage) {
  const normalizedText = (rawMessage || "").toLowerCase().trim();

  // 1. Detect location
  let location = {
    name: "Louisville Metro",
    lat: 38.2527,
    lng: -85.7585,
    matched: false
  };

  for (const loc of LOUISVILLE_LOCATIONS) {
    for (const kw of loc.keywords) {
      if (matchesKeyword(normalizedText, kw)) {
        location = {
          name: loc.name,
          lat: loc.lat,
          lng: loc.lng,
          matched: true
        };
        break;
      }
    }
    if (location.matched) break;
  }

  // 2. Detect property type
  let property_type = "UNKNOWN";
  const commercialKws = ["oficina", "negocio", "local", "restaurante", "tienda", "taller", "nave", "commercial"];
  const residentialKws = ["casa", "apartamento", "hogar", "mi cuarto", "vivienda", "residential"];

  if (commercialKws.some(kw => matchesKeyword(normalizedText, kw))) {
    property_type = "COMMERCIAL";
  } else if (residentialKws.some(kw => matchesKeyword(normalizedText, kw))) {
    property_type = "RESIDENTIAL";
  }

    // 2.5 Universal Generic Disambiguation (REGLA: PARA CADA CASO)
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
          intent: `${item.category}_INQUIRY`,
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
          intent: `LEGAL_${legalSpecialty}`,
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
  }

  // 3. Match service pattern
  let bestMatch = null;
  let highestScore = 0;

  for (const pattern of SERVICE_PATTERNS) {
    let score = 0;
    for (const kw of pattern.keywords) {
      if (matchesKeyword(normalizedText, kw)) {
        score += kw.split(" ").length * 2;
      }
    }
    if (score > highestScore) {
      highestScore = score;
      bestMatch = pattern;
    }
  }

  if (bestMatch && bestMatch.property_type && property_type === "UNKNOWN") {
    property_type = bestMatch.property_type;
  }

  let confidence = 0.5;
  if (bestMatch) {
    confidence = Math.min(0.96, 0.70 + (highestScore * 0.08));
  } else if (normalizedText.length > 5) {
    confidence = 0.40;
  }

  return {
    raw_message: rawMessage,
    confidence: confidence,
    intent: bestMatch ? bestMatch.defaultIntent : "GENERAL_INQUIRY",
    service_category: bestMatch ? bestMatch.category : null,
    service_type: bestMatch ? bestMatch.service_type : null,
    urgency: bestMatch ? bestMatch.urgency : "MEDIUM",
    property_type: property_type,
    location_raw: location.name,
    latitude: location.lat,
    longitude: location.lng,
    location_detected: location.matched
  };
}

export function calculateDistanceMiles(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 999;
  const R = 3958.8;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}
