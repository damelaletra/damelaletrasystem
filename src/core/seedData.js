// Louisville, KY - 1 Verified Provider & Business per Service Category (Clean Testing Dataset)

export const initialBusinesses = [
  {
    "id": "biz-miguel-sosa",
    "name": "Miguel Sosa — Software & Design Studio",
    "contact_phone": "+15025550100",
    "contact_email": "contacto@miguelsosa.dev",
    "verified_status": "VERIFIED",
    "city": "Louisville",
    "state": "KY"
  },
  {
    "id": "biz-consulting-01",
    "name": "502 Tax & Accounting Solutions",
    "contact_phone": "+15025550101",
    "contact_email": "info@502taxsolutions.com",
    "verified_status": "VERIFIED",
    "city": "Louisville",
    "state": "KY"
  },
  {
    "id": "biz-plumbing-01",
    "name": "Plomería Martínez",
    "contact_phone": "+15025550102",
    "contact_email": "servicio@plomeriamartinez.com",
    "verified_status": "VERIFIED",
    "city": "Louisville",
    "state": "KY"
  },
  {
    "id": "biz-hvac-01",
    "name": "Ruiz Climate & Air",
    "contact_phone": "+15025550103",
    "contact_email": "info@ruizclimateair.com",
    "verified_status": "VERIFIED",
    "city": "Louisville",
    "state": "KY"
  },
  {
    "id": "biz-automotive-01",
    "name": "502 Roadside & Tire Assistance",
    "contact_phone": "+15025550104",
    "contact_email": "ayuda@502roadside.com",
    "verified_status": "VERIFIED",
    "city": "Louisville",
    "state": "KY"
  },
  {
    "id": "biz-tree-01",
    "name": "Silva Tree & Yard Care",
    "contact_phone": "+15025550105",
    "contact_email": "contacto@silvatreecare.com",
    "verified_status": "VERIFIED",
    "city": "Louisville",
    "state": "KY"
  },
  {
    "id": "biz-electrical-01",
    "name": "Ramos Electric Pros",
    "contact_phone": "+15025550106",
    "contact_email": "info@ramoselectricpros.com",
    "verified_status": "VERIFIED",
    "city": "Louisville",
    "state": "KY"
  },
  {
    "id": "biz-roofing-01",
    "name": "Nelson Roofing & Gutters",
    "contact_phone": "+15025550107",
    "contact_email": "servicio@nelsonroofing.com",
    "verified_status": "VERIFIED",
    "city": "Louisville",
    "state": "KY"
  },
  {
    "id": "biz-handyman-01",
    "name": "502 Drywall & Handyman",
    "contact_phone": "+15025550108",
    "contact_email": "contacto@502drywall.com",
    "verified_status": "VERIFIED",
    "city": "Louisville",
    "state": "KY"
  },
  {
    "id": "biz-appliance-01",
    "name": "502 Appliance Fix",
    "contact_phone": "+15025550109",
    "contact_email": "ayuda@502appliancefix.com",
    "verified_status": "VERIFIED",
    "city": "Louisville",
    "state": "KY"
  },
  {
    "id": "biz-cleaning-01",
    "name": "Derby Deep Cleaning Services",
    "contact_phone": "+15025550110",
    "contact_email": "info@derbydeepcleaning.com",
    "verified_status": "VERIFIED",
    "city": "Louisville",
    "state": "KY"
  },
  {
    "id": "biz-locksmith-01",
    "name": "502 Quick Locksmith",
    "contact_phone": "+15025550111",
    "contact_email": "contacto@502quicklocksmith.com",
    "verified_status": "VERIFIED",
    "city": "Louisville",
    "state": "KY"
  },
  {
    "id": "biz-events-01",
    "name": "502 Sabor Latino Catering",
    "contact_phone": "+15025550112",
    "contact_email": "eventos@502saborlatino.com",
    "verified_status": "VERIFIED",
    "city": "Louisville",
    "state": "KY"
  },
  {
    "id": "biz-beauty-01",
    "name": "502 Master Cuban Barber Shop",
    "contact_phone": "+15025550113",
    "contact_email": "citas@502masterbarber.com",
    "verified_status": "VERIFIED",
    "city": "Louisville",
    "state": "KY"
  },
  {
    "id": "biz-legal-01",
    "name": "Bufete Legal Louisville (Abogados Hispanos)",
    "contact_phone": "+15025550114",
    "contact_email": "contacto@abogadoslouisville.com",
    "verified_status": "VERIFIED",
    "city": "Louisville",
    "state": "KY"
  }
];

export const initialProviders = [
  {
    "id": "prov-miguel-sosa",
    "business_id": "biz-miguel-sosa",
    "name": "Miguel Sosa",
    "display_name": "Miguel Sosa (Miguel Sosa — Software & Design Studio)",
    "phone": "+15025550100",
    "preferred_channel": "SMS",
    "languages": [
      "es",
      "en"
    ],
    "category": "TECH_SOFTWARE",
    "services": [
      "SOFTWARE_DEVELOPMENT",
      "WEB_DEVELOPMENT",
      "UI_UX_DESIGN",
      "GRAPHIC_DESIGN",
      "ILLUSTRATION",
      "LOGO_DESIGN",
      "BRANDING",
      "MOBILE_APPS",
      "AI_INTEGRATIONS",
      "FULL_STACK",
      "ECOMMERCE",
      "REACT",
      "NEXTJS",
      "FIGMA"
    ],
    "residential_capable": 1,
    "commercial_capable": 1,
    "license_status": "VERIFIED",
    "license_details": "Verified Louisville Business Provider",
    "base_location_name": "Louisville Metro / Remote",
    "base_latitude": 38.2527,
    "base_longitude": -85.7585,
    "max_radius_miles": 45,
    "availability_status": "AVAILABLE",
    "capacity_today": 15,
    "capacity_used_today": 0,
    "conditional_rules": {
      "default_callout_fee": 75,
      "standard_response_time_min": 20
    },
    "reliability_score": 0.98,
    "avg_response_time_sec": 25,
    "completed_connections": 50,
    "cancelled_connections": 0,
    "subscription_tier": "FOUNDING",
    "priority_score": 1,
    "pricing_notes": "$75/h o por proyecto",
    "bio": "Desarrollo de software full-stack, páginas web modernas en Next.js/React, diseño UI/UX en Figma, diseño de logos e integraciones de IA."
  },
  {
    "id": "prov-consulting-01",
    "business_id": "biz-consulting-01",
    "name": "Roberto Méndez",
    "display_name": "Roberto Méndez (502 Tax & Accounting Solutions)",
    "phone": "+15025550101",
    "preferred_channel": "SMS",
    "languages": [
      "es",
      "en"
    ],
    "category": "CONSULTING_PROFESSIONAL",
    "services": [
      "TAX_PREPARATION",
      "IMMIGRATION_FORMS",
      "BUSINESS_CONSULTING",
      "NOTARY_PUBLIC",
      "TRANSLATION_SERVICES",
      "ACCOUNTING_BOOKKEEPING"
    ],
    "residential_capable": 1,
    "commercial_capable": 1,
    "license_status": "VERIFIED",
    "license_details": "Verified Louisville Business Provider",
    "base_location_name": "Preston Hwy / Okolona",
    "base_latitude": 38.151,
    "base_longitude": -85.7001,
    "max_radius_miles": 45,
    "availability_status": "AVAILABLE",
    "capacity_today": 15,
    "capacity_used_today": 0,
    "conditional_rules": {
      "default_callout_fee": 80,
      "standard_response_time_min": 20
    },
    "reliability_score": 0.98,
    "avg_response_time_sec": 25,
    "completed_connections": 50,
    "cancelled_connections": 0,
    "subscription_tier": "FOUNDING",
    "priority_score": 0.95,
    "pricing_notes": "Declaraciones desde $120 / Consultoría $80/h",
    "bio": "Preparación de impuestos personales y corporativos, ITIN number, formas de inmigración, notaría pública y contabilidad para negocios."
  },
  {
    "id": "prov-plumbing-01",
    "business_id": "biz-plumbing-01",
    "name": "José Martínez",
    "display_name": "José Martínez (Plomería Martínez)",
    "phone": "+15025550102",
    "preferred_channel": "SMS",
    "languages": [
      "es",
      "en"
    ],
    "category": "PLUMBING",
    "services": [
      "PIPE_LEAK",
      "DRAIN_CLEARING",
      "FAUCET_REPAIR",
      "WATER_HEATER",
      "TOILET_REPAIR",
      "EMERGENCY_PLUMBING"
    ],
    "residential_capable": 1,
    "commercial_capable": 1,
    "license_status": "VERIFIED",
    "license_details": "Verified Louisville Business Provider",
    "base_location_name": "Dixie Hwy / Shively",
    "base_latitude": 38.1632,
    "base_longitude": -85.8341,
    "max_radius_miles": 45,
    "availability_status": "AVAILABLE",
    "capacity_today": 15,
    "capacity_used_today": 0,
    "conditional_rules": {
      "default_callout_fee": 75,
      "standard_response_time_min": 20
    },
    "reliability_score": 0.98,
    "avg_response_time_sec": 25,
    "completed_connections": 50,
    "cancelled_connections": 0,
    "subscription_tier": "FOUNDING",
    "priority_score": 0.95,
    "pricing_notes": "Estimados claros sin sorpresas / Emergencias el mismo día",
    "bio": "Plomero certificado con más de 12 años de experiencia. Reparación de fugas, destupición de tuberías con cámara y calentadores de agua."
  },
  {
    "id": "prov-hvac-01",
    "business_id": "biz-hvac-01",
    "name": "Carlos Ruiz",
    "display_name": "Carlos Ruiz (Ruiz Climate & Air)",
    "phone": "+15025550103",
    "preferred_channel": "SMS",
    "languages": [
      "es",
      "en"
    ],
    "category": "HVAC",
    "services": [
      "AC_REPAIR",
      "HEATING_REPAIR",
      "HVAC_MAINTENANCE",
      "FREON_LEAK",
      "ICE_MACHINE",
      "COMMERCIAL_COOLING"
    ],
    "residential_capable": 1,
    "commercial_capable": 1,
    "license_status": "VERIFIED",
    "license_details": "Verified Louisville Business Provider",
    "base_location_name": "Preston Hwy / Okolona",
    "base_latitude": 38.151,
    "base_longitude": -85.7001,
    "max_radius_miles": 45,
    "availability_status": "AVAILABLE",
    "capacity_today": 15,
    "capacity_used_today": 0,
    "conditional_rules": {
      "default_callout_fee": 80,
      "standard_response_time_min": 20
    },
    "reliability_score": 0.98,
    "avg_response_time_sec": 25,
    "completed_connections": 50,
    "cancelled_connections": 0,
    "subscription_tier": "FOUNDING",
    "priority_score": 0.95,
    "pricing_notes": "Diagnóstico deducible de la reparación",
    "bio": "Diagnóstico y reparación de unidades de aire acondicionado central, recarga de freón, cuartos fríos y máquinas de hielo comerciales."
  },
  {
    "id": "prov-automotive-01",
    "business_id": "biz-automotive-01",
    "name": "Roberto González",
    "display_name": "Roberto González (502 Roadside & Tire Assistance)",
    "phone": "+15025550104",
    "preferred_channel": "SMS",
    "languages": [
      "es",
      "en"
    ],
    "category": "AUTOMOTIVE",
    "services": [
      "TIRE_CHANGE",
      "ROADSIDE_ASSISTANCE",
      "BATTERY_JUMP",
      "TOWING",
      "AUTO_LOCKOUT",
      "MOBILE_MECHANIC"
    ],
    "residential_capable": 1,
    "commercial_capable": 1,
    "license_status": "VERIFIED",
    "license_details": "Verified Louisville Business Provider",
    "base_location_name": "Dixie Hwy / Shively",
    "base_latitude": 38.1632,
    "base_longitude": -85.8341,
    "max_radius_miles": 45,
    "availability_status": "AVAILABLE",
    "capacity_today": 15,
    "capacity_used_today": 0,
    "conditional_rules": {
      "default_callout_fee": 65,
      "standard_response_time_min": 20
    },
    "reliability_score": 0.98,
    "avg_response_time_sec": 25,
    "completed_connections": 50,
    "cancelled_connections": 0,
    "subscription_tier": "FOUNDING",
    "priority_score": 0.95,
    "pricing_notes": "En camino en 15-25 minutos",
    "bio": "Cambio de gomas ponchadas en carretera, pase de corriente, grúa ligera, entrega de gasolina y auxilio vial rápido."
  },
  {
    "id": "prov-tree-01",
    "business_id": "biz-tree-01",
    "name": "Yoelvis Silva",
    "display_name": "Yoelvis Silva (Silva Tree & Yard Care)",
    "phone": "+15025550105",
    "preferred_channel": "SMS",
    "languages": [
      "es",
      "en"
    ],
    "category": "TREE_SERVICE",
    "services": [
      "TREE_REMOVAL",
      "TREE_TRIMMING",
      "LAWN_MOWING",
      "YARD_CLEANUP",
      "STUMP_GRINDING",
      "LANDSCAPING"
    ],
    "residential_capable": 1,
    "commercial_capable": 1,
    "license_status": "VERIFIED",
    "license_details": "Verified Louisville Business Provider",
    "base_location_name": "Valley Station / PRP",
    "base_latitude": 38.12,
    "base_longitude": -85.85,
    "max_radius_miles": 45,
    "availability_status": "AVAILABLE",
    "capacity_today": 15,
    "capacity_used_today": 0,
    "conditional_rules": {
      "default_callout_fee": 100,
      "standard_response_time_min": 20
    },
    "reliability_score": 0.98,
    "avg_response_time_sec": 25,
    "completed_connections": 50,
    "cancelled_connections": 0,
    "subscription_tier": "FOUNDING",
    "priority_score": 0.95,
    "pricing_notes": "Estimados gratis en sitio / Citas programadas",
    "bio": "Corte y poda de árboles peligrosos, ramas sobre techos, trituración de troncos, corte de césped y limpieza profunda de patios."
  },
  {
    "id": "prov-electrical-01",
    "business_id": "biz-electrical-01",
    "name": "Andrés Ramos",
    "display_name": "Andrés Ramos (Ramos Electric Pros)",
    "phone": "+15025550106",
    "preferred_channel": "SMS",
    "languages": [
      "es",
      "en"
    ],
    "category": "ELECTRICAL",
    "services": [
      "CIRCUIT_REPAIR",
      "BREAKER_PANEL",
      "OUTLET_INSTALL",
      "LIGHTING",
      "EMERGENCY_POWER",
      "CEILING_FAN"
    ],
    "residential_capable": 1,
    "commercial_capable": 1,
    "license_status": "VERIFIED",
    "license_details": "Verified Louisville Business Provider",
    "base_location_name": "Hurstbourne Pkwy",
    "base_latitude": 38.2185,
    "base_longitude": -85.589,
    "max_radius_miles": 45,
    "availability_status": "AVAILABLE",
    "capacity_today": 15,
    "capacity_used_today": 0,
    "conditional_rules": {
      "default_callout_fee": 90,
      "standard_response_time_min": 20
    },
    "reliability_score": 0.98,
    "avg_response_time_sec": 25,
    "completed_connections": 50,
    "cancelled_connections": 0,
    "subscription_tier": "FOUNDING",
    "priority_score": 0.95,
    "pricing_notes": "Trabajos garantizados bajo código NEC",
    "bio": "Electricista con licencia: solución de cortocircuitos, cambio de breakers, actualización de paneles eléctricos e instalación de cargadores EV."
  },
  {
    "id": "prov-roofing-01",
    "business_id": "biz-roofing-01",
    "name": "Nelson Techos y Goteras",
    "display_name": "Nelson Techos y Goteras (Nelson Roofing & Gutters)",
    "phone": "+15025550107",
    "preferred_channel": "SMS",
    "languages": [
      "es",
      "en"
    ],
    "category": "ROOFING",
    "services": [
      "ROOF_LEAK",
      "SHINGLE_REPAIR",
      "GUTTER_CLEANING",
      "STORM_DAMAGE",
      "ROOF_INSPECTION",
      "ROOF_REPLACEMENT"
    ],
    "residential_capable": 1,
    "commercial_capable": 1,
    "license_status": "VERIFIED",
    "license_details": "Verified Louisville Business Provider",
    "base_location_name": "Bardstown Rd / Highlands",
    "base_latitude": 38.225,
    "base_longitude": -85.698,
    "max_radius_miles": 45,
    "availability_status": "AVAILABLE",
    "capacity_today": 15,
    "capacity_used_today": 0,
    "conditional_rules": {
      "default_callout_fee": 90,
      "standard_response_time_min": 20
    },
    "reliability_score": 0.98,
    "avg_response_time_sec": 25,
    "completed_connections": 50,
    "cancelled_connections": 0,
    "subscription_tier": "FOUNDING",
    "priority_score": 0.95,
    "pricing_notes": "Inspección y estimados en sitio",
    "bio": "Especialista en reparación de goteras, cambio de tejas (shingles), sellado de chimeneas y limpieza/instalación de canales de aluminio."
  },
  {
    "id": "prov-handyman-01",
    "business_id": "biz-handyman-01",
    "name": "José Antonio Drywall",
    "display_name": "José Antonio Drywall (502 Drywall & Handyman)",
    "phone": "+15025550108",
    "preferred_channel": "SMS",
    "languages": [
      "es",
      "en"
    ],
    "category": "HANDYMAN",
    "services": [
      "DRYWALL_REPAIR",
      "PAINTING",
      "DOOR_REPAIR",
      "TILE_REPAIR",
      "GENERAL_FIX",
      "CARPENTRY"
    ],
    "residential_capable": 1,
    "commercial_capable": 1,
    "license_status": "VERIFIED",
    "license_details": "Verified Louisville Business Provider",
    "base_location_name": "Preston Hwy / Okolona",
    "base_latitude": 38.151,
    "base_longitude": -85.7001,
    "max_radius_miles": 45,
    "availability_status": "AVAILABLE",
    "capacity_today": 15,
    "capacity_used_today": 0,
    "conditional_rules": {
      "default_callout_fee": 75,
      "standard_response_time_min": 20
    },
    "reliability_score": 0.98,
    "avg_response_time_sec": 25,
    "completed_connections": 50,
    "cancelled_connections": 0,
    "subscription_tier": "FOUNDING",
    "priority_score": 0.95,
    "pricing_notes": "Cobro por proyecto o por día",
    "bio": "Instalación y parches de drywall (pladur), acabado de masilla nivel 5, pintura interior/exterior, pisos de vinilo LVP y reparaciones generales."
  },
  {
    "id": "prov-appliance-01",
    "business_id": "biz-appliance-01",
    "name": "Guillermo Lavadoras y Secadoras",
    "display_name": "Guillermo Lavadoras y Secadoras (502 Appliance Fix)",
    "phone": "+15025550109",
    "preferred_channel": "SMS",
    "languages": [
      "es",
      "en"
    ],
    "category": "APPLIANCE_REPAIR",
    "services": [
      "WASHER_DRYER",
      "REFRIGERATOR_REPAIR",
      "STOVE_OVEN",
      "DISHWASHER",
      "MICROWAVE"
    ],
    "residential_capable": 1,
    "commercial_capable": 1,
    "license_status": "VERIFIED",
    "license_details": "Verified Louisville Business Provider",
    "base_location_name": "Dixie Hwy / Shively",
    "base_latitude": 38.1632,
    "base_longitude": -85.8341,
    "max_radius_miles": 45,
    "availability_status": "AVAILABLE",
    "capacity_today": 15,
    "capacity_used_today": 0,
    "conditional_rules": {
      "default_callout_fee": 75,
      "standard_response_time_min": 20
    },
    "reliability_score": 0.98,
    "avg_response_time_sec": 25,
    "completed_connections": 50,
    "cancelled_connections": 0,
    "subscription_tier": "FOUNDING",
    "priority_score": 0.95,
    "pricing_notes": "Diagnóstico y piezas en el camión",
    "bio": "Reparación de lavadoras, secadoras, refrigeradores que no enfrían, estufas de gas y hornos Whirlpool, Samsung, LG, GE y Maytag."
  },
  {
    "id": "prov-cleaning-01",
    "business_id": "biz-cleaning-01",
    "name": "Yaimara Casas y Mudanzas",
    "display_name": "Yaimara Casas y Mudanzas (Derby Deep Cleaning Services)",
    "phone": "+15025550110",
    "preferred_channel": "SMS",
    "languages": [
      "es",
      "en"
    ],
    "category": "CLEANING",
    "services": [
      "HOUSE_CLEANING",
      "MOVE_OUT_CLEANING",
      "COMMERCIAL_CLEANING",
      "CARPET_CLEANING",
      "POST_CONSTRUCTION"
    ],
    "residential_capable": 1,
    "commercial_capable": 1,
    "license_status": "VERIFIED",
    "license_details": "Verified Louisville Business Provider",
    "base_location_name": "St. Matthews",
    "base_latitude": 38.2514,
    "base_longitude": -85.6425,
    "max_radius_miles": 45,
    "availability_status": "AVAILABLE",
    "capacity_today": 15,
    "capacity_used_today": 0,
    "conditional_rules": {
      "default_callout_fee": 90,
      "standard_response_time_min": 20
    },
    "reliability_score": 0.98,
    "avg_response_time_sec": 25,
    "completed_connections": 50,
    "cancelled_connections": 0,
    "subscription_tier": "FOUNDING",
    "priority_score": 0.95,
    "pricing_notes": "Citas programadas / Equipo completo",
    "bio": "Limpieza profunda de casas, apartamentos para entrega de depósitos de renta (Move-in/Move-out), lavado de alfombras y oficinas comerciales."
  },
  {
    "id": "prov-locksmith-01",
    "business_id": "biz-locksmith-01",
    "name": "Frank Cerrajería y Aperturas",
    "display_name": "Frank Cerrajería y Aperturas (502 Quick Locksmith)",
    "phone": "+15025550111",
    "preferred_channel": "SMS",
    "languages": [
      "es",
      "en"
    ],
    "category": "LOCKSMITH",
    "services": [
      "AUTO_LOCKOUT",
      "HOME_LOCKOUT",
      "REKEY",
      "DEADBOLT_INSTALL",
      "CAR_KEY_PROGRAMMING"
    ],
    "residential_capable": 1,
    "commercial_capable": 1,
    "license_status": "VERIFIED",
    "license_details": "Verified Louisville Business Provider",
    "base_location_name": "Downtown Louisville",
    "base_latitude": 38.2542,
    "base_longitude": -85.7594,
    "max_radius_miles": 45,
    "availability_status": "AVAILABLE",
    "capacity_today": 15,
    "capacity_used_today": 0,
    "conditional_rules": {
      "default_callout_fee": 75,
      "standard_response_time_min": 20
    },
    "reliability_score": 0.98,
    "avg_response_time_sec": 25,
    "completed_connections": 50,
    "cancelled_connections": 0,
    "subscription_tier": "FOUNDING",
    "priority_score": 0.95,
    "pricing_notes": "Llegada rápida en 15 a 20 minutos",
    "bio": "Apertura rápida de autos y casas sin daños, llaves adentro, cambio de combinación (rekey) e instalación de cerrojos digitales."
  },
  {
    "id": "prov-events-01",
    "business_id": "biz-events-01",
    "name": "Mayelín Cocina Criolla",
    "display_name": "Mayelín Cocina Criolla (502 Sabor Latino Catering)",
    "phone": "+15025550112",
    "preferred_channel": "SMS",
    "languages": [
      "es",
      "en"
    ],
    "category": "EVENTS_CATERING",
    "services": [
      "CATERING",
      "PHOTOGRAPHY",
      "VIDEOGRAPHY",
      "DJ_MUSIC",
      "EVENT_DECOR",
      "CAKE_BAKERY"
    ],
    "residential_capable": 1,
    "commercial_capable": 1,
    "license_status": "VERIFIED",
    "license_details": "Verified Louisville Business Provider",
    "base_location_name": "Jeffersontown (J-Town)",
    "base_latitude": 38.1945,
    "base_longitude": -85.5686,
    "max_radius_miles": 45,
    "availability_status": "AVAILABLE",
    "capacity_today": 15,
    "capacity_used_today": 0,
    "conditional_rules": {
      "default_callout_fee": 150,
      "standard_response_time_min": 20
    },
    "reliability_score": 0.98,
    "avg_response_time_sec": 25,
    "completed_connections": 50,
    "cancelled_connections": 0,
    "subscription_tier": "FOUNDING",
    "priority_score": 0.95,
    "pricing_notes": "Presupuestos por número de invitados",
    "bio": "Catering criollo para fiestas, bodas y quinces: puerco asado, congrí, yuca con mojo, buffet latino, fotografía y sonido."
  },
  {
    "id": "prov-beauty-01",
    "business_id": "biz-beauty-01",
    "name": "Yasser Barbero",
    "display_name": "Yasser Barbero (502 Master Cuban Barber Shop)",
    "phone": "+15025550113",
    "preferred_channel": "SMS",
    "languages": [
      "es",
      "en"
    ],
    "category": "BEAUTY_BARBER",
    "services": [
      "BARBER_SHOP",
      "HAIR_STYLING",
      "NAILS_SPA",
      "MAKEUP_ARTIST"
    ],
    "residential_capable": 1,
    "commercial_capable": 1,
    "license_status": "VERIFIED",
    "license_details": "Verified Louisville Business Provider",
    "base_location_name": "Preston Hwy / Okolona",
    "base_latitude": 38.151,
    "base_longitude": -85.7001,
    "max_radius_miles": 45,
    "availability_status": "AVAILABLE",
    "capacity_today": 15,
    "capacity_used_today": 0,
    "conditional_rules": {
      "default_callout_fee": 35,
      "standard_response_time_min": 20
    },
    "reliability_score": 0.98,
    "avg_response_time_sec": 25,
    "completed_connections": 50,
    "cancelled_connections": 0,
    "subscription_tier": "FOUNDING",
    "priority_score": 0.95,
    "pricing_notes": "Citas y por orden de llegada",
    "bio": "Cortes modernos degradados (fades), arreglo de barba con toalla caliente, perfilado de cejas y peinados."
  },
  {
    "id": "prov-legal-01",
    "business_id": "biz-legal-01",
    "name": "Lic. Alejandro Ramos — Abogado",
    "display_name": "Lic. Alejandro Ramos — Abogado (Bufete Legal Louisville (Abogados Hispanos))",
    "phone": "+15025550114",
    "preferred_channel": "SMS",
    "languages": [
      "es",
      "en"
    ],
    "category": "LEGAL_SERVICES",
    "services": [
      "IMMIGRATION",
      "PERSONAL_INJURY",
      "CRIMINAL",
      "FAMILY",
      "TRAFFIC_TICKET",
      "REAL_ESTATE_LEGAL",
      "LABOR_EMPLOYMENT",
      "BUSINESS_CORPORATE",
      "LEGAL_GENERAL"
    ],
    "residential_capable": 1,
    "commercial_capable": 1,
    "license_status": "VERIFIED",
    "license_details": "Verified Louisville Business Provider",
    "base_location_name": "Downtown Louisville",
    "base_latitude": 38.2542,
    "base_longitude": -85.7594,
    "max_radius_miles": 45,
    "availability_status": "AVAILABLE",
    "capacity_today": 15,
    "capacity_used_today": 0,
    "conditional_rules": {
      "default_callout_fee": 100,
      "standard_response_time_min": 20
    },
    "reliability_score": 0.98,
    "avg_response_time_sec": 25,
    "completed_connections": 50,
    "cancelled_connections": 0,
    "subscription_tier": "FOUNDING",
    "priority_score": 0.95,
    "pricing_notes": "Consulta legal en oficina / personalizada",
    "bio": "Abogado bilingüe en Louisville especializado en defensa legal, inmigración, accidentes de auto, casos familiares y defensa penal/tráfico."
  }
];

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
