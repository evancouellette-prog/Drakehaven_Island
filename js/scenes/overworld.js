/* Drakehaven Island — the overworld: free walking, time, people, foraging, and doors
   into everything else. */
window.DH = window.DH || {};

DH.scenes.overworld = (function () {
  'use strict';
  const U = DH.util, G = DH.gfx, C = DH.char, T = DH.gfx.TILE;

  /* The overworld is magnified so a room fills the frame. Small rooms zoom in
     further; big maps stay at the base zoom and scroll. */
  const WORLD_ZOOM = 1.5, MAX_ZOOM = 3;
  let worldZoom = WORLD_ZOOM;
  function zoomFor(m) {
    if (!m || !m.pxW) return WORLD_ZOOM;
    const fill = Math.max(G.VW / m.pxW, G.VH / m.pxH);
    return Math.min(MAX_ZOOM, Math.max(WORLD_ZOOM, Math.round(fill * 20) / 20));
  }
  let map = null, player = null, npcs = [], followers = [];
  let hud = null, promptTarget = null, menuOpen = false;
  let stepTimer = 0, walkSfx = 0;
  /* the tile you arrived on, so a doorway cannot fire the moment you come through it */
  let spawnTile = null;

  /* =============== setup =============== */
  function enter(arg) {
    loadMap((arg && arg.map) || DH.game.state.map, (arg && arg.spawn) || DH.game.state.spawn);
    buildHud();
  }
  function exit() { DH.ui.clear(); hud = null; }
  function resume() { buildHud(); DH.input.clearAll(); }
  function pause() { DH.ui.clear(); hud = null; DH.ui.hidePrompt(); }

  function loadMap(id, spawnName) {
    map = DH.MAPS[id];
    if (!map) { console.warn('missing map', id); return; }
    DH.game.state.map = id;
    DH.game.state.placeName = map.name;
    if (map.town) DH.game.state.lastTown = id;

    const sp = (map.spawns && (map.spawns[spawnName] || map.spawns.start)) || { x: 2, y: 2 };
    player = {
      px: sp.x * T + T / 2, py: sp.y * T + T - 2,
      facing: 'down', moving: false, spec: null, scale: 1, isPlayer: true
    };
    spawnTile = { x: sp.x, y: sp.y };
    refreshPlayerLook();

    /* companions trail behind */
    const band = DH.game.party().slice(1);
    followers = band.map((ch, i) => {
      /* A ring for when you stop, wide enough that nobody overlaps anybody. */
      const a = (i / Math.max(1, band.length)) * Math.PI * 2 + 0.6;
      /* And a marching station: alternating sides of the path, stepped further
         out and further back for each companion, so the party reads as a group
         walking together rather than one silhouette four deep. */
      const rank = Math.floor(i / 2) + 1;
      return {
        ch: ch, px: player.px - (i + 1) * 10, py: player.py,
        facing: 'down', moving: false, trail: [],
        side: (i % 2 ? 1 : -1) * (9 + rank * 5),
        lag: 4 + rank * 6,
        ox: Math.round(Math.cos(a) * 30), oy: Math.round(Math.sin(a) * 19)
      };
    });

    /* NPCs present on this map */
    npcs = (map.npcs || []).map(def => {
      const n = Object.assign({}, def);
      n.px = def.x * T + T / 2; n.py = def.y * T + T - 2;
      n.homeX = n.px; n.homeY = n.py;
      n.wanderT = U.rnd() * 3;
      if (def.visualFrom) {
        const src = DH.MONSTERS[def.visualFrom] || DH.companion(def.visualFrom);
        if (src) { n.spec = src.visual; n.scale = def.scale || src.scale || 1; }
      }
      if (!n.spec) n.spec = def.visual || { body: 'humanoid', skin: '#d8a878', hair: '#3a2a18', cloth: '#5a5a6a', cloth2: '#3a3a4a' };
      n.scale = def.scale || n.scale || 1;
      return n;
    }).filter(visibleNpc);

    /* music and weather */
    worldZoom = zoomFor(map);
    G.setZoom(worldZoom);
    if (map.music) DH.audio.play(map.music);
    DH.audio.ambience(map.ambience || null);
    DH.audio.stormThunder(!!map.thunder);
    G.clearParticles();
    G.camSnap(player.px, player.py, { w: map.pxW, h: map.pxH });
  }

  function visibleNpc(n) {
    if (n.appearAfter && !DH.game.flag(n.appearAfter)) return false;
    if (n.hidden && DH.game.flag(n.hidden)) return false;
    if (n.goneAfter && DH.game.flag(n.goneAfter)) return false;
    /* companions that have joined the party walk with you instead of standing here */
    if (n.visualFrom && DH.game.hasCompanion(n.visualFrom) && n.id === n.visualFrom) return false;
    return true;
  }
  function refreshPlayerLook() {
    const pc = DH.game.pc();
    if (!pc) return;
    player.spec = C.visualFor(pc);
    player.weapon = C.weaponArt(pc);
    player.scale = pc.scale || (player.spec.smallBody ? 0.85 : player.spec.bigBody ? 1.12 : 1);
  }

  /* =============== HUD =============== */
  function buildHud() {
    DH.ui.clear();
    const root = document.getElementById('ui');
    hud = DH.ui.el('div'); hud.id = 'hud';
    root.appendChild(hud);

    const tl = DH.ui.add(hud, 'div', 'tl');
    const bar = DH.ui.add(tl, 'div', 'hpbar');
    DH.ui.add(bar, 'div', 'fill');
    DH.ui.add(bar, 'div', 'txt');
    const pcPlate = DH.ui.add(tl, 'div', 'plate small');
    pcPlate.id = 'hud-pc';

    const tr = DH.ui.add(hud, 'div', 'tr');
    const place = DH.ui.add(tr, 'div', 'plate'); place.id = 'hud-place';
    const clock = DH.ui.add(tr, 'div', 'plate clock'); clock.id = 'hud-clock';
    const gold = DH.ui.add(tr, 'div', 'plate small'); gold.id = 'hud-gold';

    const bl = DH.ui.add(hud, 'div', 'bl');
    bl.appendChild(DH.ui.btn('Sheet (C)', '', () => openBook('sheet')));
    bl.appendChild(DH.ui.btn('Journal (J)', '', () => openBook('quests')));
    bl.appendChild(DH.ui.btn('Party', '', () => openBook('party')));
    bl.appendChild(DH.ui.btn('Menu (Esc)', '', openMenu));

    const br = DH.ui.add(hud, 'div', 'br');
    br.id = 'hud-hint';
    br.innerHTML = 'WASD move · Space interact';
    updateHud();
  }
  function updateHud() {
    if (!hud) return;
    const pc = DH.game.pc();
    if (!pc) return;
    const fill = hud.querySelector('.hpbar .fill');
    const txt = hud.querySelector('.hpbar .txt');
    if (fill) fill.style.width = Math.max(0, (pc.hp / pc.hpMax) * 100) + '%';
    if (txt) txt.textContent = pc.hp + ' / ' + pc.hpMax + ' HP';
    const p = document.getElementById('hud-pc');
    if (p) p.innerHTML = DH.ui.esc(pc.name) + ' · <b>' + pc.className + ' ' + pc.level + '</b>' +
      (pc.pod ? ' · pod ' + pc.pod.charges + '/' + pc.pod.max : '');
    const pl = document.getElementById('hud-place');
    if (pl) pl.innerHTML = '<b>' + DH.ui.esc(DH.game.state.placeName) + '</b>';
    const cl = document.getElementById('hud-clock');
    if (cl) cl.textContent = DH.game.clock() + '  ·  Day ' + DH.game.state.day;
    const gd = document.getElementById('hud-gold');
    if (gd) gd.innerHTML = '<b>' + U.commas(pc.gold) + '</b> gold';
  }

  function openBook(tab) { DH.game.push(DH.scenes.journal, { tab: tab }); }

  function openMenu() {
    menuOpen = true;
    DH.ui.modal({
      title: 'Menu',
      build(m) {
        const row = DH.ui.add(m, 'div', 'sect');
        row.appendChild(DH.ui.btn('Save game', 'primary', () => {
          const slot = DH.game.state.slot || 1;
          DH.game.saveTo(slot);
          DH.ui.closeModal(); menuOpen = false;
        }));
        row.appendChild(DH.ui.btn('Short rest (1 hour)', '', () => {
          DH.game.shortRest(); DH.ui.closeModal(); menuOpen = false; updateHud();
        }));
        row.appendChild(DH.ui.btn('How to play', '', () => {
          DH.ui.closeModal(); menuOpen = false;
          DH.scenes.title && DH.ui.modal({
            title: 'How to Play',
            html: '<p><kbd>WASD</kbd> move · <kbd>Space</kbd> interact and advance dialogue · ' +
              '<kbd>C</kbd> sheet · <kbd>J</kbd> journal · <kbd>I</kbd> inventory.</p>' +
              '<p>In combat: click a glowing square to move, click an enemy to attack, ' +
              '<kbd>T</kbd> ends the turn, <kbd>P</kbd> raises your Pod shield.</p>',
            buttons: [{ label: 'Close' }]
          });
        }));
        DH.ui.add(m, 'div', 'hr');
        DH.ui.add(m, 'p', 'small dim', 'Day ' + DH.game.state.day + ', ' + DH.game.clock() +
          ' — ' + DH.game.state.placeName);
        const row2 = DH.ui.add(m, 'div', 'sect');
        row2.appendChild(DH.ui.btn('Quit to main menu', 'danger', () => {
          DH.ui.modal({
            title: 'Quit to the main menu?',
            html: '<p>Anything since your last save will be lost.</p>',
            buttons: [
              { label: 'Save and quit', cls: 'primary', fn: () => { DH.game.saveTo(DH.game.state.slot || 1); DH.game.replace(DH.scenes.title); menuOpen = false; } },
              { label: 'Quit without saving', cls: 'danger', fn: () => { DH.game.replace(DH.scenes.title); menuOpen = false; } },
              { label: 'Cancel' }
            ]
          });
        }));
      },
      buttons: [{ label: 'Close', fn: () => { menuOpen = false; } }]
    });
  }

  /* =============== collision =============== */
  function solidAt(px, py) {
    const tx = Math.floor(px / T), ty = Math.floor(py / T);
    const leg = DH.mapAt(map, tx, ty);
    if (leg.s) return true;
    return false;
  }
  function canStand(px, py) {
    /* a small box at the feet */
    return !solidAt(px - 3, py - 2) && !solidAt(px + 3, py - 2) &&
      !solidAt(px - 3, py - 6) && !solidAt(px + 3, py - 6);
  }
  function tileOf(e) { return { x: Math.floor(e.px / T), y: Math.floor((e.py - 4) / T) }; }

  /* =============== update =============== */
  function update(dt) {
    if (!map || !player) return;
    const blocked = DH.ui.dlgVisible() || DH.ui.modalOpen() || menuOpen;

    if (!blocked) handleInput(dt);
    updateFollowers(dt);
    updateNpcs(dt);
    G.camFollow(player.px, player.py - 8, { w: map.pxW, h: map.pxH });
    findPrompt();
    if (!blocked) checkExits();
    if (!blocked) checkTriggers();
    if (G.tick % 20 === 0) updateHud();
  }

  function handleInput(dt) {
    const pc = DH.game.pc();
    const ax = DH.input.axis();
    const run = DH.input.isDown('run');
    const spd = (run ? 96 : 58) * (pc && pc.speed ? pc.speed / 30 : 1);
    let moved = false;

    if (ax.x || ax.y) {
      /* mud and the like */
      const leg = DH.mapAt(map, Math.floor(player.px / T), Math.floor((player.py - 4) / T));
      const slowK = leg.slow ? 0.55 : 1;
      const stepX = ax.x * spd * dt * slowK, stepY = ax.y * spd * dt * slowK;
      if (canStand(player.px + stepX, player.py)) { player.px += stepX; moved = true; }
      if (canStand(player.px, player.py + stepY)) { player.py += stepY; moved = true; }
      player.px = U.clamp(player.px, 4, map.pxW - 4);
      player.py = U.clamp(player.py, 8, map.pxH - 1);
      if (Math.abs(ax.x) > Math.abs(ax.y)) player.facing = ax.x > 0 ? 'right' : 'left';
      else if (ax.y) player.facing = ax.y > 0 ? 'down' : 'up';
      /* time passes while you walk: one in-game minute per second of walking */
      DH.game.advanceMinutes(dt * 1.4);
      walkSfx += dt;
      if (walkSfx > (run ? 0.22 : 0.34)) { walkSfx = 0; DH.audio.sfx('step'); }
    }
    player.moving = moved;

    if (DH.input.tapped('use')) interact();
    if (DH.input.tapped('sheet')) openBook('sheet');
    if (DH.input.tapped('journal')) openBook('quests');
    if (DH.input.tapped('inventory')) openBook('inventory');
    if (DH.input.tapped('cancel')) openMenu();
    /* click to walk toward a point */
    if (DH.input.mouse.clicked) {
      const w = G.toWorld(DH.input.mouse.x, DH.input.mouse.y);
      const dx = w.x - player.px, dy = w.y - player.py;
      if (Math.hypot(dx, dy) < 26) interact();
    }
  }

  function updateFollowers(dt) {
    /* leader breadcrumb trail so companions walk where you walked */
    if (!player.trail) player.trail = [];
    if (player.moving && (!player.trail.length ||
      U.dist(player.px, player.py, player.trail[0].x, player.trail[0].y) > 5)) {
      player.trail.unshift({ x: player.px, y: player.py, f: player.facing });
      if (player.trail.length > 90) player.trail.pop();
    }
    followers.forEach((f, i) => {
      const lead = player.trail[Math.min(player.trail.length - 1, f.lag)];
      if (!lead) return;
      /* Walking, they used to stack onto the exact breadcrumbs you left, which
         put the whole party in single file inside your own footprints. Each one
         now holds station off to one side of the path — the offset is turned
         perpendicular to the direction you were facing at that breadcrumb, so
         the formation swings around corners with you instead of through walls.
         Standing still, they spread into their own spots around you. */
      let want;
      if (player.moving) {
        const along = lead.f === 'left' ? [-1, 0] : lead.f === 'right' ? [1, 0]
          : lead.f === 'up' ? [0, -1] : [0, 1];
        const perp = [-along[1], along[0]];
        want = { x: lead.x + perp[0] * f.side, y: lead.y + perp[1] * f.side };
        /* never hold station inside scenery */
        if (!canStand(want.x, want.y)) want = lead;
      } else {
        want = { x: player.px + f.ox, y: player.py + f.oy };
      }
      const dx = want.x - f.px, dy = want.y - f.py;
      const d = Math.hypot(dx, dy);
      if (d > 3) {
        const sp = Math.min(130, 50 + d * 3);
        f.px += dx / d * sp * dt; f.py += dy / d * sp * dt;
        f.moving = true;
        f.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      } else f.moving = false;
    });
  }

  function updateNpcs(dt) {
    npcs.forEach(n => {
      if (!n.wander) return;
      n.wanderT -= dt;
      if (n.wanderT <= 0) {
        n.wanderT = 1.4 + U.rnd() * 3;
        n.wdx = U.rint(-1, 1); n.wdy = U.rint(-1, 1);
      }
      if (n.wdx || n.wdy) {
        const nx = n.px + n.wdx * 18 * dt, ny = n.py + n.wdy * 18 * dt;
        if (canStand(nx, ny) && U.dist(nx, ny, n.homeX, n.homeY) < 34) {
          n.px = nx; n.py = ny; n.moving = true;
          n.facing = Math.abs(n.wdx) > Math.abs(n.wdy) ? (n.wdx > 0 ? 'right' : 'left') : (n.wdy > 0 ? 'down' : 'up');
        } else n.moving = false;
      }
    });
  }

  /* =============== interaction =============== */
  function findPrompt() {
    promptTarget = null;
    /* an NPC within reach */
    let best = null, bestD = 22;
    npcs.forEach(n => {
      const d = U.dist(player.px, player.py, n.px, n.py);
      if (d < bestD) { bestD = d; best = { kind: 'npc', npc: n, label: n.name }; }
    });
    if (best) promptTarget = best;
    else {
      /* a tile in front */
      const dirs = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
      const d = dirs[player.facing];
      const t = tileOf(player);
      const cands = [{ x: t.x + d[0], y: t.y + d[1] }, { x: t.x, y: t.y }];
      for (const c of cands) {
        const leg = DH.mapAt(map, c.x, c.y);
        if (leg.i) {
          const lbl = interactLabel(leg, c);
          if (lbl) { promptTarget = { kind: 'tile', x: c.x, y: c.y, leg: leg, label: lbl }; break; }
        }
      }
    }
    if (promptTarget) DH.ui.showPrompt('<b>Space</b> ' + DH.ui.esc(promptTarget.label));
    else DH.ui.hidePrompt();
  }

  function interactLabel(leg, c) {
    const key = c.x + ',' + c.y;
    switch (leg.i) {
      case 'forage': return nodeUsed(key) ? null : 'Forage here';
      case 'mine': return nodeUsed(key) ? null : 'Work the ore';
      case 'fish': return 'Fish';
      case 'bed': return 'Sleep until morning';
      case 'chest': return DH.game.flag('chest_' + DH.game.state.map + '_' + key) ? null : 'Open the chest';
      case 'workbench': return 'Use the workbench';
      case 'plot': return plotLabel(c);
      case 'barrel': return 'Search the barrel';
      case 'crate': return 'Search the crate';
      case 'bookshelf': return 'Read the shelves';
      case 'sign': return 'Read the sign';
      case 'stall': return 'Look over the stall';
      case 'pole': return 'Examine the pole';
      case 'statue': return 'Examine the statue';
      case 'lever': return 'Pull the lever';
      case 'commandpod': return 'The Command Pod';
      case 'pedestal': return 'Examine the pedestal';
      case 'hammock': return 'A hammock';
      case 'gel': return 'The dead gelatinous cube';
      case 'bones': return 'Search the bones';
      case 'glowtile': return 'A glowing tile';
      case 'egg': return 'The golden egg';
      case 'door': case 'stairs': return null;
      default: return null;
    }
  }
  function nodeUsed(key) {
    const m = DH.game.state.nodes[DH.game.state.map] || {};
    return m[key] === DH.game.state.day;
  }
  function markNode(key) {
    const st = DH.game.state;
    st.nodes[st.map] = st.nodes[st.map] || {};
    st.nodes[st.map][key] = st.day;
  }
  function plotLabel(c) {
    const crop = DH.game.state.crops.find(k => k.map === DH.game.state.map && k.x === c.x && k.y === c.y);
    if (!crop) return 'Plant a seed';
    if (crop.growth >= 4) return 'Harvest';
    return crop.watered ? 'Already watered' : 'Water the plant';
  }

  function interact() {
    if (!promptTarget) return;
    if (DH.scenes.script.isRunning()) return;
    DH.audio.sfx('select');
    if (promptTarget.kind === 'npc') {
      const n = promptTarget.npc;
      if (n.script) DH.scenes.script.run(n.script, { npc: n });
      return;
    }
    const c = promptTarget, key = c.x + ',' + c.y;
    switch (c.leg.i) {
      case 'forage': doForage(c, key); break;
      case 'mine': doMine(c, key); break;
      case 'fish': DH.game.push(DH.scenes.minigames, { game: 'fishing' }); break;
      case 'bed': doSleep(); break;
      case 'chest': doChest(c, key); break;
      case 'workbench': DH.game.push(DH.scenes.minigames, { game: 'craft' }); break;
      case 'plot': doPlot(c); break;
      case 'barrel': case 'crate': doSearch(c, key); break;
      case 'bookshelf': flavour('Ledgers, tide tables and one novel with the cover torn off. Nothing you need.'); break;
      case 'sign': doSign(); break;
      case 'stall': flavour('Trinkets, salt fish and a bucket of something that used to be alive. The seller watches you.'); break;
      case 'pole': doPole(); break;
      case 'statue': DH.scenes.script.run('statue_examine'); break;
      case 'lever': DH.scenes.script.run('mine_lever'); break;
      case 'commandpod': DH.scenes.script.run('command_pod'); break;
      case 'pedestal': DH.scenes.script.run('pedestal_examine'); break;
      case 'hammock': flavour('Canvas, rope, and the smell of other people\'s sleep. It swings when the ship rolls.'); break;
      case 'gel': DH.scenes.script.run('mine_cube'); break;
      case 'bones': doSearch(c, key); break;
      case 'glowtile': flavour('Four tiles glow faintly on this side of the rays. Standing on one feels like being measured.'); break;
      case 'egg': DH.scenes.script.run('ball_egg'); break;
    }
  }
  function flavour(text) { DH.scenes.script.runInline([{ t: 'say', text: text }]); }

  async function doForage(c, key) {
    markNode(key);
    const node = c.leg.node;
    const pool = node === 'mushroom' ? [['mushroom_cap', 3], ['herb_bloodroot', 1]]
      : node === 'drift' ? [['driftwood', 3], ['gem_small', 0.2]]
        : [['herb_bloodroot', 3], ['herb_seaglass_moss', 2], ['herb_emberleaf', 1.4]];
    const got = U.pickWeighted(pool);
    const qty = U.rint(1, 2);
    DH.game.giveItem(got, qty);
    DH.audio.sfx('dig');
    G.emit('dust', c.x * T + 8, c.y * T + 10, 6, { up: 0.6, life: 22 });
    DH.game.advanceMinutes(10);
    /* a survival check for a bonus find */
    const pc = DH.game.pc();
    if (U.chance(0.3)) {
      const r = DH.dice.d20({ mod: C.skillMod(pc, 'survival'), dc: 13 });
      if (r.success) { DH.game.giveItem(got, 1); DH.ui.toast('A good eye — an extra ' + DH.item(got).name, 'good'); }
    }
  }
  async function doMine(c, key) {
    const pc = DH.game.pc();
    markNode(key);
    DH.audio.sfx('dig');
    G.shake(2);
    G.emit('dust', c.x * T + 8, c.y * T + 8, 10, { life: 24 });
    const r = DH.dice.d20({ mod: C.abMod(pc, 'str'), dc: 10 });
    const kind = U.pickWeighted([['ore_copper', 5], ['ore_iron', 2.5], ['ore_silver', 0.8]]);
    DH.game.giveItem(kind, r.success ? 2 : 1);
    DH.game.advanceMinutes(15);
  }
  async function doSleep() {
    const yes = await DH.ui.choose([
      { text: 'Sleep until morning. (Long rest — restores everything, advances the day)' },
      { text: 'Not yet.' }
    ], { text: 'A bed, blankets, and the sound of rain on a roof for once.' });
    DH.ui.hideDlg();
    if (yes !== 0) return;
    await DH.ui.fadeOut(500);
    DH.game.longRest();
    DH.game.checkDeadlines();
    updateHud();
    await U.wait(300);
    await DH.ui.fadeIn(600);
  }
  async function doChest(c, key) {
    DH.game.setFlag('chest_' + DH.game.state.map + '_' + key);
    DH.audio.sfx('door');
    const table = DH.LOOT[map.lootTable || 'crew_chest'] || DH.LOOT.crew_chest;
    const lines = [];
    table.forEach(row => {
      if (U.chance(0.75)) { DH.game.giveItem(row[0], row[1], true); lines.push(DH.item(row[0]).name + (row[1] > 1 ? ' ×' + row[1] : '')); }
    });
    const gold = U.rint(8, 40);
    DH.game.giveGold(gold);
    DH.scenes.script.runInline([{ t: 'say', text: 'Inside: ' + (lines.length ? U.listing(lines) : 'not much') + ', and ' + gold + ' gold.' }]);
  }
  async function doSearch(c, key) {
    if (DH.game.flag('searched_' + DH.game.state.map + '_' + key)) {
      flavour('You have already been through this one.'); return;
    }
    DH.game.setFlag('searched_' + DH.game.state.map + '_' + key);
    if (U.chance(0.55)) {
      const row = U.pick(DH.LOOT.town_barrel);
      DH.game.giveItem(row[0], row[1]);
    } else {
      flavour('Bilge water and a dead spider.');
    }
  }
  function doSign() {
    const lines = {
      town_square: 'DRAKEHAVEN — market west, tavern east, town hall south, dock north. Below that, someone has scratched: "the dragons are not asking politely."',
      market: 'NO REFUNDS ON ANYTHING THAT MOVES.',
      dig_site: 'CAVE CLOSED BY ORDER OF THE MAYOR. Underneath, in different handwriting: "closed by a rockfall, actually."'
    };
    flavour(lines[DH.game.state.map] || 'The paint has gone. Whatever it said, the weather won.');
  }
  function doPole() {
    if (DH.game.flag('act2_started')) {
      DH.scenes.script.run('act2_investigate');
    } else {
      flavour('An iron pole in the middle of the square with rope wound round it. Something was tied here.');
    }
  }
  async function doPlot(c) {
    const st = DH.game.state;
    let crop = st.crops.find(k => k.map === st.map && k.x === c.x && k.y === c.y);
    if (!crop) {
      if (!C.hasItem(DH.game.pc(), 'herb_bloodroot')) {
        flavour('Tilled soil, ready for something. You would need a root or a cutting to plant.');
        return;
      }
      C.removeItem(DH.game.pc(), 'herb_bloodroot', 1);
      st.crops.push({ map: st.map, x: c.x, y: c.y, growth: 1, watered: true, day: st.day });
      DH.ui.toast('Planted, and watered.', 'good');
      DH.game.advanceMinutes(10);
    } else if (crop.growth >= 4) {
      U.remove(st.crops, crop);
      DH.game.giveItem('herb_bloodroot', U.rint(2, 3));
      DH.game.advanceMinutes(5);
    } else if (!crop.watered) {
      crop.watered = true;
      DH.ui.toast('Watered.', '');
      DH.game.advanceMinutes(5);
    } else {
      flavour('It has had its water. Give it a day.');
    }
  }

  /* =============== exits and triggers =============== */
  function checkExits() {
    const t = tileOf(player);
    /* a door you just walked out of should not immediately suck you back in */
    if (spawnTile) {
      if (spawnTile.x === t.x && spawnTile.y === t.y) return;
      spawnTile = null;
    }
    for (const e of (map.exits || [])) {
      if (e.x !== t.x || e.y !== t.y) continue;
      if (e.gate && !DH.game.flag(e.gate)) {
        if (G.tick % 40 === 0) DH.ui.toast('Not yet.', '', 900);
        continue;
      }
      DH.audio.sfx('door');
      DH.game.travel(e.to, e.spawn);
      return;
    }
  }
  function checkTriggers() {
    /* Never consume a one-shot beat while another script owns the screen — the
       runner would refuse it and the scene would be lost for good. */
    if (DH.scenes.script.isRunning()) return;
    const t = tileOf(player);
    for (const tr of (map.triggers || [])) {
      if (t.x < tr.x || t.y < tr.y || t.x >= tr.x + tr.w || t.y >= tr.y + tr.h) continue;
      if (tr.needFlag && !DH.game.flag(tr.needFlag)) continue;
      const key = 'trig_' + map.id + '_' + tr.script;
      if (tr.once && DH.game.flag(key)) continue;
      if (tr.once) DH.game.setFlag(key);
      DH.scenes.script.run(tr.script);
      return;
    }
  }

  /* =============== drawing =============== */
  function draw() {
    if (!map) return;
    const cam = G.cam;
    const x0 = Math.max(0, Math.floor(cam.x / T)), y0 = Math.max(0, Math.floor(cam.y / T));
    const x1 = Math.min(map.w - 1, Math.ceil((cam.x + G.viewW()) / T));
    const y1 = Math.min(map.h - 1, Math.ceil((cam.y + G.viewH()) / T));

    /* ground — the painters subtract the camera themselves */
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        G.drawTile(DH.LEGEND[map.rows[y][x]].t, x, y);
      }
    }
    /* props and creatures share one depth-sorted list */
    const drawables = [];
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const leg = DH.LEGEND[map.rows[y][x]];
        if (!leg.p) continue;
        const px = x, py = y, lg = leg;
        drawables.push({ sortY: y * T + T, fn: () => G.drawProp(lg.p, px, py, propOpts(px, py, lg)) });
      }
    }
    /* creatures sorted by feet so they layer like a top-down world */
    npcs.forEach(n => drawables.push({
      sortY: n.py, fn: () => {
        G.creature(n.spec, n.px, n.py, {
          scale: n.scale, facing: n.facing, moving: n.moving, bob: !n.asleep,
          phase: (n.px + n.py) * 0.05
        });
        drawName(n.name, n.px, n.py - 26 * (n.scale || 1));
      }
    }));
    followers.forEach(f => drawables.push({
      sortY: f.py, fn: () => {
        G.creature(C.visualFor(f.ch), f.px, f.py, {
          scale: f.ch.scale || 1, facing: f.facing, moving: f.moving,
          weapon: C.weaponArt(f.ch), phase: f.delay
        });
      }
    }));
    drawables.push({
      sortY: player.py + 1, fn: () => {
        G.creature(player.spec, player.px, player.py, {
          scale: player.scale, facing: player.facing, moving: player.moving, weapon: player.weapon
        });
      }
    });
    drawables.sort((a, b) => a.sortY - b.sortY);
    drawables.forEach(d => d.fn());

    /* the highlighted interactable */
    if (promptTarget && promptTarget.kind === 'tile') {
      const px = promptTarget.x * T - cam.x, py = promptTarget.y * T - cam.y;
      G.alpha(0.35 + Math.sin(G.tick * 0.15) * 0.2, () => {
        G.stroke(px, py, T, T, G.C.gold, 1, true);
      });
    }
    if (promptTarget && promptTarget.kind === 'npc') {
      const n = promptTarget.npc;
      G.alpha(0.5 + Math.sin(G.tick * 0.15) * 0.3, () => {
        G.label('▾', n.px, n.py - 34 * (n.scale || 1), { align: 'center', size: 10, color: G.C.gold });
      });
    }

    G.updateParticles();
    G.updateFloaters();

    /* weather, then light */
    if (map.rain) G.rain(map.rain, 5);
    if (map.fog) {
      G.alpha(0.22, () => G.rect(0, 0, G.viewW(), G.viewH(), '#7a8a7a', true));
    }
    const dark = map.indoor ? (map.baseDark || 0) : Math.max(map.baseDark || 0, DH.game.darkness());
    if (dark > 0.02) {
      const lights = [{ x: player.px, y: player.py - 10, r: 92, flicker: false }];
      (map.lights || []).forEach(l => lights.push({ x: l.x * T + T / 2, y: l.y * T + T / 2, r: l.r, flicker: l.flicker }));
      /* torches on the map light themselves */
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const leg = DH.LEGEND[map.rows[y][x]];
        if (leg.l) lights.push({ x: x * T + T / 2, y: y * T + T / 2, r: leg.l, flicker: true });
      }
      G.lighting(dark, lights);
    }
    if (map.thunder && U.chance(0.002)) { G.flash(0.4); G.shake(3); }
    G.vignette(0.35);
  }

  function propOpts(x, y, leg) {
    if (leg.plot) {
      const crop = DH.game.state.crops.find(k => k.map === map.id && k.x === x && k.y === y);
      return crop ? { growth: crop.growth } : null;
    }
    if (leg.i === 'chest') return { open: DH.game.flag('chest_' + map.id + '_' + x + ',' + y) };
    if (leg.i === 'lever') return { on: DH.game.flag('lever_pulled') };
    if (leg.i === 'pole') return { rope: !DH.game.flag('act2_started') };
    if (leg.p === 'rune') return { i: x + y };
    return null;
  }
  function drawName(name, wx, wy) {
    if (!name) return;
    G.alpha(0.85, () => G.label(name, wx, wy, { align: 'center', size: 8, color: G.C.inkDim }));
  }

  return {
    name: 'overworld', get zoom() { return worldZoom; }, enter, exit, resume, pause, update, draw,
    loadMap, updateHud, refreshPlayerLook,
    get player() { return player; },
    get map() { return map; },
    get npcs() { return npcs; },
    /* read-only seam for tooling: lets a test measure the follow formation */
    inspect() { return { player: player, followers: followers, npcs: npcs, zoom: worldZoom }; }
  };
})();
