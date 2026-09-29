import pkg from 'pg';
const { Client } = pkg;
const connectionString = 'postgres://postgres:Damelaletra00%40@db.flzkesblrmtlqtdmnnpg.supabase.co:5432/postgres';

async function setup() {
  const client = new Client({ connectionString });
  await client.connect();

  const query = `CREATE TABLE IF NOT EXISTS affiliates (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`;
  await client.query(query);
  console.log('Table affiliates ensured.');
  await client.end();
}
setup().catch(console.error);
