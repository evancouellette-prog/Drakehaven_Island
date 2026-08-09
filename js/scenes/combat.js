/* Drakehaven Island — grid combat. Squares are five feet. Click one to go there.
   Implements the table's house rules: Ending Action, no opportunity attacks,
   crits that carry, shared initiative, and the P.A.C.T. Pod shield. */
window.DH = window.DH || {};

DH.scenes.combat = (function () {
  'use strict';
  const U = DH.util, G = DH.gfx, C = DH.char, CELL = DH.gfx.CELL;

  let arena = null, grid = null, units = [], order = [], turn = 0, round = 1;
  let ox = 0, oy = 0;                    // grid origin on screen
  let mode = null;                       // current selected action
  let reach = null;                      // reachable tiles for the active unit
  let hoverTile = null, hoverUnit = null;
  let busy = false, finished = false, onDone = null, encounter = null;
  let log = [], animQueue = [];
  let bannerShown = false, resolved = false;
  /* guards a turn from being advanced twice — by a key press racing the AI, say */
  let advancing = false;

  /* =============== entry =============== */
  function enter(arg) {
    encounter = arg || {};
    finished = false; busy = false; advancing = false; round = 1; turn = 0; mode = null; log = [];
    bannerShown = false; resolved = false;
    onDone = encounter.onDone || null;
    buildArena(encounter.arena || 'town_street');
    placeUnits();
    rollInitiative();
    buildUI();
    DH.audio.play(arena.music || 'battle');
    if (arena.rain) DH.audio.stormThunder(true);
    DH.ui.banner('BATTLE', arena.name, 1800);
    setTimeout(() => beginTurn(), 900);
  }
  function exit() {
    DH.ui.clear(); DH.audio.stormThunder(false); G.clearParticles(); G.clearFloaters();
    /* If we are torn down without the fight ending — a travel, a reset — release
       whatever story script is awaiting us rather than leaving it hanging. */
    if (!resolved && onDone) { resolved = true; const f = onDone; onDone = null; f({ won: false, aborted: true }); }
  }

  function buildArena(id) {
    const def = DH.ARENAS[id] || DH.ARENAS.town_street;
    arena = def;
    grid = [];
    for (let y = 0; y < def.h; y++) {
      grid[y] = [];
      for (let x = 0; x < def.w; x++) {
        grid[y][x] = { t: def.tile || 'stonefloor', solid: false, prop: null, hazard: null, difficult: !!def.difficultAll, cold: false, climb: false };
      }
    }
    (def.water || []).forEach(r => {
      for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++)
        if (grid[y] && grid[y][x]) { grid[y][x].t = 'water'; grid[y][x].solid = true; }
    });
    (def.walls || []).forEach(r => {
      for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++)
        if (grid[y] && grid[y][x]) { grid[y][x].t = 'wall'; grid[y][x].solid = true; }
    });
    (def.props || []).forEach(p => {
      const c = grid[p.y] && grid[p.y][p.x];
      if (!c) return;
      c.prop = p.kind;
      c.solid = !!p.solid;
      c.hazard = p.hazard || null;
      c.cold = !!p.cold;
      c.climb = !!p.climb;
      c.throwable = ['barrel', 'coldbarrel', 'crate', 'bottle'].indexOf(p.kind) >= 0;
      c.hp = c.throwable ? 8 : null;
      c.light = p.light || null;
    });
    /* centre the grid on screen */
    ox = Math.floor((G.VW - def.w * CELL) / 2);
    oy = Math.floor((G.VH - def.h * CELL) / 2) - 6;
  }

  /* =============== unit construction =============== */
  /* isPC  — the one character the player drives with the action bar.
     isCharacter — anyone using the full character rules (the player and the five
     companions), as opposed to a monster stat block. Your companions are other
     people's characters: they fight alongside you, they do not wait for orders. */
  function unitFromChar(ch, side) {
    return {
      ch: ch, side: side, name: ch.name,
      x: 0, y: 0, px: 0, py: 0,
      spec: C.visualFor(ch), scale: ch.scale || 1,
      weapon: C.weaponArt(ch),
      isPC: !!ch.isPlayer, isCharacter: true, dead: false,
      ai: ch.ai || { prefer: 'melee', focus: 'nearest' },
      eco: freshEconomy(ch), used: {},
      facing: side === 'party' ? 'right' : 'left'
    };
  }
  function unitFromMonster(id, side, tweaks) {
    const src = DH.monster(id);
    if (!src) return null;
    const m = U.deep(src);
    const ch = {
      name: (tweaks && tweaks.name) || m.name, kind: 'npc', monsterId: id,
      level: 1, abilities: m.abilities, hp: m.hp, hpMax: m.hp, tempHp: 0, ac: m.ac,
      speed: m.speed, prof: 2, skills: [], saveProfs: [], expertise: [],
      effects: [], conditions: [], inv: [], equipped: {}, res: {},
      spells: { known: [], cantrips: [], prepared: [], slots: {}, slotsMax: {} },
      resistList: m.resist || [], immuneList: m.immune || [], vulnList: m.vuln || [],
      npcActions: m.actions || [], multiattack: m.multiattack || 1,
      traits: m.traits || [], initBonus: m.init || 0,
      xp: m.xp || 0, boss: !!m.boss, blurb: m.blurb, dying: false, dead: false,
      deathSaves: { s: 0, f: 0 }, monsterSaves: m.saves || {}, monsterSkills: m.skills || {}
    };
    if (tweaks && tweaks.hp) { ch.hp = ch.hpMax = tweaks.hp; }
    /* monsters use fixed lists rather than the effect engine */
    (m.traits || []).forEach(t => (t.effects || []).forEach(e => ch.effects.push(e)));
    (m.resist || []).forEach(t => ch.effects.push('resist:' + t));
    (m.immune || []).forEach(t => ch.effects.push('immune:' + t));
    (m.vuln || []).forEach(t => ch.effects.push('vuln:' + t));
    (m.actions || []).forEach(a => { if (a.uses) ch.res['act_' + a.name] = { cur: a.uses, max: a.uses }; });
    return {
      ch: ch, side: side, name: ch.name, x: 0, y: 0, px: 0, py: 0,
      spec: m.visual, scale: m.scale || 1, isPC: false, dead: false,
      eco: freshEconomy(ch), used: {}, recharge: {},
      facing: side === 'party' ? 'right' : 'left', monsterId: id, ai: m.ai || { prefer: 'melee' }
    };
  }
  function freshEconomy(ch) {
    return {
      move: ch.speed || 30, moveMax: ch.speed || 30,
      action: 1, bonus: 1, reaction: 1, ending: 1, extra: 0,
      attacksLeft: 0
    };
  }

  function placeUnits() {
    units = [];
    const pz = arena.playerZone || { x: 2, y: 4, w: 4, h: 4 };
    const ez = arena.enemyZone || { x: 14, y: 4, w: 4, h: 4 };
    /* the party */
    const party = DH.game.party().filter(c => !c.dead);
    party.forEach((ch, i) => {
      const u = unitFromChar(ch, 'party');
      const spot = freeSpot(pz, i);
      u.x = spot.x; u.y = spot.y;
      snap(u);
      units.push(u);
    });
    /* the pet, if you tamed it */
    if (DH.game.state.pet) {
      const u = unitFromMonster(DH.game.state.pet, 'party');
      if (u) { const s = freeSpot(pz, party.length); u.x = s.x; u.y = s.y; snap(u); u.ch.name = 'Cat'; units.push(u); }
    }
    /* the enemies */
    (encounter.enemies || []).forEach((e, i) => {
      const id = typeof e === 'string' ? e : e.id;
      const u = unitFromMonster(id, 'foe', typeof e === 'object' ? e : null);
      if (!u) return;
      const spot = (typeof e === 'object' && e.x != null) ? { x: e.x, y: e.y } : freeSpot(ez, i);
      u.x = spot.x; u.y = spot.y;
      snap(u);
      units.push(u);
      DH.game.state.bestiary[id] = (DH.game.state.bestiary[id] || 0) + 1;
    });
    /* friendly extras (crew, guards) */
    (encounter.allies || []).forEach((a, i) => {
      const id = typeof a === 'string' ? a : a.id;
      const u = unitFromMonster(id, 'party');
      if (!u) return;
      const spot = freeSpot(pz, 20 + i);
      u.x = spot.x; u.y = spot.y; snap(u);
      units.push(u);
    });
  }
  function freeSpot(zone, i) {
    for (let tries = 0; tries < 200; tries++) {
      const x = zone.x + ((i + tries) % zone.w);
      const y = zone.y + Math.floor(((i + tries) / zone.w) % zone.h);
      if (walkable(x, y) && !unitAt(x, y)) return { x, y };
    }
    /* fall back to anything open */
    for (let y = 0; y < arena.h; y++) for (let x = 0; x < arena.w; x++)
      if (walkable(x, y) && !unitAt(x, y)) return { x, y };
    return { x: zone.x, y: zone.y };
  }
  function snap(u) { u.px = ox + u.x * CELL + CELL / 2; u.py = oy + u.y * CELL + CELL - 3; }

  /* =============== initiative =============== */
  function rollInitiative() {
    units.forEach(u => {
      const ch = u.ch;
      const bonus = u.isCharacter ? (ch.initBonus != null ? ch.initBonus : C.abMod(ch, 'dex')) : (ch.initBonus || 0);
      const adv = u.isCharacter && C.hasEffect(ch, 'adv_initiative');
      const r = DH.dice.d20({ mod: bonus, adv: adv });
      u.init = r.total;
      u.initRoll = r.natural;
    });
    /* Shared initiative: on a tie the party goes first, and party ties keep
       their listed order so the player can coordinate. */
    order = units.slice().sort((a, b) => {
      if (b.init !== a.init) return b.init - a.init;
      if (a.side !== b.side) return a.side === 'party' ? -1 : 1;
      return 0;
    });
    logLine('Initiative: ' + order.map(u => u.name + ' ' + u.init).join(', '), 'turn');
  }

  /* =============== queries =============== */
  function unitAt(x, y) { return units.find(u => !u.dead && u.x === x && u.y === y); }
  function cell(x, y) { return (grid[y] && grid[y][x]) || null; }
  function inBounds(x, y) { return x >= 0 && y >= 0 && x < arena.w && y < arena.h; }
  function walkable(x, y) {
    if (!inBounds(x, y)) return false;
    const c = cell(x, y);
    return c && !c.solid;
  }
  function active() { return order[turn % order.length]; }
  function foesOf(u) { return units.filter(v => !v.dead && v.side !== u.side); }
  function alliesOf(u) { return units.filter(v => !v.dead && v.side === u.side && v !== u); }
  function partyAlive() { return units.some(u => !u.dead && u.side === 'party' && !u.ch.dying); }
  function foesAlive() { return units.some(u => !u.dead && u.side === 'foe'); }

  /* movement cost map for the active unit */
  function computeReach(u) {
    const speed = u.eco.move;
    const res = U.flood(u.x, u.y, arena.w, arena.h, (nx, ny) => {
      if (!walkable(nx, ny)) return false;
      const other = unitAt(nx, ny);
      if (other && other !== u) return false;
      const c = cell(nx, ny);
      return (c.difficult || c.hazard === 'spore' ? 10 : 5);
    }, speed, true);
    return res;
  }

  /* =============== turn flow =============== */
  function beginTurn() {
    advancing = false;
    if (finished) return;
    const u = active();
    if (!u) return;
    if (u.dead) { nextTurn(); return; }
    u.eco = freshEconomy(u.ch);
    if (C.hasCondition(u.ch, 'hasted')) u.eco.move *= 2;
    if (C.hasCondition(u.ch, 'slowed')) u.eco.move = Math.floor(u.eco.move / 2);
    if (C.hasCondition(u.ch, 'grappled') || C.hasCondition(u.ch, 'restrained') ||
      C.hasCondition(u.ch, 'stuck')) u.eco.move = 0;
    /* the pod shield lapses at the start of your turn */
    C.removeCondition(u.ch, 'shielded');
    C.removeCondition(u.ch, 'dodging');
    mode = null;
    /* start-of-turn damage */
    if (C.hasCondition(u.ch, 'burning')) {
      const r = DH.dice.roll('1d6');
      damage(u, r.total, 'fire', { src: 'burning' });
      logLine(u.name + ' is burning: ' + r.total + ' fire.', 'hit');
    }
    if (u.ch.dying) { deathSaveFor(u); nextTurn(); return; }
    if (C.incapacitated(u.ch)) {
      logLine(u.name + ' cannot act.', 'turn');
      setTimeout(() => nextTurn(), 500);
      return;
    }
    logLine('— ' + u.name + '\'s turn (round ' + round + ') —', 'turn');
    reach = computeReach(u);
    refreshUI();
    if (u.side === 'foe' || (!u.isPC && u.side === 'party')) {
      busy = true;
      setTimeout(() => aiTurn(u), 520);
    } else busy = false;
  }

  function endTurn() {
    if (advancing || finished) return;
    const u = active();
    if (!u) return;
    /* concentration and conditions tick down at the end of the turn */
    C.tickConditions(u.ch);
    /* recharge abilities */
    if (u.recharge) Object.keys(u.recharge).forEach(k => { if (u.recharge[k] > 0) u.recharge[k]--; });
    nextTurn();
  }
  function nextTurn() {
    if (finished || advancing) return;
    advancing = true;
    mode = null; reach = null;
    turn++;
    if (turn % order.length === 0) {
      round++;
      onRoundEnd();
    }
    if (checkEnd()) return;
    setTimeout(beginTurn, 160);
  }
  function onRoundEnd() {
    logLine('=== Round ' + round + ' ===', 'turn');
    if (encounter.onRound) encounter.onRound(round, api());
  }

  function checkEnd() {
    if (finished) return false;
    if (!foesAlive()) { finish(true); return true; }
    if (!partyAlive()) { finish(false); return true; }
    if (encounter.winWhen && encounter.winWhen(api())) { finish(true); return true; }
    return false;
  }

  async function finish(won) {
    finished = true;
    busy = true;
    DH.audio.play(won ? 'victory' : 'defeat', { restart: true });
    DH.ui.banner(won ? 'VICTORY' : 'DEFEAT', won ? arena.name : 'The party falls', 2200);
    await U.wait(1600);

    /* the house rule: a dead character loses a level */
    const fallen = DH.game.party().filter(c => c.dead);
    if (won) {
      let xp = 0;
      units.filter(u => u.side === 'foe').forEach(u => xp += (u.ch.xp || 50));
      xp = Math.max(25, Math.floor(xp / Math.max(1, DH.game.party().length)));
      /* stabilise anyone who was down */
      DH.game.party().forEach(c => {
        if (c.dying) { c.dying = false; c.hp = 1; c.deathSaves = { s: 0, f: 0 }; C.removeCondition(c, 'unconscious'); }
        c.conditions = (c.conditions || []).filter(x => ['exhaustion'].indexOf(x.id) >= 0);
        c.concentration = null;
      });
      DH.game.awardXp(xp);
    }
    for (const c of fallen) {
      await DH.ui.say({
        who: 'The Table', narr: true,
        text: c.name + ' failed their last death save.\n\nHouse rule: you lose one character level. You may keep this character, or make a new one a level below the others.'
      });
      C.loseLevel(c);
      DH.ui.hideDlg();
      DH.ui.toast(c.name + ' is back on their feet, one level lighter.', 'bad', 3200);
    }
    DH.ui.hideDlg();
    const result = { won: won, xp: 0 };
    resolved = true;
    const cb = onDone; onDone = null;
    DH.game.pop(result);
    DH.game.flushOps();
    if (cb) cb(result);
  }

  /* =============== the log =============== */
  function logLine(text, cls) {
    log.unshift({ text, cls });
    if (log.length > 40) log.pop();
    const box = document.getElementById('combat-log');
    if (box) {
      const d = DH.ui.el('div', cls || '', DH.ui.esc(text));
      box.appendChild(d);
      while (box.children.length > 9) box.removeChild(box.firstChild);
    }
  }

  /* =============== damage and healing =============== */
  function damage(target, amount, type, opts) {
    opts = opts || {};
    const res = C.applyDamage(target.ch, amount, type, opts);
    if (res.dealt > 0) {
      G.floater('-' + res.dealt, target.px, target.py - 30, '#f0a09a', 11);
      G.emit(type === 'fire' ? 'fire' : type === 'cold' ? 'ice' : type === 'poison' || type === 'acid' ? 'poison'
        : type === 'necrotic' ? 'necro' : type === 'radiant' ? 'spark' : 'blood',
        target.px, target.py - 14, 8, { speed: 1.4, up: 0.6 });
      DH.audio.sfx('hit');
      G.shake(target.ch.boss ? 3 : 2);
    } else if (res.dealt === 0 && amount > 0) {
      G.floater('resisted', target.px, target.py - 30, '#9ad0f0', 9);
    }
    if (res.relentless) { G.floater('ENDURES', target.px, target.py - 42, '#7fbf5f', 10); logLine(target.name + ' refuses to go down.', 'crit'); }
    if (res.lostConcentration) logLine(target.name + ' loses concentration.', '');
    if (res.dropped) {
      logLine(target.name + ' drops!', 'hit');
      if (!target.isCharacter) { target.dead = true; onUnitDown(target); }
    }
    if (res.killed) { target.dead = true; logLine(target.name + ' is killed.', 'crit'); onUnitDown(target); }
    if (target.isCharacter && target.ch.dead) { target.dead = true; onUnitDown(target); }
    /* monsters simply die at 0 */
    if (!target.isCharacter && target.ch.hp <= 0 && !target.dead) { target.dead = true; onUnitDown(target); }
    checkEnd();
    return res;
  }
  function onUnitDown(u) {
    DH.audio.sfx('death');
    G.emit('smoke', u.px, u.py - 12, 14, { life: 40, up: 0.3 });
    if (encounter.onDown) encounter.onDown(u, api());
  }
  function healUnit(target, amount) {
    const got = C.heal(target.ch, amount);
    if (got > 0) {
      G.floater('+' + got, target.px, target.py - 30, '#7fbf5f', 11);
      G.emit('heal', target.px, target.py - 14, 8, { up: 0.8 });
      DH.audio.sfx('heal');
    }
    return got;
  }

  /* =============== attack resolution =============== */
  function attackModifiers(attacker, target, opt) {
    let adv = false, dis = false;
    const a = attacker.ch, t = target.ch;
    if (C.hasCondition(t, 'prone') && U.gdist(attacker.x, attacker.y, target.x, target.y) <= 1) adv = true;
    if (C.hasCondition(t, 'prone') && (opt && opt.ranged)) dis = true;
    if (C.hasCondition(t, 'restrained') || C.hasCondition(t, 'outlined')) adv = true;
    if (C.hasCondition(t, 'paralyzed') || C.hasCondition(t, 'unconscious') || C.hasCondition(t, 'stunned')) adv = true;
    if (C.hasCondition(a, 'prone')) dis = true;
    if (C.hasCondition(a, 'poisoned') || C.hasCondition(a, 'blinded')) dis = true;
    if (C.hasCondition(a, 'frightened')) dis = true;
    if (C.hasCondition(t, 'dodging')) dis = true;
    if (C.hasEffect(a, 'reckless_attack') && attacker.reckless) adv = true;
    if (C.hasEffect(a, 'pack_tactics')) {
      if (alliesOf(attacker).some(al => U.gdist(al.x, al.y, target.x, target.y) <= 1)) adv = true;
    }
    if (attacker.boon) { adv = true; attacker.boon = false; }
    if (attacker.markedAdvantage === target) { adv = true; attacker.markedAdvantage = null; }
    /* high ground from climbing the rigging */
    if (attacker.climbing && !(opt && opt.ranged)) adv = true;
    return { adv, dis };
  }

  function totalAC(u) {
    let ac = u.ch.ac;
    if (C.hasCondition(u.ch, 'shielded')) ac += 2;
    if (u.ch.buffs) Object.keys(u.ch.buffs).forEach(k => { if (u.ch.buffs[k].ac) ac += u.ch.buffs[k].ac; });
    if (C.hasCondition(u.ch, 'slowed')) ac -= 2;
    if (u.ch.aoeOnly && !u.aoeHit) ac = 26;   // the fly
    return ac;
  }

  async function weaponAttack(attacker, target, atkDef, opts) {
    opts = opts || {};
    const a = attacker.ch;
    const mods = attackModifiers(attacker, target, { ranged: atkDef.ranged });
    const critAt = attacker.isCharacter ? C.critRange(a) : 20;
    const r = DH.dice.d20({ mod: atkDef.atk, adv: mods.adv, dis: mods.dis, dc: totalAC(target) });
    const isCrit = r.natural >= critAt;
    attacker.facing = target.x < attacker.x ? 'left' : 'right';
    attacker.attackAnim = 12;

    const hit = isCrit || (r.natural !== 1 && r.total >= totalAC(target));
    if (!hit) {
      logLine(attacker.name + ' misses ' + target.name + ' (' + DH.dice.fmt(r) + ' vs AC ' + totalAC(target) + ')');
      G.floater('miss', target.px, target.py - 30, '#8b7a5f', 9);
      DH.audio.sfx('miss');
      return { hit: false, roll: r };
    }
    /* damage */
    let total = 0;
    const parts = [];
    const gwf = attacker.isCharacter && C.hasEffect(a, 'style:great_weapon') &&
      (atkDef.props || []).indexOf('two_handed') >= 0;
    const dmgRoll = DH.dice.roll(atkDef.dmg, { crit: isCrit, rerollBelow: gwf ? 2 : 0 });
    total += dmgRoll.total + (atkDef.dmgMod || 0);
    parts.push(atkDef.dmg + (atkDef.dmgMod ? U.plus(atkDef.dmgMod) : ''));

    /* extra weapon die on a crit for savage attacks / brutal critical */
    if (isCrit && attacker.isCharacter) {
      const extraDice = (C.hasEffect(a, 'savage_crit') ? 1 : 0) + C.effectValue(a, 'brutal_crit');
      for (let i = 0; i < extraDice; i++) {
        const die = /d(\d+)/.exec(atkDef.dmg);
        if (die) total += DH.dice.d(+die[1]);
      }
    }
    /* riders that apply to any hit */
    if (attacker.isCharacter) {
      C.bonusDamage(a).forEach(b => {
        if (b.unarmedOnly && atkDef.id !== 'unarmed' && atkDef.id !== 'blue_brass_knuckles') return;
        if (b.strOnly && atkDef.ranged) return;
        if (b.flat) { total += b.flat; parts.push(U.plus(b.flat) + ' ' + b.src); }
        else { const rr = DH.dice.roll(b.dmg, { crit: isCrit }); total += rr.total; parts.push(b.dmg + ' ' + b.src); }
      });
    }
    /* the cold-water trick against the Half-Dragon */
    if (attacker.coldDipped && target.monsterId === 'half_dragon') {
      const rr = DH.dice.roll('1d6', { crit: isCrit });
      total += rr.total; parts.push('1d6 freezing water');
    }
    /* the black dragon's wounded leg */
    if (opts.weakPoint && target.ch.effects.some(e => e.indexOf('weak_point:') === 0)) {
      const dice = target.ch.effects.find(e => e.indexOf('weak_point:') === 0).split(':')[1];
      const rr = DH.dice.roll(dice, { crit: isCrit });
      total += rr.total; parts.push(dice + ' to the wounded leg');
    }
    /* sneak attack */
    if (attacker.isCharacter && C.sneakAttackDice(a) > 0 && !attacker.usedSneak &&
      ((atkDef.props || []).indexOf('finesse') >= 0 || atkDef.ranged)) {
      const canSneak = mods.adv || alliesOf(attacker).some(al => U.gdist(al.x, al.y, target.x, target.y) <= 1);
      if (canSneak) {
        const n = C.sneakAttackDice(a);
        const rr = DH.dice.roll(n + 'd6', { crit: isCrit });
        total += rr.total; parts.push(n + 'd6 sneak attack');
        attacker.usedSneak = true;
      }
    }
    /* hunter's mark / hex */
    if (attacker.mark === target) {
      const rr = DH.dice.roll('1d6', { crit: isCrit });
      total += rr.total; parts.push('1d6 mark');
    }
    /* poisons applied to the blade */
    if (attacker.coating) {
      const co = attacker.coating; attacker.coating = null;
      const sv = saveAgainst(target, co.save, co.dc);
      if (!sv.success) {
        if (co.dmg) { const rr = DH.dice.roll(co.dmg); total += rr.total; parts.push(co.dmg + ' poison'); }
        if (co.cond) { C.addCondition(target.ch, co.cond, co.dur || 1); logLine(target.name + ' is ' + co.cond + '.', 'hit'); }
      } else if (co.dmg && co.half) {
        const rr = DH.dice.roll(co.dmg); total += Math.floor(rr.total / 2); parts.push('half poison');
      }
    }

    logLine(attacker.name + (isCrit ? ' CRITS ' : ' hits ') + target.name + ' for ' + total + ' ' +
      atkDef.type + ' (' + DH.dice.fmt(r) + ')', isCrit ? 'crit' : 'hit');
    if (isCrit) DH.audio.sfx('crit');
    const res = damage(target, total, atkDef.type, {});

    /* house rule: a critical that kills carries the leftover onto a new target */
    if (isCrit && (target.dead || target.ch.hp <= 0)) {
      const leftover = total - (res.dealt || 0) > 0 ? total - res.dealt : Math.max(0, total - (target.ch.hpMax));
      const spill = Math.max(0, total - (res.dealt || 0));
      if (spill > 0) {
        const next = foesOf(attacker).find(f => f !== target && U.gdist(attacker.x, attacker.y, f.x, f.y) <= 1);
        if (next) {
          logLine('The critical carries: ' + spill + ' spills onto ' + next.name + '.', 'crit');
          damage(next, spill, atkDef.type, {});
        }
      }
    }
    /* riders on the attack itself (trip, prone, push) */
    if (atkDef.rider) {
      const rd = atkDef.rider;
      if (rd.save) {
        const sv = saveAgainst(target, rd.save.ab, rd.save.dc);
        if (!sv.success && rd.cond) {
          C.addCondition(target.ch, rd.cond, rd.dur || -1);
          logLine(target.name + ' is ' + rd.cond + '.', 'hit');
        }
        if (!sv.success && rd.maxHpDrain) {
          target.ch.hpMax = Math.max(1, target.ch.hpMax - total);
          target.ch.hp = Math.min(target.ch.hp, target.ch.hpMax);
          logLine(target.name + '\'s maximum hit points drop to ' + target.ch.hpMax + '.', 'hit');
        }
      }
    }
    /* brass knuckles knock people back */
    if (attacker.isCharacter && C.hasEffect(a, 'unarmed_push:10') && atkDef.id === 'unarmed') {
      pushUnit(target, attacker, 2);
    }
    if (attacker.isCharacter && C.hasEffect(a, 'hammering_horns') && attacker.eco.bonus > 0 && atkDef.id === 'horns') {
      /* offered as a bonus action rather than automatic */
    }
    return { hit: true, crit: isCrit, roll: r, dmg: total };
  }

  function saveAgainst(target, ability, dc) {
    const ch = target.ch;
    let mod;
    if (target.isCharacter) mod = C.saveMod(ch, ability);
    else {
      mod = (ch.monsterSaves && ch.monsterSaves[ability] != null)
        ? ch.monsterSaves[ability] : C.mod(ch.abilities[ability]);
    }
    let adv = false, dis = false;
    if (C.hasCondition(ch, 'restrained') && ability === 'dex') dis = true;
    if (C.hasCondition(ch, 'paralyzed') || C.hasCondition(ch, 'stunned')) { if (ability === 'dex' || ability === 'str') dis = true; }
    if (target.isCharacter) {
      if (ability === 'con' && C.hasEffect(ch, 'adv_vs_poison')) adv = true;
      if (ability === 'dex' && C.hasEffect(ch, 'danger_sense')) adv = true;
    }
    const r = DH.dice.d20({ mod: mod, dc: dc, adv: adv, dis: dis });
    return r;
  }

  function pushUnit(target, from, squares) {
    const dx = U.sign(target.x - from.x), dy = U.sign(target.y - from.y);
    for (let i = 0; i < squares; i++) {
      const nx = target.x + dx, ny = target.y + dy;
      if (!walkable(nx, ny) || unitAt(nx, ny)) break;
      target.x = nx; target.y = ny;
    }
    snap(target);
  }

  /* =============== area effects =============== */
  function tilesForShape(shape, origin, targetPt) {
    const size = Math.max(1, Math.round((shape.size || 10) / 5));
    if (shape.k === 'sphere' || shape.k === 'cube') {
      const c = targetPt || origin;
      return U.burst(c.x, c.y, Math.max(1, Math.floor(size / 2)));
    }
    if (shape.k === 'cone') {
      const dx = (targetPt ? targetPt.x : origin.x + 1) - origin.x;
      const dy = (targetPt ? targetPt.y : origin.y) - origin.y;
      return U.cone(origin.x, origin.y, dx || 1, dy, size);
    }
    if (shape.k === 'line') {
      const pts = U.line(origin.x, origin.y, targetPt.x, targetPt.y);
      const out = [];
      const step = Math.hypot(targetPt.x - origin.x, targetPt.y - origin.y) || 1;
      const ux = (targetPt.x - origin.x) / step, uy = (targetPt.y - origin.y) / step;
      for (let i = 1; i <= size; i++) {
        out.push({ x: Math.round(origin.x + ux * i), y: Math.round(origin.y + uy * i) });
      }
      return out;
    }
    return [origin];
  }

  async function areaEffect(src, def, targetPt) {
    const tiles = tilesForShape(def.shape, { x: src.x, y: src.y }, targetPt);
    const dc = def.save ? (def.save.dc || (src.ch.spellDC || 13)) : 13;
    const hitUnits = units.filter(u => !u.dead && tiles.some(t => t.x === u.x && t.y === u.y));
    /* visuals */
    tiles.forEach(t => {
      if (!inBounds(t.x, t.y)) return;
      G.emit(def.type === 'fire' ? 'fire' : def.type === 'cold' ? 'ice' : def.type === 'acid' || def.type === 'poison' ? 'acid'
        : def.type === 'lightning' ? 'spark' : def.type === 'necrotic' ? 'necro' : 'arcane',
        ox + t.x * CELL + CELL / 2, oy + t.y * CELL + CELL / 2, 5, { life: 26, speed: 1.1 });
    });
    DH.audio.sfx(def.type === 'fire' ? 'fire' : def.type === 'cold' ? 'ice' : 'spell');
    G.shake(3);
    await U.wait(260);

    for (const u of hitUnits) {
      if (def.save) {
        const sv = saveAgainst(u, def.save.ab, dc);
        let dmg = def.dmg ? DH.dice.roll(def.dmg).total : 0;
        if (sv.success) {
          if (def.half) dmg = Math.floor(dmg / 2);
          else dmg = 0;
          /* Evasion turns a successful DEX save into no damage at all */
          if (def.save.ab === 'dex' && u.isCharacter && C.hasEffect(u.ch, 'evasion')) dmg = 0;
          logLine(u.name + ' saves (' + DH.dice.fmt(sv) + ')' + (dmg ? ' but takes ' + dmg : ''));
        } else {
          if (def.save.ab === 'dex' && u.isCharacter && C.hasEffect(u.ch, 'evasion')) dmg = Math.floor(dmg / 2);
          logLine(u.name + ' fails (' + DH.dice.fmt(sv) + ') and takes ' + dmg + ' ' + (def.type || ''), 'hit');
          if (def.cond) C.addCondition(u.ch, def.cond, def.dur || 1);
        }
        if (dmg) damage(u, dmg, def.type, {});
        if (def.push && !sv.success) pushUnit(u, src, Math.round(def.push / 5));
      } else if (def.dmg) {
        const dmg = DH.dice.roll(def.dmg).total;
        damage(u, dmg, def.type, {});
      }
      u.aoeHit = true;
    }
    /* an area effect is the only thing that can hit the fly */
    units.filter(u => u.ch.aoeOnly).forEach(u => { u.aoeHit = false; });
    return hitUnits;
  }

  /* =============== props =============== */
  function propAt(x, y) {
    const c = cell(x, y);
    return c && c.prop ? c : null;
  }
  async function throwProp(u, from, target) {
    const c = cell(from.x, from.y);
    if (!c || !c.throwable) return;
    const kind = c.prop;
    c.prop = null; c.solid = false; c.throwable = false;
    const isCold = c.cold; c.cold = false;
    DH.audio.sfx(kind === 'bottle' ? 'bottle' : 'hit');
    if (kind === 'bottle') {
      logLine(u.name + ' hurls a glass bottle at ' + target.name + '.');
      const r = DH.dice.d20({ mod: C.abMod(u.ch, 'dex') + u.ch.prof, dc: totalAC(target) });
      if (r.success) {
        damage(target, DH.dice.roll('1d4').total, 'slashing', {});
        cell(target.x, target.y).difficult = true;
        logLine('Glass everywhere — that square is difficult ground now.');
      } else logLine('It shatters short of the mark.');
    } else if (isCold) {
      logLine(u.name + ' heaves a barrel of freezing water at ' + target.name + ' — a flat 20.', 'crit');
      damage(target, 20, 'cold', {});
      G.emit('ice', target.px, target.py - 16, 20, { speed: 2, life: 40 });
    } else {
      logLine(u.name + ' throws a ' + kind + ' at ' + target.name + '.');
      const r = DH.dice.d20({ mod: C.abMod(u.ch, 'str') + u.ch.prof, dc: totalAC(target) });
      if (r.success) damage(target, DH.dice.roll('2d6').total, 'bludgeoning', {});
      else logLine('It goes wide and bursts on the ground.');
    }
    G.emit('dust', ox + from.x * CELL + 12, oy + from.y * CELL + 12, 12, { life: 30 });
  }
  function dipWeapon(u, from) {
    const c = cell(from.x, from.y);
    if (!c || !c.cold) return false;
    u.coldDipped = true;
    logLine(u.name + ' plunges a weapon into the freezing water. +1d6 against the Half-Dragon.', 'crit');
    DH.audio.sfx('ice');
    G.emit('ice', ox + from.x * CELL + 12, oy + from.y * CELL + 12, 12, { life: 30 });
    return true;
  }

  /* =============== player actions =============== */
  function actionList(u) {
    const out = [];
    const ch = u.ch;
    const eco = u.eco;
    /* weapon attacks */
    if (u.isPC) {
      C.attacks(ch).forEach(atk => {
        out.push({
          id: 'atk_' + atk.id + (atk.tag || ''), label: (atk.tag ? atk.tag + ' ' : '') + atk.name,
          kind: 'attack', atk: atk, cost: 'action',
          tip: '<b>' + atk.name + '</b><br>' + U.plus(atk.atk) + ' to hit · ' + atk.dmg +
            U.plus(atk.dmgMod) + ' ' + atk.type + '<br><span class="d">' +
            (atk.ranged ? 'Ranged ' + atk.range[0] + '/' + atk.range[1] + ' ft' : 'Reach ' + atk.reach + ' ft') +
            (atk.count > 1 ? ' · ' + atk.count + ' attacks' : '') + '</span>',
          enabled: eco.action > 0 || eco.attacksLeft > 0
        });
      });
      /* spells */
      C.castableSpells(ch).forEach(sp => {
        if (sp.cast === 'reaction') return;
        out.push({
          id: 'spell_' + sp.id, label: sp.name + (sp.lv ? ' (' + sp.lv + ')' : ''),
          kind: 'spell', spell: sp, cost: sp.cast === 'bonus' ? 'bonus' : 'action',
          tip: '<b>' + sp.name + '</b> — ' + (sp.lv ? U.ord(sp.lv) + '-level ' : 'cantrip ') + sp.school +
            '<br><span class="d">' + sp.desc + '</span>',
          enabled: sp.cast === 'bonus' ? eco.bonus > 0 : eco.action > 0
        });
      });
      /* class features */
      featureActions(u).forEach(f => out.push(f));
    } else {
      (ch.npcActions || []).forEach(a => {
        out.push({ id: 'npc_' + a.name, label: a.name, kind: 'npcAction', act: a, cost: 'action', enabled: eco.action > 0 });
      });
    }
    /* universal actions */
    out.push({ id: 'dash', label: 'Dash', kind: 'dash', cost: 'action', enabled: eco.action > 0, tip: '<b>Dash</b><br>Move again up to your speed.' });
    out.push({ id: 'dodge', label: 'Dodge', kind: 'dodge', cost: 'action', enabled: eco.action > 0, tip: '<b>Dodge</b><br>Attacks against you have disadvantage until your next turn.' });
    out.push({ id: 'shove', label: 'Shove', kind: 'shove', cost: 'action', enabled: eco.action > 0, tip: '<b>Shove</b><br>Athletics against the target\'s Athletics or Acrobatics: push 5 ft or knock prone.' });
    out.push({ id: 'grapple', label: 'Grapple', kind: 'grapple', cost: 'action', enabled: eco.action > 0, tip: '<b>Grapple</b><br>Athletics contest. On a win their speed becomes 0.' });
    out.push({ id: 'throw', label: 'Throw an object', kind: 'throw', cost: 'action', enabled: eco.action > 0, tip: '<b>Throw</b><br>Pick up a barrel, crate or bottle beside you and hurl it. A barrel of freezing water does a flat 20 to the Half-Dragon.' });
    out.push({ id: 'dip', label: 'Dip weapon', kind: 'dip', cost: 'bonus', enabled: eco.bonus > 0, tip: '<b>Dip</b><br>Stand beside a barrel of freezing water and soak your weapon: +1d6 against the Half-Dragon.' });
    /* pod */
    if (ch.pod && ch.pod.charges > 0) {
      out.push({ id: 'pod', label: 'Pod Shield (' + ch.pod.charges + ')', kind: 'pod', cost: 'reaction', pod: true, enabled: eco.reaction > 0, tip: '<b>P.A.C.T. Pod — the blue "S"</b><br>+2 AC until your next turn. Costs one charge.' });
    }
    /* the Ending Action */
    out.push({
      id: 'ending', label: 'Ending Action', kind: 'ending', cost: 'ending',
      enabled: eco.ending > 0 && eco.action === 0 && eco.bonus === 0 && eco.move <= 0,
      tip: '<b>Ending Action</b><br>After your Action, Bonus Action and movement are all spent: one knowledge or observation check, or use a consumable — including feeding one to a willing creature within 5 ft.'
    });
    return out;
  }

  function featureActions(u) {
    const ch = u.ch, eco = u.eco, out = [];
    const res = (k) => ch.res && ch.res[k] ? ch.res[k].cur : 0;
    const add = (o) => out.push(o);
    if (C.hasEffect(ch, 'rage') && res('rage') > 0 && !C.hasCondition(ch, 'raging'))
      add({ id: 'rage', label: 'Rage (' + res('rage') + ')', kind: 'feature', feat: 'rage', cost: 'bonus', enabled: eco.bonus > 0, tip: '<b>Rage</b><br>+2 damage on Strength attacks, resistance to physical damage, advantage on Strength checks and saves.' });
    if (C.hasEffect(ch, 'second_wind') && res('second_wind') > 0)
      add({ id: 'second_wind', label: 'Second Wind', kind: 'feature', feat: 'second_wind', cost: 'bonus', enabled: eco.bonus > 0, tip: '<b>Second Wind</b><br>Regain 1d10 + level hit points.' });
    if (C.hasEffect(ch, 'action_surge') && res('action_surge') > 0)
      add({ id: 'action_surge', label: 'Action Surge', kind: 'feature', feat: 'action_surge', cost: 'free', enabled: true, tip: '<b>Action Surge</b><br>One extra action this turn.' });
    if (C.hasEffect(ch, 'martial_arts'))
      add({ id: 'martial_bonus', label: 'Unarmed Strike (bonus)', kind: 'feature', feat: 'martial_bonus', cost: 'bonus', enabled: eco.bonus > 0 && u.attackedThisTurn, tip: '<b>Martial Arts</b><br>After you attack, one unarmed strike as a bonus action.' });
    if (C.hasEffect(ch, 'ki') && res('ki') > 0) {
      add({ id: 'flurry', label: 'Flurry of Blows (1 ki)', kind: 'feature', feat: 'flurry', cost: 'bonus', enabled: eco.bonus > 0 && u.attackedThisTurn && res('ki') > 0, tip: '<b>Flurry of Blows</b><br>Two unarmed strikes as a bonus action.' });
      add({ id: 'patient', label: 'Patient Defence (1 ki)', kind: 'feature', feat: 'patient', cost: 'bonus', enabled: eco.bonus > 0, tip: '<b>Patient Defence</b><br>Dodge as a bonus action.' });
      add({ id: 'step', label: 'Step of the Wind (1 ki)', kind: 'feature', feat: 'step', cost: 'bonus', enabled: eco.bonus > 0, tip: '<b>Step of the Wind</b><br>Disengage and double your movement.' });
    }
    if (C.hasEffect(ch, 'cunning_action')) {
      add({ id: 'cunning_dash', label: 'Cunning Dash', kind: 'feature', feat: 'cunning_dash', cost: 'bonus', enabled: eco.bonus > 0, tip: '<b>Cunning Action</b><br>Dash as a bonus action.' });
      add({ id: 'cunning_hide', label: 'Cunning Hide', kind: 'feature', feat: 'cunning_hide', cost: 'bonus', enabled: eco.bonus > 0, tip: '<b>Cunning Action</b><br>Hide as a bonus action — a Stealth check that sets up your sneak attack.' });
    }
    if (C.hasEffect(ch, 'divine_smite') && C.slotsAvailable(ch).some(s => s.cur > 0))
      add({ id: 'smite', label: 'Divine Smite' + (u.smiting ? ' ✓' : ''), kind: 'feature', feat: 'smite', cost: 'free', enabled: true, tip: '<b>Divine Smite</b><br>Arm your next melee hit: spend a slot for 2d8 radiant, +1d8 per level above first, +1d8 against undead and fiends.' });
    if (C.hasEffect(ch, 'lay_on_hands') && res('lay_on_hands') > 0)
      add({ id: 'lay_on_hands', label: 'Lay on Hands (' + res('lay_on_hands') + ')', kind: 'feature', feat: 'lay_on_hands', cost: 'action', enabled: eco.action > 0, tip: '<b>Lay on Hands</b><br>Touch a creature and spend from your healing pool.' });
    if (C.hasEffect(ch, 'bardic_inspiration') && res('inspiration') > 0)
      add({ id: 'inspire', label: 'Bardic Inspiration (' + res('inspiration') + ')', kind: 'feature', feat: 'inspire', cost: 'bonus', enabled: eco.bonus > 0, tip: '<b>Bardic Inspiration</b><br>Give an ally a d6 to add to a d20 test or damage roll.' });
    if (C.hasEffect(ch, 'breath') && res('breath') > 0)
      add({ id: 'breath', label: 'Breath Weapon', kind: 'feature', feat: 'breath', cost: 'action', enabled: eco.action > 0, tip: '<b>Breath Weapon</b><br>2d6 in a cone or line, DC 8 + CON + proficiency for half.' });
    if (C.hasEffect(ch, 'channel_divinity:1') && res('channel_divinity') > 0)
      add({ id: 'channel', label: 'Channel Divinity (' + res('channel_divinity') + ')', kind: 'feature', feat: 'channel', cost: 'action', enabled: eco.action > 0, tip: '<b>Channel Divinity</b><br>Turn Undead, or your domain\'s option.' });
    if (C.hasEffect(ch, 'superiority:4') && res('superiority') > 0)
      add({ id: 'trip', label: 'Trip Attack (' + res('superiority') + ')', kind: 'feature', feat: 'trip', cost: 'action', enabled: eco.action > 0, tip: '<b>Trip Attack</b><br>Attack with +1d8 damage; a failed Strength save knocks the target prone.' });
    if (C.hasEffect(ch, 'feline_agility') && res('feline_agility') > 0)
      add({ id: 'feline', label: 'Feline Agility', kind: 'feature', feat: 'feline', cost: 'free', enabled: true, tip: '<b>Feline Agility</b><br>Double your movement for this turn.' });
    if (C.hasEffect(ch, 'aggressive'))
      add({ id: 'aggressive', label: 'Aggressive', kind: 'feature', feat: 'aggressive', cost: 'bonus', enabled: eco.bonus > 0, tip: '<b>Aggressive</b><br>Move up to your speed straight toward a hostile creature.' });
    if (C.hasEffect(ch, 'wild_shape') && res('wild_shape') > 0 && !u.shaped)
      add({ id: 'wild_shape', label: 'Wild Shape (' + res('wild_shape') + ')', kind: 'feature', feat: 'wild_shape', cost: C.hasEffect(ch, 'combat_wild_shape') ? 'bonus' : 'action', enabled: true, tip: '<b>Wild Shape</b><br>Become a beast. Its body takes the damage until the form drops.' });
    /* consumables usable as an action */
    ch.inv.filter(s => { const it = DH.item(s.id); return it && (it.kind === 'potion' || it.kind === 'food') && it.use; })
      .forEach(s => {
        const it = DH.item(s.id);
        add({
          id: 'use_' + s.id, label: 'Drink ' + it.name + ' (' + s.qty + ')', kind: 'item', item: it,
          cost: 'action', enabled: eco.action > 0, tip: '<b>' + it.name + '</b><br><span class="d">' + (it.desc || '') + '</span>'
        });
      });
    ch.inv.filter(s => { const it = DH.item(s.id); return it && it.kind === 'poison' && it.use && it.use.coat; })
      .forEach(s => {
        const it = DH.item(s.id);
        add({ id: 'coat_' + s.id, label: 'Apply ' + it.name, kind: 'coat', item: it, cost: 'bonus', enabled: eco.bonus > 0, tip: '<b>' + it.name + '</b><br><span class="d">' + it.desc + '</span>' });
      });
    return out;
  }

  /* =============== UI =============== */
  function buildUI() {
    DH.ui.clear();
    const root = document.getElementById('ui');
    const wrap = DH.ui.el('div'); wrap.id = 'cui';
    root.appendChild(wrap);

    const ini = DH.ui.el('div'); ini.id = 'initiative';
    wrap.appendChild(ini);
    const bar = DH.ui.el('div'); bar.id = 'actionbar';
    wrap.appendChild(bar);
    const lg = DH.ui.el('div'); lg.id = 'combat-log';
    wrap.appendChild(lg);
    refreshUI();
  }

  function refreshUI() {
    const ini = document.getElementById('initiative');
    if (!ini) return;
    ini.innerHTML = '';
    const hd = DH.ui.add(ini, 'div', 'hd', 'ROUND ' + round);
    order.forEach((u, i) => {
      const row = DH.ui.el('div', 'ini ' + (u.side === 'foe' ? 'foe' : 'ally') +
        (i === turn % order.length ? ' on' : '') + (u.dead ? ' dead' : ''));
      const frac = Math.max(0, u.ch.hp / u.ch.hpMax);
      const conds = (u.ch.conditions || []).map(c => (DH.CONDITION_INFO[c.id] || { name: c.id }).name[0]).join('');
      row.innerHTML = '<div class="rl">' + u.init + '</div><div class="nm">' + DH.ui.esc(u.name) +
        '</div><div class="cnd">' + conds + '</div><div class="hb"><i style="width:' + (frac * 100) + '%"></i></div>';
      row.onmouseenter = (e) => showUnitTip(u, e);
      row.onmouseleave = () => DH.ui.hideTip();
      ini.appendChild(row);
    });

    const bar = document.getElementById('actionbar');
    if (!bar) return;
    const u = active();
    bar.innerHTML = '';
    if (!u) return;
    const top = DH.ui.add(bar, 'div', 'top');
    DH.ui.add(top, 'div', 'nm', DH.ui.esc(u.name) + (u.isPC ? '' : u.side === 'party' ? ' (companion)' : ' (enemy)'));
    const pips = DH.ui.add(top, 'div', 'pips2');
    const eco = u.eco;
    const mk = (lbl, on, cls) => {
      const e = DH.ui.el('div', 'eco ' + (cls || '') + (on ? ' up' : ''));
      e.textContent = lbl; pips.appendChild(e);
    };
    mk('ACTION', eco.action > 0);
    mk('BONUS', eco.bonus > 0);
    mk('REACTION', eco.reaction > 0);
    mk('ENDING', eco.ending > 0, 'end');
    const mv = DH.ui.add(top, 'div', 'mv',
      'Movement ' + Math.max(0, Math.round(eco.move)) + ' / ' + eco.moveMax + ' ft' +
      '  ·  HP ' + u.ch.hp + '/' + u.ch.hpMax + (u.ch.tempHp ? ' (+' + u.ch.tempHp + ')' : '') +
      '  ·  AC ' + totalAC(u));

    if (!u.isPC) {
      DH.ui.add(bar, 'div', 'small dim', 'Thinking…');
      return;
    }
    const btns = DH.ui.el('div'); btns.id = 'abtns';
    bar.appendChild(btns);
    actionList(u).forEach(a => {
      const b = DH.ui.el('button', (mode && mode.id === a.id ? 'sel ' : '') + (a.pod ? 'pod' : ''));
      b.textContent = a.label;
      b.disabled = !a.enabled;
      b.onmouseenter = (e) => { if (a.tip) DH.ui.tip(a.tip, e.clientX, e.clientY); };
      b.onmouseleave = () => DH.ui.hideTip();
      b.onclick = () => selectAction(u, a);
      btns.appendChild(b);
    });
    const end = DH.ui.el('button', 'primary');
    end.textContent = 'End Turn (T)';
    end.onclick = () => { if (!busy) endTurn(); };
    btns.appendChild(end);
  }

  function showUnitTip(u, e) {
    const ch = u.ch;
    let html = '<b>' + DH.ui.esc(u.name) + '</b><br>';
    html += 'HP ' + ch.hp + '/' + ch.hpMax + ' · AC ' + totalAC(u) + ' · Speed ' + ch.speed + ' ft<br>';
    if (ch.blurb) html += '<span class="d">' + DH.ui.esc(ch.blurb) + '</span><br>';
    const conds = (ch.conditions || []).map(c => (DH.CONDITION_INFO[c.id] || { name: c.id }).name);
    if (conds.length) html += '<span class="d">' + conds.join(', ') + '</span><br>';
    const R = C.resistances(ch);
    if (R.resist.length) html += '<span class="d">Resists ' + U.listing([...new Set(R.resist)]) + '</span><br>';
    if (R.immune.length) html += '<span class="d">Immune to ' + U.listing([...new Set(R.immune)]) + '</span><br>';
    if (R.vuln.length) html += '<span class="d">Vulnerable to ' + U.listing(R.vuln) + '</span><br>';
    (ch.traits || []).forEach(t => { html += '<span class="d">• ' + DH.ui.esc(t.name) + '</span><br>'; });
    DH.ui.tip(html, e.clientX, e.clientY);
  }

  /* =============== action selection and execution =============== */
  function selectAction(u, a) {
    DH.audio.sfx('select');
    switch (a.kind) {
      case 'attack': case 'spell': case 'npcAction': case 'shove': case 'grapple':
      case 'throw': case 'item': case 'coat':
        mode = a; break;
      case 'dash': u.eco.action--; u.eco.move += u.eco.moveMax; reach = computeReach(u); logLine(u.name + ' dashes.'); break;
      case 'dodge': u.eco.action--; C.addCondition(u.ch, 'dodging', 1); logLine(u.name + ' takes the Dodge action.'); break;
      case 'dip': {
        let did = false;
        for (const d of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const c = cell(u.x + d[0], u.y + d[1]);
          if (c && c.cold) { did = dipWeapon(u, { x: u.x + d[0], y: u.y + d[1] }); break; }
        }
        if (did) u.eco.bonus--;
        else DH.ui.toast('No barrel of freezing water within reach.', 'bad');
        break;
      }
      case 'pod': usePod(u); break;
      case 'feature': useFeature(u, a); break;
      case 'ending': mode = a; DH.ui.toast('Ending Action: choose a check, or a consumable.', '', 2000); endingActionMenu(u); break;
    }
    refreshUI();
  }

  function usePod(u) {
    const ch = u.ch;
    if (!ch.pod || ch.pod.charges <= 0) { DH.ui.toast('The pod is flat.', 'bad'); return; }
    ch.pod.charges--;
    u.eco.reaction--;
    C.addCondition(ch, 'shielded', 1);
    DH.audio.sfx('shield');
    G.emit('arcane', u.px, u.py - 14, 16, { life: 30 });
    G.floater('+2 AC', u.px, u.py - 34, '#9ad0f0', 10);
    logLine(u.name + ' presses the blue "S" — a shield snaps up. (' + ch.pod.charges + ' charges left)', 'heal');
  }

  async function useFeature(u, a) {
    const ch = u.ch, eco = u.eco;
    const spend = (k) => { if (ch.res[k]) ch.res[k].cur--; };
    switch (a.feat) {
      case 'rage':
        eco.bonus--; spend('rage'); C.addCondition(ch, 'raging', 10);
        logLine(u.name + ' rages.', 'crit'); DH.audio.sfx('roar'); G.emit('blood', u.px, u.py - 14, 14, { life: 30 });
        break;
      case 'second_wind': {
        eco.bonus--; spend('second_wind');
        const r = DH.dice.roll('1d10+' + ch.level);
        healUnit(u, r.total); logLine(u.name + ' catches their second wind: ' + r.total + ' hit points.', 'heal');
        break;
      }
      case 'action_surge':
        spend('action_surge'); eco.action++;
        logLine(u.name + ' surges — another action.', 'crit'); DH.audio.sfx('confirm');
        break;
      case 'martial_bonus': {
        const atk = C.attacks(ch).find(x => x.id === 'unarmed') || C.attacks(ch)[0];
        mode = { id: 'atk_bonus', kind: 'attack', atk: atk, cost: 'bonus' };
        DH.ui.toast('Choose a target for the bonus strike.', '', 1600);
        return;
      }
      case 'flurry': {
        spend('ki'); eco.bonus--;
        const atk = C.attacks(ch).find(x => x.id === 'unarmed') || C.attacks(ch)[0];
        mode = { id: 'atk_flurry', kind: 'attack', atk: atk, cost: 'free', times: 2, openHand: C.hasEffect(ch, 'open_hand') };
        DH.ui.toast('Flurry of Blows — choose a target.', '', 1600);
        return;
      }
      case 'patient': spend('ki'); eco.bonus--; C.addCondition(ch, 'dodging', 1); logLine(u.name + ' takes Patient Defence.'); break;
      case 'step': spend('ki'); eco.bonus--; eco.move += eco.moveMax; reach = computeReach(u); logLine(u.name + ' steps with the wind.'); break;
      case 'cunning_dash': eco.bonus--; eco.move += eco.moveMax; reach = computeReach(u); logLine(u.name + ' dashes cunningly.'); break;
      case 'cunning_hide': {
        eco.bonus--;
        const r = DH.dice.d20({ mod: C.skillMod(ch, 'stealth'), dc: 12 });
        if (r.success) { u.hidden = true; u.boon = true; logLine(u.name + ' slips out of sight (' + DH.dice.fmt(r) + ') — advantage next attack.', 'heal'); }
        else logLine(u.name + ' fails to hide (' + DH.dice.fmt(r) + ').');
        break;
      }
      case 'smite': u.smiting = !u.smiting; logLine(u.name + (u.smiting ? ' readies a Divine Smite.' : ' lowers the smite.')); break;
      case 'lay_on_hands': mode = { id: 'lay', kind: 'heal_touch', pool: ch.res.lay_on_hands.cur, cost: 'action' }; DH.ui.toast('Choose an ally within 5 ft.', '', 1600); return;
      case 'inspire': mode = { id: 'inspire', kind: 'inspire', cost: 'bonus' }; DH.ui.toast('Choose an ally within 60 ft.', '', 1600); return;
      case 'breath': {
        eco.action--; spend('breath');
        const race = DH.raceById(ch.raceId);
        const anc = race && (race.ancestries || []).find(x => x.id === ch.ancestry);
        mode = {
          id: 'breath', kind: 'area', cost: 'free',
          def: {
            shape: { k: anc && anc.shape === 'line' ? 'line' : 'cone', size: anc && anc.shape === 'line' ? 30 : 15 },
            save: { ab: (anc && anc.dmg === 'poison') || (anc && anc.dmg === 'acid') ? 'con' : 'dex', dc: 8 + C.abMod(ch, 'con') + ch.prof },
            dmg: '2d6', type: (anc && anc.dmg) || 'fire', half: true
          }
        };
        DH.ui.toast('Choose the direction of your breath.', '', 1800);
        return;
      }
      case 'channel': {
        eco.action--; spend('channel_divinity');
        const sub = C.subclass(ch);
        if (C.hasEffect(ch, 'radiance_of_dawn')) {
          mode = { id: 'radiance', kind: 'area', cost: 'free', selfCentred: true, def: { shape: { k: 'sphere', size: 30 }, save: { ab: 'con', dc: ch.spellDC }, dmg: '2d10+' + ch.level, type: 'radiant', half: true } };
          DH.ui.toast('Radiance of the Dawn — click yourself to burst.', '', 1800);
          return;
        }
        /* default: turn undead */
        logLine(u.name + ' presents their holy symbol.', 'crit');
        DH.audio.sfx('heal');
        foesOf(u).filter(f => U.gdist(u.x, u.y, f.x, f.y) <= 6).forEach(f => {
          if ((DH.monster(f.monsterId) || {}).type !== 'undead') return;
          const sv = saveAgainst(f, 'wis', ch.spellDC);
          if (!sv.success) { C.addCondition(f.ch, 'frightened', 10); logLine(f.name + ' is turned!', 'crit'); }
        });
        break;
      }
      case 'trip': {
        spend('superiority');
        const atk = C.attacks(ch)[0];
        mode = { id: 'atk_trip', kind: 'attack', atk: atk, cost: 'action', trip: true };
        DH.ui.toast('Trip Attack — choose a target.', '', 1600);
        return;
      }
      case 'feline': spend('feline_agility'); eco.move += eco.moveMax; reach = computeReach(u); logLine(u.name + ' blurs — double speed this turn.'); break;
      case 'aggressive': eco.bonus--; {
        const t = nearestFoe(u);
        if (t) { moveToward(u, t, 99); logLine(u.name + ' closes aggressively.'); }
        break;
      }
      case 'wild_shape': {
        if (C.hasEffect(ch, 'combat_wild_shape')) eco.bonus--; else eco.action--;
        spend('wild_shape');
        u.shaped = true;
        u.preShape = { spec: u.spec, scale: u.scale, hp: ch.hp, ac: ch.ac, name: u.name };
        u.spec = { body: 'beast', fur: '#6a6a72', eye: '#d8c048' };
        u.scale = 0.85; u.name = ch.name + ' (beast)';
        ch.hpMax += 20; ch.hp = 20 + ch.hp; ch.ac = 12;
        logLine(ch.name + ' takes the shape of a great cat.', 'crit');
        DH.audio.sfx('growl');
        break;
      }
    }
    mode = null;
    refreshUI();
  }

  async function endingActionMenu(u) {
    const ch = u.ch;
    const skills = ['arcana', 'investigation', 'nature', 'history', 'perception', 'religion', 'insight', 'survival'];
    const opts = skills.map(s => ({ text: 'Check ' + DH.SKILLS[s].name + '  (' + U.plus(C.skillMod(ch, s)) + ')' }));
    ch.inv.filter(s => { const it = DH.item(s.id); return it && (it.kind === 'potion' || it.kind === 'food') && it.use; })
      .forEach(s => opts.push({ text: 'Use ' + DH.item(s.id).name, item: s.id }));
    const near = alliesOf(u).filter(v => U.gdist(u.x, u.y, v.x, v.y) <= 1);
    if (near.length) {
      ch.inv.filter(s => { const it = DH.item(s.id); return it && it.kind === 'potion' && it.use && it.use.heal; })
        .forEach(s => near.forEach(v => opts.push({ text: 'Feed ' + DH.item(s.id).name + ' to ' + v.name, item: s.id, to: v })));
    }
    opts.push({ text: 'Never mind.' });
    const pick = await DH.ui.choose(opts, {
      who: 'Ending Action',
      text: 'Your action, bonus action and movement are spent. One more thing: look at something, or use something.'
    });
    DH.ui.hideDlg();
    const chosen = opts[pick];
    if (!chosen || pick === opts.length - 1) { mode = null; refreshUI(); return; }
    u.eco.ending--;
    if (chosen.item) {
      const target = chosen.to || u;
      applyConsumable(target, chosen.item);
      C.removeItem(ch, chosen.item, 1);
      logLine(u.name + ' uses ' + DH.item(chosen.item).name + (chosen.to ? ' on ' + chosen.to.name : '') + '.', 'heal');
    } else {
      const skill = skills[pick];
      const r = await DH.ui.roller({ label: DH.SKILLS[skill].name + ' — Ending Action', mod: C.skillMod(ch, skill), dc: 13, modLabel: DH.SKILLS[skill].name });
      if (r.success) {
        insightFor(u, skill, r);
      } else logLine(u.name + ' learns nothing useful.');
    }
    mode = null;
    refreshUI();
  }

  function insightFor(u, skill, r) {
    const foe = foesOf(u).sort((a, b) => a.ch.hp - b.ch.hp)[0];
    if (!foe) { logLine('Nothing left to study.'); return; }
    if (skill === 'perception' || skill === 'investigation') {
      u.boon = true;
      logLine(u.name + ' spots an opening — advantage on the next attack.', 'heal');
    } else if (skill === 'arcana' || skill === 'religion' || skill === 'history' || skill === 'nature') {
      const R = C.resistances(foe.ch);
      logLine(u.name + ' recalls: ' + foe.name +
        (R.resist.length ? ' resists ' + U.listing([...new Set(R.resist)]) : ' has no notable resistances') +
        (R.vuln.length ? ', and is vulnerable to ' + U.listing(R.vuln) : '') + '.', 'heal');
      foe.studied = true;
    } else if (skill === 'insight') {
      logLine(u.name + ' reads ' + foe.name + ': ' + foe.ch.hp + ' of ' + foe.ch.hpMax + ' hit points left.', 'heal');
    } else {
      u.boon = true;
      logLine(u.name + ' finds their footing — advantage on the next attack.', 'heal');
    }
  }

  function applyConsumable(target, itemId) {
    const it = DH.item(itemId);
    if (!it || !it.use) return;
    const use = it.use;
    if (use.heal) healUnit(target, DH.dice.roll(use.heal).total);
    if (use.cond) C.addCondition(target.ch, use.cond, use.dur || 100);
    if (use.cure) use.cure.forEach(c => C.removeCondition(target.ch, c));
    if (use.buff) {
      target.ch.buffs = target.ch.buffs || {};
      target.ch.buffs[itemId] = Object.assign({}, use.buff);
      if (use.buff.hasted) C.addCondition(target.ch, 'hasted', use.dur || 1);
      if (use.buff.breathWeapon) { target.ch.res.breath = { cur: 1, max: 1 }; target.ch.effects.push('breath'); }
    }
    DH.audio.sfx('heal');
  }

  /* =============== clicking the grid =============== */
  function handleClick() {
    const u = active();
    if (!u || !u.isPC || busy || finished) return;
    const m = DH.input.mouse;
    const gx = Math.floor((m.x - ox) / CELL), gy = Math.floor((m.y - oy) / CELL);
    if (!inBounds(gx, gy)) return;
    const target = unitAt(gx, gy);

    if (mode) {
      if (mode.kind === 'area') { doArea(u, { x: gx, y: gy }); return; }
      if (target) { resolveModeOn(u, target); return; }
      if (mode.kind === 'throw') { DH.ui.toast('Click the enemy you want to hit.', 'bad'); return; }
      /* clicking empty ground with an action selected just moves */
    }
    if (target && target !== u) {
      /* default: attack with the first weapon */
      if (!mode) {
        const atk = C.attacks(u.ch)[0];
        if (atk && target.side !== u.side) { mode = { id: 'atk_default', kind: 'attack', atk: atk, cost: 'action' }; resolveModeOn(u, target); return; }
      }
      return;
    }
    /* move */
    tryMove(u, gx, gy);
  }

  async function tryMove(u, gx, gy) {
    if (!reach) reach = computeReach(u);
    const key = gx + ',' + gy;
    if (!reach.dist.has(key)) { DH.audio.sfx('cancel'); return; }
    const cost = reach.dist.get(key);
    if (cost > u.eco.move) { DH.audio.sfx('cancel'); return; }
    const path = U.tracePath(reach, u.x, u.y, gx, gy);
    if (!path) return;
    busy = true;
    for (const step of path) {
      /* spike growth and other per-square hazards would go here */
      u.facing = step.x > u.x ? 'right' : step.x < u.x ? 'left' : u.facing;
      u.x = step.x; u.y = step.y;
      snap(u);
      DH.audio.sfx('step');
      await U.wait(75);
      const c = cell(u.x, u.y);
      if (c.hazard === 'lava') { damage(u, DH.dice.roll('2d10').total, 'fire', {}); logLine(u.name + ' is burned by the lava.', 'hit'); }
      if (c.hazard === 'spore') {
        const sv = saveAgainst(u, 'con', 12);
        if (!sv.success) { C.addCondition(u.ch, 'poisoned', 10); logLine(u.name + ' breathes spores and is poisoned.', 'hit'); }
      }
    }
    u.eco.move -= cost;
    u.climbing = !!cell(u.x, u.y).climb;
    if (u.climbing) logLine(u.name + ' climbs the rigging — high ground, advantage in melee.', 'heal');
    /* mud: staying put risks getting stuck */
    if (arena.difficultAll && U.chance(0.25)) {
      const sv = saveAgainst(u, C.abMod(u.ch, 'str') > C.abMod(u.ch, 'dex') ? 'str' : 'dex', 11);
      if (!sv.success) { C.addCondition(u.ch, 'stuck', 1); logLine(u.name + ' is stuck fast in the mud.', 'hit'); }
    }
    reach = computeReach(u);
    busy = false;
    refreshUI();
  }

  async function resolveModeOn(u, target) {
    if (busy) return;
    busy = true;
    const m = mode;
    try {
      if (m.kind === 'attack') await doAttack(u, target, m);
      else if (m.kind === 'spell') await doSpell(u, target, m.spell);
      else if (m.kind === 'npcAction') await doNpcAction(u, target, m.act);
      else if (m.kind === 'shove') await doShove(u, target);
      else if (m.kind === 'grapple') await doGrapple(u, target);
      else if (m.kind === 'throw') await doThrow(u, target);
      else if (m.kind === 'heal_touch') await doLayOnHands(u, target);
      else if (m.kind === 'inspire') await doInspire(u, target);
      else if (m.kind === 'item') { u.eco.action--; applyConsumable(u, m.item.id); C.removeItem(u.ch, m.item.id, 1); logLine(u.name + ' drinks ' + m.item.name + '.', 'heal'); }
      else if (m.kind === 'coat') { u.eco.bonus--; u.coating = Object.assign({}, m.item.use.coat); C.removeItem(u.ch, m.item.id, 1); logLine(u.name + ' coats a blade with ' + m.item.name + '.'); }
    } catch (e) { console.error(e); }
    /* Extra Attack: keep the weapon selected so the second swing is one click */
    const keepSelected = m.kind === 'attack' && u.eco.attacksLeft > 0 && !u.dead;
    if (!(m.times > 1) && !keepSelected) mode = null;
    busy = false;
    reach = computeReach(u);
    refreshUI();
    checkEnd();
  }

  async function doAttack(u, target, m) {
    const atk = m.atk;
    const dist = U.gdist(u.x, u.y, target.x, target.y);
    const reachSq = atk.ranged ? Math.floor((atk.range ? atk.range[0] : 60) / 5) : Math.floor((atk.reach || 5) / 5);
    if (dist > reachSq) { DH.ui.toast('Out of reach — ' + (atk.ranged ? 'too far' : 'move closer'), 'bad'); return; }
    if (m.cost === 'action') {
      if (u.eco.attacksLeft > 0) u.eco.attacksLeft--;
      else if (u.eco.action > 0) { u.eco.action--; u.eco.attacksLeft = (atk.count || 1) - 1; }
      else { DH.ui.toast('No action left.', 'bad'); return; }
    } else if (m.cost === 'bonus') {
      if (u.eco.bonus <= 0) { DH.ui.toast('No bonus action left.', 'bad'); return; }
      u.eco.bonus--;
    }
    const times = m.times || 1;
    for (let i = 0; i < times; i++) {
      if (target.dead) break;
      const res = await weaponAttack(u, target, atk, { weakPoint: !!u.aimWeakPoint });
      u.attackedThisTurn = true;
      /* smite */
      if (res.hit && u.smiting) {
        u.smiting = false;
        const lv = C.spendSlot(u.ch, 1);
        if (lv) {
          const dice = 1 + lv;
          const undead = (DH.monster(target.monsterId) || {}).type === 'undead';
          const r = DH.dice.roll((dice + (undead ? 1 : 0)) + 'd8', { crit: res.crit });
          logLine('Divine Smite: ' + r.total + ' radiant!', 'crit');
          DH.audio.sfx('heal');
          G.emit('spark', target.px, target.py - 16, 18, { life: 34 });
          damage(target, r.total, 'radiant', {});
        }
      }
      /* trip */
      if (res.hit && m.trip) {
        const extra = DH.dice.roll('1d8');
        damage(target, extra.total, atk.type, {});
        const sv = saveAgainst(target, 'str', 8 + u.ch.prof + C.abMod(u.ch, 'str'));
        if (!sv.success) { C.addCondition(target.ch, 'prone'); logLine(target.name + ' is knocked prone.', 'hit'); }
      }
      /* open hand technique */
      if (res.hit && m.openHand && i === 0) {
        const sv = saveAgainst(target, 'dex', 8 + u.ch.prof + C.abMod(u.ch, 'dex'));
        if (!sv.success) { C.addCondition(target.ch, 'prone'); logLine('Open Hand: ' + target.name + ' is knocked flat.', 'hit'); }
      }
      await U.wait(240);
    }
    if (m.times) mode = null;
  }

  async function doSpell(u, target, sp) {
    const ch = u.ch;
    /* cost */
    if (sp.lv > 0) {
      const lv = C.spendSlot(ch, sp.lv);
      if (!lv) { DH.ui.toast('No slot available.', 'bad'); return; }
      u.castLevel = lv;
    } else u.castLevel = 0;
    if (sp.cast === 'bonus') { if (u.eco.bonus <= 0) { DH.ui.toast('No bonus action.', 'bad'); return; } u.eco.bonus--; }
    else { if (u.eco.action <= 0) { DH.ui.toast('No action.', 'bad'); return; } u.eco.action--; }

    logLine(u.name + ' casts ' + sp.name + '.', 'turn');
    DH.audio.sfx(sp.type === 'fire' ? 'fire' : sp.type === 'cold' ? 'ice' : 'spell');
    G.emit('arcane', u.px, u.py - 16, 10, { life: 26 });

    if (sp.conc) { ch.concentration = sp.id; C.addCondition(ch, 'concentrating', -1); }

    /* areas */
    if (sp.shape) {
      const scaled = Object.assign({}, sp);
      if (sp.up && u.castLevel > sp.lv) {
        const extra = u.castLevel - sp.lv;
        scaled.dmg = sp.dmg + '+' + extra + sp.up.replace(/^\d+/, '');
      }
      await areaEffect(u, {
        shape: sp.shape, save: sp.save ? { ab: sp.save, dc: ch.spellDC } : null,
        dmg: scaled.dmg, type: sp.type, half: sp.half, cond: sp.cond, dur: sp.dur, push: sp.push
      }, { x: target.x, y: target.y });
      applyZone(sp, { x: target.x, y: target.y });
      return;
    }
    /* healing */
    if (sp.heal) {
      let expr = sp.heal;
      if (sp.up && u.castLevel > sp.lv) {
        const extra = u.castLevel - sp.lv;
        for (let i = 0; i < extra; i++) expr += '+' + sp.up;
      }
      const r = DH.dice.roll(expr);
      let total = r.total + (sp.addMod ? C.abMod(ch, ch.spellAbility) : 0);
      if (C.hasEffect(ch, 'disciple_of_life')) total += 2 + Math.max(1, sp.lv);
      const got = healUnit(target, total);
      logLine(target.name + ' is healed for ' + got + '.', 'heal');
      return;
    }
    /* buffs */
    if (sp.buff) {
      target.ch.buffs = target.ch.buffs || {};
      target.ch.buffs[sp.id] = Object.assign({}, sp.buff);
      if (sp.buff.hasted) C.addCondition(target.ch, 'hasted', sp.dur || 10);
      if (sp.buff.attackBonus) C.addCondition(target.ch, 'blessed', sp.dur || 10);
      logLine(target.name + ' is under ' + sp.name + '.', 'heal');
      G.emit('spark', target.px, target.py - 16, 12, { life: 30 });
      return;
    }
    /* marks */
    if (sp.mark) { u.mark = target; C.addCondition(target.ch, 'marked', sp.dur || 10); logLine(u.name + ' marks ' + target.name + '.'); return; }
    /* attack-roll spells */
    if (sp.roll === 'attack') {
      const dice = cantripScale(sp, ch);
      const rays = sp.rays ? sp.rays + (u.castLevel > sp.lv ? (u.castLevel - sp.lv) * (sp.upRays || 0) : 0)
        : sp.beams ? beamCount(ch) : 1;
      for (let i = 0; i < rays; i++) {
        if (target.dead) break;
        const mods = attackModifiers(u, target, { ranged: (sp.range || 0) > 5 });
        const r = DH.dice.d20({ mod: ch.spellAtk, adv: mods.adv, dis: mods.dis, dc: totalAC(target) });
        if (r.natural >= 20 || (r.natural !== 1 && r.total >= totalAC(target))) {
          let dmg = DH.dice.roll(dice, { crit: r.natural >= 20 }).total;
          if (sp.beams && C.hasEffect(ch, 'invocation:agonizing_blast')) dmg += C.abMod(ch, 'cha');
          if (C.hasEffect(ch, 'empowered_evocation') && sp.school === 'Evocation' && i === 0) dmg += C.abMod(ch, 'int');
          logLine(sp.name + ' hits ' + target.name + ' for ' + dmg + ' ' + sp.type + ' (' + DH.dice.fmt(r) + ')', 'hit');
          damage(target, dmg, sp.type, {});
          if (sp.pull) pushTowards(target, u, Math.round(sp.pull / 5));
          if (sp.beams && C.hasEffect(ch, 'invocation:repelling_blast')) pushUnit(target, u, 2);
        } else {
          logLine(sp.name + ' misses ' + target.name + ' (' + DH.dice.fmt(r) + ')');
          DH.audio.sfx('miss');
        }
        await U.wait(180);
      }
      return;
    }
    /* automatic damage (magic missile) */
    if (sp.roll === 'auto') {
      let expr = sp.dmg;
      if (sp.up && u.castLevel > sp.lv) for (let i = 0; i < u.castLevel - sp.lv; i++) expr += '+' + sp.up;
      const r = DH.dice.roll(expr);
      logLine(sp.name + ' strikes ' + target.name + ' for ' + r.total + ' ' + sp.type + ' — no roll needed.', 'hit');
      damage(target, r.total, sp.type, {});
      return;
    }
    /* single-target saves */
    if (sp.roll === 'save' || sp.save) {
      const sv = saveAgainst(target, sp.save, ch.spellDC);
      let dmg = 0;
      if (sp.dmg) {
        let expr = cantripScale(sp, ch);
        if (sp.up && u.castLevel > sp.lv) for (let i = 0; i < u.castLevel - sp.lv; i++) expr += '+' + sp.up;
        if (sp.bigDmg && target.ch.hp < target.ch.hpMax) expr = expr.replace(/d8/g, 'd12');
        dmg = DH.dice.roll(expr).total;
      }
      if (sv.success) {
        dmg = sp.half ? Math.floor(dmg / 2) : (C.hasEffect(ch, 'potent_cantrip') && sp.lv === 0 ? Math.floor(dmg / 2) : 0);
        logLine(target.name + ' saves against ' + sp.name + ' (' + DH.dice.fmt(sv) + ')' + (dmg ? ', ' + dmg + ' through' : ''));
      } else {
        logLine(target.name + ' fails against ' + sp.name + ' (' + DH.dice.fmt(sv) + ')' + (dmg ? ' — ' + dmg + ' ' + sp.type : ''), 'hit');
        if (sp.cond) { C.addCondition(target.ch, sp.cond, sp.dur || 10); logLine(target.name + ' is ' + (DH.CONDITION_INFO[sp.cond] || { name: sp.cond }).name + '.', 'hit'); }
      }
      if (dmg) damage(target, dmg, sp.type, {});
      return;
    }
    /* utility fallback */
    logLine(sp.name + ' takes effect.', 'turn');
  }
  function cantripScale(sp, ch) {
    if (sp.lv !== 0 || !sp.cantripScale) return sp.dmg;
    const L = ch.level;
    const n = L >= 17 ? 4 : L >= 11 ? 3 : L >= 5 ? 2 : 1;
    const m = /(\d*)d(\d+)/.exec(sp.dmg);
    if (!m) return sp.dmg;
    return n + 'd' + m[2];
  }
  function beamCount(ch) { return ch.level >= 17 ? 4 : ch.level >= 11 ? 3 : ch.level >= 5 ? 2 : 1; }
  function pushTowards(target, from, squares) {
    const dx = U.sign(from.x - target.x), dy = U.sign(from.y - target.y);
    for (let i = 0; i < squares; i++) {
      const nx = target.x + dx, ny = target.y + dy;
      if (!walkable(nx, ny) || unitAt(nx, ny)) break;
      target.x = nx; target.y = ny;
    }
    snap(target);
  }
  function applyZone(sp, pt) {
    if (!sp.terrain && !sp.zone) return;
    const tiles = tilesForShape(sp.shape, pt, pt);
    tiles.forEach(t => {
      const c = cell(t.x, t.y);
      if (!c) return;
      if (sp.terrain === 'difficult' || sp.terrain === 'spikes') c.difficult = true;
      if (sp.zone === 'darkness' || sp.zone === 'obscured') c.obscured = true;
    });
  }

  async function doArea(u, pt) {
    const def = mode.def;
    if (mode.selfCentred) pt = { x: u.x, y: u.y };
    await areaEffect(u, def, pt);
    mode = null;
    refreshUI();
  }

  async function doShove(u, target) {
    if (U.gdist(u.x, u.y, target.x, target.y) > 1) { DH.ui.toast('Too far to shove.', 'bad'); return; }
    u.eco.action--;
    const a = DH.dice.d20({ mod: C.skillMod(u.ch, 'athletics') });
    const dMod = Math.max(C.skillMod(target.ch, 'athletics'), C.skillMod(target.ch, 'acrobatics'));
    const d = DH.dice.d20({ mod: dMod });
    if (a.total > d.total) {
      const choice = U.chance(0.5) || true;
      C.addCondition(target.ch, 'prone');
      logLine(u.name + ' shoves ' + target.name + ' flat (' + a.total + ' to ' + d.total + ').', 'hit');
      DH.audio.sfx('hit');
    } else logLine(u.name + ' fails to shove ' + target.name + ' (' + a.total + ' to ' + d.total + ').');
  }
  async function doGrapple(u, target) {
    if (U.gdist(u.x, u.y, target.x, target.y) > 1) { DH.ui.toast('Too far to grapple.', 'bad'); return; }
    u.eco.action--;
    const a = DH.dice.d20({ mod: C.skillMod(u.ch, 'athletics') });
    const d = DH.dice.d20({ mod: Math.max(C.skillMod(target.ch, 'athletics'), C.skillMod(target.ch, 'acrobatics')) });
    if (a.total > d.total) { C.addCondition(target.ch, 'grappled'); logLine(u.name + ' has ' + target.name + ' held fast.', 'hit'); }
    else logLine(u.name + ' cannot get a grip on ' + target.name + '.');
  }
  async function doThrow(u, target) {
    /* find something throwable beside us */
    let from = null;
    for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1], [0, 0], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
      const c = cell(u.x + d[0], u.y + d[1]);
      if (c && c.throwable) { from = { x: u.x + d[0], y: u.y + d[1] }; break; }
    }
    if (!from) { DH.ui.toast('Nothing to pick up beside you.', 'bad'); return; }
    u.eco.action--;
    await throwProp(u, from, target);
  }
  async function doLayOnHands(u, target) {
    if (U.gdist(u.x, u.y, target.x, target.y) > 1) { DH.ui.toast('You must touch them.', 'bad'); return; }
    const pool = u.ch.res.lay_on_hands;
    const amount = Math.min(pool.cur, target.ch.hpMax - target.ch.hp || 5);
    pool.cur -= amount;
    u.eco.action--;
    healUnit(target, amount);
    logLine(u.name + ' lays hands on ' + target.name + ' for ' + amount + '.', 'heal');
  }
  async function doInspire(u, target) {
    u.eco.bonus--;
    u.ch.res.inspiration.cur--;
    target.inspired = true;
    logLine(u.name + ' inspires ' + target.name + ' — a d6 on their next roll.', 'heal');
    G.emit('spark', target.px, target.py - 20, 12, { life: 30 });
    DH.audio.sfx('heal');
  }

  async function doNpcAction(u, target, act) {
    u.eco.action--;
    await runNpcAction(u, target, act);
  }

  /* =============== monster and companion AI =============== */
  function nearestFoe(u) {
    let best = null, bd = 1e9;
    foesOf(u).forEach(f => {
      const d = U.gdist(u.x, u.y, f.x, f.y);
      if (d < bd) { bd = d; best = f; }
    });
    return best;
  }
  function pickTarget(u) {
    const foes = foesOf(u).filter(f => !f.ch.dying);
    if (!foes.length) return null;
    const style = (u.ai && u.ai.focus) || 'nearest';
    const scored = foes.map(f => {
      let s = 0;
      const d = U.gdist(u.x, u.y, f.x, f.y);
      s -= d * 2;
      if (style === 'weakest') s += (100 - (f.ch.hp / f.ch.hpMax) * 100) * 0.5 + (30 - f.ch.hpMax) * 0.3;
      if (style === 'strongest') s += f.ch.hpMax * 0.1;
      if (f.ch.hp <= 8) s += 12;
      return { f, s };
    });
    scored.sort((a, b) => b.s - a.s);
    return scored[0].f;
  }
  async function moveToward(u, target, maxFt) {
    const budget = Math.min(u.eco.move, maxFt == null ? u.eco.move : maxFt);
    if (budget <= 0) return;
    const res = U.flood(u.x, u.y, arena.w, arena.h, (nx, ny) => {
      if (!walkable(nx, ny)) return false;
      const o = unitAt(nx, ny);
      if (o && o !== u) return false;
      const c = cell(nx, ny);
      return c.difficult ? 10 : 5;
    }, budget, true);
    /* find the reachable square closest to the target */
    let best = null, bd = 1e9;
    res.dist.forEach((cost, key) => {
      const [x, y] = key.split(',').map(Number);
      const d = U.gdist(x, y, target.x, target.y);
      const keep = (u.ai && u.ai.keepDistance) || 0;
      const score = keep ? Math.abs(d - keep) : d;
      if (score < bd || (score === bd && cost < res.dist.get(bd + ''))) { bd = score; best = { x, y, cost }; }
    });
    if (!best || (best.x === u.x && best.y === u.y)) return;
    const path = U.tracePath(res, u.x, u.y, best.x, best.y);
    if (!path) return;
    for (const s of path) {
      u.facing = s.x > u.x ? 'right' : s.x < u.x ? 'left' : u.facing;
      u.x = s.x; u.y = s.y; snap(u);
      await U.wait(65);
    }
    u.eco.move -= best.cost;
  }

  async function aiTurn(u) {
    if (finished) { busy = false; return; }
    const ch = u.ch;
    if (C.incapacitated(ch)) { busy = false; endTurn(); return; }
    const target = pickTarget(u);
    if (!target) { busy = false; endTurn(); return; }

    /* frightened creatures back away */
    if (C.hasCondition(ch, 'frightened')) {
      logLine(u.name + ' is too frightened to close.', '');
      await moveAway(u, target);
      busy = false; endTurn(); return;
    }

    if (u.isCharacter) { await companionTurn(u, target); busy = false; endTurn(); return; }

    /* choose an action: weighted, honouring recharge and range */
    const acts = (ch.npcActions || []).filter(a => {
      if (a.recharge && (u.recharge[a.name] || 0) > 0) return false;
      if (a.uses && ch.res['act_' + a.name] && ch.res['act_' + a.name].cur <= 0) return false;
      return true;
    });
    /* close the distance first */
    const reachSq = 1;
    const wantMelee = !u.ai || u.ai.prefer !== 'ranged';
    if (!C.hasEffect(ch, 'immobile')) {
      if (wantMelee) await moveToward(u, target);
      else if (U.gdist(u.x, u.y, target.x, target.y) < ((u.ai.keepDistance || 4))) await moveAway(u, target);
      else await moveToward(u, target);
    }
    const dist = U.gdist(u.x, u.y, target.x, target.y);

    /* an area action if two or more would be caught */
    const areaAct = acts.find(a => a.shape);
    if (areaAct && U.chance(0.7)) {
      const tiles = tilesForShape(areaAct.shape, { x: u.x, y: u.y }, { x: target.x, y: target.y });
      const caught = foesOf(u).filter(f => tiles.some(t => t.x === f.x && t.y === f.y)).length;
      if (caught >= (areaAct.recharge ? 1 : 2)) {
        logLine(u.name + ' uses ' + areaAct.name + '!', 'crit');
        if (areaAct.recharge) u.recharge[areaAct.name] = areaAct.recharge;
        if (ch.res['act_' + areaAct.name]) ch.res['act_' + areaAct.name].cur--;
        DH.audio.sfx('roar');
        await areaEffect(u, areaAct, { x: target.x, y: target.y });
        u.eco.action--;
        busy = false; endTurn(); return;
      }
    }
    /* otherwise attack */
    const usable = acts.filter(a => {
      if (a.kind === 'attack') {
        const r = a.range ? Math.floor(a.range / 5) : Math.floor((a.reach || 5) / 5);
        return dist <= r;
      }
      return a.kind !== 'attack';
    });
    const weighted = usable.map(a => [a, a.weight || 3]);
    let n = ch.multiattack || 1;
    for (let i = 0; i < n; i++) {
      if (target.dead || finished) break;
      const choice = weighted.length ? U.pickWeighted(weighted) : null;
      if (!choice) break;
      await runNpcAction(u, target, choice);
      await U.wait(230);
      if (choice.kind !== 'attack') break;
    }
    u.eco.action--;
    busy = false;
    if (!finished) endTurn();
  }
  async function moveAway(u, from) {
    const res = U.flood(u.x, u.y, arena.w, arena.h, (nx, ny) => {
      if (!walkable(nx, ny)) return false;
      const o = unitAt(nx, ny); if (o && o !== u) return false;
      return cell(nx, ny).difficult ? 10 : 5;
    }, u.eco.move, true);
    let best = null, bd = -1;
    res.dist.forEach((cost, key) => {
      const [x, y] = key.split(',').map(Number);
      const d = U.gdist(x, y, from.x, from.y);
      if (d > bd) { bd = d; best = { x, y, cost }; }
    });
    if (!best) return;
    const path = U.tracePath(res, u.x, u.y, best.x, best.y);
    if (!path) return;
    for (const s of path) { u.x = s.x; u.y = s.y; snap(u); await U.wait(60); }
    u.eco.move -= best.cost;
  }

  async function runNpcAction(u, target, a) {
    const ch = u.ch;
    if (a.recharge) u.recharge[a.name] = a.recharge;
    if (ch.res['act_' + a.name]) ch.res['act_' + a.name].cur--;
    u.attackAnim = 12;
    u.facing = target.x < u.x ? 'left' : 'right';

    if (a.kind === 'attack') {
      const def = {
        id: a.name, name: a.name, atk: a.atk, dmg: a.dmg, dmgMod: 0, type: a.type,
        reach: a.reach || 5, ranged: !!a.range, range: a.range ? [a.range, a.range] : null,
        props: [], rider: a.rider
      };
      const times = a.times || 1;
      for (let i = 0; i < times; i++) {
        const res = await weaponAttack(u, target, def, {});
        if (res.hit && a.extra) {
          const r = DH.dice.roll(a.extra.dmg);
          damage(target, r.total, a.extra.type || def.type, {});
          logLine('…and ' + r.total + ' ' + (a.extra.type || def.type) + ' more.', 'hit');
        }
        if (times > 1) await U.wait(200);
      }
      return;
    }
    if (a.kind === 'save') {
      logLine(u.name + ' uses ' + a.name + '!', 'crit');
      if (a.shape) await areaEffect(u, a, { x: target.x, y: target.y });
      else {
        const sv = saveAgainst(target, a.save.ab, a.save.dc);
        let dmg = a.dmg ? DH.dice.roll(a.dmg).total : 0;
        if (sv.success) dmg = a.half ? Math.floor(dmg / 2) : 0;
        else if (a.cond) C.addCondition(target.ch, a.cond, a.dur || 1);
        if (dmg) damage(target, dmg, a.type, {});
        logLine(target.name + (sv.success ? ' resists' : ' is caught by') + ' ' + a.name + '.');
      }
      return;
    }
    if (a.kind === 'grapple') {
      const sv = saveAgainst(target, 'str', a.dc || 13);
      if (!sv.success) {
        C.addCondition(target.ch, 'grappled', -1);
        logLine(u.name + ' seizes ' + target.name + '!', 'hit');
        /* the hags drag people overboard */
        if (C.hasEffect(ch, 'drag_under')) {
          logLine(u.name + ' starts hauling ' + target.name + ' toward the rail.', 'hit');
          pushTowards(target, { x: u.x, y: 0 }, 1);
        }
      } else logLine(target.name + ' twists free of ' + u.name + '.');
      return;
    }
    if (a.kind === 'combo') {
      const def = { id: 'punch', name: 'Punch', atk: 7, dmg: '4d6+4', type: 'bludgeoning', reach: 5 };
      for (let i = 0; i < (a.punches || 2); i++) { await weaponAttack(u, target, def, {}); await U.wait(180); }
      if (a.grapple) {
        const sv = saveAgainst(target, 'str', a.dc || 15);
        if (!sv.success) { C.addCondition(target.ch, 'grappled', -1); logLine(target.name + ' is grappled.', 'hit'); }
      }
      return;
    }
    if (a.kind === 'summon') {
      const spot = freeSpot({ x: u.x - 1, y: u.y - 1, w: 3, h: 3 }, 0);
      for (let i = 0; i < (a.count || 1); i++) {
        const nu = unitFromMonster(a.summon, u.side);
        if (!nu) break;
        const s = freeSpot({ x: u.x - 2, y: u.y - 2, w: 5, h: 5 }, i);
        nu.x = s.x; nu.y = s.y; snap(nu);
        units.push(nu);
        nu.init = u.init - 0.1;
        order.splice(order.indexOf(u) + 1, 0, nu);
      }
      logLine(u.name + ' calls for help — ' + a.count + ' more join the fight.', 'crit');
      DH.audio.sfx('roar');
      refreshUI();
      return;
    }
    if (a.kind === 'heal') {
      const r = DH.dice.roll(a.heal);
      healUnit(a.self ? u : (alliesOf(u).sort((x, y) => x.ch.hp - y.ch.hp)[0] || u), r.total);
      logLine(u.name + ' uses ' + a.name + '.', 'heal');
      return;
    }
    if (a.kind === 'buff') {
      u.ch.buffs = u.ch.buffs || {};
      u.ch.buffs[a.name] = Object.assign({}, a.buff || {});
      logLine(u.name + ' uses ' + a.name + '.', 'heal');
      return;
    }
    if (a.kind === 'spell') {
      const sp = DH.spellById(a.spell);
      if (sp) {
        const slots = u.ch.spells.slots;
        const lv = a.slot || sp.lv;
        if (slots[lv] > 0) { slots[lv]--; await doSpellAsNpc(u, target, sp, lv); return; }
      }
      /* fall back to a swing */
      const def = { id: 'staff', name: 'Staff', atk: 4, dmg: '1d6', type: 'bludgeoning', reach: 5 };
      await weaponAttack(u, target, def, {});
      return;
    }
    if (a.kind === 'special') {
      if (a.special === 'call_half_dragon') {
        logLine(u.name + ' shrieks — something enormous answers.', 'crit');
        DH.audio.sfx('roar');
        DH.game.bump('kobold_calls');
        return;
      }
      if (a.special === 'hide') { u.hidden = true; logLine(u.name + ' steps behind a dancing couple and is gone.'); return; }
      logLine(u.name + ' ' + a.name.toLowerCase() + '.');
      return;
    }
    if (a.kind === 'move') { u.eco.move += u.eco.moveMax; return; }
    logLine(u.name + ' uses ' + a.name + '.');
  }
  async function doSpellAsNpc(u, target, sp, lv) {
    logLine(u.name + ' casts ' + sp.name + '.', 'turn');
    DH.audio.sfx('spell');
    const dc = 8 + 2 + C.abMod(u.ch, 'cha');
    if (sp.shape) { await areaEffect(u, { shape: sp.shape, save: sp.save ? { ab: sp.save, dc: dc } : null, dmg: sp.dmg, type: sp.type, half: sp.half }, { x: target.x, y: target.y }); return; }
    if (sp.roll === 'auto') { const r = DH.dice.roll(sp.dmg); damage(target, r.total, sp.type, {}); logLine(sp.name + ' hits for ' + r.total + '.', 'hit'); return; }
    if (sp.roll === 'attack') {
      const rays = sp.rays || 1;
      for (let i = 0; i < rays; i++) {
        const r = DH.dice.d20({ mod: 5, dc: totalAC(target) });
        if (r.success) { const d = DH.dice.roll(sp.dmg).total; damage(target, d, sp.type, {}); logLine(sp.name + ' hits for ' + d + '.', 'hit'); }
        else logLine(sp.name + ' misses.');
        await U.wait(150);
      }
      return;
    }
    if (sp.dmg) { const r = DH.dice.roll(sp.dmg); damage(target, r.total, sp.type, {}); }
  }

  /* Companions act on their own but sensibly. */
  async function companionTurn(u, target) {
    const ch = u.ch;
    /* heal a badly hurt friend if we can */
    const hurt = alliesOf(u).concat([u]).filter(v => v.ch.hp / v.ch.hpMax < 0.35).sort((a, b) => a.ch.hp - b.ch.hp)[0];
    const healSpell = C.castableSpells(ch).find(s => s.heal);
    if (hurt && healSpell && U.gdist(u.x, u.y, hurt.x, hurt.y) <= (healSpell.range === 5 ? 1 : 12)) {
      await doSpell(u, hurt, healSpell);
      if (u.eco.action <= 0) return;
    }
    if (ch.npcActions && ch.npcActions.length) {
      /* companions authored with explicit actions use them */
      const wantMelee = !u.ai || u.ai.prefer !== 'ranged';
      if (wantMelee) await moveToward(u, target);
      else if (U.gdist(u.x, u.y, target.x, target.y) < (u.ai.keepDistance || 4)) await moveAway(u, target);
      const dist = U.gdist(u.x, u.y, target.x, target.y);
      const usable = ch.npcActions.filter(a => {
        if (a.cost && a.cost.ki && (!ch.res.ki || ch.res.ki.cur < a.cost.ki)) return false;
        if (a.cost && a.cost.superiority && (!ch.res.superiority || ch.res.superiority.cur < 1)) return false;
        if (a.uses && ch.res['act_' + a.name] && ch.res['act_' + a.name].cur <= 0) return false;
        if (a.kind === 'attack') {
          const r = a.range ? Math.floor(a.range / 5) : Math.floor((a.reach || 5) / 5);
          return dist <= r;
        }
        return true;
      });
      if (!usable.length) { logLine(u.name + ' holds position.'); return; }
      const pick = U.pickWeighted(usable.map(a => [a, a.weight || 3]));
      if (pick.cost && pick.cost.ki) ch.res.ki.cur -= pick.cost.ki;
      if (pick.cost && pick.cost.superiority) ch.res.superiority.cur -= 1;
      await runNpcAction(u, target, pick);
      return;
    }
    /* otherwise use the character engine */
    const spells = C.castableSpells(ch).filter(s => s.dmg && s.lv > 0);
    const atk = C.attacks(ch)[0];
    if (spells.length && U.chance(0.5)) {
      const sp = spells.sort((a, b) => (b.ai || 1) - (a.ai || 1))[0];
      if (U.gdist(u.x, u.y, target.x, target.y) > 12) await moveToward(u, target);
      await doSpell(u, target, sp);
      return;
    }
    if (atk) {
      if (!atk.ranged) await moveToward(u, target);
      const dist = U.gdist(u.x, u.y, target.x, target.y);
      const r = atk.ranged ? Math.floor(atk.range[0] / 5) : Math.floor((atk.reach || 5) / 5);
      if (dist <= r) {
        u.eco.action--; u.eco.attacksLeft = (atk.count || 1) - 1;
        for (let i = 0; i < (atk.count || 1); i++) {
          if (target.dead) break;
          await weaponAttack(u, target, atk, {});
          await U.wait(200);
        }
      } else logLine(u.name + ' cannot reach ' + target.name + '.');
    }
  }

  function deathSaveFor(u) {
    const r = C.deathSave(u.ch);
    if (r.died) { u.dead = true; logLine(u.name + ' dies.', 'crit'); onUnitDown(u); }
    else if (r.revived) logLine(u.name + ' gasps back to consciousness on a natural 20!', 'heal');
    else if (r.stabilised) logLine(u.name + ' stabilises.', 'heal');
    else logLine(u.name + ' fails a death save (' + u.ch.deathSaves.f + '/3).', 'hit');
    checkEnd();
  }

  /* =============== main update and draw =============== */
  function update(dt) {
    const m = DH.input.mouse;
    hoverTile = null; hoverUnit = null;
    const gx = Math.floor((m.x - ox) / CELL), gy = Math.floor((m.y - oy) / CELL);
    if (inBounds(gx, gy)) { hoverTile = { x: gx, y: gy }; hoverUnit = unitAt(gx, gy); }
    if (!busy && !finished && !DH.ui.modalOpen() && !DH.ui.dlgVisible()) {
      if (m.clicked) handleClick();
      /* only your own turn is yours to end */
      if (DH.input.tapped('endturn')) { const u = active(); if (u && u.isPC) endTurn(); }
      if (DH.input.tapped('pod')) { const u = active(); if (u && u.isPC) { usePod(u); refreshUI(); } }
      if (DH.input.tapped('cancel')) { mode = null; refreshUI(); }
    }
    units.forEach(u => { if (u.attackAnim > 0) u.attackAnim--; });
  }

  function draw() {
    if (!arena) return;
    /* the ground */
    G.cam.x = 0; G.cam.y = 0;
    G.rect(0, 0, G.VW, G.VH, '#070a10', true);
    for (let y = 0; y < arena.h; y++) {
      for (let x = 0; x < arena.w; x++) {
        const c = cell(x, y);
        const px = ox + x * CELL, py = oy + y * CELL;
        /* tiles are 16px painters; stretch them across the 24px cell */
        const ctx = G.ctx;
        ctx.save();
        ctx.translate(px, py);
        ctx.scale(CELL / DH.gfx.TILE, CELL / DH.gfx.TILE);
        G.drawTile(c.t, 0, 0);
        if (c.prop) G.drawProp(c.prop, 0, 0, { broken: c.broken, cold: c.cold });
        ctx.restore();
        /* the grid itself */
        G.alpha(0.16, () => G.stroke(px, py, CELL, CELL, '#8ba0c0', 1, true));
        if (c.difficult) G.alpha(0.2, () => G.rect(px + 2, py + 2, CELL - 4, CELL - 4, '#8a7350', true));
        if (c.hazard === 'lava') G.alpha(0.3, () => G.rect(px, py, CELL, CELL, '#d4571f', true));
        if (c.cold) G.alpha(0.22, () => G.rect(px, py, CELL, CELL, '#a8d8e8', true));
      }
    }
    /* reachable squares for the active unit */
    const u = active();
    if (u && u.isPC && reach && !busy) {
      reach.dist.forEach((cost, key) => {
        if (cost > u.eco.move) return;
        const [x, y] = key.split(',').map(Number);
        if (x === u.x && y === u.y) return;
        if (unitAt(x, y)) return;
        const px = ox + x * CELL, py = oy + y * CELL;
        G.alpha(0.2 + Math.sin(G.tick * 0.06 + cost * 0.4) * 0.05, () => {
          G.rect(px + 2, py + 2, CELL - 4, CELL - 4, '#5fa8d0', true);
        });
      });
    }
    /* hover */
    if (hoverTile) {
      const px = ox + hoverTile.x * CELL, py = oy + hoverTile.y * CELL;
      const key = hoverTile.x + ',' + hoverTile.y;
      const legal = u && u.isPC && reach && reach.dist.has(key) && reach.dist.get(key) <= u.eco.move;
      G.stroke(px, py, CELL, CELL, legal ? G.C.gold : '#8ba0c0', 2, true);
      if (legal && !hoverUnit) {
        G.text(reach.dist.get(key) + ' ft', px + CELL / 2, py + CELL / 2 - 3, { align: 'center', size: 8, color: G.C.gold });
      }
      /* path preview */
      if (legal && !hoverUnit) {
        const path = U.tracePath(reach, u.x, u.y, hoverTile.x, hoverTile.y);
        if (path) path.forEach(s => {
          G.alpha(0.5, () => G.rect(ox + s.x * CELL + CELL / 2 - 2, oy + s.y * CELL + CELL / 2 - 2, 4, 4, G.C.gold, true));
        });
      }
      /* area preview */
      if (mode && (mode.kind === 'area' || (mode.kind === 'spell' && mode.spell.shape))) {
        const shape = mode.kind === 'area' ? mode.def.shape : mode.spell.shape;
        const tiles = tilesForShape(shape, { x: u.x, y: u.y }, hoverTile);
        tiles.forEach(t => {
          if (!inBounds(t.x, t.y)) return;
          G.alpha(0.3, () => G.rect(ox + t.x * CELL, oy + t.y * CELL, CELL, CELL, '#d4571f', true));
        });
      }
    }

    /* units, sorted by row */
    const sorted = units.filter(x => !x.dead || x.ch.dying).slice().sort((a, b) => a.py - b.py);
    sorted.forEach(v => {
      const active_ = v === u;
      if (active_) {
        G.alpha(0.35 + Math.sin(G.tick * 0.1) * 0.15, () => {
          G.ellipseS(v.px, v.py - 2, 12, 5, G.C.gold, 2, true);
        });
      }
      const opts = {
        scale: v.scale, facing: v.facing, moving: false,
        weapon: v.weapon || null, attacking: v.attackAnim > 0,
        phase: v.x * 0.7 + v.y * 0.3, glowEyes: v.spec && v.spec.eyeGlow
      };
      /* creature painters work in world space; the combat camera sits at 0,0 */
      G.creature(v.spec, v.px, v.py, opts);
      if (C.hasCondition(v.ch, 'shielded')) {
        G.alpha(0.3 + Math.sin(G.tick * 0.2) * 0.15, () => G.ellipseS(v.px, v.py - 16, 15, 19, '#6fd0ff', 2, true));
      }
      if (v.ch.dying) G.text('✚', v.px, v.py - 40, { align: 'center', size: 10, color: '#d4574a' });
      /* Health bars for everyone, but only name the unit that matters right now —
         six figures standing shoulder to shoulder would otherwise be a wall of
         overlapping text. */
      G.healthBar(v.px, v.py - 34 * (v.scale || 1) - 6, 24, v.ch.hp / v.ch.hpMax,
        v.side === 'foe' ? '#d4574a' : '#7fbf5f');
      if (active_ || v === hoverUnit) {
        G.alpha(0.95, () => G.text(v.name, v.px, v.py - 34 * (v.scale || 1) - 16, {
          align: 'center', size: 7, color: v.side === 'foe' ? '#e9a49c' : '#c8e6b8'
        }));
      }
      const conds = (v.ch.conditions || []).filter(c => c.id !== 'concentrating');
      if (conds.length && (active_ || v === hoverUnit)) {
        G.alpha(0.9, () => G.text(conds.map(c => (DH.CONDITION_INFO[c.id] || { name: c.id }).name).join(' '),
          v.px, v.py + 2, { align: 'center', size: 6, color: '#d8c0ff' }));
      } else if (conds.length) {
        /* a small mark so you can still see somebody is affected */
        G.alpha(0.85, () => G.rect(v.px + 8, v.py - 34 * (v.scale || 1) - 6, 3, 3, '#d8c0ff'));
      }
    });

    G.updateParticles();
    G.updateFloaters();

    if (arena.rain) G.rain(arena.rain, 5);
    if (arena.fog) G.alpha(0.2, () => G.rect(0, 0, G.VW, G.VH, '#7a8a7a', true));
    if (arena.dark) {
      const lights = units.filter(v => !v.dead).map(v => ({ x: v.px, y: v.py - 12, r: 92 }));
      (arena.props || []).forEach(p => { if (p.light) lights.push({ x: ox + p.x * CELL + 12, y: oy + p.y * CELL + 12, r: p.light, flicker: true }); });
      G.lighting(arena.dark, lights);
    }
    if (arena.thunder && U.chance(0.0025)) { G.flash(0.35); G.shake(3); }
    G.vignette(0.5);

    /* the selected action, as a reminder under the cursor */
    if (mode && mode.label) {
      G.text(mode.label, DH.input.mouse.x + 10, DH.input.mouse.y - 12, { size: 8, color: G.C.gold });
    }
  }

  /* An API handed to encounter scripts so they can bend a fight. */
  function api() {
    return {
      units: units, round: () => round, log: logLine,
      unitAt: unitAt, cell: cell, damage: damage, heal: healUnit,
      addUnit(id, side, x, y) {
        const nu = unitFromMonster(id, side);
        if (!nu) return null;
        const s = (x != null) ? { x, y } : freeSpot(arena.enemyZone, units.length);
        nu.x = s.x; nu.y = s.y; snap(nu);
        nu.init = 12; units.push(nu);
        order.push(nu);
        refreshUI();
        return nu;
      },
      removeUnit(u) { u.dead = true; refreshUI(); },
      finish: finish,
      party: () => units.filter(u => u.side === 'party'),
      foes: () => units.filter(u => u.side === 'foe')
    };
  }

  /* A read-only window on the battlefield, for tooling and automated playtests:
     enough to find a unit's position on screen and whose turn it is. */
  function inspect() {
    const u = active();
    return {
      round: round, finished: finished, busy: busy,
      origin: { x: ox, y: oy, cell: CELL },
      activeName: u ? u.name : null,
      activeIsPC: !!(u && u.isPC),
      units: units.map(v => ({
        name: v.name, side: v.side, dead: v.dead, isPC: v.isPC,
        x: v.x, y: v.y, px: v.px, py: v.py,
        hp: v.ch.hp, hpMax: v.ch.hpMax, ac: totalAC(v),
        conditions: (v.ch.conditions || []).map(c => c.id)
      }))
    };
  }

  return {
    name: 'combat', enter, exit, update, draw, inspect,
    resume() { buildUI(); },
    pause() { DH.ui.clear(); }
  };
})();
