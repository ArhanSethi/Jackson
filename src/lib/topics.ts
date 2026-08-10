// SPRINT4.md: the known internal topic set Jackson has tracked tier/
// practice infrastructure for. Must match server/src/claude.js's
// KNOWN_TOPICS and src/lib/colors.ts's TOPIC_COLORS keys exactly,
// including "Word Problems" using a space, not an underscore.
export const KNOWN_TOPICS = [
  'Addition',
  'Subtraction',
  'Multiplication',
  'Division',
  'Fractions',
  'Word Problems',
];

export function isKnownTopic(topic: string): boolean {
  return KNOWN_TOPICS.some((t) => t.toLowerCase() === topic.toLowerCase());
}
