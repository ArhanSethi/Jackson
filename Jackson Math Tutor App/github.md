repo: ArhanSethi/Jackson
branch: main
## Last sync
date: 2026-08-11T21:46:25Z
### Updated in this project
- Designed 6 kid-facing screens (Dashboard, Entry, Placement Quiz, Question+Canvas, Feedback correct/incorrect, Session Close-out) as one connected flow, in the bright/chunky ABCya-style requested — a visual departure from today's minimal app UI.
- Grounded in real app data: exact topic colors from src/lib/colors.ts, exact topic names from src/lib/topics.ts, exact copy strings from App.tsx/EntryScreen.tsx ("What do you want to work on?", "Quick check (1 of 2)", feedback messages, session summary template), Baloo 2 font family already used in the app, and the dot-grid canvas + colored-border treatment from DrawingCanvas.tsx.
- Added a mascot character and dashboard/placement-quiz screens, which don't exist in the current app yet.

## Screen map
| Project screen | Repo files |
|---|---|
| Dashboard | src/lib/colors.ts, src/lib/topics.ts (new screen, not yet in app) |
| Entry screen | src/components/EntryScreen.tsx |
| Placement quiz | App.tsx (placement state/copy), src/lib/placement.ts |
| Question + canvas | App.tsx, DrawingCanvas.tsx |
| Feedback correct/incorrect | App.tsx (feedback strings/emoji) |
| Session close-out | App.tsx (handleEndSession) |
