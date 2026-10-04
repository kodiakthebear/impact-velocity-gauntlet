/* Player settings shared by both modes. Defaults are the legacy slider values. */
export const SETTINGS_STORAGE_KEY = 'impact-velocity.settings';

export const SETTINGS_RANGES = {
  sens: { min: 5, max: 60, default: 22 },
  music: { min: 0, max: 100, default: 30 },
  sfx: { min: 0, max: 100, default: 85 },
} as const;
