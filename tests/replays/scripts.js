import { SIM_STEP } from '../../src/config/time.ts';
import { encodeInput } from '../../src/sim/input.ts';
import { createSimState, stepSim } from '../../src/sim/state.ts';

/* Scripted drivers for the golden replays. Each maps the current state to the next tick's input;
   recording runs them once and stores only the resulting inputs, so replays never depend on this code. */

function frame(p) {
  return { moveX: 0, moveZ: 0, sprint: false, crouch: false, jump: false, yaw: 0, pitch: 0, ...p };
}

function steerX(x, target) {
  return x > target + 0.05 ? -1 : x < target - 0.05 ? 1 : 0;
}

/* Spawn → running jump over the 8 m gap → wall-run along the 14 m gap → slide under the beam → stop. */
function sandboxRoute(s) {
  const { pos, onGround } = s.player;
  if (pos.z < -59) return frame({});
  const atEdge = (edge) => onGround && pos.z <= edge + 0.8 && pos.z > edge;
  return frame({
    moveZ: 1,
    sprint: true,
    moveX: steerX(pos.x, pos.z > -18 ? 0 : -2.85),
    jump: atEdge(-8) || atEdge(-28),
    crouch: pos.z < -49 && pos.z > -58,
  });
}

/* Strafe off the side of the start deck, fall out of the world, respawn, walk a few metres on the deck. */
function fallAndRespawn(s) {
  if (s.respawns === 0) return frame({ moveX: 1 });
  return frame({ moveZ: s.player.pos.z > 0 ? 1 : 0 });
}

/* Bunny-hops between waypoints on the start deck while the mouse look sweeps, with strafing and
   crouch-jumps: exercises the yaw-dependent paths. Steers in local axes so it stays on the deck. */
const WAYPOINTS = [[-3, 4], [3, -4], [3, 4], [-3, -4]];
function lookAndHop(s) {
  const t = s.tick;
  const yaw = Math.sin(t / 40) * 1.2;
  const [tx, tz] = WAYPOINTS[Math.floor(t / 90) % WAYPOINTS.length];
  const dx = tx - s.player.pos.x;
  const dz = tz - s.player.pos.z;
  const ahead = dx * -Math.sin(yaw) + dz * -Math.cos(yaw);
  const right = dx * Math.cos(yaw) + dz * -Math.sin(yaw);
  const axis = (d) => (d > 0.5 ? 1 : d < -0.5 ? -1 : 0);
  return frame({
    moveZ: axis(ahead),
    moveX: axis(right),
    sprint: t % 120 < 80,
    jump: t % 60 < 40, /* held: hops again on every landing */
    crouch: t % 150 > 130,
    yaw,
    pitch: Math.cos(t / 55) * 0.4,
  });
}

export const SCRIPTS = {
  'sandbox-route': { ticks: 720, drive: sandboxRoute },
  'fall-and-respawn': { ticks: 300, drive: fallAndRespawn },
  'look-and-hop': { ticks: 600, drive: lookAndHop },
};

export function generateInputs(world, { ticks, drive }) {
  const state = createSimState(world);
  const inputs = [];
  for (let i = 0; i < ticks; i++) {
    const f = drive(state);
    inputs.push(encodeInput(f));
    stepSim(state, f, world, SIM_STEP);
  }
  return inputs;
}
