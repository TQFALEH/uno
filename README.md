# UNO Neon Arena (Local Web App)

A polished local UNO game (2-4 players, one device) built with React + TypeScript, a pure rules engine, and animation-driven UI.

## Setup

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

Tests:

```bash
npm run test
```

## Rules Coverage

Implemented:
- 108-card UNO deck generation + Fisher-Yates shuffle
- 2-4 local players
- 7-card initial deal
- Discard pile bootstrap (initial Wild Draw 4 avoided)
- Turn order, reverse, skip
- Draw 2, Wild, Wild Draw 4
- Wild color selection modal
- Move validation by color/number/symbol/wild
- Draw only when no playable move
- Config toggle: allow immediate play of drawn card (`drawThenPlayAllowed`)
- Draw pile refill by reshuffling discard pile (keeping top discard)
- UNO call window + missed UNO penalty (+2)
- Round win at 0 cards
- Round scoring (classic per-card values)

Assumptions/config:
- `drawThenPlayAllowed`: `true` by default (toggle in UI)
- `enforceWildDrawFourLegality`: `true` in engine config
- `unoWindowMs`: `2600` ms in engine config

## Architecture

- `src/engine`: Pure game rules/state transitions (UI-agnostic)
- `src/store`: Zustand adapter dispatching engine actions with timestamps
- `src/components`: Render and interaction layer with Framer Motion
- `src/styles`: Theme tokens + responsive premium styles
- `src/engine/reducer.test.ts`: Core rules tests

This separation keeps online multiplayer integration straightforward: the engine already works as an action-based deterministic state reducer.

## Screenshot Descriptions (Expected UI)

1. **Round start**: Neon table with animated hand fan, opponent card stacks, center draw/discard piles.
2. **Wild card flow**: Dimmed overlay and animated color-picker modal.
3. **UNO pressure**: UNO warning strip and active-player glow while UNO window is open.
4. **Win moment**: Winner banner + confetti burst + updated scoreboard.

## Animation Inventory

- Dealing/entry spring for hand cards
- Draw/discard transitions with `AnimatePresence`
- Hover lift + tap compression on playable cards
- Invalid move shake
- Current-player glow ring
- Wild color modal fade+spring
- Confetti burst on win

## Accessibility

- Semantic buttons and labels
- Keyboard shortcuts:
  - `D`: draw (when legal)
  - `U`: call UNO (when available)
  - `1..9`: play Nth playable card
- High-contrast card/theme palette with dark/light readiness
