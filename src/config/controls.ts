/* Velocity key bindings (KeyboardEvent.code) and mouse look. */
export const BINDINGS = {
  forward: ['KeyW'],
  back: ['KeyS'],
  left: ['KeyA'],
  right: ['KeyD'],
  sprint: ['ShiftLeft', 'ShiftRight'],
  crouch: ['KeyC', 'ControlLeft'],
  jump: ['Space'],
} as const;

/* Radians per mouse pixel per unit of the shared sensitivity setting (Impact's scale: 22 → 0.0022). */
export const LOOK_RADIANS_PER_SENS = 0.0001;
