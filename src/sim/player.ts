import { AIR, BODY, GRAVITY, GROUND, LOOK, SLIDE, WALL_RUN } from '../config/movement.ts';
import { bodyBox, overlapsAny, raycast, sweepAxis } from './collision.ts';
import type { InputFrame } from './input.ts';
import { addScaled, copyVec, horizontalSpeed, vec3, type Axis, type Vec3 } from './vec.ts';
import type { World } from './world.ts';

export interface PlayerState {
  /* feet position */
  pos: Vec3;
  vel: Vec3;
  yaw: number;
  pitch: number;
  onGround: boolean;
  /* collision height is the crouched one (crouch held, sliding, or no headroom to stand) */
  crouched: boolean;
  sliding: boolean;
  wallRunning: boolean;
  /* outward normal of the wall being run on, when wallRunning */
  wallNormal: Vec3 | null;
  /* jump was held last tick: wall-jumps need a fresh press */
  jumpHeld: boolean;
}

export function createPlayer(world: World): PlayerState {
  return {
    pos: copyVec(world.spawn.position),
    vel: vec3(),
    yaw: world.spawn.yaw,
    pitch: 0,
    onGround: false,
    crouched: false,
    sliding: false,
    wallRunning: false,
    wallNormal: null,
    jumpHeld: false,
  };
}

export function clonePlayer(p: PlayerState): PlayerState {
  return { ...p, pos: copyVec(p.pos), vel: copyVec(p.vel), wallNormal: p.wallNormal ? copyVec(p.wallNormal) : null };
}

/* Yaw 0 faces -z; yaw grows turning left. */
function forwardOf(yaw: number): Vec3 {
  return vec3(-Math.sin(yaw), 0, -Math.cos(yaw));
}

function rightOf(yaw: number): Vec3 {
  return vec3(Math.cos(yaw), 0, -Math.sin(yaw));
}

function wishDirection(input: InputFrame, yaw: number): Vec3 {
  const f = forwardOf(yaw);
  const r = rightOf(yaw);
  const d = vec3(f.x * input.moveZ + r.x * input.moveX, 0, f.z * input.moveZ + r.z * input.moveX);
  const len = Math.sqrt(d.x * d.x + d.z * d.z);
  if (len > 0) {
    d.x /= len;
    d.z /= len;
  }
  return d;
}

/* Quake-style acceleration: only adds speed along `wish` up to `speed`, so existing momentum is kept. */
function accelerate(p: PlayerState, wish: Vec3, speed: number, accel: number, dt: number): void {
  const current = p.vel.x * wish.x + p.vel.z * wish.z;
  const add = speed - current;
  if (add <= 0) return;
  const amount = Math.min(add, accel * dt * speed);
  p.vel.x += wish.x * amount;
  p.vel.z += wish.z * amount;
}

function applyFriction(p: PlayerState, friction: number, dt: number): void {
  const speed = horizontalSpeed(p.vel);
  if (speed < GROUND.stopSpeed) {
    p.vel.x = 0;
    p.vel.z = 0;
    return;
  }
  const scale = Math.max(0, speed - Math.max(speed, GROUND.frictionFloorSpeed) * friction * dt) / speed;
  p.vel.x *= scale;
  p.vel.z *= scale;
}

/* Side rays at probe height, right then left; returns the wall's outward normal. */
function probeWall(p: PlayerState, world: World): Vec3 | null {
  const origin = vec3(p.pos.x, p.pos.y + WALL_RUN.probeHeight, p.pos.z);
  const right = rightOf(p.yaw);
  for (const dir of [right, vec3(-right.x, 0, -right.z)]) {
    const hit = raycast(origin, dir, WALL_RUN.probeRange, world.boxes);
    if (hit && hit.normal.y === 0) return hit.normal;
  }
  return null;
}

function moveAxis(p: PlayerState, axis: Axis, delta: number, height: number, world: World): boolean {
  const r = sweepAxis(bodyBox(p.pos, BODY.radius, height), axis, delta, world.boxes);
  p.pos[axis] += r.moved;
  if (r.hit) p.vel[axis] = 0;
  return r.hit;
}

/* One fixed simulation step of player movement. Mutates `p`. */
export function stepPlayer(p: PlayerState, input: InputFrame, world: World, dt: number): void {
  p.yaw = input.yaw;
  p.pitch = Math.max(-LOOK.pitchLimit, Math.min(LOOK.pitchLimit, input.pitch));
  const wish = wishDirection(input, p.yaw);
  const speed = horizontalSpeed(p.vel);

  /* slide: crouching at speed on the ground boosts you, then friction is low until you slow down or stand */
  if (input.crouch && p.onGround && speed > SLIDE.minStartSpeed && !p.sliding) {
    p.sliding = true;
    const scale = Math.min(SLIDE.maxSpeed, speed * SLIDE.boost) / speed;
    p.vel.x *= scale;
    p.vel.z *= scale;
  }
  if (p.sliding && (!input.crouch || speed < SLIDE.endSpeed)) p.sliding = false;

  /* wall-run: airborne, beside a wall, fast enough and not still rising hard */
  p.wallRunning = false;
  p.wallNormal = null;
  if (!p.onGround) {
    const normal = probeWall(p, world);
    if (normal && speed > WALL_RUN.minSpeed && p.vel.y < WALL_RUN.maxUpSpeed) {
      p.wallRunning = true;
      p.wallNormal = normal;
      p.vel.y = Math.max(p.vel.y - WALL_RUN.extraFall * dt, -WALL_RUN.maxFallSpeed);
      addScaled(p.vel, normal, -WALL_RUN.stick * dt);
      if (input.jump && !p.jumpHeld) {
        addScaled(p.vel, normal, WALL_RUN.jumpPush);
        p.vel.y = WALL_RUN.jumpUp;
        addScaled(p.vel, forwardOf(p.yaw), WALL_RUN.jumpForward);
      }
    }
  }
  p.jumpHeld = input.jump;

  /* stand up only where there is headroom */
  const wantsCrouch = input.crouch || p.sliding;
  p.crouched = wantsCrouch || (p.crouched && overlapsAny(bodyBox(p.pos, BODY.radius, BODY.standHeight), world.boxes));

  if (p.onGround) {
    applyFriction(p, p.sliding ? SLIDE.friction : GROUND.friction, dt);
    const target = p.sliding ? 0 : p.crouched ? GROUND.crouchSpeed : input.sprint ? GROUND.sprintSpeed : GROUND.walkSpeed;
    if (target > 0) accelerate(p, wish, target, GROUND.accel, dt);
    if (input.jump) {
      p.vel.y = GROUND.jumpSpeed;
      p.onGround = false;
    }
  } else {
    accelerate(p, wish, AIR.speed, AIR.accel, dt);
    accelerate(p, wish, AIR.strafeSpeed, AIR.strafeAccel, dt);
  }

  /* physics: horizontal axes first, then gravity and the vertical sweep */
  const height = p.crouched ? BODY.crouchHeight : BODY.standHeight;
  moveAxis(p, 'x', p.vel.x * dt, height, world);
  moveAxis(p, 'z', p.vel.z * dt, height, world);
  p.vel.y -= (p.wallRunning ? WALL_RUN.gravity : GRAVITY) * dt;
  const falling = p.vel.y <= 0;
  const hitY = moveAxis(p, 'y', p.vel.y * dt, height, world);
  p.onGround = hitY && falling;
}
