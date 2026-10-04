import { loadSettings, saveSettings, type Settings } from '../shared/settings.ts';

/* Mode selector: the mode links are plain anchors; this only wires the shared settings sliders. */
const settings = loadSettings();
const keys: (keyof Settings)[] = ['sens', 'music', 'sfx'];

for (const key of keys) {
  const input = document.getElementById(key);
  if (!(input instanceof HTMLInputElement)) continue;
  input.value = String(settings[key]);
  input.addEventListener('input', () => {
    settings[key] = Number.parseInt(input.value, 10);
    saveSettings(settings);
  });
}
