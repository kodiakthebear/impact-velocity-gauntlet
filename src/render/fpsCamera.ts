import type * as THREE from 'three';
import { CAMERA, FPS_CAMERA } from '../config/render.ts';
import type { PlayerState } from '../sim/player.ts';
import type { Vec3 } from '../sim/vec.ts';

/* First-person camera with Impact's feel: smoothed crouch eye height, FOV kick at speed and in slides,
   roll on strafe and wall-run. Presentation only; smoothing runs per rendered frame. */
export class FpsCamera {
  private crouchAmount = 0;
  private roll = 0;

  constructor(private readonly camera: THREE.PerspectiveCamera) {
    camera.rotation.order = 'YXZ';
  }

  update(feet: Vec3, player: PlayerState, yaw: number, pitch: number, dt: number): void {
    const c = FPS_CAMERA;
    const crouchTarget = player.crouched ? 1 : 0;
    this.crouchAmount += (crouchTarget - this.crouchAmount) * Math.min(1, dt * c.eyeSmoothing);
    this.camera.position.set(feet.x, feet.y + c.eyeHeight - this.crouchAmount * c.crouchEyeDrop, feet.z);

    const v = player.vel;
    const sideways = v.x * Math.cos(yaw) - v.z * Math.sin(yaw);
    let rollTarget = -sideways * c.strafeRoll;
    const n = player.wallNormal;
    if (player.wallRunning && n) rollTarget += (n.x * Math.cos(yaw) - n.z * Math.sin(yaw)) > 0 ? -c.wallRunRoll : c.wallRunRoll;
    if (player.sliding) rollTarget += c.slideRoll;
    this.roll += (rollTarget - this.roll) * Math.min(1, dt * c.rollSmoothing);
    this.camera.rotation.set(pitch, yaw, this.roll);

    const speed = Math.sqrt(v.x * v.x + v.z * v.z);
    const fovTarget = CAMERA.fov + (speed > c.fovSpeedThreshold ? c.fovSpeedBoost : 0) + (player.sliding ? c.fovSlideBoost : 0);
    this.camera.fov += (fovTarget - this.camera.fov) * Math.min(1, dt * c.fovSmoothing);
    this.camera.updateProjectionMatrix();
  }
}
