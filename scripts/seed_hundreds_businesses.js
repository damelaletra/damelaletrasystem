// 1 Pristine Louisville Business & Provider per Service Category (for testing)
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const SEED_CATEGORIES = [
  {
    category: "TECH_SOFTWARE",
    services: ["SOFTWARE_DEVELOPMENT", "WEB_DEVELOPMENT", "UI_UX_DESIGN", "GRAPHIC_DESIGN", "ILLUSTRATION", "LOGO_DESIGN", "BRANDING", "MOBILE_APPS", "AI_INTEGRATIONS", "FULL_STACK", "ECOMMERCE", "REACT", "NEXTJS", "FIGMA"],
    bizId: "biz-miguel-sosa",
    provId: "prov-miguel-sosa",
    bizName: "Miguel Sosa — Software & Design Studio",
    ownerName: "Miguel Sosa",
    phone: "+15025550100",
    email: "contacto@miguelsosa.dev",
    zone: { name: "Louisville Metro / Remote", lat: 38.2527, lng: -85.7585 },
    fee: 75,
    notes: "$75/h o por proyecto",
    bio: "Desarrollo de software full-stack, páginas web modernas en Next.js/React, diseño UI/UX en Figma, diseño de logos e integraciones de IA.",
    priority: 1.0
  },
  {
    category: "CONSULTING_PROFESSIONAL",
    services: ["TAX_PREPARATION", "IMMIGRATION_FORMS", "BUSINESS_CONSULTING", "NOTARY_PUBLIC", "TRANSLATION_SERVICES", "ACCOUNTING_BOOKKEEPING"],
    bizId: "biz-consulting-01",
    provId: "prov-consulting-01",
    bizName: "502 Tax & Accounting Solutions",
    ownerName: "Roberto Méndez",
    phone: "+15025550101",
    email: "info@502taxsolutions.com",
    zone: { name: "Preston Hwy / Okolona", lat: 38.1510, lng: -85.7001 },
    fee: 80,
    notes: "Declaraciones desde $120 / Consultoría $80/h",
    bio: "Preparación de impuestos personales y corporativos, ITIN number, formas de inmigración, notaría pública y contabilidad para negocios.",
    priority: 0.95
  },
  {
    category: "PLUMBING",
    services: ["PIPE_LEAK", "DRAIN_CLEARING", "FAUCET_REPAIR", "WATER_HEATER", "TOILET_REPAIR", "EMERGENCY_PLUMBING"],
    bizId: "biz-plumbing-01",
    provId: "prov-plumbing-01",
    bizName: "Plomería Martínez",
    ownerName: "José Martínez",
    phone: "+15025550102",
    email: "servicio@plomeriamartinez.com",
    zone: { name: "Dixie Hwy / Shively", lat: 38.1632, lng: -85.8341 },
    fee: 75,
    notes: "Estimados claros sin sorpresas / Emergencias el mismo día",
    bio: "Plomero certificado con más de 12 años de experiencia. Reparación de fugas, destupición de tuberías con cámara y calentadores de agua.",
    priority: 0.95
  },
  {
    category: "HVAC",
    services: ["AC_REPAIR", "HEATING_REPAIR", "HVAC_MAINTENANCE", "FREON_LEAK", "ICE_MACHINE", "COMMERCIAL_COOLING"],
    bizId: "biz-hvac-01",
    provId: "prov-hvac-01",
    bizName: "Ruiz Climate & Air",
    ownerName: "Carlos Ruiz",
    phone: "+15025550103",
    email: "info@ruizclimateair.com",
    zone: { name: "Preston Hwy / Okolona", lat: 38.1510, lng: -85.7001 },
    fee: 80,
    notes: "Diagnóstico deducible de la reparación",
    bio: "Diagnóstico y reparación de unidades de aire acondicionado central, recarga de freón, cuartos fríos y máquinas de hielo comerciales.",
    priority: 0.95
  },
  {
    category: "AUTOMOTIVE",
    services: ["TIRE_CHANGE", "ROADSIDE_ASSISTANCE", "BATTERY_JUMP", "TOWING", "AUTO_LOCKOUT", "MOBILE_MECHANIC"],
    bizId: "biz-automotive-01",
    provId: "prov-automotive-01",
    bizName: "502 Roadside & Tire Assistance",
    ownerName: "Roberto González",
    phone: "+15025550104",
    email: "ayuda@502roadside.com",
    zone: { name: "Dixie Hwy / Shively", lat: 38.1632, lng: -85.8341 },
    fee: 65,
    notes: "En camino en 15-25 minutos",
    bio: "Cambio de gomas ponchadas en carretera, pase de corriente, grúa ligera, entrega de gasolina y auxilio vial rápido.",
    priority: 0.95
  },
  {
    category: "TREE_SERVICE",
    services: ["TREE_REMOVAL", "TREE_TRIMMING", "LAWN_MOWING", "YARD_CLEANUP", "STUMP_GRINDING", "LANDSCAPING"],
    bizId: "biz-tree-01",
    provId: "prov-tree-01",
    bizName: "Silva Tree & Yard Care",
    ownerName: "Yoelvis Silva",
    phone: "+15025550105",
    email: "contacto@silvatreecare.com",
    zone: { name: "Valley Station / PRP", lat: 38.1200, lng: -85.8500 },
    fee: 100,
    notes: "Estimados gratis en sitio / Citas programadas",
    bio: "Corte y poda de árboles peligrosos, ramas sobre techos, trituración de troncos, corte de césped y limpieza profunda de patios.",
    priority: 0.95
  },
  {
    category: "ELECTRICAL",
    services: ["CIRCUIT_REPAIR", "BREAKER_PANEL", "OUTLET_INSTALL", "LIGHTING", "EMERGENCY_POWER", "CEILING_FAN"],
    bizId: "biz-electrical-01",
    provId: "prov-electrical-01",
    bizName: "Ramos Electric Pros",
    ownerName: "Andrés Ramos",
    phone: "+15025550106",
    email: "info@ramoselectricpros.com",
    zone: { name: "Hurstbourne Pkwy", lat: 38.2185, lng: -85.5890 },
    fee: 90,
    notes: "Trabajos garantizados bajo código NEC",
    bio: "Electricista con licencia: solución de cortocircuitos, cambio de breakers, actualización de paneles eléctricos e instalación de cargadores EV.",
    priority: 0.95
  },
  {
    category: "ROOFING",
    services: ["ROOF_LEAK", "SHINGLE_REPAIR", "GUTTER_CLEANING", "STORM_DAMAGE", "ROOF_INSPECTION", "ROOF_REPLACEMENT"],
    bizId: "biz-roofing-01",
    provId: "prov-roofing-01",
    bizName: "Nelson Roofing & Gutters",
    ownerName: "Nelson Techos y Goteras",
    phone: "+15025550107",
    email: "servicio@nelsonroofing.com",
    zone: { name: "Bardstown Rd / Highlands", lat: 38.2250, lng: -85.6980 },
    fee: 90,
    notes: "Inspección y estimados en sitio",
    bio: "Especialista en reparación de goteras, cambio de tejas (shingles), sellado de chimeneas y limpieza/instalación de canales de aluminio.",
    priority: 0.95
  },
  {
    category: "HANDYMAN",
    services: ["DRYWALL_REPAIR", "PAINTING", "DOOR_REPAIR", "TILE_REPAIR", "GENERAL_FIX", "CARPENTRY"],
    bizId: "biz-handyman-01",
    provId: "prov-handyman-01",
    bizName: "502 Drywall & Handyman",
    ownerName: "José Antonio Drywall",
    phone: "+15025550108",
    email: "contacto@502drywall.com",
    zone: { name: "Preston Hwy / Okolona", lat: 38.1510, lng: -85.7001 },
    fee: 75,
    notes: "Cobro por proyecto o por día",
    bio: "Instalación y parches de drywall (pladur), acabado de masilla nivel 5, pintura interior/exterior, pisos de vinilo LVP y reparaciones generales.",
    priority: 0.95
  },
  {
    category: "APPLIANCE_REPAIR",
    services: ["WASHER_DRYER", "REFRIGERATOR_REPAIR", "STOVE_OVEN", "DISHWASHER", "MICROWAVE"],
    bizId: "biz-appliance-01",
    provId: "prov-appliance-01",
    bizName: "502 Appliance Fix",
    ownerName: "Guillermo Lavadoras y Secadoras",
    phone: "+15025550109",
    email: "ayuda@502appliancefix.com",
    zone: { name: "Dixie Hwy / Shively", lat: 38.1632, lng: -85.8341 },
    fee: 75,
    notes: "Diagnóstico y piezas en el camión",
    bio: "Reparación de lavadoras, secadoras, refrigeradores que no enfrían, estufas de gas y hornos Whirlpool, Samsung, LG, GE y Maytag.",
    priority: 0.95
  },
  {
    category: "CLEANING",
    services: ["HOUSE_CLEANING", "MOVE_OUT_CLEANING", "COMMERCIAL_CLEANING", "CARPET_CLEANING", "POST_CONSTRUCTION"],
    bizId: "biz-cleaning-01",
    provId: "prov-cleaning-01",
    bizName: "Derby Deep Cleaning Services",
    ownerName: "Yaimara Casas y Mudanzas",
    phone: "+15025550110",
    email: "info@derbydeepcleaning.com",
    zone: { name: "St. Matthews", lat: 38.2514, lng: -85.6425 },
    fee: 90,
    notes: "Citas programadas / Equipo completo",
    bio: "Limpieza profunda de casas, apartamentos para entrega de depósitos de renta (Move-in/Move-out), lavado de alfombras y oficinas comerciales.",
    priority: 0.95
  },
  {
    category: "LOCKSMITH",
    services: ["AUTO_LOCKOUT", "HOME_LOCKOUT", "REKEY", "DEADBOLT_INSTALL", "CAR_KEY_PROGRAMMING"],
    bizId: "biz-locksmith-01",
    provId: "prov-locksmith-01",
    bizName: "502 Quick Locksmith",
    ownerName: "Frank Cerrajería y Aperturas",
    phone: "+15025550111",
    email: "contacto@502quicklocksmith.com",
    zone: { name: "Downtown Louisville", lat: 38.2542, lng: -85.7594 },
    fee: 75,
    notes: "Llegada rápida en 15 a 20 minutos",
    bio: "Apertura rápida de autos y casas sin daños, llaves adentro, cambio de combinación (rekey) e instalación de cerrojos digitales.",
    priority: 0.95
  },
  {
    category: "EVENTS_CATERING",
    services: ["CATERING", "PHOTOGRAPHY", "VIDEOGRAPHY", "DJ_MUSIC", "EVENT_DECOR", "CAKE_BAKERY"],
    bizId: "biz-events-01",
    provId: "prov-events-01",
    bizName: "502 Sabor Latino Catering",
    ownerName: "Mayelín Cocina Criolla",
    phone: "+15025550112",
    email: "eventos@502saborlatino.com",
    zone: { name: "Jeffersontown (J-Town)", lat: 38.1945, lng: -85.5686 },
    fee: 150,
    notes: "Presupuestos por número de invitados",
    bio: "Catering criollo para fiestas, bodas y quinces: puerco asado, congrí, yuca con mojo, buffet latino, fotografía y sonido.",
    priority: 0.95
  },
  {
    category: "BEAUTY_BARBER",
    services: ["BARBER_SHOP", "HAIR_STYLING", "NAILS_SPA", "MAKEUP_ARTIST"],
    bizId: "biz-beauty-01",
    provId: "prov-beauty-01",
    bizName: "502 Master Cuban Barber Shop",
    ownerName: "Yasser Barbero",
    phone: "+15025550113",
    email: "citas@502masterbarber.com",
    zone: { name: "Preston Hwy / Okolona", lat: 38.1510, lng: -85.7001 },
    fee: 35,
    notes: "Citas y por orden de llegada",
    bio: "Cortes modernos degradados (fades), arreglo de barba con toalla caliente, perfilado de cejas y peinados.",
    priority: 0.95
  },
  {
    category: "LEGAL_SERVICES",
    services: ["IMMIGRATION", "PERSONAL_INJURY", "CRIMINAL", "FAMILY", "TRAFFIC_TICKET", "REAL_ESTATE_LEGAL", "LABOR_EMPLOYMENT", "BUSINESS_CORPORATE", "LEGAL_GENERAL"],
    bizId: "biz-legal-01",
    provId: "prov-legal-01",
    bizName: "Bufete Legal Louisville (Abogados Hispanos)",
    ownerName: "Lic. Alejandro Ramos — Abogado",
    phone: "+15025550114",
    email: "contacto@abogadoslouisville.com",
    zone: { name: "Downtown Louisville", lat: 38.2542, lng: -85.7594 },
    fee: 100,
    notes: "Consulta legal en oficina / personalizada",
    bio: "Abogado bilingüe en Louisville especializado en defensa legal, inmigración, accidentes de auto, casos familiares y defensa penal/tráfico.",
    priority: 0.95
  }
];

function generateCleanDataset() {
  const businesses = [];
  const providers = [];

  for (const item of SEED_CATEGORIES) {
    const bizObj = {
      id: item.bizId,
      name: item.bizName,
      contact_phone: item.phone,
      contact_email: item.email,
      verified_status: "VERIFIED",
      city: "Louisville",
      state: "KY"
    };

    const provObj = {
      id: item.provId,
      business_id: item.bizId,
      name: item.ownerName,
      display_name: `${item.ownerName} (${item.bizName})`,
      phone: item.phone,
      preferred_channel: "SMS",
      languages: ["es", "en"],
      category: item.category,
      services: item.services,
      residential_capable: 1,
      commercial_capable: 1,
      license_status: "VERIFIED",
      license_details: "Verified Louisville Business Provider",
      base_location_name: item.zone.name,
      base_latitude: item.zone.lat,
      base_longitude: item.zone.lng,
      max_radius_miles: 45,
      availability_status: "AVAILABLE",
      capacity_today: 15,
      capacity_used_today: 0,
      conditional_rules: {
        default_callout_fee: item.fee,
        standard_response_time_min: 20
      },
      reliability_score: 0.98,
      avg_response_time_sec: 25,
      completed_connections: 50,
      cancelled_connections: 0,
      subscription_tier: "FOUNDING",
      priority_score: item.priority || 0.95,
      pricing_notes: item.notes,
      bio: item.bio
    };

    businesses.push(bizObj);
    providers.push(provObj);
  }

  return { businesses, providers };
}

const { businesses, providers } = generateCleanDataset();

console.log(`Generated ${businesses.length} clean businesses (1 per service category).`);

// Update seedData.js
const seedDataPath = path.join(__dirname, "../src/core/seedData.js");
const seedDataContent = `// Louisville, KY - 1 Verified Provider & Business per Service Category (Clean Testing Dataset)

export const initialBusinesses = ${JSON.stringify(businesses, null, 2)};

export const initialProviders = ${JSON.stringify(providers, null, 2)};

export const externalPublicDirectory = [
  {
    "category": "CRANE_RIGGING",
    "business_name": "Derby City Heavy Rigging & Crane Service",
    "phone": "+15025550199",
    "address": "7100 Grade Ln, Louisville, KY",
    "source": "Louisville Public Commercial Registry"
  },
  {
    "category": "SEPTIC_SEWER",
    "business_name": "Bluegrass Septic & Excavating",
    "phone": "+15025550198",
    "address": "4500 Outer Loop, Louisville, KY",
    "source": "Jefferson County Public Directory"
  }
];
`;

fs.writeFileSync(seedDataPath, seedDataContent, "utf-8");
console.log("Updated src/core/seedData.js successfully.");

// Update data/dml_database.json
const dbPath = path.join(__dirname, "../data/dml_database.json");
if (fs.existsSync(dbPath)) {
  const currentDb = JSON.parse(fs.readFileSync(dbPath, "utf-8"));
  currentDb.businesses = businesses;
  currentDb.providers = providers;
  fs.writeFileSync(dbPath, JSON.stringify(currentDb, null, 2), "utf-8");
  console.log("Updated data/dml_database.json successfully.");
}
