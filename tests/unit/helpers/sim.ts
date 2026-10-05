import { SIM_STEP } from '../../../src/config/time.ts';
import { neutralInput, type InputFrame } from '../../../src/sim/input.ts';
import { createSimState, stepSim, type SimState } from '../../../src/sim/state.ts';
import { createWorld, type BlockSpec, type World } from '../../../src/sim/world.ts';

export const FLOOR: BlockSpec = { center: [0, -0.5, 0], size: [400, 1, 400] };

export function testWorld(blocks: BlockSpec[], spawn: [number, number, number] = [0, 0.01, 0], killY = -50): World {
  return createWorld(blocks, { position: spawn, yaw: 0 }, killY);
}

export function input(partial: Partial<InputFrame> = {}): InputFrame {
  return { ...neutralInput(), ...partial };
}

/* Steps the simulation `ticks` times with the same input (or a per-tick function of the state). */
export function run(world: World, ticks: number, frame: InputFrame | ((s: SimState) => InputFrame), state = createSimState(world)): SimState {
  for (let i = 0; i < ticks; i++) stepSim(state, typeof frame === 'function' ? frame(state) : frame, world, SIM_STEP);
  return state;
}

export function speedOf(s: SimState): number {
  const v = s.player.vel;
  return Math.sqrt(v.x * v.x + v.z * v.z);
}
