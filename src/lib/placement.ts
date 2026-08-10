// SPRINT4.md Ticket C: the 2 placement questions for a known topic with no
// tier data yet are both asked at this fixed baseline tier — difficulty
// isn't ramped between them, only the final starting tier is decided by
// placementStartingTier(). Tier 2 (middle) gives the mapping room to move
// a genuinely strong or weak first-timer to either extreme, not just up
// or down from an edge.
export const PLACEMENT_TIER = 2;

// 2-question adaptive placement result -> starting tier, independent of
// Sprint 1's streak-based bump/drop system (that takes over once real
// practice begins with a clean history). Both correct -> tier 3, both
// wrong -> tier 1, one of each -> tier 2 regardless of order.
export function placementStartingTier(answers: boolean[]): number {
  const correctCount = answers.filter(Boolean).length;
  if (correctCount === 2) return 3;
  if (correctCount === 0) return 1;
  return 2;
}
