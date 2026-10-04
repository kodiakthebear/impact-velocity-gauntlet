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
