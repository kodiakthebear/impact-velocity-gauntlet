import { test, expect } from '@playwright/test';

/* Smoke tests on the production build: every page loads cleanly, the modes run, and navigation works both ways. */

test.beforeEach(async ({ page }, testInfo) => {
  const problems = [];
  testInfo.problems = problems;
  /* Impact streams the Wilhelm scream from Wikimedia; keep tests offline and deterministic. */
  await page.route('https://upload.wikimedia.org/**', route => route.abort());
  page.on('pageerror', e => problems.push(`pageerror: ${e.message}`));
  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.location().url.startsWith('https://upload.wikimedia.org/')
        && !msg.text().includes('net::ERR_FAILED')) problems.push(`console: ${msg.text()}`);
  });
});

test.afterEach(async ({}, testInfo) => {
  expect(testInfo.problems).toEqual([]);
});

test('mode selector offers both modes', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#modeImpact')).toContainText('IMPACT');
  await expect(page.locator('#modeVelocity')).toContainText('VELOCITY');
});

test('Impact opens from the selector and runs a match', async ({ page }) => {
  /* count real animation frames: on CI's software renderer the match clock can crawl, so frames are the honest signal */
  await page.addInitScript(() => {
    window.__frames = 0;
    const raf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = cb => raf(t => { window.__frames++; cb(t); });
  });
  await page.goto('/');
  await page.locator('#modeImpact').click();
  await expect(page).toHaveURL(/\/impact\.html$/);
  await page.locator('#btnTDM').click();
  await expect(page.locator('#hud')).toBeVisible();
  await expect(page.locator('#topbar')).toHaveText(/^TDM · \d:\d\d · BLU \d+ — \d+ RED$/);
  const frames = () => page.evaluate(() => window.__frames);
  const start = await frames();
  await expect.poll(frames, { timeout: 20000 }).toBeGreaterThan(start + 5); /* game loop keeps running */
});

test('Impact returns to the selector with MODE SELECT', async ({ page }) => {
  await page.goto('/impact.html');
  await page.locator('#btnModes').click();
  await expect(page).toHaveURL(/\/$/);
});

test('Velocity opens from the selector, renders the sandbox and offers to play', async ({ page }) => {
  await page.goto('/');
  await page.locator('#modeVelocity').click();
  await expect(page).toHaveURL(/\/velocity\.html$/);
  await expect(page.locator('#view canvas')).toBeVisible();
  await expect(page.locator('#play')).toHaveText('CLICK TO PLAY');
  await expect(page.locator('#frameTime')).not.toContainText('--'); /* render loop is running */
});

test('Velocity returns to the selector from its overlay', async ({ page }) => {
  await page.goto('/velocity.html');
  await page.locator('#back').click();
  await expect(page).toHaveURL(/\/$/);
});

test('settings changed on the selector carry into Impact, and back', async ({ page }) => {
  await page.goto('/');
  await page.locator('#sens').fill('40');
  await page.locator('#sfx').fill('10');
  await page.goto('/impact.html');
  await expect(page.locator('#sens')).toHaveValue('40');
  await expect(page.locator('#sens2')).toHaveValue('40');
  await expect(page.locator('#sfxv')).toHaveValue('10');
  await page.locator('#musv').fill('70');
  await page.goto('/');
  await expect(page.locator('#music')).toHaveValue('70');
  await expect(page.locator('#sens')).toHaveValue('40');
});
