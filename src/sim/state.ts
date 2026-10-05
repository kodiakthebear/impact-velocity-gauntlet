import type { InputFrame } from './input.ts';
import { createPlayer, stepPlayer, type PlayerState } from './player.ts';
import type { World } from './world.ts';

/* Velocity simulation state: advanced only in whole fixed steps. */
export interface SimState {
  tick: number;
  player: PlayerState;
  respawns: number;
  /* true for the tick on which the player respawned (rendering must not interpolate across it) */
  justRespawned: boolean;
}

export function createSimState(world: World): SimState {
  return { tick: 0, player: createPlayer(world), respawns: 0, justRespawned: false };
}

export function stepSim(state: SimState, input: InputFrame, world: World, dt: number): void {
  stepPlayer(state.player, input, world, dt);
  state.justRespawned = state.player.pos.y < world.killY;
  if (state.justRespawned) {
    const fresh = createPlayer(world);
    fresh.yaw = state.player.yaw;
    fresh.pitch = state.player.pitch;
    state.player = fresh;
    state.respawns += 1;
  }
  state.tick += 1;
}
