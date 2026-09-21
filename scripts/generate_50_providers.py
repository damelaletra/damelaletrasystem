# -*- coding: utf-8 -*-
import json

CATEGORIES = [
    {
        "category": "PLUMBING",
        "service_types": ["PIPE_LEAK", "DRAIN_CLEARING", "FAUCET_REPAIR", "WATER_HEATER", "TOILET_REPAIR"],
        "names": [
            ("Plomería Martínez", "José Martínez", "Dixie Hwy, Shively", 38.1632, -85.8341, 80, 25),
            ("502 Quick Drain & Leak", "Carlos 'El Rápido' Plomero", "Preston Hwy, Okolona", 38.1510, -85.7001, 75, 20),
            ("Louisville Rooter Pros", "Manuel Destupiciones", "Bardstown Rd, Highlands", 38.2250, -85.6980, 85, 30),
            ("Bluegrass Master Plumbers", "Alejandro Plomería", "Hurstbourne Pkwy", 38.2185, -85.5890, 95, 35),
            ("Derby City Emergency Plumber", "David Fugas 24/7", "Downtown Louisville", 38.2542, -85.7594, 110, 20),
        ]
    },
    {
        "category": "HVAC",
        "service_types": ["AC_REPAIR", "HEATING_REPAIR", "HVAC_MAINTENANCE", "FREON_LEAK"],
        "names": [
            ("Ruiz Climate & Air", "Carlos Ruiz", "Preston Hwy, Okolona", 38.1510, -85.7001, 90, 25),
            ("502 AC & Heating Express", "Ernesto Aire Acondicionado", "Dixie Hwy, Valley Station", 38.1200, -85.8500, 85, 20),
            ("Louisville Comfort HVAC", "Javier Clima", "St. Matthews", 38.2514, -85.6425, 95, 30),
            ("Bluegrass Air & Refrigeration", "Ricardo Frío Total", "Jeffersontown", 38.1945, -85.5686, 100, 35),
            ("Fernández Commercial Cooling", "Miguel Fernández", "Downtown Louisville", 38.2542, -85.7594, 140, 40),
        ]
    },
    {
        "category": "AUTOMOTIVE",
        "service_types": ["TIRE_CHANGE", "ROADSIDE_ASSISTANCE", "BATTERY_JUMP", "TOWING", "LOCKOUT"],
        "names": [
            ("502 Roadside & Tire Assistance", "Roberto González", "Dixie Hwy & I-264", 38.1820, -85.8150, 65, 20),
            ("Louisville Mobile Gomas", "Yosvani Cambio de Gomas", "Preston Hwy", 38.1510, -85.7001, 60, 15),
            ("Quick Jump & Towing 502", "Damián Grúas", "Bardstown Rd", 38.2250, -85.6980, 75, 25),
            ("River City Roadside Rescue", "Lazaro Asistencia Vial", "Portland", 38.2675, -85.7942, 65, 20),
            ("Derby Tow & Lockout", "Osmany Remolques", "Hurstbourne Pkwy", 38.2185, -85.5890, 80, 30),
        ]
    },
    {
        "category": "TREE_SERVICE",
        "service_types": ["TREE_REMOVAL", "TREE_TRIMMING", "LAWN_MOWING", "YARD_CLEANUP", "STUMP_GRINDING"],
        "names": [
            ("Silva Tree & Yard Care", "Yoelvis Silva", "Bardstown Rd, Fern Creek", 38.1680, -85.6020, 100, 45),
            ("502 Tree Removal & Stumps", "Yunier Tala y Poda", "Dixie Hwy", 38.1632, -85.8341, 120, 35),
            ("Green Grass Lawn & Mowing", "Alexis Chapeo y Jardín", "Jeffersontown", 38.1945, -85.5686, 50, 40),
            ("Louisville Emergency Tree Cuts", "Orlando Árboles", "Shively", 38.1928, -85.8175, 110, 30),
            ("Bluegrass Landscaping Pros", "Félix Patios y Árboles", "St. Matthews", 38.2514, -85.6425, 90, 45),
        ]
    },
    {
        "category": "ELECTRICAL",
        "service_types": ["CIRCUIT_REPAIR", "BREAKER_PANEL", "OUTLET_INSTALL", "LIGHTING", "EMERGENCY_POWER"],
        "names": [
            ("Bluegrass Master Sparks", "Andrés Ramos", "Hurstbourne Pkwy", 38.2185, -85.5890, 95, 35),
            ("502 Circuit & Breaker Pro", "Eduardo Electricista", "Downtown Louisville", 38.2542, -85.7594, 90, 25),
            ("Louisville Bright Electric", "Héctor Luces y Paneles", "Preston Hwy", 38.1510, -85.7001, 85, 30),
            ("Derby Wire & Panel Pros", "Marlon Electricidad", "Dixie Hwy", 38.1632, -85.8341, 95, 25),
            ("River City Licensed Electric", "Jorge Electricista 24/7", "Portland", 38.2675, -85.7942, 105, 30),
        ]
    },
    {
        "category": "ROOFING",
        "service_types": ["ROOF_LEAK", "SHINGLE_REPAIR", "GUTTER_CLEANING", "STORM_DAMAGE", "ROOF_INSPECTION"],
        "names": [
            ("502 Master Roofing", "Nelson Techos y Goteras", "Dixie Hwy", 38.1632, -85.8341, 120, 40),
            ("Louisville Shingle & Metal Roof", "Pedro Roofing Pro", "Bardstown Rd", 38.2250, -85.6980, 130, 45),
            ("Bluegrass Gutter & Leak Repair", "Raúl Canales y Techos", "Preston Hwy", 38.1510, -85.7001, 90, 30),
            ("Derby City Storm Damage Roofing", "Yordan Techos de Emergencia", "Jeffersontown", 38.1945, -85.5686, 140, 35),
            ("River City Roof Inspections", "Iván Goteras y Techos", "Shively", 38.1928, -85.8175, 80, 25),
        ]
    },
    {
        "category": "HANDYMAN",
        "service_types": ["DRYWALL_REPAIR", "PAINTING", "DOOR_REPAIR", "TILE_REPAIR", "GENERAL_FIX"],
        "names": [
            ("José Drywall & Framing 502", "José Antonio Drywall", "Dixie Hwy", 38.1632, -85.8341, 75, 30),
            ("Louisville Pro Painting & Finishes", "Yoan Pintura y Masilla", "Bardstown Rd", 38.2250, -85.6980, 85, 40),
            ("502 General Handyman Services", "Maikel Arreglos del Hogar", "Preston Hwy", 38.1510, -85.7001, 70, 25),
            ("Bluegrass Tile & Floor Repair", "Dariel Losas y Pisos", "St. Matthews", 38.2514, -85.6425, 90, 35),
            ("Derby City Home Repairs", "Bárbaro Mantenimiento", "Downtown Louisville", 38.2542, -85.7594, 80, 30),
        ]
    },
    {
        "category": "APPLIANCE_REPAIR",
        "service_types": ["WASHER_DRYER", "REFRIGERATOR_REPAIR", "STOVE_OVEN", "DISHWASHER", "MICROWAVE"],
        "names": [
            ("502 Appliance Doctor", "Guillermo Lavadoras y Secadoras", "Preston Hwy", 38.1510, -85.7001, 75, 25),
            ("Louisville Stove & Oven Repair", "René Estufas y Hornos", "Dixie Hwy", 38.1632, -85.8341, 80, 30),
            ("Bluegrass Refrigerator Fix", "Yulieski Neveras y Frigidaires", "Bardstown Rd", 38.2250, -85.6980, 85, 35),
            ("Derby Dishwasher & Washer Care", "Camilo Electrodomésticos", "Jeffersontown", 38.1945, -85.5686, 80, 30),
            ("River City Commercial Appliances", "Orestes Equipos de Cocina", "Downtown Louisville", 38.2542, -85.7594, 110, 40),
        ]
    },
    {
        "category": "CLEANING",
        "service_types": ["HOUSE_CLEANING", "MOVE_OUT_CLEANING", "COMMERCIAL_CLEANING", "CARPET_CLEANING", "POST_CONSTRUCTION"],
        "names": [
            ("Limpieza Express 502", "Yaimara Casas y Mudanzas", "Dixie Hwy", 38.1632, -85.8341, 90, 60),
            ("Louisville Deep Clean Services", "Dayana Limpieza Profunda", "St. Matthews", 38.2514, -85.6425, 100, 60),
            ("502 Commercial Janitorial Pro", "Yadira Oficinas y Locales", "Downtown Louisville", 38.2542, -85.7594, 130, 45),
            ("Bluegrass Carpet & Window Clean", "Ariel Alfombras y Cristales", "Preston Hwy", 38.1510, -85.7001, 85, 45),
            ("Derby City Post-Construction Clean", "Marlen Limpieza Final de Obra", "Bardstown Rd", 38.2250, -85.6980, 140, 60),
        ]
    },
    {
        "category": "LOCKSMITH",
        "service_types": ["AUTO_LOCKOUT", "HOME_LOCKOUT", "REKEYING", "LOCK_INSTALLATION", "SAFE_OPENING"],
        "names": [
            ("502 Quick Locksmith", "Frank Cerrajería y Aperturas", "Dixie Hwy", 38.1632, -85.8341, 65, 20),
            ("Louisville 24/7 Mobile Key Pros", "Yoandry Llaves y Candados", "Preston Hwy", 38.1510, -85.7001, 70, 20),
            ("Bluegrass Commercial Lock & Door", "Leandro Puertas y Cerraduras", "Downtown Louisville", 38.2542, -85.7594, 90, 30),
            ("Derby City Smart Locks & Rekey", "Reinier Cerraduras Inteligentes", "Bardstown Rd", 38.2250, -85.6980, 85, 25),
            ("River City Emergency Unlock", "Alain Aperturas 24 Horas", "Hurstbourne Pkwy", 38.2185, -85.5890, 75, 25),
        ]
    }
]

USER_PHONE = "+15026587853"

businesses = []
providers = []

count = 1
for cat in CATEGORIES:
    for (biz_name, prov_name, loc_name, lat, lng, fee, eta) in cat["names"]:
        biz_id = f"biz-{count:02d}-{cat['category'].lower()}"
        prov_id = f"prov-{count:02d}-{cat['category'].lower()}"
        
        businesses.append({
            "id": biz_id,
            "name": biz_name,
            "contact_phone": USER_PHONE,
            "contact_email": f"contact@{biz_id}.com",
            "verified_status": "VERIFIED",
            "city": "Louisville",
            "state": "KY"
        })
        
        providers.append({
            "id": prov_id,
            "business_id": biz_id,
            "name": prov_name,
            "display_name": f"{prov_name} ({biz_name})",
            "phone": USER_PHONE,
            "preferred_channel": "SMS",
            "languages": ["es", "en"],
            "category": cat["category"],
            "services": cat["service_types"],
            "residential_capable": 1,
            "commercial_capable": 1 if "Commercial" in biz_name or "Oficinas" in prov_name else -1,
            "license_status": "VERIFIED",
            "license_details": f"KY State Certified / Registered #{1000 + count}",
            "base_location_name": loc_name,
            "base_latitude": lat,
            "base_longitude": lng,
            "max_radius_miles": 30.0,
            "availability_status": "AVAILABLE",
            "capacity_today": 8,
            "capacity_used_today": 0,
            "conditional_rules": {
                "default_callout_fee": fee,
                "standard_response_time_min": eta
            },
            "reliability_score": round(0.92 + (count % 8) * 0.01, 2),
            "avg_response_time_sec": eta * 2,
            "completed_connections": 15 + count * 2,
            "cancelled_connections": count % 2,
            "subscription_tier": "FOUNDING" if count % 2 == 0 else "PREMIUM",
            "priority_score": round(0.80 + (count % 15) * 0.01, 2)
        })
        count += 1

# Export JS seedData.js
js_code = f"""// Louisville, KY - 50 Founding Providers Network (All routed to {USER_PHONE} for live testing)
export const initialBusinesses = {json.dumps(businesses, indent=2, ensure_ascii=False)};

export const initialProviders = {json.dumps(providers, indent=2, ensure_ascii=False)};

export const externalPublicDirectory = [
  {{
    id: "ext-heavy-rigging-ky",
    name: "Derby City Heavy Rigging & Crane Service",
    phone: "{USER_PHONE}",
    address: "7100 Grade Ln, Louisville, KY",
    category: "CRANE_RIGGING",
    services: ["CRANE_SERVICE", "HEAVY_MACHINERY_MOVE"],
    notes: "Direct public directory listing."
  }},
  {{
    id: "ext-industrial-ice-ky",
    name: "Kentucky Industrial Ice Machine Experts",
    phone: "{USER_PHONE}",
    address: "1200 S 7th St, Louisville, KY",
    category: "INDUSTRIAL_MACHINERY",
    services: ["INDUSTRIAL_ICE_MACHINE", "AMMONIA_REFRIGERATION"],
    notes: "Direct public directory listing."
  }}
];
"""

with open("src/core/seedData.js", "w", encoding="utf-8") as f:
    f.write(js_code)

print(f"Generated 50 providers across 10 categories, all set to {USER_PHONE}!")
