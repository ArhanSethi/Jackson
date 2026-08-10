-- SPRINT3.md Ticket 3.3: parents (Clerk-authenticated users), students
-- (siblings linked to a parent), sessions, and answer history.
CREATE TABLE IF NOT EXISTS parents (
  id SERIAL PRIMARY KEY,
  clerk_user_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  parent_id INTEGER NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  correct_count INTEGER NOT NULL DEFAULT 0,
  total_count INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS answer_history (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  session_id INTEGER REFERENCES sessions(id) ON DELETE SET NULL,
  topic TEXT NOT NULL,
  correct BOOLEAN NOT NULL,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SPRINT3.md Ticket 3.4: this table isn't in Ticket 3.3's literal list, but
-- is required to satisfy it -- Sprint 1's tier/struggling state (App.tsx's
-- `tiers`/`struggling`) and the rolling last-5-answers streak window
-- (src/lib/performanceTracker.ts's `history`) are both *stateful current
-- values*, not something derivable by replaying `answer_history` on every
-- request (a tier bump/drop resets the streak window, so the current tier
-- can't be reconstructed purely from the raw answer log without
-- re-simulating the whole bump/drop algorithm server-side, which would
-- duplicate logic that already lives in App.tsx). Storing the actual
-- current tier/struggling/recent-results here is a direct migration of the
-- real in-memory structure, not a simplified reinterpretation of it.
--
-- Only ever written for known topics. Dynamic (novel, unlisted) topics
-- never get a row here at all -- App.tsx's `dynamicTiers` stays purely
-- in-memory and never calls the persistence endpoints backed by this
-- table, which is how Sprint4 Ticket D's "session-only, never persisted"
-- guarantee for dynamic topics carries over into the database era.
CREATE TABLE IF NOT EXISTS known_topic_tiers (
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  tier INTEGER NOT NULL DEFAULT 1,
  struggling BOOLEAN NOT NULL DEFAULT false,
  recent_results BOOLEAN[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, topic)
);
