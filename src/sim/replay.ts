import { SIM_STEP } from '../config/time.ts';
import { hashSimState, StateHasher } from './hash.ts';
import { decodeInput, type EncodedInput } from './input.ts';
import { createSimState, stepSim, type SimState } from './state.ts';
import type { World } from './world.ts';

export const REPLAY_VERSION = 1;

export interface ReplayExpectation {
  ticks: number;
  /* hash of the final state */
  finalHash: string;
  /* one hash over the state after every tick: catches paths that differ but end in the same state */
  traceHash: string;
}

/* A recorded run: the inputs for every tick from spawn, and the hashes they must reproduce. */
export interface Replay {
  version: number;
  world: 'sandbox';
  tickHz: number;
  inputs: EncodedInput[];
  expect: ReplayExpectation;
}

export function runInputs(world: World, inputs: readonly EncodedInput[], onTick?: (s: SimState) => void): SimState {
  const state = createSimState(world);
  for (const e of inputs) {
    stepSim(state, decodeInput(e), world, SIM_STEP);
    onTick?.(state);
  }
  return state;
}

export function replayExpectation(world: World, inputs: readonly EncodedInput[], onTick?: (s: SimState) => void): ReplayExpectation {
  const trace = new StateHasher();
  const final = runInputs(world, inputs, (s) => {
    trace.add(s);
    onTick?.(s);
  });
  return { ticks: final.tick, finalHash: hashSimState(final), traceHash: trace.digest() };
}

export function recordReplay(world: World, inputs: readonly EncodedInput[], tickHz: number): Replay {
  return { version: REPLAY_VERSION, world: 'sandbox', tickHz, inputs: [...inputs], expect: replayExpectation(world, inputs) };
}
