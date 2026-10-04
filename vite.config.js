import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

const root = import.meta.dirname;

export default defineConfig({
  build: {
    /* each mode bundles three.js r128 (~600 kB minified) */
    chunkSizeWarningLimit: 700,
    rolldownOptions: {
      input: {
        main: resolve(root, 'index.html'),
        impact: resolve(root, 'impact.html'),
        velocity: resolve(root, 'velocity.html'),
      },
    },
  },
  test: {
    include: ['tests/unit/**/*.test.{js,ts}'],
  },
});
