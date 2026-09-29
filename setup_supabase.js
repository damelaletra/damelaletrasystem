import pkg from 'pg';
const { Client } = pkg;

const connectionString = "postgres://postgres:Damelaletra00%40@db.flzkesblrmtlqtdmnnpg.supabase.co:5432/postgres";

async function setup() {
  const client = new Client({ connectionString });
  await client.connect();

  const tables = [
    'providers',
    'businesses',
    'requests',
    'quotes',
    'connections',
    'external_discoveries',
    'event_logs'
  ];

  for (const table of tables) {
    const query = `
      CREATE TABLE IF NOT EXISTS ${table} (
        id TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    await client.query(query);
    console.log(`Table ${table} ensured.`);
  }

  await client.end();
}

setup().catch(console.error);
