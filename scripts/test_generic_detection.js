import { matchesKeyword } from '../src/core/semantic.js';

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
  }
];

function checkGeneric(text) {
  const norm = text.toLowerCase();
  for (const item of GENERIC_CATEGORY_TRIGGERS) {
    const hasTrigger = item.triggers.some(t => matchesKeyword(norm, t));
    if (hasTrigger) {
      const hasSymptom = item.symptoms.some(s => norm.includes(s));
      if (!hasSymptom) {
        return { isGeneric: true, category: item.category };
      }
    }
  }
  return { isGeneric: false };
}

console.log('1. "Hola, necesito un plomero" ->', checkGeneric('Hola, necesito un plomero'));
console.log('2. "Tengo una gotera tremenda en el techo" ->', checkGeneric('Tengo una gotera tremenda en el techo'));
console.log('3. "Se me ponchó la goma en Dixie" ->', checkGeneric('Se me ponchó la goma en Dixie'));
console.log('4. "Hola, necesito un mecánico" ->', checkGeneric('Hola, necesito un mecánico'));
console.log('5. "Hola, busco un contador" ->', checkGeneric('Hola, busco un contador'));
console.log('6. "Hola necesito ayuda con mis taxes y una asesoría para mi negocio" ->', checkGeneric('Hola necesito ayuda con mis taxes y una asesoría para mi negocio'));
console.log('7. "Hola, necesito un abogado" ->', checkGeneric('Hola, necesito un abogado'));
console.log('8. "Hola, necesito un abogado de inmigración urgente" ->', checkGeneric('Hola, necesito un abogado de inmigración urgente'));
console.log('9. "Hola, necesito alguien que limpie" ->', checkGeneric('Hola, necesito alguien que limpie'));
console.log('10. "Hola, quiero hacer un dibujito para mi negocio" ->', checkGeneric('Hola, quiero hacer un dibujito para mi negocio'));
