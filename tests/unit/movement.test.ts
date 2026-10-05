import { describe, expect, it } from 'vitest';
import { BODY, GRAVITY, GROUND, SLIDE, WALL_RUN } from '../../src/config/movement.ts';
import { createSimState } from '../../src/sim/state.ts';
import { FLOOR, input, run, speedOf, testWorld } from './helpers/sim.ts';

describe('ground movement', () => {
  const world = testWorld([FLOOR]);

  it('settles on the floor and stays still with no input', () => {
    const s = run(world, 60, input());
    expect(s.player.onGround).toBe(true);
    expect(s.player.pos.y).toBeGreaterThanOrEqual(0);
    expect(s.player.pos.y).toBeLessThanOrEqual(2 * BODY.skin);
    expect(speedOf(s)).toBe(0);
  });

  it.each([
    ['walk', input({ moveZ: 1 }), GROUND.walkSpeed],
    ['sprint', input({ moveZ: 1, sprint: true }), GROUND.sprintSpeed],
    ['crouch', input({ moveZ: 1, crouch: true }), GROUND.crouchSpeed],
  ])('%s reaches and holds its top speed', (_name, frame, top) => {
    expect(speedOf(run(world, 180, frame))).toBeCloseTo(top, 6);
  });

  it('moves along the look direction: yaw 0 is -z, yaw +90° is -x, strafe right is +x', () => {
    expect(run(world, 30, input({ moveZ: 1 })).player.pos.z).toBeLessThan(-1);
    const turned = run(world, 30, input({ moveZ: 1, yaw: Math.PI / 2 })).player.pos;
    expect(turned.x).toBeLessThan(-1);
    expect(Math.abs(turned.z)).toBeLessThan(1e-9);
    expect(run(world, 30, input({ moveX: 1 })).player.pos.x).toBeGreaterThan(1);
  });

  it('stops quickly when input is released (friction)', () => {
    const s = run(world, 120, input({ moveZ: 1, sprint: true }));
    run(world, 60, input(), s);
    expect(speedOf(s)).toBe(0);
  });
});

describe('jumping', () => {
  const world = testWorld([FLOOR]);

  it('reaches the apex predicted by jump speed and gravity (v²/2g)', () => {
    const s = run(world, 5, input());
    let apex = 0;
    run(world, 60, (st) => {
      apex = Math.max(apex, st.player.pos.y);
      return input({ jump: st.tick === 5 });
    }, s);
    const predicted = (GROUND.jumpSpeed * GROUND.jumpSpeed) / (2 * GRAVITY);
    expect(apex).toBeGreaterThan(predicted - 0.1);
    expect(apex).toBeLessThan(predicted + 0.01);
    expect(s.player.onGround).toBe(true);
  });

  it('a sprint jump carries about sprint speed × airtime (2v/g)', () => {
    const s = run(world, 120, input({ moveZ: 1, sprint: true }));
    const start = s.player.pos.z;
    run(world, 1, input({ moveZ: 1, sprint: true, jump: true }), s);
    run(world, 120, (st) => (st.player.onGround ? input() : input({ moveZ: 1, sprint: true })), s);
    const landedAt = s.player.pos.z;
    const predicted = (GROUND.sprintSpeed * 2 * GROUND.jumpSpeed) / GRAVITY;
    expect(start - landedAt).toBeGreaterThan(predicted - 0.5);
    expect(start - landedAt).toBeLessThan(predicted + 1.5); /* includes the stop after landing */
  });

  it('air control pulls even a walking jump up to air speed, as in Impact', () => {
    const s = run(world, 120, input({ moveZ: 1 }));
    run(world, 1, input({ moveZ: 1, jump: true }), s);
    run(world, 20, input({ moveZ: 1 }), s);
    expect(s.player.onGround).toBe(false);
    expect(speedOf(s)).toBeCloseTo(GROUND.sprintSpeed, 6);
  });
});

describe('crouch and slide', () => {
  it('crouching at sprint speed starts a slide with Impact’s boost, which then decays and ends', () => {
    const world = testWorld([FLOOR]);
    const s = run(world, 120, input({ moveZ: 1, sprint: true }));
    run(world, 1, input({ moveZ: 1, sprint: true, crouch: true }), s);
    expect(s.player.sliding).toBe(true);
    expect(speedOf(s)).toBeGreaterThan(GROUND.sprintSpeed * SLIDE.boost - 0.5);
    run(world, 600, input({ crouch: true }), s);
    expect(s.player.sliding).toBe(false);
    expect(speedOf(s)).toBeLessThan(SLIDE.endSpeed);
  });

  it('cannot stand up under a low ceiling, and stands once clear of it', () => {
    const ceiling = { center: [0, 1.4 + 0.5, -10] as [number, number, number], size: [10, 1, 6] as [number, number, number] };
    const world = testWorld([FLOOR, ceiling]);
    const s = run(world, 160, (st) => input({ moveZ: st.player.pos.z > -10 ? 1 : 0, crouch: st.player.pos.z > -10 }));
    expect(s.player.pos.z).toBeLessThanOrEqual(-10);
    expect(s.player.crouched).toBe(true); /* crouch released, but no headroom */
    run(world, 120, input({ moveZ: 1 }), s);
    expect(s.player.pos.z).toBeLessThan(-13.5);
    expect(s.player.crouched).toBe(false);
  });

  it('walking into a low ceiling while standing is blocked', () => {
    const beam = { center: [0, 1.4 + 0.5, -5] as [number, number, number], size: [10, 1, 1] as [number, number, number] };
    const s = run(testWorld([FLOOR, beam]), 120, input({ moveZ: 1 }));
    expect(s.player.pos.z).toBeGreaterThan(-5 + 0.5);
  });
});

describe('wall-run and wall-jump', () => {
  /* wall face at x = -1, running along -z; no floor, so only the wall-run slows the fall */
  const wall = { center: [-1.5, 0, -50] as [number, number, number], size: [1, 200, 200] as [number, number, number] };

  function airborneAlongWall(withWall: boolean) {
    const world = testWorld(withWall ? [wall] : [], [-0.3, 20, 0], -500);
    const s = createSimState(world);
    s.player.vel = { x: 0, y: 0, z: -11 };
    return { world, s };
  }

  it('wall-running falls far slower than free fall', () => {
    const a = airborneAlongWall(true);
    const b = airborneAlongWall(false);
    let ran = 0;
    run(a.world, 60, (st) => {
      if (st.player.wallRunning) ran++;
      return input({ moveZ: 1, sprint: true });
    }, a.s);
    run(b.world, 60, input({ moveZ: 1, sprint: true }), b.s);
    expect(ran).toBeGreaterThan(55);
    expect(a.s.player.vel.y).toBeGreaterThan(-WALL_RUN.maxFallSpeed - GRAVITY / 60);
    expect(a.s.player.pos.y).toBeGreaterThan(b.s.player.pos.y + 3);
  });

  it('a fresh jump press pushes away from the wall and up; holding jump does not repeat it', () => {
    const { world, s } = airborneAlongWall(true);
    run(world, 10, input({ moveZ: 1 }), s);
    expect(s.player.wallNormal).toEqual({ x: 1, y: 0, z: 0 });
    const vxBefore = s.player.vel.x; /* small pull toward the wall from wall-running */
    run(world, 1, input({ moveZ: 1, jump: true }), s);
    expect(s.player.vel.x).toBeCloseTo(vxBefore - WALL_RUN.stick / 60 + WALL_RUN.jumpPush, 9);
    expect(s.player.vel.y).toBeCloseTo(WALL_RUN.jumpUp - WALL_RUN.gravity / 60, 9);
    const vxAfterJump = s.player.vel.x;
    run(world, 1, input({ moveZ: 1, jump: true }), s);
    expect(s.player.vel.x).toBeLessThanOrEqual(vxAfterJump);
  });

  it('needs speed: a slow drop beside the wall does not wall-run', () => {
    const { world, s } = airborneAlongWall(true);
    s.player.vel = { x: 0, y: 0, z: -2 };
    let ran = false;
    run(world, 30, (st) => {
      ran ||= st.player.wallRunning;
      return input();
    }, s);
    expect(ran).toBe(false);
  });
});

describe('falling out of the world', () => {
  it('respawns at the spawn point with no velocity', () => {
    const world = testWorld([], [3, 2, 4], -10);
    const s = run(world, 120, input({ moveZ: 1 }));
    expect(s.respawns).toBeGreaterThanOrEqual(1);
    const fresh = run(world, 1, input(), createSimState(world));
    expect(s.player.pos.y).toBeGreaterThan(-10);
    expect(fresh.respawns).toBe(0);
  });
});
