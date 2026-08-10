// SPRINT3.md Ticket 3.4: known-topic tier/streak persistence. Never called
// for dynamic topics -- see schema.sql's comment on known_topic_tiers.
import { getPool } from './db.js';

const MAX_RECENT_RESULTS = 5;

export async function getKnownTopicTiers(studentId) {
  const pool = getPool();
  const result = await pool.query(
    'SELECT topic, tier, struggling, recent_results FROM known_topic_tiers WHERE student_id = $1',
    [studentId]
  );
  const tiers = {};
  const struggling = {};
  const recentResults = {};
  for (const row of result.rows) {
    tiers[row.topic] = row.tier;
    struggling[row.topic] = row.struggling;
    recentResults[row.topic] = row.recent_results;
  }
  return { tiers, struggling, recentResults };
}

export async function upsertKnownTopicTier(studentId, topic, { tier, struggling, recentResults }) {
  const pool = getPool();
  await pool.query(
    `INSERT INTO known_topic_tiers (student_id, topic, tier, struggling, recent_results, updated_at)
     VALUES ($1, $2, $3, $4, $5, now())
     ON CONFLICT (student_id, topic)
     DO UPDATE SET tier = $3, struggling = $4, recent_results = $5, updated_at = now()`,
    [studentId, topic, tier, struggling, recentResults.slice(-MAX_RECENT_RESULTS)]
  );
}
