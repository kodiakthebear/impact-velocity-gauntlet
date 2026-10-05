import { NEON, type RGB } from './render.ts';

/* Slice 0 placeholder greybox: static blocks only, no collision or gameplay.
   Replaced by real chunks in slices 2 and 4. Positions are block centres, sizes are full extents (metres). */
export interface ShellBlock {
  center: readonly [number, number, number];
  size: readonly [number, number, number];
  shade: RGB;
  trim?: RGB;
}

const DECK: RGB = [0.3, 0.33, 0.42];
const WALL: RGB = [0.36, 0.38, 0.48];
const PILLAR: RGB = [0.3, 0.32, 0.4];

export const SHELL_BLOCKS: readonly ShellBlock[] = [
  { center: [0, -0.5, 0], size: [12, 1, 16], shade: DECK, trim: NEON.cyan },          /* start deck */
  { center: [0, -0.5, -22], size: [10, 1, 12], shade: DECK, trim: NEON.magenta },     /* landing after the gap */
  { center: [-6.5, 3, -40], size: [1, 8, 18], shade: WALL, trim: NEON.violet },       /* wall-run wall */
  { center: [2, -0.5, -40], size: [6, 1, 18], shade: DECK, trim: NEON.cyan },
  { center: [0, 7, -62], size: [1.2, 16, 1.2], shade: PILLAR, trim: NEON.amber },     /* grapple pillar */
  { center: [0, -0.5, -70], size: [14, 1, 10], shade: DECK, trim: NEON.magenta },
];

/* Slow orbit for the empty shell, so the page shows the look before movement exists. */
export const SHELL_CAMERA = {
  target: [0, 1, -32] as const,
  radius: 34,
  height: 14,
  radiansPerSecond: 0.08,
};
