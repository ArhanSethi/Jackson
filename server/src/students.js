// SPRINT3.md Ticket 3.3: parent/student profile persistence.
import { getPool } from './db.js';

export async function findOrCreateParent(clerkUserId) {
  const pool = getPool();
  const existing = await pool.query(
    'SELECT id FROM parents WHERE clerk_user_id = $1',
    [clerkUserId]
  );
  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }
  const inserted = await pool.query(
    'INSERT INTO parents (clerk_user_id) VALUES ($1) RETURNING id',
    [clerkUserId]
  );
  return inserted.rows[0].id;
}

export async function listStudents(parentId) {
  const pool = getPool();
  const result = await pool.query(
    'SELECT id, name, created_at FROM students WHERE parent_id = $1 ORDER BY id ASC',
    [parentId]
  );
  return result.rows;
}

export async function createStudent(parentId, name) {
  const pool = getPool();
  const result = await pool.query(
    'INSERT INTO students (parent_id, name) VALUES ($1, $2) RETURNING id, name, created_at',
    [parentId, name]
  );
  return result.rows[0];
}

// Confirms `studentId` actually belongs to the parent identified by
// `clerkUserId` -- without this, any authenticated parent could read or
// overwrite any other family's tier data just by guessing a student ID.
export async function studentBelongsToParent(studentId, clerkUserId) {
  const pool = getPool();
  const result = await pool.query(
    `SELECT 1 FROM students s
     JOIN parents p ON p.id = s.parent_id
     WHERE s.id = $1 AND p.clerk_user_id = $2`,
    [studentId, clerkUserId]
  );
  return result.rows.length > 0;
}
