import { defineConfig, devices } from '@playwright/test';

/* e2e runs against the production build served by `vite preview`. */
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    ...devices['Desktop Chrome'],
  },
  /* Parity traces are CPU-heavy (software WebGL); running them alongside the smoke tests starves page loads.
     Smoke runs first, parity after it. */
  projects: [
    /* page loads and a running match are slow under CI's software WebGL */
    { name: 'smoke', testMatch: /smoke\.spec\.js/, timeout: 60000 },
    { name: 'parity', testMatch: /parity\.spec\.js/, dependencies: ['smoke'] },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
