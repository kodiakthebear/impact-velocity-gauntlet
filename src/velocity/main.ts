import { SHELL_BLOCKS, SHELL_CAMERA } from '../config/shellScene.ts';
import { FRAME_TIME_SMOOTHING, MAX_SUBSTEPS, SIM_STEP } from '../config/time.ts';
import { createCamera, createRenderer, createScene, fitToWindow, greyboxBlock } from '../render/kit.ts';
import { advanceFixedStep } from '../sim/loop.ts';
import { createSimState, stepSim } from '../sim/state.ts';

function byId(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`missing #${id}`);
  return el;
}

const renderer = createRenderer(byId('view'));
const scene = createScene();
const camera = createCamera();
for (const b of SHELL_BLOCKS) scene.add(greyboxBlock(b.center, b.size, b.shade, b.trim));
window.addEventListener('resize', () => fitToWindow(renderer, camera));

function backToModes(): void {
  location.href = './';
}
byId('back').addEventListener('click', backToModes);
document.addEventListener('keydown', (e) => {
  if (e.code === 'Escape') backToModes();
});

const sim = createSimState();
const frameTimeEl = byId('frameTime');
const simTicksEl = byId('simTicks');
let accumulator = 0;
let lastMs: number | null = null;
let smoothedMs = 0;
let orbit = 0;

function frame(nowMs: number): void {
  requestAnimationFrame(frame);
  const frameMs = lastMs === null ? 0 : nowMs - lastMs;
  lastMs = nowMs;

  const advance = advanceFixedStep(accumulator, frameMs / 1000, SIM_STEP, MAX_SUBSTEPS);
  accumulator = advance.accumulator;
  for (let i = 0; i < advance.steps; i++) stepSim(sim);

  orbit += SHELL_CAMERA.radiansPerSecond * (frameMs / 1000);
  const [tx, ty, tz] = SHELL_CAMERA.target;
  camera.position.set(tx + Math.cos(orbit) * SHELL_CAMERA.radius, ty + SHELL_CAMERA.height, tz + Math.sin(orbit) * SHELL_CAMERA.radius);
  camera.lookAt(tx, ty, tz);
  renderer.render(scene, camera);

  smoothedMs = smoothedMs === 0 ? frameMs : smoothedMs + (frameMs - smoothedMs) * FRAME_TIME_SMOOTHING;
  frameTimeEl.textContent = `FRAME ${smoothedMs.toFixed(1)} ms`;
  simTicksEl.textContent = `SIM ${sim.tick} TICKS`;
}
requestAnimationFrame(frame);
