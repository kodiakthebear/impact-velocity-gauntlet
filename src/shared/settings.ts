import { SETTINGS_RANGES, SETTINGS_STORAGE_KEY } from '../config/settings.ts';

export interface Settings {
  sens: number;
  music: number;
  sfx: number;
}

type SettingsStorage = Pick<Storage, 'getItem' | 'setItem'>;

export const DEFAULT_SETTINGS: Readonly<Settings> = {
  sens: SETTINGS_RANGES.sens.default,
  music: SETTINGS_RANGES.music.default,
  sfx: SETTINGS_RANGES.sfx.default,
};

/* localStorage can be missing or throw (private mode, blocked site data); settings then live for the page only. */
function browserStorage(): SettingsStorage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function sanitize(key: keyof Settings, value: unknown): number {
  const range = SETTINGS_RANGES[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) return range.default;
  return Math.min(range.max, Math.max(range.min, Math.round(value)));
}

export function loadSettings(storage: SettingsStorage | null = browserStorage()): Settings {
  let raw: Record<string, unknown> = {};
  try {
    const text = storage?.getItem(SETTINGS_STORAGE_KEY);
    const parsed: unknown = text ? JSON.parse(text) : null;
    if (parsed && typeof parsed === 'object') raw = parsed as Record<string, unknown>;
  } catch {
    /* unreadable or corrupt: fall back to defaults */
  }
  return {
    sens: sanitize('sens', raw.sens),
    music: sanitize('music', raw.music),
    sfx: sanitize('sfx', raw.sfx),
  };
}

export function saveSettings(settings: Settings, storage: SettingsStorage | null = browserStorage()): void {
  try {
    storage?.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* storage full or blocked: keep the in-page values */
  }
}
