@AGENTS.md

# Impact Velocity: Gauntlet mode
- The spec is docs/design.md. legacy/ is the original game: read it, never edit it.
- Architecture rule: src/sim/ contains game rules and movement and must NEVER import three.js, the DOM or Web Audio. That keeps it testable without a browser.
- The simulation uses a fixed timestep and a seeded random generator. No Math.random in src/sim/.
- Every tunable number lives in src/config. Never hard-code speeds, gravities, costs or timers.
- No external assets without noting the licence in docs/assets.md.
- Do not set up deployment. Publishing is done by hand.
