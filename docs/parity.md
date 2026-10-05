# Impact parity

Impact (`impact.html`, `src/impact/`) is the legacy game (`legacy/impact-velocity.html`) hosted as its own page. Its behaviour must stay identical to legacy. `legacy/` is the reference and is never edited.

## What changed from legacy, on purpose
Every edit in `src/impact/main.js` and `impact.html` is marked `IMPACT-EDIT`.

| Change | Why | Effect on behaviour |
|---|---|---|
| three.js comes from npm (`three/build/three.min.js` 0.128.0) instead of the cdnjs `<script>` | builds offline, version pinned | none: the file is byte-identical to the CDN copy. The ES-module build was rejected because tree-shaking changed how many `Math.random` calls three makes at load |
| Script runs as an ES module | Vite bundling | none: the legacy script was already strict mode and ran after the DOM |
| innerHTML writes replaced by DOM builders (`src/impact/dom.js`) | AGENTS.md: no innerHTML with dynamic content | none: same elements, classes and inline styles. Bot names are now always text, never parsed as HTML |
| Sensitivity, music and SFX load from and save to shared settings (`src/shared/settings.ts`) | settings shared with the selector and Velocity | none with no saved settings (defaults are legacy's 22/30/85). Saved values replace the defaults |
| MODE SELECT button on the main menu | navigation to the selector | one extra button |
| `window.__iv` parity hook (`src/impact/parityHook.js`) | lets the harness read module-scoped state | none: only installed when the URL has `?parity`. With it, anyone can read state and trigger kills from the console, which is acceptable for a single-player game |

## How parity is proven (automated)
`tests/e2e/impact-parity.spec.js` runs legacy and Impact through the same scripted inputs under a deterministic harness (`tests/e2e/helpers/determinism.js`):
- seeded `Math.random`, with a count of calls
- audio sample rate fixed at 48 kHz (legacy draws one random number per noise-buffer sample, so the device rate would otherwise change the random sequence between machines)
- virtual clock for `performance.now` and `requestAnimationFrame` (exact 60 Hz frames)
- no-op speech synthesis, a stubbed pointer lock, and the Wikimedia scream blocked so the synth fallback plays
- the cdnjs three.js request served from `node_modules`

Each frame records the player, the bots (position, velocity, HP, AI state), inventory and weapon timers, power-ups, the match state, the camera, the viewmodel transform, effect counts, HUD markup and inline styles, slider values, minimap pixels and the `Math.random` call count. The traces must be equal on every frame.

Scenarios:
- **movementAndWeapons:** sprint, slide, jump, dash, mouse look, SMG fire, reload, ADS, death and respawn, pistol, knife
- **shotgunTeamMatch:** TDM, shotgun flip-cock, reload, ADS
- **streaksAndLifecycle:** sniper scope, every streak reward (grapple, UAV, gunslinger, rain hell, Sabre with the katana), death cam, respawn, match end, results table, back to the menu

The spec also checks that legacy run twice gives identical traces (the harness is deterministic) and that each scenario reaches the features it claims to cover. When a check fails, the report shows the first frame that differs.

The harness was tested by mutation. Changing the jump speed from 8.6 to 8.61 failed at frame 100, the scripted jump. Changing one HUD class failed at frame 5.

## Manual checks (not covered by the harness)
- Audio by ear: gunshots, music loop, the Wilhelm scream when online, speech announcements, Sabre hum, napalm roar.
- Pointer lock: click to lock, Esc pauses, RESUME relocks, ABANDON MATCH returns to the Impact menu.
- Mouse feel at different sensitivities; slider changes apply immediately.
- Visuals side by side with legacy: skyline, neon, shadows, viewmodels, ragdolls, gore, scope overlay.
- Window resize.

## Repo rules Impact does not follow (accepted)
Impact is a frozen copy, so these CLAUDE.md rules apply only to Velocity code:
- Hard-coded tunables instead of `src/config`.
- `Math.random` and wall-clock time inside game rules; variable `dt` instead of a fixed timestep.
- Remote asset without a licence note: the Wilhelm scream streamed from Wikimedia Commons. To be added to docs/assets.md in slice 7.

## Legacy quirks kept on purpose
- Rays for wall-run, grapple, bot line of sight and shooting hit decor meshes (neon strips, panels, the ground pad) that have no collider.
- Wall-running only works during Sabre Surprise (streak 20). Grapple only works after a 3-kill streak.
- Bot kills are always labelled SMG in the kill feed.
- The pause menu has no SFX slider.
