// SPRINT2.md Ticket 4.1: exact palette specified by the user, one bright,
// saturated color per topic (not muted pastels).
export const TOPIC_COLORS: Record<string, string> = {
  addition: '#2E7DF0',
  subtraction: '#8B5CF6',
  multiplication: '#22C55E',
  division: '#EC4899',
  fractions: '#F97316',
  'word problems': '#14B8A6',
};

const NEUTRAL_COLOR = '#6b7280';

export function getTopicColor(topic: string | null): string {
  if (!topic) return NEUTRAL_COLOR;
  return TOPIC_COLORS[topic.toLowerCase()] ?? NEUTRAL_COLOR;
}

function clamp(n: number): number {
  return Math.max(0, Math.min(255, n));
}

function mix(hex: string, target: [number, number, number], amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const [tr, tg, tb] = target;
  const mixed = [
    clamp(Math.round(r + (tr - r) * amount)),
    clamp(Math.round(g + (tg - g) * amount)),
    clamp(Math.round(b + (tb - b) * amount)),
  ];
  return `#${mixed.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

// Darker shade for the "chunky button with depth" bottom-border effect.
export function darken(hex: string, amount: number): string {
  return mix(hex, [0, 0, 0], amount);
}

// Light tint for question-screen background accents.
export function lighten(hex: string, amount: number): string {
  return mix(hex, [255, 255, 255], amount);
}
