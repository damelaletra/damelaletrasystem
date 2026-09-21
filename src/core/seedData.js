// Louisville, KY - 10 Founding Verified Providers (1 per key category, all routed to +15026587853 for testing)
export const initialBusinesses = [
  {
    "id": "biz-01-plumbing",
    "name": "Plomería Martínez",
    "contact_phone": "+15026587853",
    "contact_email": "contacto@plomeriamartinez.com",
    "verified_status": "VERIFIED",
    "city": "Louisville",
    "state": "KY"
  },
  {
    "id": "biz-02-hvac",
    "name": "Ruiz Climate & Air",
    "contact_phone": "+15026587853",
    "contact_email": "contacto@ruizclimate.com",
    "verified_status": "VERIFIED",
    "city": "Louisville",
    "state": "KY"
  },
  {
    "id": "biz-03-automotive",
    "name": "502 Roadside & Tire Assistance",
    "contact_phone": "+15026587853",
    "contact_email": "contacto@502roadside.com",
    "verified_status": "VERIFIED",
    "city": "Louisville",
    "state": "KY"
  },
  {
    "id": "biz-04-tree",
    "name": "Silva Tree & Yard Care",
    "contact_phone": "+15026587853",
    "contact_email": "contacto@silvatreecare.com",
    "verified_status": "VERIFIED",
    "city": "Louisville",
    "state": "KY"
  },
  {
    "id": "biz-05-electrical",
    "name": "Ramos Electric Pros",
    "contact_phone": "+15026587853",
    "contact_email": "contacto@ramoselectric.com",
    "verified_status": "VERIFIED",
    "city": "Louisville",
    "state": "KY"
  },
  {
    "id": "biz-06-roofing",
    "name": "Nelson Roofing & Gutters",
    "contact_phone": "+15026587853",
    "contact_email": "contacto@nelsonroofing.com",
    "verified_status": "VERIFIED",
    "city": "Louisville",
    "state": "KY"
  },
  {
    "id": "biz-07-handyman",
    "name": "502 Drywall & Handyman",
    "contact_phone": "+15026587853",
    "contact_email": "contacto@502drywall.com",
    "verified_status": "VERIFIED",
    "city": "Louisville",
    "state": "KY"
  },
  {
    "id": "biz-08-appliance",
    "name": "502 Appliance Fix",
    "contact_phone": "+15026587853",
    "contact_email": "contacto@502appliance.com",
    "verified_status": "VERIFIED",
    "city": "Louisville",
    "state": "KY"
  },
  {
    "id": "biz-09-cleaning",
    "name": "Derby Deep Cleaning Services",
    "contact_phone": "+15026587853",
    "contact_email": "contacto@derbycleaning.com",
    "verified_status": "VERIFIED",
    "city": "Louisville",
    "state": "KY"
  },
  {
    "id": "biz-10-locksmith",
    "name": "502 Quick Locksmith",
    "contact_phone": "+15026587853",
    "contact_email": "contacto@502locksmith.com",
    "verified_status": "VERIFIED",
    "city": "Louisville",
    "state": "KY"
  }
];

export const initialProviders = [
  {
    "id": "prov-01-plumbing",
    "business_id": "biz-01-plumbing",
    "name": "José Martínez",
    "display_name": "José Martínez (Plomería Martínez)",
    "phone": "+15026587853",
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
      "TOILET_REPAIR"
    ],
    "residential_capable": 1,
    "commercial_capable": -1,
    "license_status": "VERIFIED",
    "license_details": "KY Master Plumber #1001",
    "base_location_name": "Dixie Hwy / Shively",
    "base_latitude": 38.1632,
    "base_longitude": -85.8341,
    "max_radius_miles": 35,
    "availability_status": "AVAILABLE",
    "capacity_today": 10,
    "capacity_used_today": 0,
    "conditional_rules": {
      "default_callout_fee": 75,
      "standard_response_time_min": 25
    },
    "reliability_score": 0.95,
    "avg_response_time_sec": 45,
    "completed_connections": 48,
    "cancelled_connections": 0,
    "subscription_tier": "FOUNDING",
    "priority_score": 0.9
  },
  {
    "id": "prov-02-hvac",
    "business_id": "biz-02-hvac",
    "name": "Carlos Ruiz",
    "display_name": "Carlos Ruiz (Ruiz Climate & Air)",
    "phone": "+15026587853",
    "preferred_channel": "SMS",
    "languages": [
      "es",
      "en"
    ],
    "category": "HVAC",
    "services": [
      "AC_REPAIR",
      "HEATING_REPAIR",
      "ICE_MACHINE",
      "COMMERCIAL_REFRIGERATION",
      "MAINTENANCE"
    ],
    "residential_capable": 1,
    "commercial_capable": 1,
    "license_status": "VERIFIED",
    "license_details": "KY HVAC Journeyman #2001",
    "base_location_name": "Preston Hwy / Okolona",
    "base_latitude": 38.151,
    "base_longitude": -85.7001,
    "max_radius_miles": 35,
    "availability_status": "AVAILABLE",
    "capacity_today": 10,
    "capacity_used_today": 0,
    "conditional_rules": {
      "default_callout_fee": 85,
      "standard_response_time_min": 30
    },
    "reliability_score": 0.96,
    "avg_response_time_sec": 40,
    "completed_connections": 52,
    "cancelled_connections": 0,
    "subscription_tier": "FOUNDING",
    "priority_score": 0.92
  },
  {
    "id": "prov-03-automotive",
    "business_id": "biz-03-automotive",
    "name": "Roberto González",
    "display_name": "Roberto González (502 Roadside & Tire)",
    "phone": "+15026587853",
    "preferred_channel": "SMS",
    "languages": [
      "es",
      "en"
    ],
    "category": "AUTOMOTIVE",
    "services": [
      "TIRE_CHANGE",
      "TOWING",
      "BATTERY_JUMP",
      "LOCKOUT",
      "FUEL_DELIVERY"
    ],
    "residential_capable": 1,
    "commercial_capable": 1,
    "license_status": "VERIFIED",
    "license_details": "KY Commercial Roadside #3001",
    "base_location_name": "Dixie Hwy / PRP",
    "base_latitude": 38.1632,
    "base_longitude": -85.8341,
    "max_radius_miles": 35,
    "availability_status": "AVAILABLE",
    "capacity_today": 12,
    "capacity_used_today": 0,
    "conditional_rules": {
      "default_callout_fee": 65,
      "standard_response_time_min": 20
    },
    "reliability_score": 0.97,
    "avg_response_time_sec": 35,
    "completed_connections": 64,
    "cancelled_connections": 0,
    "subscription_tier": "FOUNDING",
    "priority_score": 0.94
  },
  {
    "id": "prov-04-tree",
    "business_id": "biz-04-tree",
    "name": "Yoelvis Silva",
    "display_name": "Yoelvis Silva (Silva Tree & Yard Care)",
    "phone": "+15026587853",
    "preferred_channel": "SMS",
    "languages": [
      "es",
      "en"
    ],
    "category": "TREE_SERVICE",
    "services": [
      "TREE_REMOVAL",
      "TREE_TRIMMING",
      "STUMP_GRINDING",
      "LAWN_MOWING",
      "YARD_CLEANUP"
    ],
    "residential_capable": 1,
    "commercial_capable": 1,
    "license_status": "VERIFIED",
    "license_details": "KY Certified Arborist #4001",
    "base_location_name": "Bardstown Rd / Fern Creek",
    "base_latitude": 38.225,
    "base_longitude": -85.698,
    "max_radius_miles": 35,
    "availability_status": "AVAILABLE",
    "capacity_today": 8,
    "capacity_used_today": 0,
    "conditional_rules": {
      "default_callout_fee": 100,
      "standard_response_time_min": 35
    },
    "reliability_score": 0.93,
    "avg_response_time_sec": 50,
    "completed_connections": 39,
    "cancelled_connections": 1,
    "subscription_tier": "FOUNDING",
    "priority_score": 0.88
  },
  {
    "id": "prov-05-electrical",
    "business_id": "biz-05-electrical",
    "name": "Andrés Ramos",
    "display_name": "Andrés Ramos (Ramos Electric Pros)",
    "phone": "+15026587853",
    "preferred_channel": "SMS",
    "languages": [
      "es",
      "en"
    ],
    "category": "ELECTRICAL",
    "services": [
      "CIRCUIT_REPAIR",
      "PANEL_UPGRADE",
      "LIGHTING_INSTALL",
      "BREAKER_REPLACE",
      "OUTLET_REPAIR"
    ],
    "residential_capable": 1,
    "commercial_capable": 1,
    "license_status": "VERIFIED",
    "license_details": "KY Master Electrician #5001",
    "base_location_name": "Hurstbourne Pkwy / J-Town",
    "base_latitude": 38.2185,
    "base_longitude": -85.589,
    "max_radius_miles": 35,
    "availability_status": "AVAILABLE",
    "capacity_today": 10,
    "capacity_used_today": 0,
    "conditional_rules": {
      "default_callout_fee": 85,
      "standard_response_time_min": 30
    },
    "reliability_score": 0.95,
    "avg_response_time_sec": 40,
    "completed_connections": 45,
    "cancelled_connections": 0,
    "subscription_tier": "FOUNDING",
    "priority_score": 0.91
  },
  {
    "id": "prov-06-roofing",
    "business_id": "biz-06-roofing",
    "name": "Nelson Techos y Goteras",
    "display_name": "Nelson Techos (Nelson Roofing & Gutters)",
    "phone": "+15026587853",
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
      "EMERGENCY_TARP",
      "ROOF_INSPECTION"
    ],
    "residential_capable": 1,
    "commercial_capable": 1,
    "license_status": "VERIFIED",
    "license_details": "KY Roofing Contractor #6001",
    "base_location_name": "Shively / Dixie Hwy",
    "base_latitude": 38.1928,
    "base_longitude": -85.8175,
    "max_radius_miles": 35,
    "availability_status": "AVAILABLE",
    "capacity_today": 8,
    "capacity_used_today": 0,
    "conditional_rules": {
      "default_callout_fee": 95,
      "standard_response_time_min": 35
    },
    "reliability_score": 0.94,
    "avg_response_time_sec": 45,
    "completed_connections": 41,
    "cancelled_connections": 0,
    "subscription_tier": "FOUNDING",
    "priority_score": 0.89
  },
  {
    "id": "prov-07-handyman",
    "business_id": "biz-07-handyman",
    "name": "José Antonio Drywall",
    "display_name": "José Antonio Drywall (502 Handyman)",
    "phone": "+15026587853",
    "preferred_channel": "SMS",
    "languages": [
      "es",
      "en"
    ],
    "category": "HANDYMAN",
    "services": [
      "DRYWALL_REPAIR",
      "PAINTING",
      "TILE_REPAIR",
      "DOOR_INSTALL",
      "GENERAL_REPAIRS"
    ],
    "residential_capable": 1,
    "commercial_capable": -1,
    "license_status": "VERIFIED",
    "license_details": "KY General Contractor #7001",
    "base_location_name": "Downtown / West End",
    "base_latitude": 38.2542,
    "base_longitude": -85.7594,
    "max_radius_miles": 35,
    "availability_status": "AVAILABLE",
    "capacity_today": 10,
    "capacity_used_today": 0,
    "conditional_rules": {
      "default_callout_fee": 65,
      "standard_response_time_min": 30
    },
    "reliability_score": 0.95,
    "avg_response_time_sec": 40,
    "completed_connections": 55,
    "cancelled_connections": 0,
    "subscription_tier": "FOUNDING",
    "priority_score": 0.9
  },
  {
    "id": "prov-08-appliance",
    "business_id": "biz-08-appliance",
    "name": "Guillermo Lavadoras y Secadoras",
    "display_name": "Guillermo (502 Appliance Fix)",
    "phone": "+15026587853",
    "preferred_channel": "SMS",
    "languages": [
      "es",
      "en"
    ],
    "category": "APPLIANCE_REPAIR",
    "services": [
      "WASHER_DRYER",
      "REFRIGERATOR_REPAIR",
      "STOVE_OVEN_REPAIR",
      "DISHWASHER_REPAIR",
      "MICROWAVE_REPAIR"
    ],
    "residential_capable": 1,
    "commercial_capable": 1,
    "license_status": "VERIFIED",
    "license_details": "KY Appliance Tech #8001",
    "base_location_name": "Preston Hwy / New Cut",
    "base_latitude": 38.151,
    "base_longitude": -85.7001,
    "max_radius_miles": 35,
    "availability_status": "AVAILABLE",
    "capacity_today": 10,
    "capacity_used_today": 0,
    "conditional_rules": {
      "default_callout_fee": 70,
      "standard_response_time_min": 30
    },
    "reliability_score": 0.94,
    "avg_response_time_sec": 45,
    "completed_connections": 49,
    "cancelled_connections": 0,
    "subscription_tier": "FOUNDING",
    "priority_score": 0.89
  },
  {
    "id": "prov-09-cleaning",
    "business_id": "biz-09-cleaning",
    "name": "Yaimara Casas y Mudanzas",
    "display_name": "Yaimara (Derby Deep Cleaning)",
    "phone": "+15026587853",
    "preferred_channel": "SMS",
    "languages": [
      "es",
      "en"
    ],
    "category": "CLEANING",
    "services": [
      "HOUSE_CLEANING",
      "DEEP_CLEANING",
      "MOVE_OUT_CLEANING",
      "OFFICE_CLEANING",
      "CARPET_CLEANING"
    ],
    "residential_capable": 1,
    "commercial_capable": 1,
    "license_status": "VERIFIED",
    "license_details": "KY Cleaning Registered #9001",
    "base_location_name": "St. Matthews / Middletown",
    "base_latitude": 38.2514,
    "base_longitude": -85.6425,
    "max_radius_miles": 35,
    "availability_status": "AVAILABLE",
    "capacity_today": 8,
    "capacity_used_today": 0,
    "conditional_rules": {
      "default_callout_fee": 90,
      "standard_response_time_min": 40
    },
    "reliability_score": 0.96,
    "avg_response_time_sec": 40,
    "completed_connections": 58,
    "cancelled_connections": 0,
    "subscription_tier": "FOUNDING",
    "priority_score": 0.92
  },
  {
    "id": "prov-10-locksmith",
    "business_id": "biz-10-locksmith",
    "name": "Frank Cerrajería y Aperturas",
    "display_name": "Frank Cerrajería (502 Quick Locksmith)",
    "phone": "+15026587853",
    "preferred_channel": "SMS",
    "languages": [
      "es",
      "en"
    ],
    "category": "LOCKSMITH",
    "services": [
      "AUTO_LOCKOUT",
      "HOME_LOCKOUT",
      "REKEYING",
      "LOCK_INSTALLATION",
      "SAFE_OPENING"
    ],
    "residential_capable": 1,
    "commercial_capable": 1,
    "license_status": "VERIFIED",
    "license_details": "KY Certified Locksmith #10001",
    "base_location_name": "St. Matthews / Mall Area",
    "base_latitude": 38.2514,
    "base_longitude": -85.6425,
    "max_radius_miles": 35,
    "availability_status": "AVAILABLE",
    "capacity_today": 12,
    "capacity_used_today": 0,
    "conditional_rules": {
      "default_callout_fee": 60,
      "standard_response_time_min": 20
    },
    "reliability_score": 0.98,
    "avg_response_time_sec": 30,
    "completed_connections": 72,
    "cancelled_connections": 0,
    "subscription_tier": "FOUNDING",
    "priority_score": 0.95
  }
];

export const externalPublicDirectory = [
  {
    "id": "ext-heavy-rigging-ky",
    "name": "Derby City Heavy Rigging & Crane Service",
    "phone": "+15026587853",
    "address": "7100 Grade Ln, Louisville, KY",
    "category": "CRANE_RIGGING",
    "services": [
      "CRANE_SERVICE",
      "HEAVY_MACHINERY_MOVE"
    ],
    "notes": "Direct public directory listing."
  },
  {
    "id": "ext-industrial-ice-ky",
    "name": "Kentucky Industrial Ice Machine Experts",
    "phone": "+15026587853",
    "address": "1200 S 7th St, Louisville, KY",
    "category": "INDUSTRIAL_MACHINERY",
    "services": [
      "INDUSTRIAL_ICE_MACHINE",
      "AMMONIA_REFRIGERATION"
    ],
    "notes": "Direct public directory listing."
  }
];
