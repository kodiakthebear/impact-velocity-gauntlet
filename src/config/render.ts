/* Velocity's look, recreated from Impact's night-city arena. Colours are RGB in 0..1 unless noted. */
export type RGB = readonly [number, number, number];

export const NEON = {
  magenta: [1, 0.15, 0.55],
  cyan: [0.15, 0.85, 1],
  violet: [0.65, 0.3, 1],
  amber: [1, 0.55, 0.1],
} as const satisfies Record<string, RGB>;

export const RENDERER = {
  maxPixelRatio: 2,
  exposure: 1.2,
  background: 0x0a0e1c,
  fogColor: 0x0d1322,
  fogNear: 50,
  fogFar: 170,
};

export const CAMERA = {
  fov: 92,
  near: 0.05,
  far: 220,
};

export const LIGHTS = {
  ambient: { color: 0x8fa3cf, intensity: 0.85 },
  hemisphere: { sky: 0x7d95c9, ground: 0x2a2f42, intensity: 0.7 },
  moon: {
    color: 0xb8ccff,
    intensity: 0.9,
    position: [30, 52, 20] as const,
    shadowMapSize: 2048,
    shadowExtent: 45,
    shadowNear: 5,
    shadowFar: 140,
    shadowBias: -0.0004,
  },
};

export const SURFACE = { roughness: 0.85, metalness: 0.15 };
export const NEON_SURFACE = { baseScale: 0.2, intensity: 1.6, roughness: 0.4 };
/* Neon trim strips sit just proud of the surface they decorate. */
export const STRIP = { thickness: 0.07, width: 0.3, lift: 0.04 };

/* First-person camera feel, from Impact: FOV kick at speed and while sliding, roll on strafe and wall-run. */
export const FPS_CAMERA = {
  eyeHeight: 1.6,
  crouchEyeDrop: 0.7,
  eyeSmoothing: 10,
  fovSpeedThreshold: 10,
  fovSpeedBoost: 6,
  fovSlideBoost: 6,
  fovSmoothing: 10,
  strafeRoll: 0.0035,
  wallRunRoll: 0.18,
  slideRoll: -0.06,
  rollSmoothing: 8,
};
