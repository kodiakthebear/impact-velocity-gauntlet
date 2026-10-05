import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SIM_HZ } from '../../src/config/time.ts';
import { hashSimState } from '../../src/sim/hash.ts';
import { decodeInput, encodeInput } from '../../src/sim/input.ts';
import { recordReplay, replayExpectation, REPLAY_VERSION, runInputs } from '../../src/sim/replay.ts';
import { sandboxWorld } from '../../src/sim/world.ts';
import { generateInputs, SCRIPTS } from '../replays/scripts.js';

/* Golden replays: recorded inputs that must reproduce their stored final-state hash exactly.
   A deliberate movement or sandbox change alters them; re-record with UPDATE_REPLAYS=1 npm test
   and review what the milestone checks below say about the new behaviour. */
const DIR = resolve(import.meta.dirname, '../replays');
const UPDATE = process.env.UPDATE_REPLAYS === '1';
const world = sandboxWorld();

function load(name) {
  const path = resolve(DIR, `${name}.json`);
  if (UPDATE) {
    mkdirSync(DIR, { recursive: true });
    const replay = recordReplay(world, generateInputs(world, SCRIPTS[name]), SIM_HZ);
    writeFileSync(path, JSON.stringify(replay) + '\n');
  }
  return JSON.parse(readFileSync(path, 'utf8'));
}

/* What each replay must show, so a re-recorded golden cannot silently stop exercising its feature. */
const MILESTONES = {
  'sandbox-route': (states, final) => {
    expect(final.respawns).toBe(0);
    expect(states.some((s) => s.wallRunning)).toBe(true);
    expect(states.some((s) => s.sliding && s.z < -55 && s.z > -57)).toBe(true); /* slid under the beam */
    expect(final.player.pos.z).toBeLessThan(-58);
    expect(final.player.pos.y).toBeCloseTo(-1.5, 2);
    expect(final.player.onGround).toBe(true);
  },
  'fall-and-respawn': (states, final) => {
    expect(final.respawns).toBe(1);
    expect(final.player.onGround).toBe(true);
    expect(final.player.pos.z).toBeLessThan(world.spawn.position.z - 2);
  },
  'look-and-hop': (states, final) => {
    expect(final.respawns).toBe(0);
    expect(states.filter((s) => s.jumpStart).length).toBeGreaterThanOrEqual(8);
    expect(new Set(states.map((s) => s.yaw)).size).toBeGreaterThan(100);
    expect(states.some((s) => s.sliding)).toBe(true);
  },
};

describe('golden replays', () => {
  for (const name of Object.keys(SCRIPTS)) {
    it(`${name} reproduces its recorded state exactly and still shows its milestones`, () => {
      const replay = load(name);
      expect(replay.version).toBe(REPLAY_VERSION);
      expect(replay.tickHz).toBe(SIM_HZ);
      const states = [];
      let wasGrounded = false;
      let final;
      const got = replayExpectation(world, replay.inputs, (s) => {
        const p = s.player;
        states.push({ z: p.pos.z, yaw: p.yaw, wallRunning: p.wallRunning, sliding: p.sliding, jumpStart: wasGrounded && !p.onGround });
        wasGrounded = p.onGround;
        final = s;
      });
      expect(got).toEqual(replay.expect);
      MILESTONES[name](states, final);
    });
  }
});

describe('determinism', () => {
  it('the same inputs give bit-identical state on every tick', () => {
    const { inputs } = load('look-and-hop');
    const a = [];
    const b = [];
    runInputs(world, inputs, (s) => a.push(hashSimState(s)));
    runInputs(world, inputs, (s) => b.push(hashSimState(s)));
    expect(b).toEqual(a);
    expect(new Set(a).size).toBe(a.length); /* the hash really changes as the state does */
  });

  it('input encoding survives JSON exactly', () => {
    const f = { moveX: -1, moveZ: 1, sprint: true, crouch: false, jump: true, yaw: 0.1 + 0.2, pitch: -Math.PI / 7 };
    expect(decodeInput(JSON.parse(JSON.stringify(encodeInput(f))))).toEqual(f);
  });
});
