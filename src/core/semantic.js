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

  // 2. HVAC / AC Repair
  {
    category: "HVAC",
    service_type: "AC_REPAIR",
    keywords: [
      "aire", "ac", "aire acondicionado", "no enfría", "no tira frío", "casa caliente",
      "se jodió el aire", "se apagó el aire", "calor adentro", "condensador", "freón", "freon", "frio"
    ],
    urgency: "HIGH",
    defaultIntent: "AC_REPAIR"
  },
  {
    category: "HVAC",
    service_type: "ICE_MACHINE",
    keywords: [
      "máquina de hielo", "ice machine", "refrigeración comercial", "cuarto frío",
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

  // 11. Heavy Fallbacks
  {
    category: "CRANE_RIGGING",
    service_type: "CRANE_SERVICE",
    keywords: ["grúa pesada", "crane", "levantar maquinaria", "montacargas pesado", "rigging"],
    urgency: "MEDIUM",
    defaultIntent: "CRANE_SERVICE"
  }
];

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
      if (normalizedText.includes(kw)) {
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

  if (commercialKws.some(kw => normalizedText.includes(kw))) {
    property_type = "COMMERCIAL";
  } else if (residentialKws.some(kw => normalizedText.includes(kw))) {
    property_type = "RESIDENTIAL";
  }

  // 3. Match service pattern
  let bestMatch = null;
  let highestScore = 0;

  for (const pattern of SERVICE_PATTERNS) {
    let score = 0;
    for (const kw of pattern.keywords) {
      if (normalizedText.includes(kw)) {
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
