import { KILL_Y, SANDBOX_BLOCKS, SANDBOX_SPAWN } from '../config/greybox.ts';
import { aabbFromCenterSize, type Aabb } from './collision.ts';
import { vec3, type Vec3 } from './vec.ts';

export interface World {
  boxes: readonly Aabb[];
  spawn: { position: Vec3; yaw: number };
  /* falling below this respawns the player */
  killY: number;
}

export interface BlockSpec {
  center: readonly [number, number, number];
  size: readonly [number, number, number];
}

export function createWorld(
  blocks: readonly BlockSpec[],
  spawn: { position: readonly [number, number, number]; yaw: number },
  killY: number,
): World {
  return {
    boxes: blocks.map((b) => aabbFromCenterSize(b.center, b.size)),
    spawn: { position: vec3(...spawn.position), yaw: spawn.yaw },
    killY,
  };
}

/* The movement sandbox drawn by the Velocity page; replays are recorded against it. */
export function sandboxWorld(): World {
  return createWorld(SANDBOX_BLOCKS, SANDBOX_SPAWN, KILL_Y);
}
