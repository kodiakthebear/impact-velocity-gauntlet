import { test, expect, type Page } from '@playwright/test';
import type { EncodedInput } from '../../src/sim/input.ts';
import type { PlayerState } from '../../src/sim/player.ts';
import { hashSimState } from '../../src/sim/hash.ts';
import { runInputs } from '../../src/sim/replay.ts';
import { sandboxWorld } from '../../src/sim/world.ts';

/* Velocity in a real browser. Headless Chromium cannot take pointer lock, so it is emulated: requesting
   it locks the canvas and fires pointerlockchange, as a real browser does. Esc is emulated by exitPointerLock. */

interface Capture {
  inputs: EncodedInput[];
  tick: number;
  hash: string;
  player: PlayerState;
}

async function emulatePointerLock(page: Page): Promise<void> {
  await page.addInitScript(() => {
    let locked: Element | null = null;
    const changed = (): void => void setTimeout(() => document.dispatchEvent(new Event('pointerlockchange')));
    Object.defineProperty(Document.prototype, 'pointerLockElement', { configurable: true, get: () => locked });
    Element.prototype.requestPointerLock = function (this: Element) {
      locked = this;
      changed();
      return Promise.resolve();
    } as typeof Element.prototype.requestPointerLock;
    Document.prototype.exitPointerLock = function () {
      locked = null;
      changed();
    };
  });
}

const capture = (page: Page): Promise<Capture> =>
  page.evaluate(() => (window as unknown as { __velocity: { capture: () => Capture } }).__velocity.capture());

test.beforeEach(async ({ page }) => {
  await emulatePointerLock(page);
  await page.goto('/velocity.html?debug');
  await expect(page.locator('#overlay')).toBeVisible();
  await page.locator('#play').click();
  await expect(page.locator('#overlay')).toBeHidden();
});

test('playing moves the player, and the inputs the page recorded replay to the identical state in Node', async ({ page }) => {
  await page.keyboard.down('KeyW');
  await page.keyboard.down('ShiftLeft');
  await page.waitForTimeout(600);
  await page.keyboard.press('Space');
  await page.evaluate(() => {
    for (let i = 0; i < 20; i++) document.dispatchEvent(new MouseEvent('mousemove', { movementX: 6, movementY: -2 }));
  });
  await page.waitForTimeout(600);
  await page.keyboard.up('ShiftLeft');
  await page.keyboard.up('KeyW');
  await expect(page.locator('#speed')).not.toHaveText('0.0 m/s');

  const browser = await capture(page);
  expect(browser.tick).toBeGreaterThan(30);
  expect(browser.inputs).toHaveLength(browser.tick);
  expect(browser.player.pos.z).toBeLessThan(sandboxWorld().spawn.position.z - 3); /* really moved */
  expect(new Set(browser.inputs.map((i) => i[3])).size).toBeGreaterThan(1); /* mouse look was recorded */

  const node = runInputs(sandboxWorld(), browser.inputs);
  expect(hashSimState(node)).toBe(browser.hash);
  expect(node.player).toEqual(browser.player);
});

test('losing pointer lock (Esc) pauses: overlay offers RESUME and the simulation stops', async ({ page }) => {
  await page.waitForTimeout(300);
  await page.evaluate(() => document.exitPointerLock());
  await expect(page.locator('#overlay')).toBeVisible();
  await expect(page.locator('#play')).toHaveText('RESUME');
  const paused = (await capture(page)).tick;
  await page.waitForTimeout(500);
  expect((await capture(page)).tick).toBe(paused);
  await page.locator('#play').click();
  await expect(page.locator('#overlay')).toBeHidden();
  await expect.poll(async () => (await capture(page)).tick).toBeGreaterThan(paused);
});

test('the pause overlay returns to the mode selector', async ({ page }) => {
  await page.evaluate(() => document.exitPointerLock());
  await page.locator('#back').click();
  await expect(page).toHaveURL(/\/$/);
});
