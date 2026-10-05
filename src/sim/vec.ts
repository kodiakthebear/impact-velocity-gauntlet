/* Plain 3D vectors for the simulation (no three.js). Only + - * / and sqrt, so results are exact and repeatable. */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export type Axis = 'x' | 'y' | 'z';

export function vec3(x = 0, y = 0, z = 0): Vec3 {
  return { x, y, z };
}

export function copyVec(v: Vec3): Vec3 {
  return { x: v.x, y: v.y, z: v.z };
}

export function addScaled(out: Vec3, v: Vec3, s: number): void {
  out.x += v.x * s;
  out.y += v.y * s;
  out.z += v.z * s;
}

export function horizontalSpeed(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.z * v.z);
}
