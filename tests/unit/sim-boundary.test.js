import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/* CLAUDE.md architecture rule: src/sim must stay runnable without a browser and deterministic. */
const SIM_DIR = resolve(import.meta.dirname, '../../src/sim');
const FORBIDDEN = [
  ['three.js', /from\s+['"]three|import\(\s*['"]three|\bTHREE\./],
  ['the DOM', /\b(document|window|HTMLElement|requestAnimationFrame|localStorage)\b/],
  ['Web Audio', /\b(AudioContext|webkitAudioContext|Audio|speechSynthesis)\b/],
  ['Math.random', /Math\.random/],
  ['wall-clock time', /\b(performance\.now|Date\.now|new Date)\b/],
  ['imports from outside sim/ and config/', /from\s+['"]\.\.\/(?!config\/)/],
];

function sourceFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? sourceFiles(join(dir, e.name)) : /\.(ts|js)$/.test(e.name) ? [join(dir, e.name)] : [],
  );
}

describe('src/sim boundary', () => {
  const files = sourceFiles(SIM_DIR);

  it('has source files to check', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    it(`${file.slice(SIM_DIR.length + 1)} uses none of the forbidden APIs`, () => {
      const code = readFileSync(file, 'utf8');
      const hits = FORBIDDEN.filter(([, re]) => re.test(code)).map(([name]) => name);
      expect(hits).toEqual([]);
    });
  }
});
