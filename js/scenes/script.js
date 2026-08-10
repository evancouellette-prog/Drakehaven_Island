/* Drakehaven Island — the cutscene interpreter. The campaign in data/story.js is a
   list of instructions; this executes them. It doubles as a scene for the prologue,
   and otherwise runs on top of whatever scene is active. */
window.DH = window.DH || {};

DH.scenes.script = (function () {
  'use strict';
  const U = DH.util, G = DH.gfx, C = DH.char;

  let running = false, ambientMode = null, ctxStack = [];

  /* =============== scene shell (used for the prologue) =============== */
  function enter(arg) {
    ambientMode = (arg && arg.ambient) || 'storm';
    DH.ui.clear();
    if (arg && arg.script) run(arg.script, arg.ctx);
  }
  function exit() { DH.ui.clear(); }
  function update() { }
  function draw() {
    /* a plain stormy limbo behind prologue text */
    G.cam.x = 0; G.cam.y = 0;
    G.rect(0, 0, G.VW, G.VH, '#070b12', true);
    if (ambientMode === 'storm') {
      for (let i = 0; i < 14; i++) {
        const y = G.VH * 0.55 + i * 8;
        G.alpha(0.4 - i * 0.02, () => G.rect(Math.sin(G.tick * 0.03 + i) * 12, y, G.VW, 4, i % 2 ? '#12303f' : '#0e2438', true));
      }
      G.rain(1.2, 5);
      if (U.chance(0.004)) { G.flash(0.4); DH.audio.sfx('thunder'); }
    }
    G.updateParticles();
    G.vignette(0.7);
  }

  /* =============== the runner =============== */
  async function run(id, ctx) {
    const list = DH.STORY[id];
    if (!list) { console.warn('no script "' + id + '"'); return; }
    if (running) return;
    running = true;
    ctxStack.push(ctx || {});
    try { await play(list); }
    catch (e) { console.error('script error in ' + id, e); }
    ctxStack.pop();
    DH.ui.hideDlg();
    running = false;
  }
  async function runInline(list, ctx) {
    if (running) return;
    running = true;
    ctxStack.push(ctx || {});
    try { await play(list); } catch (e) { console.error(e); }
    ctxStack.pop();
    DH.ui.hideDlg();
    running = false;
  }
  function ctx() { return ctxStack[ctxStack.length - 1] || {}; }
  function isRunning() { return running; }

  async function play(list) {
    for (let i = 0; i < list.length; i++) {
      const step = list[i];
      if (!step) continue;
      const jump = await exec(step);
      if (jump === 'STOP') return 'STOP';
    }
  }

  /* Resolve values that may be functions of the game state. */
  function val(v) { return (typeof v === 'function') ? v(DH.game.state, ctx()) : v; }

  async function exec(s) {
    switch (s.t) {

      case 'say':
        await DH.ui.say({ who: val(s.who), text: val(s.text), narr: s.narr, instant: s.instant });
        return;

      case 'narr':
        await DH.ui.say({ text: val(s.text), narr: true });
        return;

      case 'choice': {
        const opts = (s.options || []).filter(o => !o.hide || !val(o.hide));
        const shown = opts.map(o => ({
          text: val(o.text), hint: o.hint,
          locked: o.need ? !meets(o.need) : false,
          lockNote: o.lockNote
        }));
        const pick = await DH.ui.choose(shown, { text: val(s.text), who: val(s.who) });
        DH.ui.hideDlg();
        const chosen = opts[pick];
        if (!chosen) return;
        if (chosen.set) DH.game.setFlag(chosen.set);
        if (chosen.do) chosen.do(DH.game.state, ctx());
        if (chosen.then) { const r = await play(chosen.then); if (r === 'STOP') return 'STOP'; }
        if (chosen.run) { const l = DH.STORY[chosen.run]; if (l) { const r = await play(l); if (r === 'STOP') return 'STOP'; } }
        if (chosen.stop) return 'STOP';
        return;
      }

      case 'check': {
        const who = pickChecker(s.skill, s.by);
        const mod = s.ability ? C.abMod(who, s.ability) : C.skillMod(who, s.skill);
        const label = (s.label || (DH.SKILLS[s.skill] ? DH.SKILLS[s.skill].name : U.titleCase(s.skill || ''))) +
          (s.by !== 'party' ? '' : ' — ' + who.name);
        let adv = !!s.adv, dis = !!s.dis;
        /* offer the sea hag's necklace on a hard test, if its charge is unspent */
        if (!adv && val(s.dc) >= 13) {
          const boon = findBoon(who);
          if (boon) {
            const use = await DH.ui.choose(
              [{ text: 'Spend the necklace\'s charge for advantage.' }, { text: 'Save it.' }],
              { who: 'The Sea Hag\'s Necklace', text: 'The salt-crusted silver goes cold against your skin. It has one favour in it, and it will not have another until you rest.' });
            DH.ui.hideDlg();
            if (use === 0) { boon.charges--; adv = true; DH.audio.sfx('shield'); }
          }
        }
        const r = await DH.ui.roller({
          label: label, dc: val(s.dc), mod: mod, adv: adv, dis: dis,
          modLabel: s.ability ? s.ability.toUpperCase() : (DH.SKILLS[s.skill] || {}).name
        });
        if (r.success) {
          if (s.set) DH.game.setFlag(s.set);
          if (s.ok) { const j = await play(s.ok); if (j === 'STOP') return 'STOP'; }
        } else {
          if (s.setFail) DH.game.setFlag(s.setFail);
          if (s.fail) { const j = await play(s.fail); if (j === 'STOP') return 'STOP'; }
        }
        return;
      }

      /* Best of the whole party, the way a table actually plays it. */
      case 'partyCheck': {
        const party = DH.game.party().filter(c => !c.dead);
        let best = party[0], bestMod = -99;
        party.forEach(c => {
          const m = s.ability ? C.abMod(c, s.ability) : C.skillMod(c, s.skill);
          if (m > bestMod) { bestMod = m; best = c; }
        });
        const r = await DH.ui.roller({
          label: (DH.SKILLS[s.skill] ? DH.SKILLS[s.skill].name : U.titleCase(s.skill)) + ' — ' + best.name,
          dc: val(s.dc), mod: bestMod, adv: !!s.adv, dis: !!s.dis
        });
        if (r.success) { if (s.set) DH.game.setFlag(s.set); if (s.ok) { const j = await play(s.ok); if (j === 'STOP') return 'STOP'; } }
        else { if (s.setFail) DH.game.setFlag(s.setFail); if (s.fail) { const j = await play(s.fail); if (j === 'STOP') return 'STOP'; } }
        return;
      }

      /* Every character rolls a save; used for gas, spores, rune rays. */
      case 'partySave': {
        const dc = val(s.dc);
        const lines = [];
        for (const c of DH.game.party().filter(x => !x.dead)) {
          const r = DH.dice.d20({ mod: C.saveMod(c, s.ability), dc: dc });
          if (!r.success) {
            if (s.dmg) { const d = DH.dice.roll(s.dmg); C.applyDamage(c, s.half ? Math.floor(d.total / 2) : d.total, s.type); lines.push(c.name + ' fails (' + r.total + ') and takes ' + d.total); }
            if (s.cond) C.addCondition(c, s.cond, s.dur || 100);
            if (!s.dmg) lines.push(c.name + ' fails (' + r.total + ')');
            if (s.setFail) DH.game.setFlag(s.setFail);
          } else {
            if (s.dmg && s.half) { const d = DH.dice.roll(s.dmg); C.applyDamage(c, Math.floor(d.total / 2), s.type); lines.push(c.name + ' saves (' + r.total + '), half: ' + Math.floor(d.total / 2)); }
            else lines.push(c.name + ' saves (' + r.total + ')');
          }
        }
        await DH.ui.say({ who: s.who || 'Saving Throws', narr: true, text: lines.join('\n') });
        return;
      }

      case 'combat': {
        DH.ui.hideDlg();
        const result = await fight(s);
        if (result.won) {
          if (s.set) DH.game.setFlag(s.set);
          if (s.onWin) { const j = await play(s.onWin); if (j === 'STOP') return 'STOP'; }
        } else {
          if (s.onLose) { const j = await play(s.onLose); if (j === 'STOP') return 'STOP'; }
          else {
            await DH.ui.say({ who: 'The Table', narr: true, text: 'The party goes down — but the story does not stop here. You come to some time later, lighter by a level and a great deal of dignity.' });
          }
        }
        return;
      }

      case 'give': DH.game.giveItem(val(s.item), val(s.qty) || 1, s.quiet); return;
      case 'giveAll': DH.game.giveItemToAll(val(s.item), val(s.qty) || 1); return;
      case 'gold': DH.game.giveGold(val(s.n)); return;
      case 'take': C.removeItem(DH.game.pc(), val(s.item), val(s.qty) || 1); return;
      case 'xp': DH.game.awardXp(val(s.n)); return;

      case 'flag': DH.game.setFlag(s.k, s.v === undefined ? true : s.v); return;
      case 'quest': DH.game.addQuest(s.id, s.title, s.desc); return;
      case 'questDone': DH.game.completeQuest(s.id, s.xp); return;
      case 'count': DH.game.bump(s.k, s.n); return;

      case 'music': DH.audio.play(s.id, { restart: s.restart }); return;
      case 'ambience': DH.audio.ambience(s.id); return;
      case 'sfx': DH.audio.sfx(s.id); return;
      case 'thunder': DH.audio.stormThunder(s.on !== false); return;

      case 'chapter':
        DH.game.state.chapter = s.n || DH.game.state.chapter;
        await DH.ui.chapter(s.label, val(s.title), val(s.sub), s.ms);
        return;

      case 'banner': DH.ui.banner(val(s.big), val(s.small), s.ms); await U.wait(s.ms || 1400); return;
      case 'toast': DH.ui.toast(val(s.text), s.kind, s.ms); return;

      case 'travel':
        DH.ui.hideDlg();
        await DH.game.travel(s.map, s.spawn);
        await U.wait(360);
        return;

      case 'wait': await U.wait(s.ms || 500); return;
      case 'fadeOut': await DH.ui.fadeOut(s.ms); return;
      case 'fadeIn': await DH.ui.fadeIn(s.ms); return;
      case 'shake': G.shake(s.amt || 5); return;
      case 'flash': G.flash(0.6); DH.audio.sfx('thunder'); return;
      case 'particles': G.emit(s.kind || 'spark', G.VW / 2 + G.cam.x, G.VH / 2 + G.cam.y, s.n || 20, { life: 40 }); return;

      case 'shop': {
        DH.ui.hideDlg();
        await openShop(s.id);
        return;
      }
      case 'minigame': {
        DH.ui.hideDlg();
        await openMinigame(s.game, s.opts);
        return;
      }

      case 'join': {
        const ch = DH.game.addCompanion(s.who);
        if (ch) {
          DH.ui.toast(ch.name + ' joins you — ' + ch.raceName + ' ' + ch.className, 'good', 2600);
          DH.audio.sfx('quest');
          if (DH.scenes.overworld.map) DH.scenes.overworld.loadMap(DH.game.state.map, null);
        }
        return;
      }
      case 'joinAll': {
        ['anvil', 'umarion', 'ball_wizard'].forEach(id => DH.game.addCompanion(id));
        DH.ui.toast('The whole party is on its feet.', 'good', 2400);
        return;
      }
      case 'pods': DH.game.issuePods(); DH.ui.toast('P.A.C.T. Pods issued to everyone.', 'item', 3000); return;
      case 'tamePet': DH.game.state.pet = s.id || 'grey_cat'; DH.ui.toast('The cat is yours now.', 'good'); DH.audio.sfx('meow'); return;
      case 'longRest': DH.game.longRest(); return;
      case 'shortRest': DH.game.shortRest(); return;
      case 'heal': DH.game.party().forEach(c => C.heal(c, val(s.n) || 999)); DH.ui.toast('Everyone patched up.', 'good'); return;

      case 'setTile': (s.edits || []).forEach(e => DH.setMapChar(DH.MAPS[s.map || DH.game.state.map], e.x, e.y, e.c)); return;
      case 'deadline': DH.game.state.contractDeadlineDay = DH.game.state.day + (s.days || 60); return;
      case 'muster': DH.game.state.musterDay = DH.game.state.day + (s.days || 1); return;

      case 'if': {
        const ok = s.flag ? DH.game.flag(s.flag) : s.test ? !!s.test(DH.game.state, ctx()) : false;
        const branch = ok ? s.then : s.else;
        if (branch) { const j = await play(branch); if (j === 'STOP') return 'STOP'; }
        return;
      }
      case 'do': if (s.fn) await s.fn(DH.game.state, ctx()); return;
      case 'run': { const l = DH.STORY[s.id]; if (l) { const j = await play(l); if (j === 'STOP') return 'STOP'; } return; }
      case 'stop': return 'STOP';

      default:
        console.warn('unknown story step', s);
        return;
    }
  }

  function meets(need) {
    if (!need) return true;
    if (need.flag && !DH.game.flag(need.flag)) return false;
    if (need.noFlag && DH.game.flag(need.noFlag)) return false;
    if (need.item && !C.hasItem(DH.game.pc(), need.item)) return false;
    if (need.gold && DH.game.partyGold() < need.gold) return false;
    if (need.skill && !C.isProficient(DH.game.pc(), need.skill)) return false;
    if (need.classId && DH.game.pc().classId !== need.classId) return false;
    if (need.companion && !DH.game.hasCompanion(need.companion)) return false;
    if (need.test && !need.test(DH.game.state)) return false;
    return true;
  }

  /* An item carried by anyone in the party that can buy advantage once per rest. */
  function findBoon(who) {
    const carriers = [who].concat(DH.game.party());
    for (const c of carriers) {
      if (!c || !c.inv) continue;
      const slot = c.inv.find(s => {
        const it = DH.item(s.id);
        return it && (it.effects || []).indexOf('boon_advantage') >= 0 && (s.charges || 0) > 0;
      });
      if (slot) return slot;
    }
    return null;
  }

  /* Who rolls? The player by default; 'party' picks whoever is best. */
  function pickChecker(skill, by) {
    const party = DH.game.party().filter(c => !c.dead);
    if (by === 'party' && skill) {
      let best = party[0], bm = -99;
      party.forEach(c => { const m = C.skillMod(c, skill); if (m > bm) { bm = m; best = c; } });
      return best;
    }
    if (by && typeof by === 'string') {
      const c = party.find(x => x.companionId === by);
      if (c) return c;
    }
    return DH.game.pc();
  }

  /* =============== bridges to the other scenes =============== */
  function fight(s) {
    return new Promise(resolve => {
      DH.game.push(DH.scenes.combat, {
        arena: val(s.arena), enemies: val(s.enemies) || [], allies: val(s.allies) || [],
        onRound: s.onRound, onDown: s.onDown, winWhen: s.winWhen,
        onDone: (result) => resolve(result)
      });
      DH.game.flushOps();
    });
  }
  function openShop(id) {
    return new Promise(resolve => {
      DH.game.push(DH.scenes.shop, { id: id, onDone: resolve });
      DH.game.flushOps();
    });
  }
  function openMinigame(game, opts) {
    return new Promise(resolve => {
      DH.game.push(DH.scenes.minigames, Object.assign({ game: game, onDone: resolve }, opts || {}));
      DH.game.flushOps();
    });
  }

  return { name: 'script', enter, exit, update, draw, run, runInline, isRunning, play, fight };
})();
