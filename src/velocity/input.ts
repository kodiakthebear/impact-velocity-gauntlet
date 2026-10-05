import { BINDINGS, LOOK_RADIANS_PER_SENS } from '../config/controls.ts';
import { LOOK } from '../config/movement.ts';
import type { InputFrame } from '../sim/input.ts';

/* Collects keyboard and pointer-locked mouse input; the game samples it once per simulation tick. */
export class PlayerInput {
  private readonly held = new Set<string>();
  private yaw: number;
  private pitch = 0;
  private readonly radiansPerPixel: number;

  constructor(
    private readonly isLocked: () => boolean,
    sensitivity: number,
    initialYaw: number,
  ) {
    this.yaw = initialYaw;
    this.radiansPerPixel = sensitivity * LOOK_RADIANS_PER_SENS;
    document.addEventListener('keydown', (e) => {
      if (!this.isLocked()) return;
      this.held.add(e.code);
      if (e.code === 'Space' || e.code === 'ControlLeft') e.preventDefault();
    });
    document.addEventListener('keyup', (e) => this.held.delete(e.code));
    document.addEventListener('mousemove', (e) => {
      if (!this.isLocked()) return;
      this.yaw -= e.movementX * this.radiansPerPixel;
      this.pitch = Math.max(-LOOK.pitchLimit, Math.min(LOOK.pitchLimit, this.pitch - e.movementY * this.radiansPerPixel));
    });
    window.addEventListener('blur', () => this.release());
  }

  /* Drops held keys, e.g. when pointer lock is lost and keyups would be missed. */
  release(): void {
    this.held.clear();
  }

  get look(): { yaw: number; pitch: number } {
    return { yaw: this.yaw, pitch: this.pitch };
  }

  private down(codes: readonly string[]): boolean {
    return codes.some((c) => this.held.has(c));
  }

  sample(): InputFrame {
    return {
      moveX: (this.down(BINDINGS.right) ? 1 : 0) - (this.down(BINDINGS.left) ? 1 : 0),
      moveZ: (this.down(BINDINGS.forward) ? 1 : 0) - (this.down(BINDINGS.back) ? 1 : 0),
      sprint: this.down(BINDINGS.sprint),
      crouch: this.down(BINDINGS.crouch),
      jump: this.down(BINDINGS.jump),
      yaw: this.yaw,
      pitch: this.pitch,
    };
  }
}
