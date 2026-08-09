/* Headless smoke test for Drakehaven Island.
   Stubs just enough browser to load every module, then exercises the rules,
   the data, the combat maths and the whole campaign script graph.

   Run:  node tools/smoketest.js
*/
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
let failures = 0, checks = 0;
function ok(cond, msg) {
  checks++;
  if (!cond) { failures++; console.log('  FAIL  ' + msg); }
}
function section(name) { console.log('\n=== ' + name + ' ==='); }

/* ---------------- a very small DOM ---------------- */
function makeEl(tag) {
  const el = {
    tagName: (tag || 'div').toUpperCase(),
    style: {}, dataset: {}, children: [], childNodes: [], parentNode: null,
    className: '', id: '', textContent: '', _html: '',
    get innerHTML() { return this._html; },
    set innerHTML(v) { this._html = String(v); this.children = []; this.childNodes = []; },
    appendChild(c) { c.parentNode = this; this.children.push(c); this.childNodes.push(c); return c; },
    removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) { this.children.splice(i, 1); this.childNodes.splice(i, 1); } return c; },
    remove() { if (this.parentNode) this.parentNode.removeChild(this); },
    addEventListener() { }, removeEventListener() { },
    querySelector() { return null }, querySelectorAll() { return [] },
    getBoundingClientRect() { return { left: 0, top: 0, width: 640, height: 360 }; },
    classList: { add() { }, remove() { }, contains() { return false } },
    get firstChild() { return this.children[0] || null; },
    focus() { }, click() { },
    getContext() { return makeCtx(); },
    width: 640, height: 360,
    offsetWidth: 100, offsetHeight: 40
  };
  return el;
}
function makeCtx() {
  const noop = () => { };
  return {
    canvas: { width: 640, height: 360 },
    save: noop, restore: noop, setTransform: noop, translate: noop, scale: noop, rotate: noop,
    clearRect: noop, fillRect: noop, strokeRect: noop, beginPath: noop, closePath: noop,
    moveTo: noop, lineTo: noop, arc: noop, ellipse: noop, fill: noop, stroke: noop,
    fillText: noop, measureText: () => ({ width: 10 }),
    createRadialGradient: () => ({ addColorStop: noop }),
    createLinearGradient: () => ({ addColorStop: noop }),
    drawImage: noop,
    globalAlpha: 1, globalCompositeOperation: 'source-over',
    imageSmoothingEnabled: false, font: '', textAlign: '', textBaseline: '',
    fillStyle: '', strokeStyle: '', lineWidth: 1
  };
}

const elements = {};
['screen', 'ui', 'toasts', 'dicelog', 'stage', 'rotate'].forEach(id => {
  elements[id] = makeEl('div'); elements[id].id = id;
});
const document_ = {
  readyState: 'complete',
  createElement: makeEl,
  getElementById: (id) => elements[id] || null,
  querySelector: () => null,
  addEventListener() { }, removeEventListener() { },
  body: makeEl('body')
};

const sandbox = {
  console, Math, Date, JSON, parseInt, parseFloat, isNaN, String, Number, Boolean,
  Array, Object, Error, Promise, Set, Map, RegExp,
  setTimeout, clearTimeout, setInterval, clearInterval,
  document: document_,
  performance: { now: () => Date.now() },
  requestAnimationFrame: () => 0,
  localStorage: (() => {
    const m = {};
    return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; } };
  })(),
  AudioContext: undefined, webkitAudioContext: undefined,
  innerWidth: 1280, innerHeight: 720,
  addEventListener() { }, removeEventListener() { }
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

/* ---------------- load in the same order index.html does ---------------- */
const order = [
  'js/core/util.js', 'js/core/input.js', 'js/core/audio.js', 'js/core/gfx.js',
  'js/core/ui.js', 'js/core/save.js', 'js/rules/dice.js',
  'js/data/races.js', 'js/data/classes.js', 'js/data/backgrounds.js', 'js/data/spells.js',
  'js/data/items.js', 'js/data/monsters.js', 'js/data/maps.js', 'js/data/story.js',
  'js/rules/character.js', 'js/core/game.js',
  'js/scenes/title.js', 'js/scenes/charcreate.js', 'js/scenes/overworld.js',
  'js/scenes/combat.js', 'js/scenes/script.js', 'js/scenes/shop.js',
  'js/scenes/minigames.js', 'js/scenes/journal.js'
];

section('loading modules');
/* index.html must list every file we load, and nothing we do not */
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
order.forEach(f => ok(html.indexOf(f) >= 0, 'index.html references ' + f));

order.forEach(f => {
  const code = fs.readFileSync(path.join(ROOT, f), 'utf8');
  try {
    vm.runInContext(code, sandbox, { filename: f });
  } catch (e) {
    failures++;
    console.log('  FAIL  loading ' + f + ': ' + e.message);
    console.log(e.stack.split('\n').slice(0, 4).join('\n'));
  }
});
const DH = sandbox.DH;
ok(!!DH, 'DH namespace exists');
DH.gfx.init(elements.screen);

/* ---------------- data integrity ---------------- */
section('data');
ok(DH.RACES.length >= 15, 'at least 15 races (' + DH.RACES.length + ')');
ok(DH.CLASSES.length === 12, 'exactly 12 classes (' + DH.CLASSES.length + ')');
DH.CLASSES.forEach(c => {
  ok(!!c.hitDie, c.name + ' has a hit die');
  ok(Array.isArray(c.saves) && c.saves.length === 2, c.name + ' has two save proficiencies');
  ok((c.subclasses || []).length >= 3, c.name + ' has at least 3 subclasses');
  ok(!!c.features[1], c.name + ' has level 1 features');
  ok(c.skillList && c.skillList.length >= 2, c.name + ' has a skill list');
  (c.subclasses || []).forEach(s => ok(!!s.features, c.name + '/' + s.name + ' has features'));
});
ok(DH.BACKGROUNDS.length >= 12, 'at least 12 backgrounds');
DH.BACKGROUNDS.forEach(b => {
  ok(b.skills.length === 2, b.name + ' grants two skills');
  b.skills.forEach(s => ok(!!DH.SKILLS[s], b.name + ' skill "' + s + '" is real'));
  (b.kit || []).forEach(i => ok(!!DH.item(i), b.name + ' kit item "' + i + '" exists'));
});
ok(DH.SPELLS.length >= 70, 'at least 70 spells (' + DH.SPELLS.length + ')');
const spellIds = new Set();
DH.SPELLS.forEach(s => {
  ok(!spellIds.has(s.id), 'spell id "' + s.id + '" is unique'); spellIds.add(s.id);
  ok(typeof s.lv === 'number', s.name + ' has a level');
  ok(!!s.lists, s.name + ' has class lists');
  if (s.dmg) ok(!isNaN(DH.dice.avg(s.dmg)), s.name + ' damage "' + s.dmg + '" parses');
  if (s.heal) ok(!isNaN(DH.dice.avg(s.heal)), s.name + ' healing parses');
});
/* every class kit item and starting weapon resolves */
DH.CLASSES.forEach(c => (c.kit || []).forEach(i => ok(!!DH.item(i), c.name + ' kit item "' + i + '" exists')));
/* shops sell things that exist */
Object.keys(DH.SHOPS).forEach(id => {
  DH.SHOPS[id].stock.forEach(r => ok(!!DH.item(r.id), 'shop ' + id + ' sells real item ' + r.id));
});
DH.RECIPES.forEach(r => {
  ok(!!DH.item(r.out), 'recipe output ' + r.out + ' exists');
  Object.keys(r.need).forEach(k => ok(!!DH.item(k), 'recipe input ' + k + ' exists'));
});
Object.keys(DH.LOOT).forEach(t => DH.LOOT[t].forEach(r => ok(!!DH.item(r[0]), 'loot ' + t + ' item ' + r[0] + ' exists')));

/* monsters */
Object.keys(DH.MONSTERS).forEach(id => {
  const m = DH.MONSTERS[id];
  ok(m.hp > 0, m.name + ' has hit points');
  ok(m.ac > 0, m.name + ' has AC');
  ok(!!m.abilities && m.abilities.str, m.name + ' has abilities');
  ok(!!m.visual && !!m.visual.body, m.name + ' has a visual body type');
  (m.actions || []).forEach(a => {
    if (a.dmg) ok(!isNaN(DH.dice.avg(a.dmg)), m.name + '/' + a.name + ' damage "' + a.dmg + '" parses');
    if (a.summon) ok(!!DH.MONSTERS[a.summon], m.name + ' summons real monster ' + a.summon);
  });
});
DH.COMPANIONS.forEach(c => {
  ok(c.hp > 0 && c.ac > 0, c.name + ' has hp and ac');
  (c.spells || []).forEach(s => ok(!!DH.spellById(s), c.name + ' knows real spell ' + s));
  ok(!!DH.item(c.weapon), c.name + ' weapon exists');
});

/* maps */
section('maps');
Object.keys(DH.MAPS).forEach(id => {
  const m = DH.MAPS[id];
  const widths = new Set(m.rows.map(r => r.length));
  ok(widths.size === 1, id + ' rows are all the same width');
  ok(!!m.spawns && !!m.spawns.start, id + ' has a start spawn');
  /* the start spawn must be standable */
  const sp = m.spawns.start;
  ok(!DH.mapAt(m, sp.x, sp.y).s, id + ' start spawn is not inside a wall');
  (m.exits || []).forEach(e => {
    ok(!!DH.MAPS[e.to], id + ' exit points at real map ' + e.to);
    if (DH.MAPS[e.to]) {
      ok(!!DH.MAPS[e.to].spawns[e.spawn], id + ' exit spawn "' + e.spawn + '" exists in ' + e.to);
      const dsp = DH.MAPS[e.to].spawns[e.spawn];
      if (dsp) ok(!DH.mapAt(DH.MAPS[e.to], dsp.x, dsp.y).s, id + ' → ' + e.to + ' arrives somewhere standable');
    }
    ok(e.x >= 0 && e.x < m.w && e.y >= 0 && e.y < m.h, id + ' exit is inside the map');
    /* you have to be able to walk onto the exit tile to use it */
    ok(!DH.mapAt(m, e.x, e.y).s, id + ' exit at ' + e.x + ',' + e.y + ' is reachable on foot');
  });
  (m.npcs || []).forEach(n => {
    ok(!!DH.STORY[n.script], id + ' npc ' + n.id + ' has script "' + n.script + '"');
    ok(!DH.mapAt(m, n.x, n.y).s, id + ' npc ' + n.id + ' is not inside a wall');
    if (n.visualFrom) ok(!!DH.MONSTERS[n.visualFrom] || !!DH.companion(n.visualFrom), id + ' npc visualFrom ' + n.visualFrom);
  });
  (m.triggers || []).forEach(t => ok(!!DH.STORY[t.script], id + ' trigger script "' + t.script + '" exists'));
  (m.lights || []).forEach(l => ok(l.x < m.w && l.y < m.h, id + ' light is inside the map'));
});
/* every arena is coherent */
Object.keys(DH.ARENAS).forEach(id => {
  const a = DH.ARENAS[id];
  ok(a.w > 0 && a.h > 0, id + ' has dimensions');
  (a.props || []).forEach(p => ok(p.x < a.w && p.y < a.h, id + ' prop inside bounds'));
  const z = a.playerZone, e = a.enemyZone;
  ok(z && z.x + z.w <= a.w && z.y + z.h <= a.h, id + ' player zone fits');
  ok(e && e.x + e.w <= a.w && e.y + e.h <= a.h, id + ' enemy zone fits');
  ok(!!DH.gfx.TILES[a.tile], id + ' uses a real tile painter "' + a.tile + '"');
});

/* ---------------- story graph ---------------- */
section('story');
const storyIds = Object.keys(DH.STORY);
ok(storyIds.length > 60, 'campaign has plenty of scripts (' + storyIds.length + ')');
const known = new Set(storyIds);
let storyProblems = 0;
const VALID_STEPS = new Set(['say', 'narr', 'choice', 'check', 'partyCheck', 'partySave', 'combat',
  'give', 'giveAll', 'gold', 'take', 'xp', 'flag', 'quest', 'questDone', 'count', 'music', 'ambience',
  'sfx', 'thunder', 'chapter', 'banner', 'toast', 'travel', 'wait', 'fadeOut', 'fadeIn', 'shake',
  'flash', 'particles', 'shop', 'minigame', 'join', 'joinAll', 'pods', 'tamePet', 'longRest',
  'shortRest', 'heal', 'setTile', 'deadline', 'muster', 'if', 'do', 'run', 'stop']);

function walkStory(list, where) {
  (list || []).forEach(step => {
    if (!step) return;
    if (step.t && !VALID_STEPS.has(step.t)) { console.log('  FAIL  ' + where + ' unknown step "' + step.t + '"'); failures++; storyProblems++; }
    if (step.t === 'run' && !known.has(step.id)) { console.log('  FAIL  ' + where + ' run:' + step.id + ' missing'); failures++; storyProblems++; }
    if (step.t === 'give' || step.t === 'giveAll' || step.t === 'take') {
      if (typeof step.item === 'string' && !DH.item(step.item)) { console.log('  FAIL  ' + where + ' item:' + step.item + ' missing'); failures++; storyProblems++; }
    }
    if (step.t === 'travel' && !DH.MAPS[step.map]) { console.log('  FAIL  ' + where + ' travel:' + step.map + ' missing'); failures++; storyProblems++; }
    if (step.t === 'shop' && !DH.SHOPS[step.id]) { console.log('  FAIL  ' + where + ' shop:' + step.id + ' missing'); failures++; storyProblems++; }
    if (step.t === 'minigame' && !DH.scenes.minigames.GAMES[step.game]) { console.log('  FAIL  ' + where + ' minigame:' + step.game + ' missing'); failures++; storyProblems++; }
    if (step.t === 'combat') {
      if (!DH.ARENAS[step.arena]) { console.log('  FAIL  ' + where + ' arena:' + step.arena + ' missing'); failures++; storyProblems++; }
      (step.enemies || []).forEach(en => {
        const id = typeof en === 'string' ? en : en.id;
        if (!DH.MONSTERS[id]) { console.log('  FAIL  ' + where + ' enemy:' + id + ' missing'); failures++; storyProblems++; }
      });
      (step.allies || []).forEach(al => {
        const id = typeof al === 'string' ? al : al.id;
        if (!DH.MONSTERS[id]) { console.log('  FAIL  ' + where + ' ally:' + id + ' missing'); failures++; storyProblems++; }
      });
    }
    if (step.t === 'join' && !DH.companion(step.who)) { console.log('  FAIL  ' + where + ' join:' + step.who + ' missing'); failures++; storyProblems++; }
    if (step.t === 'check' || step.t === 'partyCheck') {
      if (step.skill && !DH.SKILLS[step.skill]) { console.log('  FAIL  ' + where + ' skill:' + step.skill + ' missing'); failures++; storyProblems++; }
    }
    if (step.t === 'tamePet' && step.id && !DH.MONSTERS[step.id]) { console.log('  FAIL  ' + where + ' pet:' + step.id); failures++; storyProblems++; }
    (step.options || []).forEach(o => {
      if (o.run && !known.has(o.run)) { console.log('  FAIL  ' + where + ' option run:' + o.run + ' missing'); failures++; storyProblems++; }
      walkStory(o.then, where);
    });
    ['then', 'else', 'ok', 'fail', 'onWin', 'onLose'].forEach(k => walkStory(step[k], where));
  });
}
storyIds.forEach(id => walkStory(DH.STORY[id], id));
ok(storyProblems === 0, 'story graph resolves with no dangling references');

/* ---------------- character construction: every class and race ---------------- */
section('characters');
const built = [];
DH.CLASSES.forEach(cls => {
  DH.RACES.forEach(race => {
    const ch = DH.char.create({
      name: 'Test', raceId: race.id, classId: cls.id,
      subclassId: (cls.subclasses[0] || {}).id,
      backgroundId: 'sailor',
      ancestry: race.ancestries ? race.ancestries[0].id : null,
      abilities: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
      skills: cls.skillList.slice(0, cls.skillCount),
      fightingStyle: 'defense'
    });
    built.push(ch);
    ok(ch.hpMax > 0, cls.name + '/' + race.name + ' has hit points');
    ok(ch.ac >= 10, cls.name + '/' + race.name + ' AC >= 10 (' + ch.ac + ')');
    ok(ch.speed >= 25, cls.name + '/' + race.name + ' has a speed');
    ok(DH.char.attacks(ch).length > 0, cls.name + '/' + race.name + ' has at least one attack');
    if (cls.caster) {
      ok(ch.spellDC > 0, cls.name + ' has a spell save DC');
      /* paladins and rangers only begin casting at 2nd level, so at 1st they
         correctly know nothing */
      if (ch.maxSpellLevel > 0) ok(DH.char.knownSpells(ch).length > 0, cls.name + ' knows spells');
    }
  });
});
console.log('  built ' + built.length + ' class/race combinations');

/* level every class to 10 and make sure nothing explodes */
DH.CLASSES.forEach(cls => {
  const ch = DH.char.create({
    name: 'Ten', raceId: 'human', classId: cls.id, subclassId: (cls.subclasses[0] || {}).id,
    backgroundId: 'soldier', abilities: { str: 15, dex: 14, con: 14, int: 12, wis: 12, cha: 10 },
    skills: cls.skillList.slice(0, cls.skillCount), fightingStyle: 'dueling'
  });
  for (let i = 0; i < 12; i++) DH.char.gainXp(ch, 20000);
  ok(ch.level === 10, cls.name + ' caps at level 10 (got ' + ch.level + ')');
  ok(ch.hpMax > 10, cls.name + ' level 10 has sensible hit points (' + ch.hpMax + ')');
  ok(ch.prof === 4, cls.name + ' level 10 proficiency is +4');
  DH.char.longRest(ch);
  DH.char.shortRest(ch);
  if (cls.caster && cls.caster.type !== 'pact') {
    const slots = DH.char.slotsAvailable(ch);
    ok(slots.length > 0, cls.name + ' has spell slots at 10');
  }
});

/* ---------------- rules maths ---------------- */
section('rules');
ok(DH.char.mod(10) === 0 && DH.char.mod(20) === 5 && DH.char.mod(7) === -2, 'ability modifiers');
ok(DH.char.profFor(1) === 2 && DH.char.profFor(5) === 3 && DH.char.profFor(9) === 4, 'proficiency by level');
const r1 = DH.dice.roll('2d6+3');
ok(r1.total >= 5 && r1.total <= 15, '2d6+3 in range (' + r1.total + ')');
ok(DH.dice.roll('4d6dl1').rolls.length === 3, '4d6 drop lowest keeps three');
ok(Math.abs(DH.dice.avg('1d8') - 4.5) < 0.001, 'average of 1d8');
ok(Math.abs(DH.dice.avg('2d6+3') - 10) < 0.001, 'average of 2d6+3');
const crit = DH.dice.roll('1d8', { crit: true });
ok(crit.rolls.length === 2, 'critical doubles the dice');
let advWins = 0;
for (let i = 0; i < 4000; i++) {
  const a = DH.dice.d20({ adv: true }), b = DH.dice.d20({ dis: true });
  if (a.natural > b.natural) advWins++;
}
ok(advWins > 2600, 'advantage beats disadvantage most of the time (' + advWins + '/4000)');
const both = DH.dice.d20({ adv: true, dis: true });
ok(both.both.length === 1, 'advantage and disadvantage cancel to one die');

/* damage, resistance, immunity */
const dummy = DH.char.create({ name: 'Dummy', raceId: 'tiefling', classId: 'fighter', subclassId: 'champion', backgroundId: 'soldier', abilities: { str: 14, dex: 12, con: 14, int: 10, wis: 10, cha: 10 }, skills: ['athletics', 'perception'] });
dummy.hp = 40; dummy.hpMax = 40;
DH.char.applyDamage(dummy, 10, 'fire');
ok(dummy.hp === 35, 'tiefling halves fire damage (hp ' + dummy.hp + ')');
DH.char.applyDamage(dummy, 10, 'slashing');
ok(dummy.hp === 25, 'ordinary damage applies in full');
DH.char.addTempHp(dummy, 8);
DH.char.applyDamage(dummy, 5, 'slashing');
ok(dummy.hp === 25 && dummy.tempHp === 3, 'temporary hit points soak first');
DH.char.heal(dummy, 100);
ok(dummy.hp === dummy.hpMax, 'healing caps at maximum');
dummy.hp = 3;
const drop = DH.char.applyDamage(dummy, 10, 'slashing');
ok(dummy.hp === 0 && (drop.dropped || drop.relentless), 'dropping to zero is handled');

/* conditions */
const cond = built[0];
DH.char.addCondition(cond, 'poisoned', 2);
ok(DH.char.hasCondition(cond, 'poisoned'), 'condition applied');
DH.char.tickConditions(cond); DH.char.tickConditions(cond);
ok(!DH.char.hasCondition(cond, 'poisoned'), 'condition expires on its timer');

/* death saves and the house rule that costs a level */
const dyer = DH.char.create({ name: 'Doomed', raceId: 'human', classId: 'rogue', subclassId: 'thief', backgroundId: 'urchin', abilities: { str: 10, dex: 15, con: 12, int: 13, wis: 10, cha: 12 }, skills: ['stealth', 'acrobatics', 'perception', 'investigation'] });
DH.char.gainXp(dyer, 1000);
const lvlBefore = dyer.level;
dyer.dead = true;
DH.char.loseLevel(dyer);
ok(dyer.level === lvlBefore - 1, 'dying costs one character level');
ok(!dyer.dead && dyer.hp > 0, 'the character comes back on their feet');

/* pods */
section('pact pods');
DH.game.reset();
DH.game.state.party = [built[0]];
DH.game.issuePods();
const podOwner = DH.game.pc();
ok(!!podOwner.pod, 'the pod is issued');
ok(podOwner.pod.max === 2, 'two charges at low level');
podOwner.level = 9; DH.char.derive(podOwner);
ok(podOwner.pod.max === 5, 'five charges at level 9');
ok(DH.game.state.commandPod.max === 4, 'the command pod charges four');
podOwner.pod.charges = 0;
DH.game.longRest();
ok(podOwner.pod.charges === podOwner.pod.max, 'a long rest refills the pod');

/* ---------------- pathfinding and grid ---------------- */
section('grid');
const U = DH.util;
ok(U.gdist(0, 0, 3, 3) === 3, 'diagonals cost the same as straight lines');
const flood = U.flood(0, 0, 10, 10, () => 5, 30, true);
ok(flood.dist.get('0,0') === 0, 'flood starts at zero cost');
ok(flood.dist.get('3,0') === 15, 'three squares costs 15 ft');
ok(!flood.dist.has('7,0'), 'beyond the movement budget is unreachable');
const walled = U.flood(0, 0, 6, 6, (x, y) => (x === 2 ? false : 5), 60, true);
ok(!walled.dist.has('3,3'), 'a wall blocks the flood');
const p = U.tracePath(flood, 0, 0, 2, 2);
ok(p && p.length === 2, 'path traced through the flood');
ok(U.burst(5, 5, 1).length === 9, 'a one-square burst covers nine tiles');
ok(U.line(0, 0, 3, 0).length === 4, 'lines include both ends');
ok(U.cone(0, 0, 1, 0, 3).length > 3, 'cones cover several tiles');

/* ---------------- combat, driven headlessly ---------------- */
section('combat');
DH.game.reset();
const hero = DH.char.create({
  name: 'Hero', raceId: 'half_orc', classId: 'fighter', subclassId: 'champion', backgroundId: 'soldier',
  abilities: { str: 15, dex: 13, con: 14, int: 10, wis: 12, cha: 8 }, skills: ['athletics', 'perception'],
  fightingStyle: 'defense'
});
DH.game.state.party = [hero];
['mahoraga', 'dex', 'wyatt', 'lucas', 'ball_wizard'].forEach(id => DH.game.addCompanion(id));
ok(DH.game.party().length === 6, 'the party is the player plus five companions');
DH.game.party().forEach(c => {
  ok(c.hpMax > 0, c.name + ' has hit points in the party');
  ok(c.ac > 0, c.name + ' has AC in the party');
});

/* the real combat scene, stepped by hand */
let combatFinished = null;
DH.scenes.combat.enter({
  arena: 'ship_deck_fight', enemies: ['sea_hag', 'sea_hag'], allies: ['sailor'],
  onDone: (res) => { combatFinished = res; }
});
ok(true, 'combat scene entered without throwing');
/* drive a few hundred frames; the AI is asynchronous so we let timers run */
function pump(frames) {
  for (let i = 0; i < frames; i++) {
    try { DH.gfx.begin(); DH.scenes.combat.update(0.016); DH.scenes.combat.draw(); DH.gfx.end(); }
    catch (e) { failures++; console.log('  FAIL  combat frame threw: ' + e.message); console.log(e.stack.split('\n').slice(0, 3).join('\n')); return false; }
  }
  return true;
}
ok(pump(240), 'combat renders and updates for 240 frames without throwing');

/* every monster stat block can be instantiated and attacked */
section('every monster');
const monsterIds = Object.keys(DH.MONSTERS);
let monsterOk = true;
monsterIds.forEach(id => {
  DH.game.reset();
  DH.game.state.party = [DH.char.create({
    name: 'Prod', raceId: 'human', classId: 'fighter', subclassId: 'champion', backgroundId: 'soldier',
    abilities: { str: 16, dex: 12, con: 14, int: 10, wis: 10, cha: 10 }, skills: ['athletics', 'perception']
  })];
  try {
    DH.scenes.combat.enter({ arena: 'town_street', enemies: [id], onDone: () => { } });
    for (let i = 0; i < 30; i++) { DH.gfx.begin(); DH.scenes.combat.update(0.016); DH.scenes.combat.draw(); DH.gfx.end(); }
    DH.scenes.combat.exit();
  } catch (e) {
    monsterOk = false; failures++;
    console.log('  FAIL  monster ' + id + ' broke combat: ' + e.message);
  }
});
ok(monsterOk, 'all ' + monsterIds.length + ' monsters survive being put on the grid');

/* every arena renders */
section('every arena');
let arenaOk = true;
Object.keys(DH.ARENAS).forEach(id => {
  DH.game.reset();
  DH.game.state.party = [DH.char.create({
    name: 'Prod', raceId: 'elf' in DH.MONSTERS ? 'human' : 'human', classId: 'wizard', subclassId: 'evocation',
    backgroundId: 'sage', abilities: { str: 8, dex: 14, con: 12, int: 16, wis: 12, cha: 10 }, skills: ['arcana', 'history']
  })];
  try {
    DH.scenes.combat.enter({ arena: id, enemies: ['rogue_civilian'], onDone: () => { } });
    for (let i = 0; i < 20; i++) { DH.gfx.begin(); DH.scenes.combat.update(0.016); DH.scenes.combat.draw(); DH.gfx.end(); }
    DH.scenes.combat.exit();
  } catch (e) { arenaOk = false; failures++; console.log('  FAIL  arena ' + id + ': ' + e.message); }
});
ok(arenaOk, 'all ' + Object.keys(DH.ARENAS).length + ' arenas render');

/* ---------------- overworld: walk every map ---------------- */
section('overworld');
DH.game.reset();
DH.game.state.party = [DH.char.create({
  name: 'Walker', raceId: 'wood_elf', classId: 'ranger', subclassId: 'hunter', backgroundId: 'outlander',
  abilities: { str: 12, dex: 15, con: 13, int: 10, wis: 14, cha: 8 }, skills: ['survival', 'perception', 'stealth']
})];
DH.game.addCompanion('mahoraga');
/* mark every one-shot trigger as already seen: this pass is about whether the
   world renders and collides, not about the story */
Object.keys(DH.MAPS).forEach(id => {
  (DH.MAPS[id].triggers || []).forEach(t => DH.game.setFlag('trig_' + id + '_' + t.script));
});
let mapOk = true;
Object.keys(DH.MAPS).forEach(id => {
  try {
    DH.scenes.overworld.enter({ map: id, spawn: 'start' });
    for (let i = 0; i < 20; i++) {
      DH.gfx.begin(); DH.scenes.overworld.update(0.016); DH.scenes.overworld.draw(); DH.gfx.end();
    }
    DH.scenes.overworld.exit();
  } catch (e) {
    mapOk = false; failures++;
    console.log('  FAIL  map ' + id + ': ' + e.message);
    console.log(e.stack.split('\n').slice(0, 3).join('\n'));
  }
});
ok(mapOk, 'all ' + Object.keys(DH.MAPS).length + ' maps load, update and draw');
ok(!DH.scenes.script.isRunning(), 'no script is left running after the map walk');

/* every named NPC must be adjacent to somewhere the player can actually stand,
   or they can never be spoken to */
Object.keys(DH.MAPS).forEach(id => {
  const m = DH.MAPS[id];
  (m.npcs || []).forEach(n => {
    const around = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(d => !DH.mapAt(m, n.x + d[0], n.y + d[1]).s);
    ok(around, id + ' npc ' + n.id + ' can be reached from an adjacent tile');
  });
});

/* ---------------- save and load round trip ---------------- */
section('saving');
DH.game.reset();
const saveHero = DH.char.create({
  name: 'Keeper', raceId: 'dragonborn', classId: 'paladin', subclassId: 'devotion', backgroundId: 'acolyte',
  ancestry: 'gold', abilities: { str: 15, dex: 10, con: 14, int: 8, wis: 12, cha: 14 },
  skills: ['athletics', 'persuasion']
});
DH.game.state.party = [saveHero];
DH.game.addCompanion('dex');
DH.game.issuePods();
DH.game.setFlag('act0_done');
DH.game.addQuest('test', 'A Test', 'Testing.');
DH.game.state.day = 7;
DH.game.giveGold(500);
ok(DH.game.saveTo(1), 'the game saves');
const summary = DH.save.summary(1);
ok(!!summary && summary.name === 'Keeper', 'the save summary reads back (' + (summary && summary.name) + ')');
DH.game.reset();
ok(DH.game.state.party.length === 0, 'reset clears the party');
ok(DH.game.loadFrom(1), 'the game loads');
ok(DH.game.pc().name === 'Keeper', 'the player character came back');
ok(DH.game.party().length === 2, 'the companion came back');
ok(DH.game.state.day === 7, 'the day came back');
ok(DH.game.flag('act0_done'), 'flags came back');
ok(!!DH.game.pc().pod, 'the pod came back');
ok(DH.game.pc().ac >= 10, 'derived stats rebuilt after loading (AC ' + DH.game.pc().ac + ')');

/* ---------------- shops and economy ---------------- */
section('shops');
DH.game.reset();
DH.game.state.party = [DH.char.create({
  name: 'Buyer', raceId: 'halfling', classId: 'rogue', subclassId: 'thief', backgroundId: 'criminal',
  abilities: { str: 8, dex: 15, con: 12, int: 13, wis: 10, cha: 14 },
  skills: ['stealth', 'sleight_of_hand', 'perception', 'investigation']
})];
DH.game.pc().gold = 1000;
const stock = DH.game.shopStock('potion_stand');
ok(stock.length > 0, 'the potion stand has stock');
const before = DH.game.partyGold();
const potion = stock.find(s => s.id === 'potion_greater_healing');
DH.game.spendGold(DH.item('potion_greater_healing').price);
DH.char.addItem(DH.game.pc(), 'potion_greater_healing');
ok(DH.game.partyGold() === before - 45, 'buying costs the listed price');
ok(DH.char.countItem(DH.game.pc(), 'potion_greater_healing') === 1, 'the potion arrives in the pack');
ok(DH.sellPrice('potion_greater_healing') === 15, 'shops pay a third');

/* the exact stock and prices the market was written with */
const potionStand = DH.SHOPS.potion_stand.stock;
const expect = {
  potion_pugilism: [10, 45], potion_speed: [2, 195], potion_growth: [1, 60],
  potion_greater_healing: [5, 45], potion_resistance: [10, 55], potion_gaseous: [1, 40],
  potion_magical_action: [3, 30]
};
Object.keys(expect).forEach(id => {
  const row = potionStand.find(s => s.id === id);
  ok(!!row, 'the stand stocks ' + id);
  if (row) {
    ok(row.qty === expect[id][0], id + ' quantity is ' + expect[id][0] + ' (got ' + row.qty + ')');
    ok(DH.item(id).price === expect[id][1], id + ' costs ' + expect[id][1] + ' gp (got ' + DH.item(id).price + ')');
  }
});
ok(DH.item('wyvern_poison').price === 400, 'wyvern poison costs 400 gp');
ok(DH.item('crawlers_mucus').price === 400, 'crawler\'s mucus costs 400 gp');
ok(DH.item('mystery_key').price === 25, 'a mystery key costs 25 gp');
ok(DH.item('necklace_adaptation').price === 90, 'the necklace of adaptation costs 90 gp');
ok(DH.item('dragons_breath_drink').price === 15, 'a Dragon\'s Breath costs 15 gp');

/* the campaign's named stat blocks match what was written at the table */
section('written numbers');
const hd = DH.monster('half_dragon');
ok(hd.hp === 90 && hd.ac === 14 && hd.speed === 40 && hd.init === 3, 'Half-Dragon is 90 HP, AC 14, 40 ft, +3 initiative');
const cat = DH.monster('grey_cat');
ok(cat.hp === 3 && cat.ac === 11, 'the grey cat is 3 HP and AC 11');
ok(cat.actions[0].dmg === '1d4', 'the cat claws for 1d4');
const cap = DH.monster('captain_hobbs');
ok(cap.abilities.str === 19 && cap.abilities.dex === 17 && cap.abilities.con === 18 &&
  cap.abilities.int === 19 && cap.abilities.wis === 18 && cap.abilities.cha === 16, 'the captain\'s six scores');
ok(cap.actions.find(a => a.name === 'Punch').dmg === '4d6+4', 'the captain punches for 4d6+4');
ok(cap.actions.find(a => a.name === 'Sword').dmg === '3d10+4', 'the captain\'s sword is 3d10+4');
ok(cap.actions.find(a => a.name === 'Punch').rider.save.dc === 17, 'his punch is a DC 17 CON save to avoid prone');
const fly = DH.monster('annoying_fly');
ok(fly.ac === 26, 'the fly has AC 26');

/* ---------------- minigames ---------------- */
section('minigames');
const games = Object.keys(DH.scenes.minigames.GAMES);
ok(games.length >= 9, 'at least nine minigames (' + games.length + ')');
['dragons_hoard', 'arm_wrestling', 'darts', 'drinking', 'roulette', 'winning_roll', 'dig', 'statue_riddle', 'gas_room', 'fishing', 'craft'].forEach(g => {
  ok(games.indexOf(g) >= 0, 'minigame "' + g + '" exists');
});
DH.game.reset();
DH.game.state.party = [DH.char.create({
  name: 'Gambler', raceId: 'human', classId: 'bard', subclassId: 'lore', backgroundId: 'charlatan',
  abilities: { str: 10, dex: 14, con: 12, int: 12, wis: 10, cha: 15 }, skills: ['deception', 'persuasion', 'performance']
})];
DH.game.pc().gold = 500;
let gameOk = true;
['dragons_hoard', 'roulette', 'craft', 'arena_signup'].forEach(g => {
  try {
    DH.scenes.minigames.enter({ game: g, onDone: () => { } });
    DH.scenes.minigames.exit();
  } catch (e) { gameOk = false; failures++; console.log('  FAIL  minigame ' + g + ': ' + e.message); }
});
ok(gameOk, 'minigames open without throwing');

/* ---------------- time and the Stardew layer ---------------- */
section('time and the island');
DH.game.reset();
DH.game.state.party = [built[0]];
DH.game.state.minutes = 23 * 60;
const dayBefore = DH.game.state.day;
DH.game.advanceMinutes(120);
ok(DH.game.state.day === dayBefore + 1, 'passing midnight advances the day');
ok(DH.game.clock().indexOf('AM') > 0, 'the clock reads as morning (' + DH.game.clock() + ')');
DH.game.state.minutes = 12 * 60;
ok(DH.game.darkness() === 0, 'noon is fully lit');
DH.game.state.minutes = 23 * 60;
ok(DH.game.darkness() > 0.4, 'midnight is dark');
ok(DH.game.isNight(), 'and counts as night');
/* crops grow when watered */
DH.game.state.crops.push({ map: 'inn_room', x: 5, y: 6, growth: 1, watered: true });
DH.game.newDay();
ok(DH.game.state.crops[0].growth === 2, 'a watered crop grows overnight');
ok(DH.game.state.crops[0].watered === false, 'and needs watering again');
/* the shady man's deadline */
DH.game.state.contractDeadlineDay = DH.game.state.day + 1;
DH.game.state.day += 3;
DH.game.checkDeadlines();
ok(DH.game.flag('contract_failed'), 'missing the two-month deadline makes you the target');

/* affinity */
DH.game.addAffinity('mimsy', 3, 'Little Mimsy');
ok(DH.game.affinity('mimsy') === 3, 'affinity accumulates');
DH.game.addAffinity('mimsy', 99);
ok(DH.game.affinity('mimsy') === 10, 'affinity caps at ten');

/* ---------------- carried boons and aimed weak points ---------------- */
section('story items in play');
DH.game.reset();
const boonHero = DH.char.create({
  name: 'Boon', raceId: 'human', classId: 'ranger', subclassId: 'hunter', backgroundId: 'sage',
  abilities: { str: 12, dex: 15, con: 13, int: 12, wis: 14, cha: 8 }, skills: ['survival', 'perception', 'investigation']
});
DH.game.state.party = [boonHero];
DH.char.addItem(boonHero, 'hag_necklace');
const boonSlot = boonHero.inv.find(x => x.id === 'hag_necklace');
ok(boonSlot && boonSlot.charges === 1, 'the hag necklace arrives with its one charge');
boonSlot.charges = 0;
DH.char.shortRest(boonHero);
ok(boonSlot.charges === 1, 'a short rest restores the necklace charge');
/* the black dragon advertises a weak point the player can aim at */
const bd = DH.monster('black_dragon');
ok((bd.traits || []).some(t => (t.effects || []).some(e => e.indexOf('weak_point:') === 0)),
  'the black dragon carries a weak point the engine can read');

/* ---------------- script runner, end to end ---------------- */
section('script runner');
DH.game.reset();
DH.game.state.party = [DH.char.create({
  name: 'Reader', raceId: 'human', classId: 'cleric', subclassId: 'life', backgroundId: 'acolyte',
  abilities: { str: 12, dex: 10, con: 14, int: 10, wis: 15, cha: 12 }, skills: ['insight', 'religion']
})];
/* run every non-interactive step type through the interpreter */
let ranSteps = 0;
const probe = [
  { t: 'flag', k: 'probe_flag' },
  { t: 'gold', n: 25 },
  { t: 'give', item: 'rations', qty: 2 },
  { t: 'xp', n: 10 },
  { t: 'quest', id: 'probe', title: 'Probe', desc: 'Testing.' },
  { t: 'questDone', id: 'probe', xp: 5 },
  { t: 'count', k: 'probe_count' },
  { t: 'music', id: 'town' },
  { t: 'sfx', id: 'coin' },
  { t: 'toast', text: 'probe' },
  { t: 'deadline', days: 60 },
  { t: 'muster', days: 1 },
  { t: 'pods' },
  { t: 'tamePet', id: 'grey_cat' },
  { t: 'shortRest' },
  { t: 'longRest' },
  { t: 'heal', n: 5 },
  { t: 'do', fn: () => { ranSteps++; } },
  { t: 'if', flag: 'probe_flag', then: [{ t: 'do', fn: () => { ranSteps++; } }] },
  { t: 'setTile', map: 'town_square', edits: [{ x: 13, y: 4, c: 'p' }] }
];
let scriptError = null;
DH.scenes.script.runInline(probe).then(() => { }).catch(e => { scriptError = e; });

/* the interpreter is async; give the microtask queue a chance */
setTimeout(() => {
  ok(!scriptError, 'the script runner executed the probe without throwing' + (scriptError ? ': ' + scriptError.message : ''));
  ok(DH.game.flag('probe_flag'), 'flag step works');
  ok(DH.char.countItem(DH.game.pc(), 'rations') >= 2, 'give step works');
  ok(DH.game.counter('probe_count') === 1, 'count step works');
  ok(DH.game.questDone('probe'), 'quest steps work');
  ok(!!DH.game.pc().pod, 'pods step works');
  ok(DH.game.state.pet === 'grey_cat', 'tamePet step works');
  ok(ranSteps === 2, 'do and if steps both ran (' + ranSteps + ')');
  ok(DH.game.state.contractDeadlineDay > DH.game.state.day, 'deadline step works');

  /* ---------------- report ---------------- */
  console.log('\n' + '='.repeat(52));
  if (failures === 0) console.log('ALL ' + checks + ' CHECKS PASSED');
  else console.log(failures + ' of ' + checks + ' CHECKS FAILED');
  console.log('='.repeat(52));
  process.exit(failures === 0 ? 0 : 1);
}, 400);
