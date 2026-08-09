/* Drakehaven Island — the engine: global state, the scene stack, the main loop. */
window.DH = window.DH || {};

DH.game = (function () {
  'use strict';
  const U = DH.util;

  /* ---------------- global state ---------------- */
  function freshState() {
    return {
      party: [],                 // characters; [0] is the player
      day: 1, minutes: 5 * 60 + 40, weather: 'storm',
      map: 'ship_quarters', placeName: 'The Mary Parker',
      spawn: 'start',
      flags: {}, quests: [], counters: {},
      affinity: {},              // npcId -> 0..10
      shops: {},                 // shopId -> [{id, qty}]
      nodes: {},                 // mapId -> {key: harvestedOnDay}
      crops: [],                 // {map,x,y,seed,growth,watered,day}
      chapter: 0, act: 0,
      commandPod: { charges: 4, max: 4 },
      pet: null,                 // the grey cat, once tamed
      bestiary: {},              // monsterId -> times fought
      contractDeadlineDay: null, // the shady man's two months
      musterDay: null,
      lastTown: 'town_square',
      playTime: 0,
      seenIntro: false
    };
  }
  let state = freshState();

  /* ---------------- scene stack ---------------- */
  const stack = [];
  let pendingOps = [];

  function current() { return stack[stack.length - 1] || null; }
  /* Each scene declares the world zoom it wants to draw at; set it before the
     scene runs so nothing has to remember. */
  function applyZoom(scene) { DH.gfx.setZoom((scene && scene.zoom) || 1); }
  function push(scene, arg) {
    pendingOps.push(() => {
      const cur = current();
      if (cur && cur.pause) cur.pause();
      stack.push(scene);
      applyZoom(scene);
      if (scene.enter) scene.enter(arg);
    });
  }
  function pop(result) {
    pendingOps.push(() => {
      const s = stack.pop();
      if (s && s.exit) s.exit(result);
      const cur = current();
      applyZoom(cur);
      if (cur && cur.resume) cur.resume(result);
    });
  }
  function replace(scene, arg) {
    pendingOps.push(() => {
      while (stack.length) { const s = stack.pop(); if (s && s.exit) s.exit(); }
      DH.ui.clear();
      stack.push(scene);
      applyZoom(scene);
      if (scene.enter) scene.enter(arg);
    });
  }
  function clearScenes() {
    pendingOps.push(() => {
      while (stack.length) { const s = stack.pop(); if (s && s.exit) s.exit(); }
      DH.ui.clear();
    });
  }
  function flushOps() {
    while (pendingOps.length) { const op = pendingOps.shift(); op(); }
  }
  function inScene(name) { return stack.some(s => s.name === name); }

  /* ---------------- party helpers ---------------- */
  function pc() { return state.party[0]; }
  function party() { return state.party; }
  function alive() { return state.party.filter(c => !c.dead); }
  function addCompanion(id) {
    if (state.party.find(c => c.companionId === id)) return null;
    const data = DH.companion(id);
    if (!data) return null;
    const ch = DH.char.fromCompanion(data);
    state.party.push(ch);
    return ch;
  }
  function hasCompanion(id) { return !!state.party.find(c => c.companionId === id); }

  function partyGold() { return pc() ? pc().gold : 0; }
  function spendGold(n) {
    const p = pc();
    if (!p || p.gold < n) return false;
    p.gold -= n; return true;
  }
  function giveGold(n) {
    const p = pc(); if (!p) return;
    p.gold += n;
    DH.ui.toast('[gold]+' + U.commas(n) + ' gold[/]', 'item');
    DH.audio.sfx('coin');
  }
  function giveItem(id, qty, quiet) {
    const it = DH.item(id);
    if (!it) return;
    DH.char.addItem(pc(), id, qty || 1);
    if (!quiet) {
      DH.ui.toast('Received [gold]' + it.name + (qty > 1 ? ' ×' + qty : '') + '[/]', 'item');
      DH.audio.sfx('quest');
    }
  }
  function giveItemToAll(id, qty) {
    state.party.forEach(c => DH.char.addItem(c, id, qty || 1));
    const it = DH.item(id);
    if (it) DH.ui.toast('Everyone receives [gold]' + it.name + '[/]', 'item');
  }
  /* Give every party member a P.A.C.T. pod. */
  function issuePods() {
    state.party.forEach(c => {
      if (!c.pod) c.pod = { charges: 2, max: 2, archetype: null, bonded: false };
      DH.char.addItem(c, 'pact_pod');
      DH.char.derive(c);
    });
    state.commandPod = { charges: 4, max: 4 };
    setFlag('has_pods', true);
  }

  function awardXp(amount, quiet) {
    let any = false;
    state.party.forEach(c => {
      if (c.dead) return;
      if (DH.char.gainXp(c, amount)) any = true;
    });
    if (!quiet) DH.ui.toast('+' + amount + ' experience', '');
    if (any) {
      DH.audio.sfx('levelup');
      const names = state.party.filter(c => !c.dead).map(c => c.name + ' ' + c.level);
      DH.ui.toast('[good]Level up![/] ' + names.join(', '), 'good', 3200);
    }
    return any;
  }

  /* ---------------- flags, quests, counters ---------------- */
  function setFlag(k, v) { state.flags[k] = v === undefined ? true : v; }
  function flag(k) { return !!state.flags[k]; }
  function flagVal(k) { return state.flags[k]; }
  function bump(k, n) { state.counters[k] = (state.counters[k] || 0) + (n == null ? 1 : n); return state.counters[k]; }
  function counter(k) { return state.counters[k] || 0; }

  function addQuest(id, title, desc) {
    if (state.quests.find(q => q.id === id)) return;
    state.quests.push({ id, title, desc, done: false, steps: [] });
    DH.ui.toast('New task: [gold]' + title + '[/]', 'item', 3000);
    DH.audio.sfx('quest');
  }
  function questStep(id, text) {
    const q = state.quests.find(x => x.id === id);
    if (!q) return;
    q.steps.push(text);
  }
  function completeQuest(id, xp) {
    const q = state.quests.find(x => x.id === id);
    if (!q || q.done) return;
    q.done = true;
    DH.ui.toast('[good]Task complete:[/] ' + q.title, 'good', 3000);
    DH.audio.sfx('quest');
    if (xp) awardXp(xp);
  }
  function questDone(id) {
    const q = state.quests.find(x => x.id === id);
    return !!(q && q.done);
  }
  function hasQuest(id) { return !!state.quests.find(x => x.id === id); }

  /* ---------------- affinity ---------------- */
  function affinity(npcId) { return state.affinity[npcId] || 0; }
  function addAffinity(npcId, n, name) {
    const before = affinity(npcId);
    state.affinity[npcId] = U.clamp(before + (n == null ? 1 : n), 0, 10);
    if (state.affinity[npcId] > before && name) {
      DH.ui.toast('♥ ' + name + ' warms to you (' + state.affinity[npcId] + '/10)', '', 1800);
    }
  }

  /* ---------------- time ---------------- */
  function advanceMinutes(n) {
    state.minutes += n;
    while (state.minutes >= 1440) { state.minutes -= 1440; newDay(); }
  }
  function newDay() {
    state.day++;
    /* crops grow */
    state.crops.forEach(c => {
      if (c.watered) { c.growth = Math.min(4, c.growth + 1); c.watered = false; }
    });
    /* foraging nodes come back */
    state.nodes = {};
    /* restock shops lightly */
    Object.keys(state.shops).forEach(sid => {
      const def = DH.SHOPS[sid];
      if (!def) return;
      state.shops[sid].forEach(row => {
        const orig = def.stock.find(s => s.id === row.id);
        if (orig && row.qty < orig.qty && U.chance(0.5)) row.qty++;
      });
    });
    checkDeadlines();
  }
  function checkDeadlines() {
    if (state.contractDeadlineDay && state.day > state.contractDeadlineDay && !flag('contract_done') && !flag('contract_failed')) {
      setFlag('contract_failed', true);
      DH.ui.toast('[bad]The shady man\'s two months are up. You are the target now.[/]', 'bad', 5000);
    }
  }
  function clock() { return U.clockStr(state.minutes); }
  function isNight() { const m = state.minutes; return m < 6 * 60 || m >= 20 * 60; }
  function darkness() {
    const m = state.minutes;
    if (m >= 6 * 60 && m < 18 * 60) return 0;
    if (m >= 18 * 60 && m < 20 * 60) return (m - 18 * 60) / (2 * 60) * 0.55;
    if (m >= 20 * 60) return 0.55 + Math.min(0.15, (m - 20 * 60) / (4 * 60) * 0.15);
    return 0.6;                              // small hours
  }

  function longRest() {
    state.party.forEach(c => {
      if (c.dead) return;
      DH.char.longRest(c);
    });
    /* the Command Pod recharges four pods */
    let charged = 0;
    state.party.forEach(c => {
      if (c.pod && charged < 4) {
        c.pod.charges = Math.min(c.pod.max, c.pod.charges + 4);
        charged++;
      }
    });
    const before = state.day;
    state.minutes = 6 * 60;
    if (before === state.day) newDay();
    DH.ui.toast('You wake on day ' + state.day + '. Everyone is rested.', 'good', 2600);
  }
  function shortRest() {
    const notes = [];
    state.party.forEach(c => { if (!c.dead) DH.char.shortRest(c); });
    advanceMinutes(60);
    DH.ui.toast('An hour\'s rest. Hit dice spent, abilities restored.', 'good', 2400);
    return notes;
  }

  /* ---------------- shops ---------------- */
  function shopStock(id) {
    if (!state.shops[id]) {
      const def = DH.SHOPS[id];
      state.shops[id] = def ? def.stock.map(s => ({ id: s.id, qty: s.qty })) : [];
    }
    return state.shops[id];
  }

  /* ---------------- travel ---------------- */
  async function travel(mapId, spawn, opts) {
    opts = opts || {};
    const map = DH.MAPS[mapId];
    if (!map) { console.warn('no map', mapId); return; }
    if (!opts.noFade) await DH.ui.fadeOut(320);
    state.map = mapId;
    state.spawn = spawn || 'start';
    state.placeName = map.name;
    if (map.town) state.lastTown = mapId;
    const ow = DH.scenes.overworld;
    if (current() !== ow) replace(ow, { map: mapId, spawn: state.spawn });
    else ow.loadMap(mapId, state.spawn);
    flushOps();
    if (!opts.noFade) {
      setTimeout(() => DH.ui.fadeIn(380), 60);
      DH.ui.toast(map.name, '', 1800);
    }
  }

  /* ---------------- persistence ---------------- */
  function serialize() {
    return {
      party: state.party, day: state.day, minutes: state.minutes, weather: state.weather,
      map: state.map, placeName: state.placeName, spawn: state.spawn,
      flags: state.flags, quests: state.quests, counters: state.counters,
      affinity: state.affinity, shops: state.shops, nodes: state.nodes, crops: state.crops,
      chapter: state.chapter, act: state.act, commandPod: state.commandPod,
      pet: state.pet, bestiary: state.bestiary,
      contractDeadlineDay: state.contractDeadlineDay, musterDay: state.musterDay,
      lastTown: state.lastTown, playTime: state.playTime, seenIntro: state.seenIntro,
      storyPointer: state.storyPointer || null
    };
  }
  function saveTo(slot) {
    const ok = DH.save.write(slot, serialize());
    if (ok) DH.ui.toast('Saved to slot ' + slot, 'good');
    return ok;
  }
  function loadFrom(slot) {
    const blob = DH.save.read(slot);
    if (!blob || !blob.state) return false;
    state = Object.assign(freshState(), blob.state);
    /* rebuild derived values that we do not persist */
    state.party.forEach(c => {
      c.conditions = c.conditions || [];
      c.buffs = c.buffs || {};
      if (c.isPlayer) DH.char.derive(c);
    });
    return true;
  }
  function reset() { state = freshState(); }

  /* ---------------- main loop ---------------- */
  let last = 0, running = false, acc = 0;
  function frame(t) {
    if (!running) return;
    const dt = Math.min(0.05, (t - last) / 1000 || 0);
    last = t;
    state.playTime += dt;
    flushOps();
    const scene = current();
    DH.gfx.begin();
    if (scene) {
      if (scene.update) scene.update(dt);
      if (scene.draw) scene.draw(dt);
    }
    DH.gfx.end();
    DH.input.clearFrame();
    requestAnimationFrame(frame);
  }
  function start() {
    if (running) return;
    running = true; last = performance.now();
    requestAnimationFrame(frame);
  }
  function stop() { running = false; }

  return {
    get state() { return state; },
    set state(s) { state = s; },
    freshState, reset, serialize, saveTo, loadFrom,
    push, pop, replace, clearScenes, current, inScene, flushOps,
    pc, party, alive, addCompanion, hasCompanion,
    partyGold, spendGold, giveGold, giveItem, giveItemToAll, issuePods, awardXp,
    setFlag, flag, flagVal, bump, counter,
    addQuest, questStep, completeQuest, questDone, hasQuest,
    affinity, addAffinity,
    advanceMinutes, newDay, clock, isNight, darkness, longRest, shortRest, checkDeadlines,
    shopStock, travel,
    start, stop
  };
})();

DH.scenes = DH.scenes || {};
