import { describe, expect, it } from 'vitest';
import { BODY } from '../../src/config/movement.ts';
import { aabbFromCenterSize, bodyBox, overlaps, raycast, sweepAxis } from '../../src/sim/collision.ts';
import { vec3 } from '../../src/sim/vec.ts';

const floor = aabbFromCenterSize([0, -0.5, 0], [20, 1, 20]);

describe('sweepAxis', () => {
  it('stops a fall on the floor, one skin above it', () => {
    const box = bodyBox(vec3(0, 1, 0), 0.45, 1.8);
    const r = sweepAxis(box, 'y', -5, [floor]);
    expect(r.hit).toBe(true);
    expect(1 + r.moved).toBeCloseTo(BODY.skin, 12);
  });

  it('cannot tunnel through a 5 cm wall even when moving 100 m in one step', () => {
    const wall = aabbFromCenterSize([0, 1, -10], [4, 2, 0.05]);
    const box = bodyBox(vec3(0, 0.01, 0), 0.45, 1.8);
    const r = sweepAxis(box, 'z', -100, [wall]);
    expect(r.hit).toBe(true);
    expect(0 + r.moved - 0.45).toBeGreaterThanOrEqual(wall.max.z);
  });

  it('does not snag on the seam between two touching floor boxes', () => {
    const a = aabbFromCenterSize([-5, -0.5, 0], [10, 1, 4]);
    const b = aabbFromCenterSize([5, -0.5, 0], [10, 1, 4]);
    const box = bodyBox(vec3(-1, BODY.skin, 0), 0.45, 1.8);
    expect(sweepAxis(box, 'x', 3, [a, b])).toEqual({ moved: 3, hit: false });
  });

  it('ignores boxes behind the motion and boxes beside it', () => {
    const behind = aabbFromCenterSize([0, 1, 5], [2, 2, 1]);
    const beside = aabbFromCenterSize([3, 1, -5], [1, 2, 1]);
    const box = bodyBox(vec3(0, 0.01, 0), 0.45, 1.8);
    expect(sweepAxis(box, 'z', -10, [behind, beside])).toEqual({ moved: -10, hit: false });
  });

  it('treats shared faces as touching, not overlapping', () => {
    const a = aabbFromCenterSize([0, 0, 0], [1, 1, 1]);
    const b = aabbFromCenterSize([1, 0, 0], [1, 1, 1]);
    expect(overlaps(a, b)).toBe(false);
    expect(overlaps(a, aabbFromCenterSize([0.5, 0, 0], [1, 1, 1]))).toBe(true);
  });
});

describe('raycast', () => {
  const wall = aabbFromCenterSize([-4, 2, 0], [1, 8, 10]);

  it('returns the distance and outward normal of the nearest face', () => {
    const hit = raycast(vec3(-3, 1, 0), vec3(-1, 0, 0), 2, [wall]);
    expect(hit?.distance).toBeCloseTo(0.5, 12);
    expect(hit?.normal).toEqual({ x: 1, y: 0, z: 0 });
  });

  it('misses beyond max distance, when pointing away, or when parallel outside', () => {
    expect(raycast(vec3(-2, 1, 0), vec3(-1, 0, 0), 1, [wall])).toBeNull();
    expect(raycast(vec3(-3, 1, 0), vec3(1, 0, 0), 5, [wall])).toBeNull();
    expect(raycast(vec3(-3, 1, 0), vec3(0, 0, -1), 50, [wall])).toBeNull();
  });
});
