// SPRINT3.md Ticket 3.3: applies schema.sql. Idempotent (CREATE TABLE IF
// NOT EXISTS), safe to re-run.
import 'dotenv/config';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { getPool } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const sql = readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  const pool = getPool();
  await pool.query(sql);
  console.log('Migration applied.');
  await pool.end();
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
