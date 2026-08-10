/* Drakehaven Island — the main screen. Storm at sea, drawn live behind the menu. */
window.DH = window.DH || {};

DH.scenes.title = (function () {
  'use strict';
  const U = DH.util, G = DH.gfx;

  let t = 0, flashT = 0, nextFlash = 3, ui = null;

  function enter() {
    t = 0; nextFlash = 2;
    G.cam.x = 0; G.cam.y = 0;
    DH.audio.play('title');
    DH.audio.ambience('sea');
    build();
  }
  function exit() { DH.ui.clear(); DH.audio.stormThunder(false); }
  function resume() { build(); }

  function build() {
    DH.ui.clear();
    const root = document.getElementById('ui');
    ui = DH.ui.el('div'); ui.id = 'title-screen';
    root.appendChild(ui);

    const logo = DH.ui.add(ui, 'div', 'logo', 'DRAKEHAVEN<em>ISLAND</em>');

    const menu = DH.ui.add(ui, 'div'); menu.id = 'title-menu';
    const anySave = [1, 2, 3].some(s => DH.save.has(s));

    menu.appendChild(DH.ui.btn('New Game', 'primary', newGame));
    const cont = DH.ui.btn('Continue', '', loadMenu);
    if (!anySave) cont.disabled = true;
    menu.appendChild(cont);
    menu.appendChild(DH.ui.btn('How to Play', '', howTo));
    menu.appendChild(DH.ui.btn('House Rules', '', houseRules));
    menu.appendChild(DH.ui.btn('Settings', '', settings));

    DH.ui.add(ui, 'div', 'foot', 'Click anywhere first to let the sound in. Everything you hear is generated live.');
    DH.ui.add(ui, 'div', 'vsn', 'v1.0');

    ui.addEventListener('mousedown', () => DH.audio.unlock(), { once: true });
  }

  /* ---------------- menu actions ---------------- */
  function newGame() {
    DH.audio.unlock();
    slotPicker('Begin a new story in which slot?', (slot) => {
      DH.game.reset();
      DH.game.state.slot = slot;
      DH.game.replace(DH.scenes.charcreate, { slot: slot });
    });
  }

  function slotPicker(title, fn) {
    DH.ui.modal({
      title: title,
      build(m) {
        for (let s = 1; s <= 3; s++) {
          const sum = DH.save.summary(s);
          const row = DH.ui.el('div', 'slot' + (sum ? '' : ' empty'));
          if (sum) {
            row.innerHTML = '<div class="who"><b>' + DH.ui.esc(sum.name) + '</b><br>' +
              '<span class="meta">' + DH.ui.esc(sum.line) + ' · ' + DH.ui.esc(sum.place) +
              ' · day ' + sum.day + '</span></div><div class="meta">' + DH.ui.esc(sum.when) + '</div>';
          } else {
            row.innerHTML = '<div class="who">Slot ' + s + ' — empty</div>';
          }
          row.onclick = () => {
            if (sum) {
              DH.ui.modal({
                title: 'Overwrite ' + sum.name + '?',
                html: '<p>This will erase that save permanently.</p>',
                buttons: [
                  { label: 'Overwrite', cls: 'danger', fn: () => { DH.save.wipe(s); DH.ui.closeModal(); fn(s); } },
                  { label: 'Cancel' }
                ]
              });
            } else { DH.ui.closeModal(); fn(s); }
          };
          m.appendChild(row);
        }
      },
      buttons: [{ label: 'Cancel' }]
    });
  }

  function loadMenu() {
    DH.ui.modal({
      title: 'Continue',
      build(m) {
        let any = false;
        for (let s = 1; s <= 3; s++) {
          const sum = DH.save.summary(s);
          if (!sum) continue;
          any = true;
          const row = DH.ui.el('div', 'slot');
          row.innerHTML = '<div class="who"><b>' + DH.ui.esc(sum.name) + '</b><br>' +
            '<span class="meta">' + DH.ui.esc(sum.line) + ' · ' + DH.ui.esc(sum.place) +
            ' · day ' + sum.day + '</span></div><div class="meta">' + DH.ui.esc(sum.when) + '</div>';
          row.onclick = () => {
            if (DH.game.loadFrom(s)) {
              DH.game.state.slot = s;
              DH.ui.closeModal();
              DH.audio.unlock();
              const st = DH.game.state;
              DH.game.replace(DH.scenes.overworld, { map: st.map, spawn: st.spawn });
              DH.ui.toast('Welcome back to ' + st.placeName, '', 2400);
            } else DH.ui.toast('That save could not be read.', 'bad');
          };
          m.appendChild(row);
        }
        if (!any) m.appendChild(DH.ui.el('p', 'dim', 'No saved games yet.'));
      },
      buttons: [{ label: 'Back' }]
    });
  }

  function howTo() {
    DH.ui.modal({
      title: 'How to Play',
      html: `
        <h3>Walking about</h3>
        <ul>
          <li><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or the arrow keys to move. <kbd>Shift</kbd> to hurry.</li>
          <li><kbd>Space</kbd> or <kbd>E</kbd> to talk, open, forage, mine, fish, sleep, and to advance dialogue.</li>
          <li><kbd>C</kbd> character sheet · <kbd>J</kbd> journal · <kbd>I</kbd> inventory · <kbd>Esc</kbd> menu and saving.</li>
          <li>Time passes as you walk. Sleep in a bed for a long rest and the next day.</li>
        </ul>
        <h3>Fighting on squares</h3>
        <ul>
          <li>Each square is five feet. Reachable squares glow — click one to move there.</li>
          <li>You get <b>movement</b>, one <b>Action</b>, one <b>Bonus Action</b>, one <b>Reaction</b>,
              and one <b>Ending Action</b> per turn.</li>
          <li>Click an enemy to attack with the selected action. Hover anything for its numbers.</li>
          <li><kbd>T</kbd> ends your turn. <kbd>P</kbd> raises your P.A.C.T. Pod shield.</li>
          <li>Terrain matters: throw barrels, climb ropes, smash bottles, and dip your weapon in freezing water.</li>
        </ul>
        <h3>The island</h3>
        <ul>
          <li>Forage herbs, mine ore, fish off the dock, grow things behind the inn, and craft at a cauldron.</li>
          <li>Named people remember you. Talking and helping raises their regard, and that opens doors.</li>
        </ul>`,
      buttons: [{ label: 'Close' }]
    });
  }

  function houseRules() {
    DH.ui.modal({
      title: 'House Rules at This Table',
      html: `
        <h3>Ending Action</h3>
        <p>Once per turn, after your Action, Bonus Action and movement are spent, you get one more
        thing: a knowledge or observation check (Arcana, Investigation, Nature, History, Perception,
        Religion, Insight, Survival), or using a consumable — including feeding one to a willing
        creature within five feet.</p>
        <h3>No Opportunity Attacks</h3>
        <p>Walk away from whatever you like. Nobody gets a free swing.</p>
        <h3>Critical Hits Carry</h3>
        <p>A critical that kills its target passes the leftover damage on to a new target in reach.</p>
        <h3>Shared Initiative</h3>
        <p>Tie with a friend and you choose the order, or act together. Tie with a monster and you go first.</p>
        <h3>Death</h3>
        <p>Fail your third death save and you lose one character level. You may keep the character,
        or make a new one a level below the rest.</p>
        <h3>P.A.C.T. Pods</h3>
        <p>A reaction press of the blue "S" raises your AC by 2 until your next turn and spends a
        charge. You get more charges as you level, five by ninth. The Command Pod restores four
        charges on a long rest and is how the higher-ups send you things. At seventh level you choose
        a Pod Archetype — Attack, Defence or Utility — and at tenth you bond with the thing.</p>`,
      buttons: [{ label: 'Close' }]
    });
  }

  function settings() {
    const cfg = DH.save.loadConfig();
    DH.ui.modal({
      title: 'Settings',
      build(m) {
        const mk = (label, key) => {
          const wrap = DH.ui.add(m, 'div', 'sect');
          const lab = DH.ui.add(wrap, 'div', 'small dim', label + ': ' + Math.round(DH.audio.getVolume(key) * 100) + '%');
          const inp = DH.ui.el('input'); inp.type = 'range'; inp.min = 0; inp.max = 100;
          inp.value = Math.round(DH.audio.getVolume(key) * 100);
          inp.oninput = () => {
            DH.audio.setVolume(key, inp.value / 100);
            lab.textContent = label + ': ' + inp.value + '%';
            cfg['vol_' + key] = inp.value / 100;
            DH.save.saveConfig(cfg);
          };
          wrap.appendChild(inp);
        };
        mk('Master volume', 'master');
        mk('Music', 'music');
        mk('Sound effects', 'sfx');
        const row = DH.ui.add(m, 'div', 'sect');
        row.appendChild(DH.ui.btn(DH.audio.isMuted() ? 'Unmute everything' : 'Mute everything', '', (e) => {
          DH.audio.setMuted(!DH.audio.isMuted());
          e.target.textContent = DH.audio.isMuted() ? 'Unmute everything' : 'Mute everything';
        }));
        DH.ui.add(m, 'p', 'tiny faint', 'All music and sound is synthesized in the browser at runtime. There are no audio files.');
      },
      buttons: [{ label: 'Close' }]
    });
  }

  function credits() {
    DH.ui.modal({
      title: 'Credits',
      html: `
        <p><b>Drakehaven Island</b> — a tactical role-playing game built from nothing: no engine,
        no libraries, no image files, no audio files. Every sprite is drawn by code onto a canvas and
        every note is synthesized live.</p>
        <h3>The Story</h3>
        <p>The campaign, its people, its stat blocks and its house rules come from a real table:
        the Mary Parker in a storm, the sea hags, P.A.C.T. and its pods, the crazy ones, the
        Half-Dragon, Grimble's trials, the swamp, the arena, and the golden egg at the ball.</p>
        <h3>The Party</h3>
        <p>Anvil, Umarion and the Ball Wizard — plus whoever you just made.</p>
        <h3>Rules</h3>
        <p>A hand-written implementation of fifth-edition-style play: d20 tests, advantage,
        conditions, spell slots, and a grid where a square is five feet.</p>`,
      buttons: [{ label: 'Close' }]
    });
  }

  /* ---------------- animated background ---------------- */
  function update(dt) {
    t += dt;
    flashT -= dt;
    nextFlash -= dt;
    if (nextFlash <= 0) {
      nextFlash = U.rint(4, 11);
      flashT = 0.42;
      DH.audio.sfx('thunder');
      G.shake(4);
    }
  }

  function draw() {
    const W = G.VW, H = G.VH;
    /* sky */
    G.rect(0, 0, W, H, '#0b1220', true);
    for (let i = 0; i < 5; i++) {
      const y = 8 + i * 12;
      G.alpha(0.12 + i * 0.03, () => G.rect(0, y, W, 12, '#1b2740', true));
    }
    /* distant lightning glow */
    if (flashT > 0) {
      const a = Math.max(0, flashT / 0.42);
      G.flash(a * 0.5);
    }
    /* the island silhouette */
    const horizon = H * 0.55;
    G.alpha(0.9, () => {
      G.poly([[W * 0.55, horizon], [W * 0.66, horizon - 46], [W * 0.72, horizon - 30],
      [W * 0.80, horizon - 62], [W * 0.9, horizon - 20], [W, horizon], [W, H], [W * 0.55, H]], '#0a1018', true);
    });
    /* sea */
    G.rect(0, horizon, W, H - horizon, '#0e2438', true);
    for (let i = 0; i < 22; i++) {
      const yy = horizon + i * 6;
      const amp = 3 + i * 0.8;
      const off = Math.sin(t * 1.4 + i * 0.7) * amp;
      G.alpha(0.5 - i * 0.014, () => {
        G.rect(0 + off, yy, W, 3, i % 2 ? '#183a55' : '#12303f', true);
      });
      if (i % 5 === 0) {
        G.alpha(0.35, () => G.rect((Math.sin(t * 0.8 + i) * 0.5 + 0.5) * W, yy, 22, 2, '#7fb8d0', true));
      }
    }
    /* the ship, small and pitching */
    const sx = W * 0.26, sy = horizon + 26 + Math.sin(t * 1.1) * 5;
    const tilt = Math.sin(t * 1.1) * 0.1;
    const ctx = G.ctx;
    ctx.save();
    ctx.translate(sx, sy); ctx.rotate(tilt);
    ctx.fillStyle = '#2b1f14'; ctx.fillRect(-30, -6, 60, 12);
    ctx.fillStyle = '#3d2c1c'; ctx.fillRect(-26, -9, 52, 4);
    ctx.fillStyle = '#4a3826'; ctx.fillRect(-2, -52, 4, 46);
    ctx.fillStyle = '#c8bca0';
    ctx.beginPath(); ctx.moveTo(0, -48); ctx.lineTo(20, -18); ctx.lineTo(0, -18); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, -44); ctx.lineTo(-16, -20); ctx.lineTo(0, -20); ctx.closePath(); ctx.fill();
    /* lantern */
    const lit = 0.6 + Math.sin(t * 6) * 0.15;
    ctx.fillStyle = 'rgba(232,189,88,' + lit + ')';
    ctx.fillRect(-24, -14, 3, 4);
    ctx.restore();
    /* rain and vignette */
    G.rain(1.3, 5);
    G.vignette(0.62);
    G.updateParticles();
  }

  return { name: 'title', enter, exit, resume, update, draw };
})();
