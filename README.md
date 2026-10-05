# impact-velocity-gauntlet

Impact Velocity has two modes behind a mode selector:
- **Impact:** the original arena FPS against bots. This is the legacy game, unchanged.
- **Velocity:** an endless gauntlet run, being built slice by slice (see `docs/design.md`).

## Run
Requires Node 20.19 or later.

```sh
npm ci
npm run dev        # http://localhost:5173 opens the mode selector
```

## Test and build
```sh
npm run typecheck  # TypeScript (Velocity, shared code)
npm test           # unit tests (vitest)
npm run build      # production build into dist/
npx playwright install chromium   # once
npm run test:e2e   # smoke tests + Impact-vs-legacy parity (builds first)
```

## Velocity
Click to play (the mouse is captured); Esc pauses. WASD move, Shift sprint, Space jump, C or Ctrl crouch and slide. Jump along a wall at speed to wall-run; press Space again to wall-jump.

The simulation (`src/sim/`) runs on a fixed 60 Hz step and is deterministic: a list of per-tick inputs replayed from spawn always gives bit-identical state.
- `tests/replays/*.json` are golden replays. Each stores its inputs plus a hash of the final state and a hash of the state after every tick.
- After a deliberate change to movement tuning or the sandbox, re-record them with `UPDATE_REPLAYS=1 npm test`. Then review the milestone checks in `tests/unit/replay.test.js`, which confirm each replay still wall-runs, slides, respawns and so on.
- Open `velocity.html?debug` to get `window.__velocity.capture()`, which returns the session's recorded inputs and exact state.
- Determinism is verified in V8 (Chrome and Node). Other engines may compute `Math.sin`/`Math.cos` differently, so replays are not guaranteed to match in Firefox or Safari.

## Layout
| Path | What |
|---|---|
| `index.html`, `src/shell/` | mode selector |
| `impact.html`, `src/impact/` | Impact mode (legacy copy; see `docs/parity.md`) |
| `velocity.html`, `src/velocity/` | Velocity page |
| `src/sim/` | Velocity rules: no three.js, DOM, Web Audio, `Math.random` or wall-clock time |
| `src/config/` | every Velocity tunable |
| `src/render/` | three.js visual kit for Velocity |
| `src/shared/` | settings and styles shared by the pages |
| `legacy/` | the original game: reference only, never edited |
