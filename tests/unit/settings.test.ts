import { describe, expect, it } from 'vitest';
import { SETTINGS_STORAGE_KEY } from '../../src/config/settings.ts';
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from '../../src/shared/settings.ts';

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    data,
  };
}

const throwingStorage = {
  getItem: (): string | null => {
    throw new Error('blocked');
  },
  setItem: (): void => {
    throw new Error('blocked');
  },
};

describe('settings', () => {
  it('defaults equal the legacy slider values', () => {
    expect(DEFAULT_SETTINGS).toEqual({ sens: 22, music: 30, sfx: 85 });
  });

  it('returns defaults with no storage, empty storage or storage that throws', () => {
    expect(loadSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(loadSettings(memoryStorage())).toEqual(DEFAULT_SETTINGS);
    expect(loadSettings(throwingStorage)).toEqual(DEFAULT_SETTINGS);
  });

  it('round-trips saved settings', () => {
    const storage = memoryStorage();
    saveSettings({ sens: 40, music: 0, sfx: 100 }, storage);
    expect(loadSettings(storage)).toEqual({ sens: 40, music: 0, sfx: 100 });
  });

  it('ignores corrupt data and clamps or rounds out-of-range values', () => {
    expect(loadSettings(memoryStorage({ [SETTINGS_STORAGE_KEY]: '{not json' }))).toEqual(DEFAULT_SETTINGS);
    const stored = JSON.stringify({ sens: 999, music: -5, sfx: 'loud' });
    expect(loadSettings(memoryStorage({ [SETTINGS_STORAGE_KEY]: stored }))).toEqual({ sens: 60, music: 0, sfx: 85 });
    expect(loadSettings(memoryStorage({ [SETTINGS_STORAGE_KEY]: '{"sens":22.6}' })).sens).toBe(23);
  });

  it('does not throw when saving to storage that throws', () => {
    expect(() => saveSettings(DEFAULT_SETTINGS, throwingStorage)).not.toThrow();
  });
});
