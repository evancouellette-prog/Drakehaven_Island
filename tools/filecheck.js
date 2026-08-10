/* Prove the single-file build plays with NO server at all — the double-click path.

   The multi-file game needs a server, because browsers refuse cross-file reads
   over file://. The whole point of dist/drakehaven-island.html is that it does
   not: one file, opened straight off the disk. This verifies that claim, and
   also that the game survives a sandbox with localStorage taken away, which is
   what an embedded or restricted host looks like.

   Run:  node tools/filecheck.js
*/
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright-core');

const ROOT = path.join(__dirname, '..');
let failures = 0;
const ok = (c, m) => { if (!c) { failures++; console.log('  FAIL  ' + m); } else console.log('  ok    ' + m); };

(async () => {
  const exe = ['/opt/pw-browsers/chromium/chrome-linux/chrome',
    '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell']
    .find(p => fs.existsSync(p));
  const browser = await chromium.launch({
    executablePath: exe,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--mute-audio',
           '--autoplay-policy=no-user-gesture-required']
  });

  /* ---------- 1. straight off the disk, no server ---------- */
  console.log('\n=== file:// with no server ===');
  const page = await browser.newPage({ viewport: { width: 1280, height: 760 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  const file = 'file://' + path.join(ROOT, 'dist/drakehaven-island.html');
  await page.goto(file);
  await page.waitForFunction(() => window.DH && DH.game && DH.game.current(), null, { timeout: 15000 });

  ok(await page.locator('#screen').isVisible(), 'the canvas is on screen');
  const boot = await page.evaluate(() => ({
    scene: DH.game.current().name,
    races: DH.RACES.length,
    classes: DH.CLASSES.length,
    maps: Object.keys(DH.MAPS).length,
    monsters: Object.keys(DH.MONSTERS).length,
    companions: DH.COMPANIONS.length,
    beats: Object.keys(DH.STORY).length
  }));
  ok(boot.scene === 'title', 'it boots to the title screen (' + boot.scene + ')');
  ok(boot.classes === 12, 'all 12 classes loaded (' + boot.classes + ')');
  ok(boot.races >= 9, boot.races + ' races loaded');
  ok(boot.maps >= 30, boot.maps + ' maps loaded');
  ok(boot.monsters >= 30, boot.monsters + ' monsters loaded');
  ok(boot.companions === 5, boot.companions + ' companions loaded');
  ok(boot.beats >= 20, boot.beats + ' story beats loaded');

  /* the title screen must actually start a game: New Game -> pick a slot */
  const newGame = page.locator('button:has-text("New Game"), .tb:has-text("New Game")').first();
  await newGame.waitFor({ state: 'visible', timeout: 8000 });
  await newGame.click();
  await page.waitForTimeout(300);
  const slot = page.locator('.slot').first();
  await slot.waitFor({ state: 'visible', timeout: 8000 });
  await slot.click();
  await page.waitForTimeout(500);
  ok((await page.evaluate(() => DH.game.current().name)) === 'charcreate',
     'New Game -> slot reaches character creation');

  /* build a party the way the game does, and confirm it is playable */
  const party = await page.evaluate(() => {
    const pc = DH.char.create({ raceId: 'human', classId: 'fighter', backgroundId: 'sailor',
                                name: 'Filecheck', level: 3 });
    DH.char.derive(pc);
    return [pc].concat(DH.COMPANIONS.map(DH.char.fromCompanion))
      .map(c => ({ name: c.name, cls: c.className, lv: c.level, hp: c.hp, ac: c.ac }));
  });
  ok(party.length === 6, 'a full party of six (' + party.length + ')');
  ok(party.every(c => c.lv === 3), 'everyone starts at level 3');
  ok(party.every(c => c.hp > 0 && c.ac > 0), 'everyone has hit points and an AC');

  /* the dice engine is the whole game — it must work off the disk too */
  const rolls = await page.evaluate(() => {
    const out = [];
    for (let i = 0; i < 200; i++) out.push(DH.dice.roll('1d20').total);
    return { min: Math.min(...out), max: Math.max(...out), n: out.length };
  });
  ok(rolls.min >= 1 && rolls.max <= 20, '200 d20 rolls stay in range (' + rolls.min + '–' + rolls.max + ')');

  ok(errors.length === 0, 'no console errors over file:// ' + (errors.length ? JSON.stringify(errors.slice(0, 3)) : ''));
  await page.close();

  /* ---------- 2. the same file with localStorage denied ---------- */
  console.log('\n=== localStorage taken away ===');
  const p2 = await browser.newPage({ viewport: { width: 1280, height: 760 } });
  const e2 = [];
  p2.on('pageerror', e => e2.push('pageerror: ' + e.message));
  p2.on('console', m => { if (m.type() === 'error') e2.push('console: ' + m.text()); });
  await p2.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() { throw new DOMException('denied', 'SecurityError'); }
    });
  });
  await p2.goto(file);
  await p2.waitForFunction(() => window.DH && DH.game && DH.game.current(), null, { timeout: 15000 });
  ok((await p2.evaluate(() => DH.game.current().name)) === 'title',
     'still boots with storage blocked');
  const saveTried = await p2.evaluate(() => {
    try { DH.save.write(1, { probe: true }); return 'returned'; }
    catch (e) { return 'threw: ' + e.message; }
  });
  ok(saveTried === 'returned', 'saving degrades quietly instead of throwing (' + saveTried + ')');
  ok(e2.length === 0, 'no console errors with storage blocked ' + (e2.length ? JSON.stringify(e2.slice(0, 3)) : ''));
  await p2.close();

  await browser.close();
  console.log('\n' + '='.repeat(52));
  console.log(failures === 0 ? 'SINGLE-FILE BUILD PLAYS WITH NO SERVER'
                             : failures + ' CHECKS FAILED');
  console.log('='.repeat(52));
  process.exit(failures === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
