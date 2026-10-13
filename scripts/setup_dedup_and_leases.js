import pkg from 'pg';
const { Client } = pkg;

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:Damelaletra00%40@db.flzkesblrmtlqtdmnnpg.supabase.co:5432/postgres';

async function setupTables() {
  console.log('[MIGRATION] Connecting to Supabase Postgres...');
  const client = new Client({ connectionString });
  await client.connect();

  console.log('[MIGRATION] Creating webhook_dedup table...');
  await client.query(`
    CREATE TABLE IF NOT EXISTS webhook_dedup (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL DEFAULT 'twilio',
      payload JSONB DEFAULT '{}'::jsonb,
      expires_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_webhook_dedup_expires ON webhook_dedup(expires_at);
  `);
  console.log('[MIGRATION] webhook_dedup table ensured.');

  console.log('[MIGRATION] Creating capacity_leases table...');
  await client.query(`
    CREATE TABLE IF NOT EXISTS capacity_leases (
      provider_id TEXT PRIMARY KEY,
      request_id TEXT NOT NULL,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_capacity_leases_expires ON capacity_leases(expires_at);
    CREATE INDEX IF NOT EXISTS idx_capacity_leases_request ON capacity_leases(request_id);
  `);
  console.log('[MIGRATION] capacity_leases table ensured.');

  await client.end();
  console.log('[MIGRATION] All tables ensured successfully!');
}

setupTables().catch(err => {
  console.error('[MIGRATION] Error:', err);
  process.exit(1);
});
