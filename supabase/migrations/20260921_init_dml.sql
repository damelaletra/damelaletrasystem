-- ====================================================================
-- DAME LA LETRA (DML) - Master Database Migration for Supabase
-- Core Engine: PostgreSQL + PostGIS (Geo) + pgvector (Semantic)
-- Target: Louisville, Kentucky
-- ====================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. Table: businesses
CREATE TABLE IF NOT EXISTS businesses (
    id TEXT PRIMARY KEY DEFAULT ('biz-' || substr(md5(random()::text), 1, 12)),
    name TEXT NOT NULL,
    legal_name TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    tax_id TEXT,
    verified_status TEXT NOT NULL DEFAULT 'UNVERIFIED', -- VERIFIED, UNVERIFIED, EXPIRED
    city TEXT NOT NULL DEFAULT 'Louisville',
    state TEXT NOT NULL DEFAULT 'KY',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Table: providers
CREATE TABLE IF NOT EXISTS providers (
    id TEXT PRIMARY KEY DEFAULT ('prov-' || substr(md5(random()::text), 1, 12)),
    business_id TEXT REFERENCES businesses(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    preferred_channel TEXT NOT NULL DEFAULT 'WHATSAPP', -- WHATSAPP, SMS, PHONE
    languages JSONB NOT NULL DEFAULT '["es"]'::jsonb,
    category TEXT NOT NULL, -- PLUMBING, HVAC, AUTOMOTIVE, ELECTRICAL, TREE_SERVICE, etc.
    services JSONB NOT NULL DEFAULT '[]'::jsonb,
    residential_capable INT NOT NULL DEFAULT 1, -- 1 = Yes, 0 = No, -1 = UNKNOWN (UNKNOWN != NO!)
    commercial_capable INT NOT NULL DEFAULT -1, -- 1 = Yes, 0 = No, -1 = UNKNOWN
    license_status TEXT NOT NULL DEFAULT 'UNKNOWN', -- VERIFIED, UNVERIFIED, UNKNOWN, EXPIRED
    license_details TEXT,
    base_location_name TEXT NOT NULL,
    base_latitude DOUBLE PRECISION NOT NULL,
    base_longitude DOUBLE PRECISION NOT NULL,
    location_geom GEOMETRY(Point, 4326),
    max_radius_miles DOUBLE PRECISION NOT NULL DEFAULT 25.0,
    availability_status TEXT NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE, BUSY, OFF_DUTY, PAUSED
    capacity_today INT NOT NULL DEFAULT 5,
    capacity_used_today INT NOT NULL DEFAULT 0,
    conditional_rules JSONB DEFAULT '{}'::jsonb,
    reliability_score DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    avg_response_time_sec INT NOT NULL DEFAULT 60,
    completed_connections INT NOT NULL DEFAULT 0,
    cancelled_connections INT NOT NULL DEFAULT 0,
    subscription_tier TEXT NOT NULL DEFAULT 'FOUNDING', -- FREE, FOUNDING, PREMIUM
    priority_score DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    embedding VECTOR(1536), -- For pgvector semantic matching
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_providers_category ON providers(category);
CREATE INDEX IF NOT EXISTS idx_providers_phone ON providers(phone);
CREATE INDEX IF NOT EXISTS idx_providers_geom ON providers USING GIST(location_geom);

-- Trigger to keep location_geom updated from lat/lng
CREATE OR REPLACE FUNCTION update_provider_geom()
RETURNS TRIGGER AS $$
BEGIN
    NEW.location_geom := ST_SetSRID(ST_MakePoint(NEW.base_longitude, NEW.base_latitude), 4326);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_providers_geom ON providers;
CREATE TRIGGER trg_providers_geom
BEFORE INSERT OR UPDATE OF base_latitude, base_longitude ON providers
FOR EACH ROW EXECUTE FUNCTION update_provider_geom();

-- 4. Table: requests (Core Customer Request Entity)
CREATE TABLE IF NOT EXISTS requests (
    id TEXT PRIMARY KEY DEFAULT ('req-' || substr(md5(random()::text), 1, 16)),
    channel TEXT NOT NULL DEFAULT 'SMS', -- WHATSAPP, SMS, PHONE, WEB
    conversation_reference TEXT NOT NULL, -- Phone number or web session ID
    language TEXT NOT NULL DEFAULT 'es',
    raw_message TEXT NOT NULL,
    normalized_intent TEXT,
    service_category TEXT,
    service_type TEXT,
    description TEXT,
    location_raw TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    location_geom GEOMETRY(Point, 4326),
    property_type TEXT NOT NULL DEFAULT 'UNKNOWN', -- RESIDENTIAL, COMMERCIAL, UNKNOWN
    urgency TEXT NOT NULL DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, EMERGENCY
    preferred_time TEXT,
    customer_constraints JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'NEW',
    matched_provider_id TEXT REFERENCES providers(id),
    candidate_provider_ids JSONB DEFAULT '[]'::jsonb,
    contacted_provider_ids JSONB DEFAULT '[]'::jsonb,
    cascade_step INT NOT NULL DEFAULT 0,
    cascade_expires_at TIMESTAMPTZ,
    quoted_price NUMERIC(10,2),
    estimated_arrival TEXT,
    customer_confirmation INT DEFAULT 0,
    connection_status TEXT NOT NULL DEFAULT 'NOT_STARTED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_conv_ref ON requests(conversation_reference);

-- 5. Table: quotes
CREATE TABLE IF NOT EXISTS quotes (
    id TEXT PRIMARY KEY DEFAULT ('quote-' || substr(md5(random()::text), 1, 12)),
    request_id TEXT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    quoted_price NUMERIC(10,2) NOT NULL,
    estimated_arrival TEXT NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, ACCEPTED, DECLINED, EXPIRED
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- 6. Table: connections
CREATE TABLE IF NOT EXISTS connections (
    id TEXT PRIMARY KEY DEFAULT ('conn-' || substr(md5(random()::text), 1, 12)),
    request_id TEXT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    channel TEXT NOT NULL DEFAULT 'SMS',
    customer_contact TEXT NOT NULL,
    provider_contact TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'CONNECTED', -- CONNECTED, COMPLETED, DISPUTED
    connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 7. Table: external_discoveries (Transparent Fallback for Unserved Gaps)
CREATE TABLE IF NOT EXISTS external_discoveries (
    id TEXT PRIMARY KEY DEFAULT ('ext-' || substr(md5(random()::text), 1, 12)),
    request_id TEXT REFERENCES requests(id) ON DELETE SET NULL,
    business_name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    service_indicated TEXT,
    source TEXT NOT NULL DEFAULT 'PUBLIC_DIRECTORY',
    distance_miles DOUBLE PRECISION,
    disclaimer_sent INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Table: event_logs (Observability & North Star Metric Tracking)
CREATE TABLE IF NOT EXISTS event_logs (
    id TEXT PRIMARY KEY DEFAULT ('ev-' || substr(md5(random()::text), 1, 16)),
    request_id TEXT REFERENCES requests(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    actor TEXT NOT NULL, -- CUSTOMER, PROVIDER, SYSTEM, OPERATOR
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_logs_request ON event_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_event_logs_type ON event_logs(event_type);

-- 9. Seed Founding Louisville Network
INSERT INTO businesses (id, name, contact_phone, verified_status, city, state) VALUES
('biz-martinez-plumbing', 'Plomería Martínez LLC', '+15025550192', 'VERIFIED', 'Louisville', 'KY'),
('biz-ruiz-hvac', 'Ruiz Climate & Air Solutions', '+15025550183', 'VERIFIED', 'Louisville', 'KY'),
('biz-fernandez-commercial', 'Fernández Commercial Refrigeration', '+15025550174', 'VERIFIED', 'Louisville', 'KY'),
('biz-towing-502', '502 Roadside & Tire Assistance', '+15025550165', 'VERIFIED', 'Louisville', 'KY'),
('biz-silva-tree', 'Silva Tree & Yard Care', '+15025550156', 'UNVERIFIED', 'Louisville', 'KY'),
('biz-bluegrass-electric', 'Bluegrass Master Sparks', '+15025550147', 'VERIFIED', 'Louisville', 'KY')
ON CONFLICT (id) DO NOTHING;

INSERT INTO providers (
    id, business_id, name, display_name, phone, preferred_channel, languages,
    category, services, residential_capable, commercial_capable, license_status,
    license_details, base_location_name, base_latitude, base_longitude, max_radius_miles,
    capacity_today, reliability_score, subscription_tier, priority_score
) VALUES
('prov-jose-martinez', 'biz-martinez-plumbing', 'José Martínez', 'José (Plomero)', '+15025550192', 'WHATSAPP', '["es", "en"]'::jsonb, 'PLUMBING', '["PIPE_LEAK", "DRAIN_CLEARING", "FAUCET_REPAIR", "WATER_HEATER"]'::jsonb, 1, -1, 'VERIFIED', 'KY Journeyman Plumber #JP-84920', 'Dixie Hwy, Shively', 38.1632, -85.8341, 25.0, 4, 0.98, 'FOUNDING', 0.85),
('prov-carlos-ruiz', 'biz-ruiz-hvac', 'Carlos Ruiz', 'Carlos (HVAC / Aire)', '+15025550183', 'WHATSAPP', '["es", "en"]'::jsonb, 'HVAC', '["AC_REPAIR", "HEATING_REPAIR", "HVAC_MAINTENANCE"]'::jsonb, 1, 1, 'VERIFIED', 'KY Master HVAC #HM-39201', 'Preston Hwy, Okolona', 38.1510, -85.7001, 30.0, 5, 0.95, 'PREMIUM', 0.95),
('prov-miguel-fernandez', 'biz-fernandez-commercial', 'Miguel Fernández', 'Miguel (Refrigeración Comercial)', '+15025550174', 'WHATSAPP', '["es", "en"]'::jsonb, 'HVAC', '["AC_REPAIR", "COMMERCIAL_REFRIGERATION", "ICE_MACHINE"]'::jsonb, 0, 1, 'VERIFIED', 'EPA Universal & KY HVAC #HM-44019', 'Downtown Louisville', 38.2542, -85.7594, 35.0, 3, 0.92, 'PREMIUM', 0.90),
('prov-roberto-gonzalez', 'biz-towing-502', 'Roberto González', 'Roberto (Gomas & Grúa 502)', '+15025550165', 'WHATSAPP', '["es", "en"]'::jsonb, 'AUTOMOTIVE', '["TIRE_CHANGE", "ROADSIDE_ASSISTANCE", "BATTERY_JUMP", "TOWING"]'::jsonb, 1, 1, 'VERIFIED', 'DOT & KY Towing Lic #TW-1029', 'Dixie Hwy & I-264', 38.1820, -85.8150, 25.0, 8, 0.99, 'FOUNDING', 0.90),
('prov-yoelvis-silva', 'biz-silva-tree', 'Yoelvis Silva', 'Yoelvis (Árboles & Jardinería)', '+15025550156', 'SMS', '["es"]'::jsonb, 'TREE_SERVICE', '["TREE_REMOVAL", "TREE_TRIMMING", "LAWN_MOWING"]'::jsonb, 1, 1, 'UNVERIFIED', 'Insured / Local Registered', 'Bardstown Rd, Fern Creek', 38.1680, -85.6020, 20.0, 2, 0.91, 'FREE', 0.40),
('prov-andres-electric', 'biz-bluegrass-electric', 'Andrés Ramos', 'Andrés (Electricista Master)', '+15025550147', 'WHATSAPP', '["es", "en"]'::jsonb, 'ELECTRICAL', '["CIRCUIT_REPAIR", "BREAKER_PANEL", "OUTLET_INSTALL"]'::jsonb, 1, 1, 'VERIFIED', 'KY Master Electrician #ME-51920', 'Hurstbourne Pkwy', 38.2185, -85.5890, 30.0, 4, 0.96, 'FOUNDING', 0.88)
ON CONFLICT (id) DO NOTHING;
