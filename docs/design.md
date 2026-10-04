# Gauntlet mode: design

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
- Existing in Impact Velocity: wall-running and grappling.
- To build: air boost. OPEN DECISION: charges, cooldown, or something else. Decide before slice 2.

## Course
Built from hand-designed chunks (gap, wall-run corridor, grapple pit, boost shaft, target gallery), placed by a seeded generator, with parameters inside the movement's real limits. A scripted bot proves every chunk is traversable.

## Technical rules
- Fixed physics timestep, decoupled from rendering. Swept collision. Own simple controller, no heavy physics engine.
- Recentre the world periodically. Pool and dispose chunks. Measure frame time.

## Slices (one PR each)
0. Split legacy into modules with no behaviour change. Smoke test. CI.
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
