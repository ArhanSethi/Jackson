// In-memory only, per SPRINT.md Ticket 1.1: resets when the app restarts,
// no storage/persistence.

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
