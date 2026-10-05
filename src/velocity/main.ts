import { SANDBOX_BLOCKS } from '../config/greybox.ts';
import { FRAME_TIME_SMOOTHING, MAX_SUBSTEPS, SIM_STEP } from '../config/time.ts';
import { FpsCamera } from '../render/fpsCamera.ts';
import { createCamera, createRenderer, createScene, fitToWindow, greyboxBlock } from '../render/kit.ts';
import { loadSettings } from '../shared/settings.ts';
import { hashSimState } from '../sim/hash.ts';
import { encodeInput, type EncodedInput } from '../sim/input.ts';
import { advanceFixedStep } from '../sim/loop.ts';
import { clonePlayer } from '../sim/player.ts';
import { createSimState, stepSim } from '../sim/state.ts';
import { sandboxWorld } from '../sim/world.ts';
import { PlayerInput } from './input.ts';

function byId<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`missing #${id}`);
  return el as T;
}

const world = sandboxWorld();
const renderer = createRenderer(byId('view'));
const scene = createScene();
const camera = createCamera();
for (const b of SANDBOX_BLOCKS) scene.add(greyboxBlock(b.center, b.size, b.shade, b.trim));
window.addEventListener('resize', () => fitToWindow(renderer, camera));
const view = new FpsCamera(camera);

const canvas = renderer.domElement;
const isLocked = (): boolean => document.pointerLockElement === canvas;
const input = new PlayerInput(isLocked, loadSettings().sens, world.spawn.yaw);

const sim = createSimState(world);
let previous = clonePlayer(sim.player);
/* every tick's input since the page opened: replaying it from spawn reproduces this session exactly */
const recorded: EncodedInput[] = [];

/* ---- pause overlay: Esc releases pointer lock (the browser handles it) and pauses ---- */
const overlay = byId('overlay');
const playButton = byId<HTMLButtonElement>('play');
const overlayTag = byId('overlayTag');
function requestPlay(): void {
  try {
    const pending = canvas.requestPointerLock() as unknown;
    if (pending instanceof Promise) pending.catch(() => (overlayTag.textContent = 'POINTER LOCK UNAVAILABLE — CLICK TO RETRY'));
  } catch {
    overlayTag.textContent = 'POINTER LOCK UNAVAILABLE — CLICK TO RETRY';
  }
}
playButton.addEventListener('click', requestPlay);
byId('back').addEventListener('click', () => (location.href = './'));
document.addEventListener('pointerlockchange', () => {
  const locked = isLocked();
  overlay.hidden = locked;
  if (!locked) {
    input.release();
    playButton.textContent = 'RESUME';
    overlayTag.textContent = 'PAUSED';
  }
  lastMs = null;
  accumulator = 0;
});

/* ---- HUD ---- */
const frameTimeEl = byId('frameTime');
const simTicksEl = byId('simTicks');
const speedEl = byId('speed');
const moveStateEl = byId('moveState');

/* ---- test/debug hook: ?debug exposes the recorded inputs and the exact state ---- */
if (new URLSearchParams(location.search).has('debug')) {
  (window as unknown as { __velocity: unknown }).__velocity = {
    capture: () => ({ inputs: recorded.slice(), tick: sim.tick, hash: hashSimState(sim), player: clonePlayer(sim.player) }),
  };
}

let accumulator = 0;
let lastMs: number | null = null;
let smoothedMs = 0;

function frame(nowMs: number): void {
  requestAnimationFrame(frame);
  const frameMs = lastMs === null ? 0 : nowMs - lastMs;
  lastMs = nowMs;

  let alpha = 1;
  if (isLocked()) {
    const advance = advanceFixedStep(accumulator, frameMs / 1000, SIM_STEP, MAX_SUBSTEPS);
    accumulator = advance.accumulator;
    for (let i = 0; i < advance.steps; i++) {
      previous = clonePlayer(sim.player);
      const f = input.sample();
      recorded.push(encodeInput(f));
      stepSim(sim, f, world, SIM_STEP);
      if (sim.justRespawned) previous = clonePlayer(sim.player);
    }
    alpha = advance.alpha;
  }

  /* draw between the last two ticks so motion is smooth at any frame rate */
  const p = sim.player;
  const feet = {
    x: previous.pos.x + (p.pos.x - previous.pos.x) * alpha,
    y: previous.pos.y + (p.pos.y - previous.pos.y) * alpha,
    z: previous.pos.z + (p.pos.z - previous.pos.z) * alpha,
  };
  const look = input.look;
  view.update(feet, p, look.yaw, look.pitch, frameMs / 1000);
  renderer.render(scene, camera);

  smoothedMs = smoothedMs === 0 ? frameMs : smoothedMs + (frameMs - smoothedMs) * FRAME_TIME_SMOOTHING;
  frameTimeEl.textContent = `FRAME ${smoothedMs.toFixed(1)} ms`;
  simTicksEl.textContent = `SIM ${sim.tick} TICKS`;
  speedEl.textContent = `${Math.sqrt(p.vel.x * p.vel.x + p.vel.z * p.vel.z).toFixed(1)} m/s`;
  moveStateEl.textContent = p.wallRunning ? 'WALLRUN' : p.sliding ? 'SLIDING' : p.crouched ? 'CROUCH' : p.onGround ? '' : 'AIR';
}
requestAnimationFrame(frame);
