# Impact Velocity: design

## Modes
The game opens on a mode selector with two modes:
- **Impact**: the original arena FPS (team deathmatch and free-for-all against bots). It is the legacy game (legacy/impact-velocity.html) hosted as its own page with no behaviour change; see docs/parity.md.
- **Velocity**: the Gauntlet mode described below. It is built from scratch and takes only visual inspiration from Impact (the look of its weapons and environments), not its code or logic.

Settings (sensitivity, music and SFX volume) are shared by both modes.

The rest of this document describes Velocity.

## Fantasy
An endless obstacle course in the spirit of Titanfall 2's Gauntlet: jump gaps, wall-run, grapple, air-boost, and shoot non-attacking targets for points. Speed, accuracy, reaction time and movement skill win.

## Run model: the pace clock
- The course is an endless chain of sectors. A time bank drains constantly.
- Clearing a sector quickly and hitting targets adds time. Faster clears add more.
- The run ends when the time bank is empty, or when the player cannot get back onto the map after a break.

## Scoring
Points come from distance, speed and target hits. A combo multiplier rewards hits made while wall-running, airborne or boosting.

## Map breaks
Random events where part of the map collapses. Always telegraphed with an audio cue and a short visual warning. Recovery must always be possible with a boost or grapple.

## Movement
- Wall-running and grappling: Impact has them (unlocked by killstreaks). Velocity builds its own versions in src/sim, using Impact only as a reference for feel.
- To build: air boost (decided 2026-10-05; built in slice 2):
  - **Charges:** 2. Spent charges refill one at a time, 2.5 s each, on the ground and in the air.
  - **Use:** in the air only, on a fresh press of Q. A boost sets velocity along the exact look direction (full 3D) at 17 m/s, or at the current speed if that is higher, and ends any wall-run. Respawning refills both charges.
  - **Feedback:** a punchy, bassy audio hit and a short, sharp camera shake on every boost; a hiss when Q is pressed in the air with no charges. The HUD shows two charge pips that fill as they refill.

## Course
Built from hand-designed chunks (gap, wall-run corridor, grapple pit, boost shaft, target gallery), placed by a seeded generator, with parameters inside the movement's real limits. A scripted bot proves every chunk is traversable.

## Technical rules
- Fixed physics timestep, decoupled from rendering. Swept collision. Own simple controller, no heavy physics engine.
- Recentre the world periodically. Pool and dispose chunks. Measure frame time.

## Slices (one PR each)
0. Game shell: mode selector, Impact as its own page with no behaviour change (proven against legacy by a parity harness), Velocity shell page on a fixed timestep, shared settings. Smoke test. CI.
1. Movement simulation on a fixed timestep, with deterministic replay tests.
2. Greybox course with gap, wall-run, grapple and air boost.
3. Non-attacking targets, hit zones, scoring and combo.
4. Chunk system, seeded generation and traversability bot.
5. Run lifecycle: pace clock, fail and restart, HUD.
6. Map-break events.
7. Polish: audio, effects, performance, deploy.

Milestone 1 is slices 0 to 3.

## Out of scope for now
Multiplayer, enemy attacks, leaderboards, mobile controls.
