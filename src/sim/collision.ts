import { BODY } from '../config/movement.ts';
import type { Axis, Vec3 } from './vec.ts';

/* Axis-aligned box. */
export interface Aabb {
  min: Vec3;
  max: Vec3;
}

export function aabbFromCenterSize(center: readonly [number, number, number], size: readonly [number, number, number]): Aabb {
  return {
    min: { x: center[0] - size[0] / 2, y: center[1] - size[1] / 2, z: center[2] - size[2] / 2 },
    max: { x: center[0] + size[0] / 2, y: center[1] + size[1] / 2, z: center[2] + size[2] / 2 },
  };
}

/* The player's collision box: a square column of half-width `radius`, feet at pos.y, `height` tall. */
export function bodyBox(pos: Vec3, radius: number, height: number): Aabb {
  return {
    min: { x: pos.x - radius, y: pos.y, z: pos.z - radius },
    max: { x: pos.x + radius, y: pos.y + height, z: pos.z + radius },
  };
}

/* True overlap on one axis; shared faces and slivers thinner than touchEpsilon do not count. */
function overlapsOn(a: Aabb, b: Aabb, axis: Axis): boolean {
  return a.min[axis] < b.max[axis] - BODY.touchEpsilon && a.max[axis] > b.min[axis] + BODY.touchEpsilon;
}

export function overlaps(a: Aabb, b: Aabb): boolean {
  return overlapsOn(a, b, 'x') && overlapsOn(a, b, 'y') && overlapsOn(a, b, 'z');
}

export function overlapsAny(box: Aabb, boxes: readonly Aabb[]): boolean {
  return boxes.some((b) => overlaps(box, b));
}

const OTHER_AXES: Record<Axis, [Axis, Axis]> = { x: ['y', 'z'], y: ['x', 'z'], z: ['x', 'y'] };

export interface SweepResult {
  /* distance actually moved along the axis (same sign as the request) */
  moved: number;
  hit: boolean;
}

/* Swept move of `box` along one axis by `delta`: stops at the first box in the way (minus the skin),
   however far the move, so fast bodies cannot tunnel through thin walls. Boxes the body already
   overlaps on this axis are ignored rather than snapped out of. */
export function sweepAxis(box: Aabb, axis: Axis, delta: number, boxes: readonly Aabb[]): SweepResult {
  if (delta === 0) return { moved: 0, hit: false };
  const [a1, a2] = OTHER_AXES[axis];
  let moved = delta;
  let hit = false;
  for (const b of boxes) {
    if (!overlapsOn(box, b, a1) || !overlapsOn(box, b, a2)) continue;
    if (delta > 0) {
      const gap = b.min[axis] - box.max[axis];
      if (gap < -BODY.touchEpsilon) continue;
      const allowed = Math.max(0, gap - BODY.skin);
      if (allowed < moved) {
        moved = allowed;
        hit = true;
      }
    } else {
      const gap = box.min[axis] - b.max[axis];
      if (gap < -BODY.touchEpsilon) continue;
      const allowed = -Math.max(0, gap - BODY.skin);
      if (allowed > moved) {
        moved = allowed;
        hit = true;
      }
    }
  }
  return { moved, hit };
}

export interface RayHit {
  distance: number;
  /* outward normal of the face that was hit */
  normal: Vec3;
}

/* Nearest hit of a ray against the boxes within maxDistance (slab test). `dir` must be normalised. */
export function raycast(origin: Vec3, dir: Vec3, maxDistance: number, boxes: readonly Aabb[]): RayHit | null {
  let best: RayHit | null = null;
  for (const b of boxes) {
    let tNear = -Infinity;
    let tFar = Infinity;
    let nearAxis: Axis | null = null;
    let nearSign = 0;
    let miss = false;
    for (const axis of ['x', 'y', 'z'] as const) {
      const o = origin[axis];
      const d = dir[axis];
      if (d === 0) {
        if (o < b.min[axis] || o > b.max[axis]) {
          miss = true;
          break;
        }
        continue;
      }
      let t1 = (b.min[axis] - o) / d;
      let t2 = (b.max[axis] - o) / d;
      /* entering through the min face means the face normal points to -axis */
      let sign = -1;
      if (t1 > t2) {
        [t1, t2] = [t2, t1];
        sign = 1;
      }
      if (t1 > tNear) {
        tNear = t1;
        nearAxis = axis;
        nearSign = sign;
      }
      if (t2 < tFar) tFar = t2;
      if (tNear > tFar) {
        miss = true;
        break;
      }
    }
    /* origins inside a box are not hits: the wall probe starts inside the player, never inside a wall */
    if (miss || nearAxis === null || tNear < 0 || tNear > maxDistance) continue;
    if (!best || tNear < best.distance) {
      const normal = { x: 0, y: 0, z: 0 };
      normal[nearAxis] = nearSign;
      best = { distance: tNear, normal };
    }
  }
  return best;
}
