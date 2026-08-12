# Jackson — Sprint: Visual Polish Catch-Up

**Why this exists:** Sprint 2 established a real visual identity (the
6-color topic system, Baloo 2 typography, rounded chunky buttons,
celebratory animations, dot-grid canvas). Everything built after that,
Sprint 3's auth/profile screens and Sprint 4's open-entry screen, was
deliberately scoped WITHOUT visual work to keep those sprints tight. The
result: the app now has a visible seam between polished and unpolished
screens. This sprint closes that gap by applying Sprint 2's already-
established design system to everything built since.

**This is not a new design direction.** Don't invent new colors, fonts,
or a new style. Reuse exactly what Sprint 2 already built and verified,
the same 6-color palette, Baloo 2 font, rounded/chunky button style,
animation patterns. The goal is consistency, not novelty.

## Design reference
Claude Design mockups (Dashboard, Entry, Placement Quiz, Question+Canvas,
Feedback correct/incorrect, Close-out) are the visual target for this
sprint. Key recurring element: a simple rounded mascot character (round
head, dot eyes, small antenna, a circular "chest" dot that changes color
to match the current topic) appears on every screen. Add this mascot
consistently across all screens in Tickets P.1-P.4 below, not just
described in prose, it's the single element tying every screen together.

### Ticket P.0 — Dashboard screen (new, not yet built anywhere)
**Context:** No dashboard/home screen currently exists, the app goes
straight from sign-in to the entry screen. The design reference shows a
genuinely useful home base: greets the student by name, shows all 6
topics as colored progress cards, plus a "+ Start something new" card
that leads into the existing open-text entry flow.

**Task:** Build a Dashboard screen shown after sign-in (before the entry
screen). Mascot greets student by name ("Hi, [name]!"). Six topic cards
in the established colors, each showing a simple progress indicator
(e.g. 3 dots, filled based on tier: 1 dot = just started, 2 = great
progress, 3 = mastered) sourced from real persisted tier data (Sprint
3's `known_topic_tiers`), not placeholder text. Tapping a topic card
goes straight to practice for that topic (skipping the entry screen).
Below the topic cards, a dashed-border "+ Start something new" card
that opens the existing free-text entry flow.

**Decide before building:** exact dot-count-to-tier mapping (recommend:
no data yet = "New — give it a try!", tier 1 = "Just started", tier 2 =
"Great progress", tier 3 = "Mastered!", matching the reference copy).

**Done when:** Dashboard shows real per-topic progress for a student
with existing tier data (verify against actual DB values), correctly
shows "New" state for topics never attempted, tapping a topic card
reaches practice directly, and "+ Start something new" reaches the
existing entry screen.

**Out of scope:** No editing/removing topics, no reordering, this is a
read-and-navigate screen only.

---

### Ticket P.1 — Sign-in / sign-up screens
**Task:** Restyle Clerk's `<SignIn />`/`<SignUp />` components (or wrap
them) to match the app's established look, Baloo 2 headings, the app's
background color, rounded input fields and buttons consistent with the
topic-button style, not Clerk's bare default styling.

**Done when:** Sign-in and sign-up screens visually match the rest of the
app, verified by direct visual comparison against a known-good screen
(e.g. the topic picker) side by side.

### Ticket P.2 — SKIPPED, not part of this sprint
**Original scope assumed a student profile creation UI exists to
restyle. It doesn't** — Sprint 3 only built silent backend auto-
provisioning (a single "Student 1" row per parent), never a screen where
a parent actually creates/names a profile or adds a sibling. Restyling
a flow that doesn't exist would mean building real new functionality,
which isn't what a visual-consistency ticket should quietly absorb.

**Deferred to a future, properly-scoped ticket**: build the actual
create/name/add-sibling profile screen (real feature work, its own
Done-when), then style it, likely in a later sprint, not bundled into
visual catch-up. Multiple-sibling support (Sprint 3's Ticket 3.0
decision) currently has no UI path to actually use it, worth prioritizing
this before Ticket 3.5's "create a second sibling profile" verification
step, which technically has no real interface to do that through either.

### Ticket P.3 — Open-entry screen (the "what do you want to work on" screen)
**Task:** This is the most visible one, it's the new first screen a
returning user sees. Restyle the text input, "Go" button, and error
states to match the topic-button aesthetic, rounded, colorful accents,
Baloo 2 headline for "What do you want to work on?", not a plain default
HTML-style input box. Error messages (backend errors, decline messages)
should render as a styled card/banner, not raw red text.

**Done when:** The entry screen visually matches the established design
system, verified by direct comparison against Sprint 2's polished
screens.

### Ticket P.4 — Consistency pass
**Task:** Click through the entire app end to end (sign-in → entry
screen → topic/profile selection → question → canvas → feedback →
session close-out) and note any remaining visual inconsistencies, spacing,
color mismatches, font fallbacks not loading, fix what's found.

**Done when:** A full walkthrough shows one consistent visual identity
throughout, no screen feels like a different, earlier version of the app.

---

## Out of scope
No new design direction, no new colors/fonts, no new animation patterns.
This is a consistency pass, not a redesign.
