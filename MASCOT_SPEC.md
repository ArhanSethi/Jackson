# Mascot Component — Exact Spec

Create `src/components/Mascot.tsx`. This is a single reusable SVG-based
component, no external image assets, no illustration library.

## Props

```ts
type MascotProps = {
  color: string; // hex, matches the current topic color from colors.ts
  size?: number; // default 80
};
```

## Structure (SVG, viewBox 0 0 100 100)
- **Head**: white rounded rectangle (rx 24), centered, roughly 60x60, dark navy stroke (#1E293B or similar, matching existing text color), stroke width 3.
- **Antenna**: small vertical line from top-center of head, topped with a small filled circle in the `color` prop.
- **Eyes**: two small filled dark navy circles, simple dots, no pupils/detail beyond that.
- **Mouth**: simple curved line (smile), dark navy stroke.
- **Cheeks**: two small filled pink circles (#FFB6C1 or similar), purely decorative, fixed color regardless of `color` prop.
- **Body**: white rounded rectangle below the head, smaller, with a centered filled circle in the `color` prop (the "chest dot" that changes per topic), dark navy stroke matching the head.
- **Arms**: two small rounded rectangles or capsule shapes extending from the body sides, same stroke style.

## Usage
Import and render `<Mascot color={topicColor} />` on every screen that currently or will show the mascot: Dashboard, Entry screen, Placement Quiz, Question+Canvas, Feedback (correct/incorrect), Session Close-out. `topicColor` comes from the same `colors.ts` values already used for topic buttons/headers, don't hardcode a separate color set.

## Done when
`<Mascot color="#2E7DF0" />` and `<Mascot color="#EC4899" />` render visibly different chest-dot and antenna-tip colors, everything else (head, eyes, cheeks, mouth, stroke) identical between them. Renders correctly at the sizes used across all 6 screens without visual distortion.
