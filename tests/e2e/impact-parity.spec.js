import { test, expect } from '@playwright/test';
import { openLegacy, openImpact, runScenario, scenario } from './helpers/determinism.js';

/* Proves Impact (impact.html) behaves exactly like legacy/impact-velocity.html:
   both run the same scripted inputs on a seeded RNG and a virtual 60 Hz clock,
   and every per-frame snapshot (player, bots, weapons, powers, match, camera,
   viewmodel, fx counts, HUD markup, sliders, minimap pixels, RNG call count) must match. */

const SEED = 20261005;

test.use({ viewport: { width: 320, height: 240 } });
/* each test drives two 600-1800 frame runs with real rendering; CI's software WebGL is slow */
test.describe.configure({ timeout: 900000 });

const movementAndWeapons = scenario(900)
  .click('#btnFFA', 5)
  .key('KeyW', 10, 200).key('ShiftLeft', 40, 150).look(20, 80, 3, 0)
  .tap('Space', 100).key('KeyC', 130, 160).tap('KeyQ', 170)
  .mouse(0, 210, 300).look(210, 300, 0, -1)
  .tap('KeyR', 310)
  .mouse(2, 420, 470).mouse(0, 430, 432)
  .key('KeyW', 540, 900).key('KeyD', 600, 800).look(540, 700, -2, 0)
  .tap('Space', 620).tap('Space', 680).tap('Space', 740)
  /* bots kill the player at ~443 and they respawn at ~624; swap weapons after that */
  .tap('Digit2', 650).mouse(0, 660, 662).mouse(0, 672, 674).tap('Digit1', 690).tap('KeyV', 700)
  .mouse(0, 760, 820)
  .build();

const shotgunTeamMatch = scenario(600)
  .click('.wsel[data-w="shotgun"]', 3)
  .click('#btnTDM', 5)
  .key('KeyA', 10, 200).key('KeyS', 220, 400).look(10, 120, 4, 1)
  .mouse(0, 20, 22).mouse(0, 60, 62).mouse(0, 100, 102).mouse(0, 140, 142)
  .tap('KeyR', 310).mouse(2, 420, 500).mouse(0, 450, 452)
  .build();

/* Forces kills to walk through every streak reward, then death, respawn and match end.
   Bots respawn 3 s after dying, so kills come in waves; untilStreak caps each phase. */
const streaksAndLifecycle = scenario(1800)
  .click('.wsel[data-w="sniper"]', 3)
  .click('#btnFFA', 5)
  .mouse(2, 20, 60)                                          /* sniper scope */
  .killsUntil(3, 80, 140, 4).key('KeyE', 100, 150)           /* grapple */
  .killsUntil(10, 150, 310, 4)
  .tap('KeyG', 320).mouse(0, 330, 332).mouse(0, 350, 352)    /* gunslinger */
  .killsUntil(15, 380, 560, 4)
  .tap('KeyH', 580)                                          /* rain hell */
  .killsUntil(20, 600, 900, 4)                               /* sabre: katana, wall-run */
  .key('KeyW', 900, 1000).key('ShiftLeft', 900, 1000).tap('Space', 930).tap('Space', 960)
  .mouse(0, 920, 922).mouse(0, 940, 942)
  .tap('Digit1', 1010).tap('Digit3', 1020)
  .hurt(200, 1040)                                           /* death, respawn after 3 s */
  .killsUntil(99, 1240, 1700, 4)                             /* reach 30 kills: match over */
  .click('#btnBack', 1750)
  .build();

async function trace(browser, open, scn){
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await open(page, SEED);
  const frames = await runScenario(page, scn);
  await ctx.close();
  expect(errors).toEqual([]);
  return frames;
}

function expectSameTrace(actual, expected){
  expect(actual.length).toBe(expected.length);
  for (let i = 0; i < expected.length; i++) {
    expect(actual[i], `frame ${i}`).toEqual(expected[i]);
  }
}

test('harness is deterministic: legacy run twice gives identical traces', async ({ browser }) => {
  const a = await trace(browser, openLegacy, movementAndWeapons);
  const b = await trace(browser, openLegacy, movementAndWeapons);
  expectSameTrace(b, a);
});

/* Guards against a vacuous pass: each scenario must actually exercise what it is there to cover.
   Indexes follow the snapshot layout in helpers/determinism.js. */
const COVERAGE = {
  movementAndWeapons: {
    'sprint over 10 m/s': s => Math.hypot(s.P.vel[0], s.P.vel[2]) > 10,
    'slide': s => s.P.sliding,
    'airborne': s => !s.P.onGround,
    'dash cooldown': s => s.weapon[8] > 0,
    'reload': s => s.weapon[3] > 0,
    'aim down sights': s => s.weapon[5] > 0.5,
    'pistol': s => s.weapon[0] === 'pistol',
    'knife': s => s.weapon[7] > 0,
    'tracers': s => s.fx[2] > 0,
    'player damaged': s => s.P.hp < 100,
  },
  shotgunTeamMatch: {
    'team deathmatch': s => s.match[0] === 'tdm',
    'shotgun flip': s => s.weapon[4] > 0,
    'reload': s => s.weapon[3] > 0,
    'blue team bots': s => s.bots.some(b => b.team === 'blue'),
  },
  streaksAndLifecycle: {
    'sniper scope': s => s.box[4].includes('block'),
    'grapple earned': s => s.powers[0],
    'grapple anchored': s => s.powers[1] !== null,
    'UAV minimap drawn': s => s.minimap !== null,
    'gunslinger equipped': s => s.weapon[0] === 'six',
    'rain hell active': s => s.powers[6] > 0,
    'sabre': s => s.powers[7],
    'katana': s => s.weapon[2],
    'katana swing': s => s.weapon[6] > 0,
    'ammo pickups': s => s.fx[3] > 0,
    'ragdolls and gore': s => s.fx[0] > 0 && s.fx[1] > 0,
    'death cam': s => !s.P.alive && s.box.length && s.leaf[10].startsWith('TERMINATED BY'),
    'respawned after death': (s, i, f) => s.P.alive && f.slice(0, i).some(p => !p.P.alive),
    'results table': s => s.state === 'results' && s.leaf[13].includes('<tbody>'),
    'back on the menu after the match': (s, i, f) => s.state === 'menu' && f.slice(0, i).some(p => p.state === 'results'),
  },
};

for (const [name, scn] of Object.entries({ movementAndWeapons, shotgunTeamMatch, streaksAndLifecycle })) {
  test(`Impact matches legacy frame by frame: ${name}`, async ({ browser }) => {
    const legacy = await trace(browser, openLegacy, scn);
    const missing = Object.entries(COVERAGE[name]).filter(([, seen]) => !legacy.some(seen)).map(([what]) => what);
    expect(missing, 'scenario must exercise what it claims').toEqual([]);
    const impact = await trace(browser, openImpact, scn);
    expectSameTrace(impact, legacy);
  });
}
