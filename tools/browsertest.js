/* Real-browser playthrough of Drakehaven Island.
   Opens index.html in Chromium, creates a character through the actual creator,
   plays the prologue, fights the sea hags, and screenshots as it goes.

   Run:  node tools/browsertest.js
*/
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright-core');

const ROOT = path.join(__dirname, '..');
const SHOTS = process.env.SHOT_DIR || path.join(ROOT, 'screenshots');
if (!fs.existsSync(SHOTS)) fs.mkdirSync(SHOTS, { recursive: true });

let step = 0, failures = 0;
function ok(cond, msg) { if (!cond) { failures++; console.log('  FAIL  ' + msg); } else console.log('  ok    ' + msg); }

(async () => {
  const exe = ['/opt/pw-browsers/chromium/chrome-linux/chrome',
    '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell']
    .find(p => fs.existsSync(p));
  const browser = await chromium.launch({
    executablePath: exe,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--mute-audio', '--autoplay-policy=no-user-gesture-required']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 760 } });

  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  async function shot(name) {
    step++;
    const f = path.join(SHOTS, String(step).padStart(2, '0') + '-' + name + '.png');
    await page.screenshot({ path: f });
    console.log('        → ' + path.basename(f));
  }
  const clickText = async (text, opts) => {
    const el = page.locator('button:has-text("' + text + '"), .ch:has-text("' + text + '"), .opt:has-text("' + text + '"), .tb:has-text("' + text + '")').first();
    await el.waitFor({ state: 'visible', timeout: (opts && opts.timeout) || 8000 });
    await el.click();
    await page.waitForTimeout((opts && opts.wait) || 260);
  };
  const seeText = (t) => page.locator('text=' + t).first().isVisible().catch(() => false);
  const state = () => page.evaluate(() => {
    const s = DH.game.state;
    return {
      scene: DH.game.current() && DH.game.current().name,
      map: s.map, place: s.placeName, day: s.day, clock: DH.game.clock(),
      party: s.party.map(c => ({ name: c.name, cls: c.className, lv: c.level, hp: c.hp, max: c.hpMax, ac: c.ac })),
      gold: s.party[0] ? s.party[0].gold : 0,
      flags: Object.keys(s.flags).length,
      quests: s.quests.map(q => q.title + (q.done ? ' ✓' : '')),
      pods: s.party[0] && s.party[0].pod ? s.party[0].pod.charges + '/' + s.party[0].pod.max : null
    };
  });

  console.log('\n=== loading ===');
  await page.goto('file://' + path.join(ROOT, 'index.html'));
  await page.waitForTimeout(900);
  ok(await page.locator('#title-screen .logo').isVisible(), 'the title screen renders');
  ok((await page.locator('#title-menu button').count()) >= 6, 'the main menu has its options');
  await shot('title');

  /* the informational modals */
  await clickText('How to Play');
  ok(await page.locator('.modal h2').isVisible(), 'How to Play opens');
  await shot('how-to-play');
  await clickText('Close');
  await clickText('House Rules');
  ok(await seeText('Ending Action'), 'the house rules list the Ending Action');
  await shot('house-rules');
  await clickText('Close');

  console.log('\n=== character creation ===');
  await clickText('New Game');
  await page.locator('.slot').first().click();
  await page.waitForTimeout(400);
  ok(await page.locator('#cc').isVisible(), 'the creator opens');
  ok((await page.locator('#cc-list .opt').count()) >= 15, 'all races are listed');
  await shot('cc-race-empty');

  /* Race → Dragonborn, so we exercise ancestries too */
  await clickText('Dragonborn');
  ok(await seeText('Draconic Ancestry'), 'dragonborn shows the ancestry picker');
  await page.locator('#cc-mid .swrow .sw').first().click();
  await page.waitForTimeout(200);
  await shot('cc-race');
  await clickText('Next');

  /* Class → Paladin (half caster, subclass at 3, fighting style) */
  ok((await page.locator('#cc-list .opt').count()) === 12, 'exactly twelve classes are offered');
  await clickText('Paladin');
  await page.waitForTimeout(200);
  await shot('cc-class');
  await clickText('Next');

  /* subclass step is skipped for paladins (level 3), so we should be on Abilities */
  let stepName = await page.locator('#cc-steps .st.on').textContent();
  ok(/Abilities|Subclass/.test(stepName), 'the wizard advanced past class (on "' + stepName.trim() + '")');
  if (/Subclass/.test(stepName)) { await clickText('Oath of Devotion'); await clickText('Next'); stepName = await page.locator('#cc-steps .st.on').textContent(); }
  ok(/Abilities/.test(stepName), 'reached the abilities step');

  await clickText('Recommend for my class');
  await page.waitForTimeout(250);
  const scores = await page.evaluate(() => Array.from(document.querySelectorAll('.abrow .val')).map(e => e.textContent.trim()));
  ok(scores.length === 6 && scores.every(s => +s >= 8), 'six ability scores are set (' + scores.join(',') + ')');
  await shot('cc-abilities');
  await clickText('Next');

  await clickText('Sailor');
  await page.waitForTimeout(200);
  await shot('cc-background');
  await clickText('Next');

  /* skills: click until the Next button enables */
  const skillOpts = page.locator('#cc-mid .opt');
  const n = await skillOpts.count();
  for (let i = 0; i < n; i++) {
    const nextBtn = page.locator('#cc-foot button.primary');
    if (!(await nextBtn.isDisabled())) break;
    await skillOpts.nth(i).click();
    await page.waitForTimeout(120);
  }
  ok(!(await page.locator('#cc-foot button.primary').isDisabled()), 'skill choices satisfy the requirement');
  await shot('cc-skills');
  await clickText('Next');

  await page.waitForTimeout(200);
  await shot('cc-look');
  await clickText('Next');

  await page.locator('#cc-mid input[type=text]').fill('Verity Ashfall');
  await page.waitForTimeout(150);
  await shot('cc-name');
  await clickText('Next');

  ok(await seeText('Verity Ashfall'), 'the review page shows the character');
  const reviewStats = await page.evaluate(() => Array.from(document.querySelectorAll('#cc-mid .stat')).map(e => e.textContent));
  ok(reviewStats.some(s => /HIT POINTS/.test(s)), 'the review shows hit points');
  await shot('cc-review');

  console.log('\n=== the prologue ===');
  await clickText('Begin the Story');
  /* the chapter card plays first; wait for the dialogue box rather than guessing */
  let dlgUp = false;
  for (let i = 0; i < 60; i++) {
    if (await page.locator('#dlg .txt').first().isVisible().catch(() => false)) { dlgUp = true; break; }
    await page.waitForTimeout(300);
  }
  ok(dlgUp, 'dialogue is running');
  await page.waitForTimeout(400);
  await shot('prologue');

  /* advance until the first choice appears, then take the first option */
  let advanced = 0;
  while (advanced < 40) {
    if (await page.locator('#dlg .ch').first().isVisible().catch(() => false)) break;
    await page.keyboard.press('Space');
    await page.waitForTimeout(190);
    advanced++;
  }
  ok(await page.locator('#dlg .ch').first().isVisible(), 'a dialogue choice was offered');
  await shot('first-choice');

  let s = await state();
  ok(s.map === 'ship_quarters', 'we are in the crew quarters (' + s.map + ')');
  ok(s.party.length === 1, 'the party starts as one');
  console.log('        state: ' + JSON.stringify(s.party[0]));

  /* Answer "yes, talk to Mahoraga", then keep advancing through the act */
  await page.locator('#dlg .ch').first().click();
  await page.waitForTimeout(400);
  for (let i = 0; i < 60; i++) {
    const choice = page.locator('#dlg .ch').first();
    if (await choice.isVisible().catch(() => false)) { await choice.click(); await page.waitForTimeout(230); }
    else { await page.keyboard.press('Space'); await page.waitForTimeout(160); }
    const st = await page.evaluate(() => DH.game.flag('called_on_deck'));
    if (st) break;
  }
  ok(await page.evaluate(() => DH.game.flag('called_on_deck')), 'the call to the deck happened');
  s = await state();
  ok(s.party.length >= 3, 'companions joined the party (' + s.party.length + ')');
  console.log('        party: ' + s.party.map(p => p.name + ' ' + p.cls + ' ' + p.lv).join(', '));
  await shot('crew-quarters');

  console.log('\n=== walking the ship ===');
  /* dismiss any dialogue, then walk up to the deck */
  for (let i = 0; i < 8; i++) { await page.keyboard.press('Space'); await page.waitForTimeout(150); }
  await page.evaluate(() => DH.ui.hideDlg());
  /* walk right and up toward the stairs at 25,1 */
  for (let i = 0; i < 46; i++) { await page.keyboard.down('KeyD'); await page.waitForTimeout(40); }
  await page.keyboard.up('KeyD');
  for (let i = 0; i < 14; i++) { await page.keyboard.down('KeyW'); await page.waitForTimeout(40); }
  await page.keyboard.up('KeyW');
  await page.waitForTimeout(900);
  s = await state();
  console.log('        now in: ' + s.map + ' — ' + s.place);
  ok(s.map === 'ship_deck' || s.map === 'ship_quarters', 'walking works and did not break the world');
  await shot('ship');

  /* Force the deck scene so we always test the hag fight deterministically */
  if (s.map !== 'ship_deck') {
    await page.evaluate(() => DH.game.travel('ship_deck', 'below'));
    await page.waitForTimeout(900);
  }
  console.log('\n=== the sea hags ===');
  await page.evaluate(() => { DH.scenes.script.run('act0_deck'); });
  await page.waitForTimeout(700);
  for (let i = 0; i < 80; i++) {
    if (await page.locator('#actionbar').isVisible().catch(() => false)) break;
    const choice = page.locator('#dlg .ch').first();
    if (await choice.isVisible().catch(() => false)) await choice.click();
    else await page.keyboard.press('Space');
    await page.waitForTimeout(170);
    /* the dice popup needs its Continue */
    const cont = page.locator('#roller button').first();
    if (await cont.isVisible().catch(() => false)) { await cont.click(); await page.waitForTimeout(300); }
  }
  ok(await page.locator('#actionbar').isVisible(), 'combat started and the action bar is up');
  await shot('combat-start');

  const combatInfo = await page.evaluate(() => {
    const s = DH.game.state;
    return { scene: DH.game.current().name, initiative: document.querySelectorAll('#initiative .ini').length };
  });
  ok(combatInfo.scene === 'combat', 'the combat scene is active');
  ok(combatInfo.initiative >= 8, 'the initiative ladder is populated (' + combatInfo.initiative + ' entries)');

  /* verify the economy pips and the Ending Action rule are shown */
  const ecoLabels = await page.evaluate(() => Array.from(document.querySelectorAll('#actionbar .eco')).map(e => e.textContent));
  ok(ecoLabels.join(',') === 'ACTION,BONUS,REACTION,ENDING', 'the turn economy shows all four slots');

  /* the action buttons only exist on the player's own turn — companions act for
     themselves — so wait for our initiative slot before checking them */
  /* the AI advances its own turns, so simply wait for our slot to come round */
  let mine = false;
  for (let i = 0; i < 60; i++) {
    const inf = await page.evaluate(() => {
      const c = DH.game.current();
      return c && c.name === 'combat' ? DH.scenes.combat.inspect() : null;
    });
    if (!inf) break;
    if (inf.activeIsPC) { mine = true; break; }
    await page.waitForTimeout(250);
  }
  ok(mine, 'the player gets their own turn in the initiative order');
  /* the action bar is rebuilt at the top of the turn; wait for it to appear */
  if (mine) {
    for (let i = 0; i < 30; i++) {
      const n2 = await page.locator('#abtns button').count();
      if (n2 > 0) break;
      await page.waitForTimeout(200);
    }
  }
  if (mine) {
    const btns = await page.evaluate(() => Array.from(document.querySelectorAll('#abtns button')).map(x => ({ t: x.textContent, d: x.disabled })));
    const ending = btns.find(b => /Ending Action/.test(b.t));
    ok(!!ending, 'the Ending Action is offered');
    ok(ending && ending.d === true, 'the Ending Action is locked until the rest of the turn is spent');
    ok(btns.some(b => /Pod Shield/.test(b.t)) || !(await page.evaluate(() => !!DH.game.pc().pod)),
      'the pod shield is offered when you carry a pod');
    ok(btns.some(b => /Throw an object/.test(b.t)), 'throwing terrain is offered');
    ok(btns.some(b => /Dip weapon/.test(b.t)), 'dipping a weapon is offered');
    console.log('        player actions: ' + btns.map(b => b.t).join(' | '));
  }

  /* Play the fight out properly: on our turn, walk into reach, select a weapon
     and click the enemy on the canvas, exactly as a player would. */
  console.log('        playing the fight out…');

  /* virtual canvas coords → real page coords (the box does not move) */
  let canvasBox = null;
  async function canvasClick(vx, vy) {
    if (!canvasBox) canvasBox = await page.locator('#screen').boundingBox();
    await page.mouse.click(canvasBox.x + (vx / 640) * canvasBox.width,
      canvasBox.y + (vy / 360) * canvasBox.height);
  }
  async function takeTurn() {
    const info = await page.evaluate(() => DH.scenes.combat.inspect());
    if (!info.activeIsPC || info.busy) return false;
    const me = info.units.find(u => u.name === info.activeName && !u.dead);
    const foes = info.units.filter(u => u.side === 'foe' && !u.dead);
    if (!me || !foes.length) return false;
    foes.sort((a, b) => (Math.max(Math.abs(a.x - me.x), Math.abs(a.y - me.y))) -
      (Math.max(Math.abs(b.x - me.x), Math.abs(b.y - me.y))));
    const foe = foes[0];
    const dist = Math.max(Math.abs(foe.x - me.x), Math.abs(foe.y - me.y));
    /* close the distance first if we need to */
    if (dist > 1) {
      const step = await page.evaluate(([fx, fy]) => {
        const i = DH.scenes.combat.inspect();
        const me = i.units.find(u => u.name === i.activeName);
        const dx = Math.sign(fx - me.x), dy = Math.sign(fy - me.y);
        const tx = fx - dx, ty = fy - dy;
        return { vx: i.origin.x + tx * i.origin.cell + i.origin.cell / 2, vy: i.origin.y + ty * i.origin.cell + i.origin.cell / 2 };
      }, [foe.x, foe.y]);
      await canvasClick(step.vx, step.vy);
      await page.waitForTimeout(420);
    }
    /* select a weapon and swing */
    for (let i = 0; i < 15; i++) {
      if ((await page.locator('#abtns button').count()) > 0) break;
      await page.waitForTimeout(150);
    }
    const picked = await page.evaluate(() => {
      const bar = document.getElementById('abtns');
      if (!bar) return false;
      const btns = Array.from(bar.querySelectorAll('button'));
      const atk = btns.find(b => !b.disabled &&
        /Longsword|Unarmed Strike|Rapier|Shortsword|Javelin|Mace|Greataxe|Warhammer|Quarterstaff|Horns|Claws/.test(b.textContent));
      if (atk) { atk.click(); return atk.textContent; }
      return false;
    });
    if (picked) {
      const target = await page.evaluate(([fx, fy]) => {
        const i = DH.scenes.combat.inspect();
        return { vx: i.origin.x + fx * i.origin.cell + i.origin.cell / 2, vy: i.origin.y + fy * i.origin.cell + i.origin.cell / 2 };
      }, [foe.x, foe.y]);
      await canvasClick(target.vx, target.vy);
      await page.waitForTimeout(380);
    }
    return true;
  }

  /* Wait on the outcome, not on a turn count: rounds take as long as ten units
     need. Bail out after a generous deadline so a hang still reports. */
  let attacked = 0, shotMid = false;
  const fightDeadline = Date.now() + 240000;
  while (Date.now() < fightDeadline) {
    const stillFighting = await page.evaluate(() => {
      const c = DH.game.current();
      return !!(c && c.name === 'combat');
    });
    if (!stillFighting) break;
    const did = await takeTurn();
    if (did) attacked++;
    if (attacked >= 1 && !shotMid) { await shot('combat-mid'); shotMid = true; }
    if (did) await page.keyboard.press('KeyT');
    await page.waitForTimeout(did ? 260 : 500);
    /* the dice popup, if a save or a check interrupts */
    const cont = page.locator('#roller button').first();
    if (await cont.isVisible().catch(() => false)) { await cont.click(); await page.waitForTimeout(200); }
  }
  ok(attacked > 0, 'the player took real attacks on the grid (' + attacked + ' turns)');
  await page.waitForTimeout(1800);
  const afterFight = await page.evaluate(() => ({
    scene: DH.game.current() && DH.game.current().name,
    hags: DH.game.flag('hags_beaten'),
    xp: DH.game.pc().xp,
    hp: DH.game.pc().hp
  }));
  console.log('        after the fight: ' + JSON.stringify(afterFight));
  ok(afterFight.scene !== 'combat', 'the fight ended and combat handed control back');
  ok(afterFight.hags, 'the sea hags encounter is resolved');
  ok(afterFight.xp > 0, 'the party earned experience (' + afterFight.xp + ')');
  await shot('combat-after');

  /* the story must pick up again where it left off: the necklace beat */
  console.log('\n=== the story resumes ===');
  for (let i = 0; i < 90; i++) {
    if (await page.evaluate(() => DH.game.flag('invited_to_cabin'))) break;
    const choice = page.locator('#dlg .ch').first();
    const cont = page.locator('#roller button').first();
    if (await cont.isVisible().catch(() => false)) { await cont.click(); await page.waitForTimeout(220); continue; }
    if (await choice.isVisible().catch(() => false)) { await choice.click(); await page.waitForTimeout(220); continue; }
    if (await page.evaluate(() => DH.game.flag('invited_to_cabin'))) break;
    await page.keyboard.press('Space');
    await page.waitForTimeout(160);
  }
  const necklace = await page.evaluate(() => ({
    invited: DH.game.flag('invited_to_cabin'),
    hasNecklace: DH.char.hasItem(DH.game.pc(), 'hag_necklace')
  }));
  ok(necklace.hasNecklace, 'the hag\'s glimmering necklace was collected');
  ok(necklace.invited, 'the captain invited you to his cabin, so the act can continue');
  await shot('after-hags');

  console.log('\n=== sheet, journal and shops ===');
  /* jump ahead to the town so we can check the Stardew layer and a shop */
  await page.evaluate(async () => {
    DH.ui.hideDlg();
    DH.game.setFlag('act0_done'); DH.game.setFlag('act1_done'); DH.game.setFlag('act2_started');
    /* pretend the town's opening scene already played, so this pass can look at
       the shops and the sheet rather than being pulled into Act Two */
    DH.game.setFlag('trig_town_square_act2_the_crazy_ones');
    DH.game.issuePods();
    DH.game.pc().gold = 2000;
    await DH.game.travel('town_square', 'start');
  });
  await page.waitForTimeout(1400);
  await page.evaluate(() => DH.ui.hideDlg());
  await page.waitForTimeout(300);
  let s2 = await state();
  ok(s2.map === 'town_square', 'travelled to the town square (' + s2.map + ')');
  ok(!!s2.pods, 'the pod is issued (' + s2.pods + ')');
  await shot('town-square');

  await page.keyboard.press('KeyC');
  await page.waitForTimeout(500);
  ok(await page.locator('#book').isVisible(), 'the character sheet opens');
  const sheetText = await page.locator('#book-body').textContent();
  ok(/HIT POINTS/.test(sheetText) && /ARMOUR CLASS/.test(sheetText), 'the sheet shows hit points and AC');
  ok(/Divine Sense|Lay on Hands/.test(sheetText), 'the sheet lists class features');
  await shot('sheet');

  await clickText('POD');
  await page.waitForTimeout(300);
  ok(/CHARGES/.test(await page.locator('#book-body').textContent()), 'the pod page shows charges');
  await shot('pod');

  await clickText('RULES');
  await page.waitForTimeout(300);
  ok(/No Opportunity Attacks/.test(await page.locator('#book-body').textContent()), 'the rules page lists the house rules');
  await shot('rules');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  /* a shop */
  ok(!(await page.evaluate(() => DH.scenes.script.isRunning())), 'no story script is left hanging before the shop');
  await page.evaluate(() => { DH.scenes.script.run('shop_potion_stand'); });
  await page.waitForTimeout(600);
  for (let i = 0; i < 6; i++) {
    if (await page.locator('#shop').isVisible().catch(() => false)) break;
    await page.keyboard.press('Space'); await page.waitForTimeout(400);
  }
  ok(await page.locator('#shop').isVisible(), 'the potion stand opens');
  const wares = await page.locator('#shop-buy .wares').count();
  ok(wares >= 8, 'the stand has its stock (' + wares + ' lines)');
  const goldBefore = (await state()).gold;
  await page.locator('#shop-buy .wares').first().click();
  await page.waitForTimeout(200);
  const buyBtn = page.locator('#shop-detail button').first();
  if (await buyBtn.isVisible()) { await buyBtn.click(); await page.waitForTimeout(300); }
  const goldAfter = (await state()).gold;
  ok(goldAfter < goldBefore, 'buying something costs gold (' + goldBefore + ' → ' + goldAfter + ')');
  await shot('shop');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  console.log('\n=== a minigame ===');
  await page.evaluate(() => { DH.game.push(DH.scenes.minigames, { game: 'dragons_hoard' }); DH.game.flushOps(); });
  await page.waitForTimeout(600);
  ok(await page.locator('#mini').isVisible(), 'Dragon\'s Hoard opens');
  ok(/ante/i.test(await page.locator('#mini .rules').textContent()), 'the rules are shown');
  await clickText('The house rolls');
  await page.waitForTimeout(400);
  ok(/house rolls a/i.test(await page.locator('#mini .msg').textContent()), 'the house roll resolves');
  await shot('minigame');
  await page.evaluate(() => DH.game.pop());
  await page.waitForTimeout(400);

  console.log('\n=== saving and reloading ===');
  const saved = await page.evaluate(() => {
    DH.game.state.day = 4;
    DH.game.pc().name = 'Verity Ashfall';
    return DH.game.saveTo(1);
  });
  ok(saved, 'the game saves to a slot');
  await page.reload();
  await page.waitForTimeout(1000);
  await clickText('Continue');
  await page.waitForTimeout(400);
  ok(await page.locator('.slot').first().isVisible(), 'the load menu lists the save');
  const slotText = await page.locator('.slot').first().textContent();
  ok(/Verity Ashfall/.test(slotText), 'the save is labelled with the character');
  await shot('load-menu');
  await page.locator('.slot').first().click();
  await page.waitForTimeout(1400);
  const loaded = await state();
  ok(loaded.party[0].name === 'Verity Ashfall', 'the character loaded back');
  ok(loaded.day === 4, 'the day loaded back (' + loaded.day + ')');
  ok(loaded.map === 'town_square', 'the location loaded back (' + loaded.map + ')');
  await shot('loaded');

  console.log('\n=== time and rest ===');
  const before = await state();
  await page.evaluate(() => { DH.game.state.minutes = 22 * 60; DH.game.longRest(); });
  await page.waitForTimeout(400);
  const after = await state();
  ok(after.day === before.day + 1, 'a long rest advances the day (' + before.day + ' → ' + after.day + ')');
  ok(after.clock.indexOf('6:00 AM') === 0, 'and wakes you at six (' + after.clock + ')');

  /* every map renders in the browser too */
  console.log('\n=== every map, in the browser ===');
  const mapReport = await page.evaluate(async () => {
    const out = [];
    /* mark one-shot triggers as seen: this pass is about rendering, and we do not
       want to teleport through the campaign firing its scenes */
    Object.keys(DH.MAPS).forEach(id => {
      (DH.MAPS[id].triggers || []).forEach(t => DH.game.setFlag('trig_' + id + '_' + t.script));
    });
    for (const id of Object.keys(DH.MAPS)) {
      try {
        DH.scenes.overworld.loadMap(id, 'start');
        for (let i = 0; i < 3; i++) { DH.gfx.begin(); DH.scenes.overworld.update(0.016); DH.scenes.overworld.draw(); DH.gfx.end(); }
        out.push([id, 'ok']);
      } catch (e) { out.push([id, 'THREW: ' + e.message]); }
    }
    return out;
  });
  const brokenMaps = mapReport.filter(r => r[1] !== 'ok');
  ok(brokenMaps.length === 0, 'all ' + mapReport.length + ' maps render in the browser' +
    (brokenMaps.length ? ': ' + JSON.stringify(brokenMaps) : ''));

  /* a boss fight, for the screenshot and to prove the arena props work */
  console.log('\n=== the half-dragon ===');
  await page.evaluate(() => {
    DH.game.push(DH.scenes.combat, { arena: 'town_boss', enemies: ['half_dragon'], allies: ['town_guard', 'town_guard'], onDone: () => { } });
    DH.game.flushOps();
  });
  await page.waitForTimeout(1800);
  ok(await page.locator('#actionbar').isVisible(), 'the boss fight is running');
  const coldBarrels = await page.evaluate(() => {
    const a = DH.ARENAS.town_boss;
    return a.props.filter(p => p.cold).length;
  });
  ok(coldBarrels === 3, 'there are three barrels of freezing water (' + coldBarrels + ')');
  /* wait for our own turn before reading the action bar */
  let bossTurn = false;
  for (let i = 0; i < 60; i++) {
    const inf = await page.evaluate(() => {
      const c = DH.game.current();
      return c && c.name === 'combat' ? DH.scenes.combat.inspect() : null;
    });
    if (!inf) break;
    if (inf.activeIsPC && (await page.locator('#abtns button').count()) > 0) { bossTurn = true; break; }
    await page.waitForTimeout(300);
  }
  ok(bossTurn, 'the player gets a turn against the Half-Dragon');
  const dipBtn = await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('#abtns button')).map(x => x.textContent);
    return b.some(t => /Dip weapon/.test(t)) && b.some(t => /Throw an object/.test(t));
  });
  ok(dipBtn, 'dipping a weapon and throwing a barrel are both offered');
  await shot('boss-fight');

  console.log('\n=== errors ===');
  const real = errors.filter(e => !/AudioContext|autoplay|favicon|Failed to load resource/i.test(e));
  if (real.length) { real.slice(0, 12).forEach(e => console.log('  ' + e)); }
  ok(real.length === 0, 'no page errors during the whole run' + (real.length ? ' (' + real.length + ')' : ''));

  await browser.close();
  console.log('\n' + '='.repeat(52));
  console.log(failures === 0 ? 'BROWSER PLAYTHROUGH PASSED' : failures + ' BROWSER CHECKS FAILED');
  console.log('screenshots in ' + SHOTS);
  console.log('='.repeat(52));
  process.exit(failures === 0 ? 0 : 1);
})().catch(e => { console.error('harness crashed:', e); process.exit(1); });
