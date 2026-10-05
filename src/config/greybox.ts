import { NEON, type RGB } from './render.ts';

/* Movement sandbox greybox: the same blocks are drawn and collided with. Replaced by real chunks in slices 2 and 4.
   Positions are block centres, sizes are full extents (metres). Deck tops are at y = 0 unless noted.
   Distances assume the movement config: a running jump clears ~9 m (air control pulls any jump up to
   air speed), so the 8 m gap is a plain running jump; the 14 m gap needs the wall-run or a slide-jump. */
export interface GreyboxBlock {
  center: readonly [number, number, number];
  size: readonly [number, number, number];
  shade: RGB;
  trim?: RGB;
}

const DECK: RGB = [0.3, 0.33, 0.42];
const WALL: RGB = [0.36, 0.38, 0.48];

export const SANDBOX_BLOCKS: readonly GreyboxBlock[] = [
  { center: [0, -0.5, 0], size: [12, 1, 16], shade: DECK, trim: NEON.cyan },          /* start deck, z 8 .. -8 */
  { center: [0, -0.5, -22], size: [10, 1, 12], shade: DECK, trim: NEON.magenta },     /* after the 8 m gap, z -16 .. -28 */
  { center: [-4, 2, -35], size: [1, 8, 18], shade: WALL, trim: NEON.violet },         /* wall-run wall along the 14 m gap, face at x = -3.5 */
  { center: [0, -2, -52], size: [10, 1, 20], shade: DECK, trim: NEON.cyan },          /* lower landing (top y = -1.5), z -42 .. -62 */
  { center: [0, 0.4, -56], size: [10, 1, 1.2], shade: WALL, trim: NEON.amber },       /* beam with 1.4 m clearance: slide or crouch under */
];

export const SANDBOX_SPAWN = { position: [0, 0.01, 5] as const, yaw: 0 };

/* Falling below this height respawns the player. */
export const KILL_Y = -25;
