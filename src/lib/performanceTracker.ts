// In-memory only, per SPRINT.md Ticket 1.1: resets when the app restarts,
// no storage/persistence in this module itself. As of SPRINT3.md Ticket
// 3.4, App.tsx persists known-topic history to the backend and reloads it
// via seedHistory() on app start, so state survives a restart even though
// this module's own in-memory object doesn't. Dynamic topics are never
// seeded/read here for persistence purposes -- App.tsx never calls
// seedHistory/getHistory for them, only recordResult/getRecentPerformance
// (the same in-session streak mechanism dynamic topics already reuse).

const MAX_HISTORY = 5;

const history: Record<string, boolean[]> = {};

function key(topic: string): string {
  return topic.toLowerCase();
}

export function recordResult(topic: string, correct: boolean): void {
  const k = key(topic);
  const existing = history[k] ?? [];
  history[k] = [...existing, correct].slice(-MAX_HISTORY);
}

export interface RecentPerformance {
  correctStreak: number;
  incorrectStreak: number;
}

export function getRecentPerformance(topic: string): RecentPerformance {
  const results = history[key(topic)] ?? [];
  if (results.length === 0) {
    return { correctStreak: 0, incorrectStreak: 0 };
  }

  const last = results[results.length - 1];
  let streak = 0;
  for (let i = results.length - 1; i >= 0 && results[i] === last; i--) {
    streak++;
  }

  return last
    ? { correctStreak: streak, incorrectStreak: 0 }
    : { correctStreak: 0, incorrectStreak: streak };
}

// Clears a topic's history so streaks start fresh (used after a tier
// adjustment fires, so it takes a new run to trigger the next one).
export function resetTopicHistory(topic: string): void {
  delete history[key(topic)];
}

// SPRINT3.md Ticket 3.4: seeds a topic's rolling window from persisted
// data on app start, so streak computation picks up exactly where it left
// off instead of starting fresh after a reload.
export function seedHistory(topic: string, results: boolean[]): void {
  history[key(topic)] = results.slice(-MAX_HISTORY);
}

// Reads the current rolling window so it can be persisted after each
// graded answer -- the exact array getRecentPerformance() computes from,
// not a re-derived approximation of it.
export function getHistory(topic: string): boolean[] {
  return history[key(topic)] ?? [];
}
