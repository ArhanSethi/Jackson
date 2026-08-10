// SPRINT3.md Ticket 3.3/3.4: Postgres connection. Lazily initialized (same
// pattern as claude.js's getApiKey()) so routes that don't touch the
// database aren't affected if DATABASE_URL is ever unset.
import pg from 'pg';

const { Pool } = pg;

let pool;

export function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set');
    }
    pool = new Pool({ connectionString });
  }
  return pool;
}
