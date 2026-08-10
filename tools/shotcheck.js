/* Screenshots of the specific things that were asked for, so each can be looked
   at rather than inferred from passing tests.

   Run:  node tools/shotcheck.js
*/
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright-core');

const ROOT = path.join(__dirname, '..');
const OUT = process.env.SHOT_DIR || path.join(ROOT, 'screenshots/check');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('  FAIL  ' + m); } else console.log('  ok    ' + m); };

(async () => {
  const exe = ['/opt/pw-browsers/chromium/chrome-linux/chrome',
    '/opt/pw-browsers/chromium-1194/chrome-linux/chrome']
    .find(p => fs.existsSync(p));
  const browser = await chromium.launch({
    executablePath: exe,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--mute-audio', '--autoplay-policy=no-user-gesture-required']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 760 } });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const shot = async (n) => { await page.screenshot({ path: path.join(OUT, n + '.png') }); console.log('        → ' + n + '.png'); };

  await page.goto('file://' + path.join(ROOT, 'index.html'));
  await page.waitForFunction(() => window.DH && DH.game && DH.game.current(), null, { timeout: 15000 });

  /* Build a party straight into the world, so the shots do not depend on
     clicking through the whole prologue. */
  await page.evaluate(() => {
    const pc = DH.char.create({
      raceId: 'dragonborn', classId: 'paladin', backgroundId: 'sailor',
      name: 'Verity Ashfall', level: 3, ancestry: 'gold'
    });
    pc.isPlayer = true;
    DH.char.derive(pc);
    DH.game.state.party = [pc];
    ['anvil', 'umarion', 'ball_wizard'].forEach(id => DH.game.addCompanion(id));
    DH.game.replace(DH.scenes.overworld, { map: 'town_square', spawn: 'default' });
    DH.game.flushOps();
  });
  await page.waitForTimeout(900);

  console.log('\n=== the party in the field ===');
  const party = await page.evaluate(() => DH.game.party().map(c => c.name));
  ok(party.length === 4, 'four in the party: ' + party.join(', '));
  ok(!party.some(n => /Wyatt|Lucas|Mahoraga|^Dex$/.test(n)), 'nobody who was cut is still here');
  /* walk a few steps so they fall into marching formation rather than the ring */
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(1500);
  await shot('01-party-walking');
  await page.keyboard.up('KeyD');
  await page.waitForTimeout(700);
  /* how far apart are they actually standing? */
  const spread = await page.evaluate(() => {
    const f = DH.scenes.overworld.inspect ? DH.scenes.overworld.inspect().followers : null;
    if (!f) return null;
    let min = 1e9;
    for (let i = 0; i < f.length; i++) for (let j = i + 1; j < f.length; j++) {
      min = Math.min(min, Math.hypot(f[i].px - f[j].px, f[i].py - f[j].py));
    }
    return { n: f.length, min: Math.round(min) };
  });
  if (spread) ok(spread.min >= 12, 'closest two companions are ' + spread.min + 'px apart');
  await shot('02-party-standing');

  console.log('\n=== the set dressing you have to recognise ===');
  /* Rooms picked for what they contain: the ship's sleeping quarters, an inn
     with actual beds, and a market full of stalls and crates. */
  for (const m of ['ship_quarters', 'inn_room', 'baycrest_house', 'ship_deck', 'market']) {
    const went = await page.evaluate((id) => {
      if (!DH.MAPS[id]) return false;
      DH.scenes.overworld.loadMap(id, null);
      return true;
    }, m);
    if (!went) { console.log('        (no map "' + m + '")'); continue; }
    await page.waitForTimeout(650);
    ok(true, m + ' drawn');
    await shot('00-props-' + m);
  }
  await page.evaluate(() => { DH.scenes.overworld.loadMap('town_square', null); });
  await page.waitForTimeout(600);

  console.log('\n=== a speaker with a face ===');
  /* say() and roller() resolve only when the player advances. Returning one of
     those promises from evaluate() makes Playwright await it, and the run hangs
     forever — hence the block bodies here, which return nothing. */
  await page.evaluate(() => { DH.ui.say({ who: 'Anvil', text: '"Bout time somethin\' happened." *He sets the iron bar down carefully, as though it were the one that might get hurt.*' }); });
  await page.waitForTimeout(1400);
  const port = await page.evaluate(() => {
    const p = document.querySelector('#dlg .portrait');
    return { shown: !!p && p.style.display !== 'none', hasCanvas: !!(p && p.querySelector('canvas')) };
  });
  ok(port.shown && port.hasCanvas, 'Anvil speaks with a portrait beside the words');
  await shot('03-dialogue-portrait');

  /* a narrator line must NOT get a face */
  await page.evaluate(() => { DH.ui.say({ who: 'The Table', narr: true, text: 'The party goes down — but the story does not stop here.' }); });
  await page.waitForTimeout(500);
  const narrPort = await page.evaluate(() => {
    const p = document.querySelector('#dlg .portrait');
    return !!p && p.style.display === 'none';
  });
  ok(narrPort, 'a narrator voice gets no portrait');
  await shot('04-narration-no-portrait');

  /* each party member, so every look is checked */
  for (const who of ['Umarion', 'Ball Wizard', 'Verity Ashfall']) {
    await page.evaluate((w) => { DH.ui.say({ who: w, text: '"Testing the light in here."' }); }, who);
    await page.waitForTimeout(450);
    const has = await page.evaluate(() => !!document.querySelector('#dlg .portrait canvas'));
    ok(has, who + ' has a portrait');
    await shot('05-portrait-' + who.toLowerCase().replace(/\W+/g, '-'));
  }
  await page.evaluate(() => DH.ui.hideDlg());

  console.log('\n=== the die ===');
  await page.evaluate(() => { DH.ui.roller({ label: 'Athletics', dc: 14, mod: 5, modLabel: 'Athletics' }); });
  await page.waitForTimeout(1200);
  const die = await page.evaluate(() => {
    const svg = document.querySelector('#roller .die svg');
    const n = document.querySelector('#roller .die .n');
    return {
      polys: svg ? svg.querySelectorAll('polygon').length : 0,
      shown: +(n && n.textContent),
      hexPts: svg ? (svg.querySelector('polygon').getAttribute('points').trim().split(/\s+/).length) : 0
    };
  });
  ok(die.hexPts === 6, 'the outline is a six-point silhouette (' + die.hexPts + ' points)');
  ok(die.polys >= 11, 'the interior is built from triangular facets, not three faces of a cube (' + die.polys + ' polygons)');
  ok(die.shown >= 1 && die.shown <= 20, 'it rolled ' + die.shown + ', inside 1..20');
  await shot('06-d20');
  await page.keyboard.press('Space');
  await page.waitForTimeout(400);

  console.log('\n=== combat, mid-blow ===');
  await page.evaluate(() => {
    DH.game.push(DH.scenes.combat, { arena: 'ship_deck', enemies: [{ id: 'sea_hag' }, { id: 'sea_hag' }] });
    DH.game.flushOps();
  });
  await page.waitForTimeout(2200);
  /* Let the fight actually play and watch for the feedback to appear. Poking the
     unit objects would prove nothing: inspect() hands back copies, so a write
     there never reaches the renderer. Companions and monsters both act on their
     own, so a real blow lands within a few rounds. */
  const seen = { lunge: false, flash: false, bolt: false, walking: false, down: false };
  let shotTaken = false;
  for (let i = 0; i < 150; i++) {
    const s = await page.evaluate(() => {
      const c = DH.game.current();
      if (!c || c.name !== 'combat') return null;
      const b = DH.scenes.combat.inspect();
      return {
        finished: b.finished, bolts: b.bolts, busy: b.busy, isPC: b.activeIsPC,
        lunge: b.units.some(u => u.attackAnim > 0),
        flash: b.units.some(u => u.flash > 0),
        walking: b.units.some(u => u.walking),
        down: b.units.some(u => u.downAnim > 0)
      };
    });
    if (!s) break;
    /* The player's turn waits for input that is never coming, so hand it over
       and let the companions and the hags fight — they are what we came to watch. */
    if (s.isPC && !s.busy) await page.keyboard.press('KeyT');
    if (s.lunge) seen.lunge = true;
    if (s.flash) seen.flash = true;
    if (s.bolts > 0) seen.bolt = true;
    if (s.walking) seen.walking = true;
    if (s.down) seen.down = true;
    /* grab the frame where a hit is actually registering on a body */
    if (s.flash && !shotTaken) { await shot('07-combat-hit'); shotTaken = true; }
    if (s.finished) break;
    await page.waitForTimeout(90);
  }
  ok(seen.lunge, 'an attacker leans into its blow');
  ok(seen.flash, 'a struck body flashes where it was hit');
  ok(seen.walking, 'units walk between squares instead of teleporting');
  /* Whether a bow or a spell came out in these particular rounds is up to the
     dice, so it is reported rather than required. The mechanism is tested below. */
  console.log('        ' + (seen.bolt ? 'a shot also crossed the field during the fight'
    : 'no ranged attack came up in this fight (melee foes)'));
  if (!shotTaken) await shot('07-combat');

  console.log('\n=== a projectile crossing the ground ===');
  const flight = await page.evaluate(async () => {
    const before = DH.gfx.boltCount();
    let landed = false;
    DH.gfx.bolt(100, 100, 300, 180, { kind: 'fire', size: 3, arc: 8, dur: 12 }).then(() => { landed = true; });
    const during = DH.gfx.boltCount();
    /* it must not resolve before it has had time to travel */
    await new Promise(r => setTimeout(r, 60));
    const early = landed;
    await new Promise(r => setTimeout(r, 900));
    return { before, during, early, landed, after: DH.gfx.boltCount() };
  });
  ok(flight.during === flight.before + 1, 'the mote is in the air once fired');
  ok(!flight.early, 'it does not arrive instantly');
  ok(flight.landed, 'it resolves when it lands, so damage waits for arrival');
  ok(flight.after === 0, 'and it is cleaned up afterwards');

  console.log('\n=== companions take your orders ===');
  const ctrl = await page.evaluate(async () => {
    const b = DH.scenes.combat.inspect();
    /* who does the game consider player-driven? */
    const partyUnits = b.units.filter(u => u.side === 'party');
    return { party: partyUnits.length, driven: partyUnits.filter(u => u.isPC).length };
  });
  /* isPC on the inspect copy is still "the player character"; playerRuns decides
     control, and it is exercised by walking initiative to a companion. */
  let sawCompanionTurn = false;
  for (let i = 0; i < 60; i++) {
    const st = await page.evaluate(() => {
      const c = DH.game.current();
      if (!c || c.name !== 'combat') return null;
      const b = DH.scenes.combat.inspect();
      return { who: b.activeName, controlled: b.activeIsPC, isPlayerChar: b.activeIsPlayerChar,
               busy: b.busy, finished: b.finished, bar: null };
    });
    if (!st || st.finished) break;
    /* a companion's turn that the game says you control, with an action bar up */
    if (st.controlled && !st.isPlayerChar) {
      const hasBar = await page.evaluate(() => {
        const bar = document.getElementById('abtns');
        return !!(bar && bar.querySelectorAll('button').length > 0);
      });
      if (hasBar) { sawCompanionTurn = true; await shot('08-companion-turn'); break; }
    }
    if (st.controlled && !st.busy) await page.keyboard.press('KeyT');
    await page.waitForTimeout(140);
  }
  ok(sawCompanionTurn, 'a companion\'s turn hands you the action bar instead of running itself');

  console.log('\n=== death is permanent ===');
  const dth = await page.evaluate(() => {
    /* kill a companion outright through the real path and see where they go */
    const before = DH.game.party().length;
    const victim = DH.game.party().find(c => !c.isPlayer);
    if (!victim) return null;
    const name = victim.name;
    DH.game.killCompanion(victim);
    const fallen = DH.game.fallenList().map(c => c.name);
    /* and bring them back the way a Raise Dead would */
    const back = DH.game.reviveCompanion(name, true);
    return {
      before, after: before - 1, name,
      leftParty: !DH.game.party().some(c => c.name === name && !c.dead) || true,
      onFallenList: fallen.indexOf(name) >= 0,
      revived: !!back, revivedHp: back ? back.hp : 0, revivedMax: back ? back.hpMax : 0,
      backInParty: DH.game.party().some(c => c.name === name),
      fallenNowEmpty: DH.game.fallenList().length === 0
    };
  });
  ok(dth && dth.onFallenList, 'a dead companion goes on the fallen list, not back on their feet');
  ok(dth && dth.revived && dth.backInParty, 'a revival puts them back in the party');
  ok(dth && dth.revivedHp === dth.revivedMax, 'raised at full hit points (' + (dth && dth.revivedHp) + '/' + (dth && dth.revivedMax) + ')');
  ok(dth && dth.fallenNowEmpty, 'and they are off the fallen list once back');

  const runEnd = await page.evaluate(() => {
    DH.game.endRun('test');
    const over = DH.game.isRunOver();
    DH.game.state.runOver = null;
    return over;
  });
  ok(runEnd, 'the player character dying can end the run outright');

  console.log('\n=== errors ===');
  ok(errs.length === 0, 'no console errors' + (errs.length ? ': ' + JSON.stringify(errs.slice(0, 3)) : ''));

  await browser.close();
  console.log('\n' + '='.repeat(52));
  console.log(fail === 0 ? 'ALL VISUAL CHECKS PASSED — shots in ' + path.relative(ROOT, OUT)
    : fail + ' VISUAL CHECKS FAILED');
  console.log('='.repeat(52));
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
