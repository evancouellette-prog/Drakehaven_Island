/* Drakehaven Island — the book: sheet, inventory, spells, party, quests, bestiary. */
window.DH = window.DH || {};

DH.scenes.journal = (function () {
  'use strict';
  const U = DH.util, C = DH.char;

  const TABS = [
    { id: 'sheet', name: 'SHEET' },
    { id: 'inventory', name: 'PACK' },
    { id: 'spells', name: 'SPELLS' },
    { id: 'party', name: 'PARTY' },
    { id: 'quests', name: 'JOURNAL' },
    { id: 'pod', name: 'POD' },
    { id: 'bestiary', name: 'BESTIARY' },
    { id: 'rules', name: 'RULES' }
  ];
  let tab = 'sheet', who = 0;

  function enter(arg) { tab = (arg && arg.tab) || 'sheet'; who = 0; build(); }
  function exit() { DH.ui.clear(); }
  function close() { DH.game.pop(); DH.game.flushOps(); }

  function build() {
    DH.ui.clear();
    const root = document.getElementById('ui');
    const wrap = DH.ui.el('div'); wrap.id = 'book';
    root.appendChild(wrap);
    const tabs = DH.ui.add(wrap, 'div'); tabs.id = 'book-tabs';
    TABS.forEach(t => {
      if (t.id === 'spells' && !DH.game.pc().caster) return;
      if (t.id === 'pod' && !DH.game.pc().pod) return;
      const e = DH.ui.add(tabs, 'div', 'tb' + (tab === t.id ? ' on' : ''), t.name);
      e.onclick = () => { tab = t.id; build(); };
    });
    const body = DH.ui.add(wrap, 'div'); body.id = 'book-body';
    const closeBtn = DH.ui.btn('Close (Esc)', '', close);
    closeBtn.id = 'book-close';
    wrap.appendChild(closeBtn);

    switch (tab) {
      case 'sheet': drawSheet(body); break;
      case 'inventory': drawInventory(body); break;
      case 'spells': drawSpells(body); break;
      case 'party': drawParty(body); break;
      case 'quests': drawQuests(body); break;
      case 'pod': drawPod(body); break;
      case 'bestiary': drawBestiary(body); break;
      case 'rules': drawRules(body); break;
    }
  }

  const target = () => DH.game.party()[who] || DH.game.pc();

  function memberPicker(col) {
    const row = DH.ui.add(col, 'div', 'swrow');
    DH.game.party().forEach((c, i) => {
      row.appendChild(DH.ui.btn(c.name, i === who ? 'primary' : '', () => { who = i; build(); }));
    });
  }

  /* Everything mechanically true about a character, gathered from their race,
     class and subclass — so the Party screen can answer "what does Anvil
     actually do" without opening three tabs. */
  function partyTraits(ch) {
    const out = [];
    const race = DH.raceById(ch.raceId);
    if (race) (race.traits || []).forEach(t => out.push(t));
    const cls = DH.classById(ch.classId);
    if (cls) for (let L = 1; L <= ch.level; L++) (cls.features[L] || []).forEach(f => out.push(f));
    const sub = C.subclass(ch);
    if (sub) Object.keys(sub.features || {}).forEach(k => {
      if (+k <= ch.level) sub.features[k].forEach(f => out.push(f));
    });
    /* companions carry their features as plain strings rather than sheets */
    (ch.features || []).forEach(id => {
      if (typeof id !== 'string') return;
      out.push({ name: U.titleCase(id.split(':')[0].replace(/_/g, ' ')), desc: 'Companion feature.' });
    });
    return out;
  }

  /* ---------------- sheet ---------------- */
  function drawSheet(body) {
    const ch = target();
    const left = DH.ui.add(body, 'div', 'col');
    const mid = DH.ui.add(body, 'div', 'col');
    const right = DH.ui.add(body, 'div', 'col');

    memberPicker(left);
    DH.ui.add(left, 'h3', '', DH.ui.esc(ch.name));
    DH.ui.add(left, 'div', 'small dim', (ch.raceName || '') + ' ' + (ch.className || '') +
      (ch.subclassName ? ' — ' + ch.subclassName : (C.subclass(ch) ? ' — ' + C.subclass(ch).name : '')) +
      ' · Level ' + ch.level);
    if (ch.backgroundName) DH.ui.add(left, 'div', 'small faint', ch.backgroundName);
    const grid = DH.ui.add(left, 'div', 'statgrid');
    const stat = (k, v) => {
      const s = DH.ui.add(grid, 'div', 'stat');
      s.innerHTML = '<div class="k">' + k + '</div><div class="v">' + v + '</div>';
    };
    stat('HIT POINTS', ch.hp + ' / ' + ch.hpMax + (ch.tempHp ? ' +' + ch.tempHp : ''));
    stat('ARMOR CLASS', ch.ac);
    stat('SPEED', ch.speed + ' ft');
    stat('PROFICIENCY', U.plus(ch.prof));
    stat('INITIATIVE', U.plus(ch.initBonus != null ? ch.initBonus : C.abMod(ch, 'dex')));
    stat('HIT DICE', (ch.hitDiceLeft || 0) + 'd' + (ch.hitDie || 8));
    if (ch.isPlayer) {
      stat('EXPERIENCE', U.commas(ch.xp));
      stat('NEXT LEVEL', ch.level >= C.MAX_LEVEL ? 'max' : U.commas(C.xpForLevel(ch.level + 1)));
    }
    if (ch.spellDC) { stat('SPELL SAVE DC', ch.spellDC); stat('SPELL ATTACK', U.plus(ch.spellAtk)); }

    DH.ui.add(mid, 'h3', '', 'ABILITIES AND SAVES');
    DH.ABILITIES.forEach(ab => {
      const v = ch.abilities[ab.id];
      const e = DH.ui.add(mid, 'div', 'kv');
      const prof = (ch.saveProfs || []).indexOf(ab.id) >= 0;
      e.innerHTML = '<span>' + ab.name + '</span><span>' + v + ' (' + U.plus(C.mod(v)) + ')' +
        ' · save ' + U.plus(C.saveMod(ch, ab.id)) + (prof ? ' ●' : '') + '</span>';
    });
    DH.ui.add(mid, 'h3', '', 'SKILLS');
    Object.keys(DH.SKILLS).forEach(s => {
      const prof = (ch.skills || []).indexOf(s) >= 0;
      const exp = (ch.expertise || []).indexOf(s) >= 0;
      const e = DH.ui.add(mid, 'div', 'kv');
      e.innerHTML = '<span>' + (exp ? '◆ ' : prof ? '● ' : '　') + DH.SKILLS[s].name +
        ' <span class="faint tiny">' + DH.SKILLS[s].ab.toUpperCase() + '</span></span>' +
        '<span>' + U.plus(C.skillMod(ch, s)) + '</span>';
    });

    DH.ui.add(right, 'h3', '', 'RESOURCES');
    const res = ch.res || {};
    let anyRes = false;
    Object.keys(res).forEach(k => {
      if (k.indexOf('act_') === 0) return;
      anyRes = true;
      const e = DH.ui.add(right, 'div', 'kv');
      e.innerHTML = '<span>' + U.titleCase(k) + '</span><span>' + res[k].cur + ' / ' + res[k].max + '</span>';
    });
    if (!anyRes) DH.ui.add(right, 'div', 'small faint', 'Nothing to spend but effort.');

    DH.ui.add(right, 'h3', '', 'FEATURES AND TRAITS');
    const race = DH.raceById(ch.raceId);
    if (race) (race.traits || []).forEach(t => {
      const f = DH.ui.add(right, 'div', 'feat');
      f.innerHTML = '<b>' + DH.ui.esc(t.name) + '</b><p>' + DH.ui.esc(t.desc) + '</p>';
    });
    const cls = DH.classById(ch.classId);
    if (cls) for (let L = 1; L <= ch.level; L++) {
      (cls.features[L] || []).forEach(f2 => {
        const f = DH.ui.add(right, 'div', 'feat');
        f.innerHTML = '<b>' + DH.ui.esc(f2.name) + '</b><p>' + DH.ui.esc(f2.desc) + '</p>';
      });
    }
    const sub = C.subclass(ch);
    if (sub) Object.keys(sub.features || {}).forEach(k => {
      if (+k > ch.level) return;
      sub.features[k].forEach(f2 => {
        const f = DH.ui.add(right, 'div', 'feat');
        f.innerHTML = '<b>' + DH.ui.esc(f2.name) + '</b><p>' + DH.ui.esc(f2.desc) + '</p>';
      });
    });
    if (ch.effects && ch.effects.length && !cls) {
      DH.ui.add(right, 'div', 'small faint', ch.effects.join(', '));
    }
    if (ch.conditions && ch.conditions.length) {
      DH.ui.add(right, 'h3', '', 'CONDITIONS');
      ch.conditions.forEach(c2 => {
        const info = DH.CONDITION_INFO[c2.id] || { name: c2.id, desc: '' };
        const f = DH.ui.add(right, 'div', 'feat');
        f.innerHTML = '<b>' + info.name + '</b><p>' + DH.ui.esc(info.desc) + '</p>';
      });
    }
  }

  /* ---------------- inventory ---------------- */
  function drawInventory(body) {
    const ch = DH.game.pc();
    const left = DH.ui.add(body, 'div', 'col');
    const right = DH.ui.add(body, 'div', 'col');

    DH.ui.add(left, 'h3', '', 'CARRIED — ' + U.commas(ch.gold) + ' GOLD');
    const groups = { weapon: [], armor: [], potion: [], wondrous: [], quest: [], other: [] };
    ch.inv.forEach(slot => {
      const it = DH.item(slot.id);
      if (!it) return;
      const g = groups[it.kind] ? it.kind : (it.kind === 'poison' ? 'potion' : 'other');
      groups[g].push({ slot, it });
    });
    const titles = { weapon: 'Weapons', armor: 'Armor', potion: 'Potions and Poisons', wondrous: 'Wondrous Items', quest: 'Story Items', other: 'Everything Else' };
    Object.keys(groups).forEach(g => {
      if (!groups[g].length) return;
      DH.ui.add(left, 'div', 'small gold', titles[g]);
      groups[g].forEach(({ slot, it }) => {
        const equipped = Object.keys(ch.equipped).some(k => ch.equipped[k] === it.id);
        const row = DH.ui.el('div', 'itemrow' + (equipped ? ' eq' : ''));
        row.innerHTML = '<div class="grow">' + DH.ui.esc(it.name) + (slot.qty > 1 ? ' <span class="q">×' + slot.qty + '</span>' : '') +
          (equipped ? ' <span class="q">worn</span>' : '') + '</div>' +
          '<div class="q">' + (it.price ? it.price + ' gp' : '') + '</div>';
        row.onclick = () => showItem(right, slot, it);
        left.appendChild(row);
      });
    });
    if (!ch.inv.length) DH.ui.add(left, 'div', 'small faint', 'Nothing but lint.');

    DH.ui.add(right, 'h3', '', 'EQUIPPED');
    const slots = ['mainHand', 'offHand', 'armor', 'shield', 'head', 'neck', 'ring', 'arms', 'back', 'hands', 'trinket', 'pod'];
    slots.forEach(s => {
      const id = ch.equipped[s];
      const e = DH.ui.add(right, 'div', 'kv');
      e.innerHTML = '<span>' + U.titleCase(s) + '</span><span>' + (id ? DH.ui.esc(DH.item(id).name) : '—') + '</span>';
      if (id) e.style.cursor = 'pointer';
      if (id) e.onclick = () => { C.unequip(ch, s); DH.scenes.overworld.refreshPlayerLook && DH.scenes.overworld.refreshPlayerLook(); build(); };
    });
    DH.ui.add(right, 'div', 'small faint', 'Click an equipped line to take it off. Click an item on the left to use, equip or drop it.');
  }
  function showItem(panel, slot, it) {
    const ch = DH.game.pc();
    panel.innerHTML = '';
    DH.ui.add(panel, 'h3', '', DH.ui.esc(it.name));
    const bits = [];
    if (it.kind === 'weapon') bits.push(it.dmg + ' ' + it.type + (it.props && it.props.length ? ' · ' + it.props.join(', ') : ''));
    if (it.kind === 'armor') bits.push((it.ac ? 'AC ' + it.ac : '+' + it.acBonus + ' AC') + ' · ' + it.armorKind);
    if (it.rarity) bits.push(it.rarity);
    if (it.attune) bits.push('requires attunement');
    if (bits.length) DH.ui.add(panel, 'div', 'small gold', bits.join(' · '));
    DH.ui.add(panel, 'div', 'prose', DH.ui.esc(it.desc || ''));
    const row = DH.ui.add(panel, 'div', 'swrow');
    if (it.kind === 'weapon' || it.kind === 'armor' || it.slot) {
      if (C.canEquip(ch, it.id)) {
        row.appendChild(DH.ui.btn('Equip', 'primary', () => {
          C.equip(ch, it.id);
          DH.scenes.overworld.refreshPlayerLook && DH.scenes.overworld.refreshPlayerLook();
          build();
        }));
      } else DH.ui.add(panel, 'div', 'small bad', 'You are not trained with that.');
    }
    if (it.use) {
      row.appendChild(DH.ui.btn('Use now', '', () => {
        const use = it.use;
        if (use.heal) {
          const r = DH.dice.roll(use.heal);
          const got = C.heal(ch, r.total);
          DH.ui.toast('Healed ' + got + ' hit points.', 'good');
        }
        if (use.cure) use.cure.forEach(c2 => C.removeCondition(ch, c2));
        if (use.cond) C.addCondition(ch, use.cond, use.dur || 100);
        if (use.buff) { ch.buffs = ch.buffs || {}; ch.buffs[it.id] = Object.assign({}, use.buff); DH.ui.toast(it.name + ' takes effect.', 'good'); }
        C.removeItem(ch, it.id, 1);
        DH.audio.sfx('heal');
        build();
      }));
    }
    if (!it.quest) {
      row.appendChild(DH.ui.btn('Drop', 'danger', () => { C.removeItem(ch, it.id, 1); build(); }));
    }
  }

  /* ---------------- spells ---------------- */
  function drawSpells(body) {
    const ch = DH.game.pc();
    const left = DH.ui.add(body, 'div', 'col');
    const right = DH.ui.add(body, 'div', 'col');
    if (!ch.caster) { DH.ui.add(left, 'div', 'small faint', 'You do not cast spells.'); return; }

    DH.ui.add(left, 'h3', '', 'SPELL SLOTS');
    C.slotsAvailable(ch).forEach(s => {
      const row = DH.ui.add(left, 'div', 'slots');
      let html = '<span style="width:52px">Level ' + s.level + '</span>';
      for (let i = 0; i < s.max; i++) html += '<span class="s' + (i < s.cur ? ' f' : '') + '"></span>';
      row.innerHTML = html;
    });
    if (ch.caster.type === 'pact') DH.ui.add(left, 'div', 'small faint', 'Pact slots return on a short rest.');
    DH.ui.add(left, 'div', 'kv').innerHTML = '<span>Spell save DC</span><span>' + ch.spellDC + '</span>';
    DH.ui.add(left, 'div', 'kv').innerHTML = '<span>Spell attack</span><span>' + U.plus(ch.spellAtk) + '</span>';

    DH.ui.add(left, 'h3', '', 'KNOWN');
    (ch.spells.cantrips || []).forEach(id => spellRow(left, id, right, false));
    const list = ch.caster.prepares ? (ch.spells.prepared || []) : (ch.spells.known || []);
    list.forEach(id => spellRow(left, id, right, false));

    /* prepared casters can swap what is ready */
    if (ch.caster.prepares) {
      DH.ui.add(right, 'h3', '', 'PREPARE SPELLS — ' + (ch.spells.prepared || []).length + ' / ' + ch.preparedCount);
      DH.ui.add(right, 'div', 'small faint', 'Click to prepare or set aside. Cantrips are always ready.');
      const code = DH.LIST_CODE[ch.classId] || 'w';
      DH.spellsFor(code, ch.maxSpellLevel).filter(s => s.lv > 0).forEach(sp => {
        const on = (ch.spells.prepared || []).indexOf(sp.id) >= 0;
        const row = DH.ui.el('div', 'spellrow' + (on ? ' eq' : ''));
        row.innerHTML = '<div class="lv">' + sp.lv + '</div><div class="grow">' +
          (on ? '● ' : '○ ') + DH.ui.esc(sp.name) + '</div><div class="q">' + sp.school + '</div>';
        row.onclick = () => {
          if (on) U.remove(ch.spells.prepared, sp.id);
          else {
            if (ch.spells.prepared.length >= ch.preparedCount) { DH.ui.toast('That is as many as you can hold ready.', 'bad'); return; }
            ch.spells.prepared.push(sp.id);
          }
          DH.audio.sfx('select');
          build();
        };
        right.appendChild(row);
      });
    } else {
      DH.ui.add(right, 'h3', '', 'YOUR SPELLS');
      DH.ui.add(right, 'div', 'small faint', 'Click one on the left to read it.');
    }
  }
  function spellRow(col, id, panel, dim) {
    const sp = DH.spellById(id);
    if (!sp) return;
    const row = DH.ui.el('div', 'spellrow');
    row.innerHTML = '<div class="lv">' + (sp.lv || 'c') + '</div><div class="grow">' + DH.ui.esc(sp.name) +
      '</div><div class="q">' + sp.school.slice(0, 4) + '</div>';
    row.onclick = () => {
      panel.innerHTML = '';
      DH.ui.add(panel, 'h3', '', DH.ui.esc(sp.name));
      DH.ui.add(panel, 'div', 'small gold', (sp.lv ? U.ord(sp.lv) + '-level ' : 'Cantrip · ') + sp.school +
        ' · ' + U.titleCase(sp.cast) + (sp.conc ? ' · concentration' : ''));
      const bits = [];
      bits.push('Range ' + (sp.range === 0 ? 'self' : sp.range === 5 ? 'touch' : sp.range + ' ft'));
      if (sp.shape) bits.push(sp.shape.size + '-ft ' + sp.shape.k);
      if (sp.dmg) bits.push(sp.dmg + ' ' + (sp.type || ''));
      if (sp.heal) bits.push('heals ' + sp.heal);
      if (sp.save) bits.push(sp.save.toUpperCase() + ' save');
      DH.ui.add(panel, 'div', 'small dim', bits.join(' · '));
      DH.ui.add(panel, 'div', 'prose', DH.ui.esc(sp.desc || ''));
    };
    col.appendChild(row);
  }

  /* ---------------- party ---------------- */
  function drawParty(body) {
    const col = DH.ui.add(body, 'div', 'col');
    const right = DH.ui.add(body, 'div', 'col');
    DH.ui.add(col, 'h3', '', 'THE PARTY');
    DH.game.party().forEach((c, i) => {
      const row = DH.ui.el('div', 'itemrow');
      row.innerHTML = '<div class="grow"><b>' + DH.ui.esc(c.name) + '</b> — ' +
        DH.ui.esc((c.raceName || '') + ' ' + (c.className || '')) + ' ' + c.level +
        '<div class="q">HP ' + c.hp + '/' + c.hpMax + ' · AC ' + c.ac + (c.pod ? ' · pod ' + c.pod.charges + '/' + c.pod.max : '') + '</div></div>';
      row.onclick = () => { who = i; tab = 'sheet'; build(); };
      col.appendChild(row);
    });

    /* Anyone who died for good, and what it takes to get them back. */
    const fallen = DH.game.fallen ? DH.game.fallen() : (DH.game.fallenList ? DH.game.fallenList() : []);
    if (fallen && fallen.length) {
      DH.ui.add(col, 'h3', '', 'THE FALLEN');
      fallen.forEach(c => {
        const row = DH.ui.el('div', 'itemrow');
        row.innerHTML = '<div class="grow"><b>' + DH.ui.esc(c.name) + '</b> — dead' +
          '<div class="q">' + DH.ui.esc((c.raceName || '') + ' ' + (c.className || '')) + ' ' + c.level + '</div></div>';
        const dust = C.countItem(DH.game.pc(), 'diamond_dust');
        const b = DH.ui.btn(dust > 0 ? 'Raise (diamond dust)' : 'Needs diamond dust', dust > 0 ? 'primary' : '', () => {
          if (C.countItem(DH.game.pc(), 'diamond_dust') <= 0) {
            DH.ui.toast('Raising the dead costs 300 gold of diamond dust.', 'bad'); return;
          }
          C.removeItem(DH.game.pc(), 'diamond_dust', 1);
          const back = DH.game.reviveCompanion(c.companionId || c.name, true);
          DH.audio.sfx('heal');
          DH.ui.toast((back ? back.name : c.name) + ' is breathing again.', 'good', 3600);
          build();
        });
        if (dust <= 0) b.disabled = true;
        row.appendChild(b);
        col.appendChild(row);
      });
    }

    /* What each of them actually is, mechanically — the traits that decide how
       they play, not just a paragraph about their mood. */
    DH.ui.add(right, 'h3', '', 'WHAT THEY BRING');
    DH.game.party().forEach(c => {
      const f = DH.ui.add(right, 'div', 'feat');
      let html = '<b>' + DH.ui.esc(c.name) + '</b>';
      if (c.blurb) html += '<p>' + DH.ui.esc(c.blurb) + '</p>';
      const traits = partyTraits(c);
      if (traits.length) {
        html += '<p>' + traits.map(t =>
          '<b class="gold">' + DH.ui.esc(t.name) + '</b> — ' + DH.ui.esc(t.desc)).join('<br>') + '</p>';
      }
      f.innerHTML = html;
    });
    if (DH.game.state.pet) {
      const f = DH.ui.add(right, 'div', 'feat');
      const m = DH.monster(DH.game.state.pet);
      f.innerHTML = '<b>' + DH.ui.esc(m.name) + '</b><p>Tamed, and fights beside you. ' +
        m.hp + ' hit points, AC ' + m.ac + ', a claw for 1d4.</p>';
    }
    DH.ui.add(right, 'h3', '', 'REGARD');
    const aff = DH.game.state.affinity;
    const keys = Object.keys(aff).filter(k => aff[k] > 0);
    if (!keys.length) DH.ui.add(right, 'div', 'small faint', 'Nobody on this island has an opinion about you yet.');
    keys.forEach(k => {
      const e = DH.ui.add(right, 'div', 'kv');
      e.innerHTML = '<span>' + U.titleCase(k.replace('shop_', '')) + '</span><span>' +
        '♥'.repeat(Math.ceil(aff[k] / 2)) + ' ' + aff[k] + '/10</span>';
    });
  }

  /* ---------------- quests ---------------- */
  function drawQuests(body) {
    const col = DH.ui.add(body, 'div', 'col');
    const right = DH.ui.add(body, 'div', 'col');
    const st = DH.game.state;
    DH.ui.add(col, 'h3', '', 'TASKS');
    const open = st.quests.filter(q => !q.done);
    const done = st.quests.filter(q => q.done);
    if (!open.length) DH.ui.add(col, 'div', 'small faint', 'Nothing outstanding.');
    open.forEach(q => {
      const c = DH.ui.add(col, 'div', 'questcard');
      c.innerHTML = '<b>' + DH.ui.esc(q.title) + '</b><p>' + DH.ui.esc(q.desc || '') + '</p>' +
        (q.steps || []).map(s => '<p class="faint">· ' + DH.ui.esc(s) + '</p>').join('');
    });
    if (done.length) {
      DH.ui.add(col, 'h3', '', 'FINISHED');
      done.forEach(q => {
        const c = DH.ui.add(col, 'div', 'questcard done');
        c.innerHTML = '<b>' + DH.ui.esc(q.title) + '</b>';
      });
    }

    DH.ui.add(right, 'h3', '', 'WHERE YOU ARE');
    DH.ui.add(right, 'div', 'prose', DH.ui.esc(st.placeName) + ' — day ' + st.day + ', ' + DH.game.clock() + '.');
    if (st.contractDeadlineDay) {
      const left = st.contractDeadlineDay - st.day;
      const e = DH.ui.add(right, 'div', 'questcard');
      e.innerHTML = '<b>The Shady Man\'s Contract</b><p>' +
        (DH.game.flag('contract_done') ? 'Settled.' :
          left > 0 ? left + ' days left. Fail, and you all become new targets.' :
            '<span class="bad">The time is up.</span>') + '</p>';
    }
    if (st.musterDay) {
      const e = DH.ui.add(right, 'div', 'questcard');
      e.innerHTML = '<b>The Town\'s Defence</b><p>You put your name on the muster for day ' + st.musterDay + '.</p>';
    }
    DH.ui.add(right, 'h3', '', 'THE ISLAND SO FAR');
    const notes = [];
    if (DH.game.flag('has_pods')) notes.push('You each carry a P.A.C.T. Pod, and the Command Pod charges four of them on a long rest.');
    if (DH.game.flag('act1_done')) notes.push('An Ancient Golden Dragon spoke through you on the dock: "Where have they gone, please, help me child."');
    if (DH.game.flag('half_dragon_beaten')) notes.push('The crazy ones are caught, and the Half-Dragon in the square is down. They all said the same thing about eggs, in the same voice.');
    if (DH.game.flag('mine_done')) notes.push('Grimble the gnome brews something that keeps small dragons calm. He is looking for a gnome named Grimey.');
    if (DH.game.flag('green_dragon_took_egg')) notes.push('An adult green dragon dropped a five-foot golden egg in the swamp, then came back for it. MINE, it said, inside your heads.');
    if (!notes.length) notes.push('Nothing has gone badly wrong yet.');
    notes.forEach(n => DH.ui.add(right, 'div', 'prose faint', DH.ui.esc(n)));
  }

  /* ---------------- pod ---------------- */
  function drawPod(body) {
    const ch = DH.game.pc();
    const col = DH.ui.add(body, 'div', 'col');
    const right = DH.ui.add(body, 'div', 'col');
    DH.ui.add(col, 'h3', '', 'YOUR P.A.C.T. POD');
    const grid = DH.ui.add(col, 'div', 'statgrid');
    const stat = (k, v) => { const s = DH.ui.add(grid, 'div', 'stat'); s.innerHTML = '<div class="k">' + k + '</div><div class="v">' + v + '</div>'; };
    stat('CHARGES', ch.pod.charges + ' / ' + ch.pod.max);
    stat('ARCHETYPE', ch.pod.archetype ? U.titleCase(ch.pod.archetype) : 'level 7');
    stat('BONDED', ch.pod.bonded ? 'yes' : 'level 10');
    stat('COMMAND POD', DH.game.state.commandPod.charges + ' / ' + DH.game.state.commandPod.max);

    DH.ui.add(col, 'div', 'prose', 'The blue "S" raises a shield around whoever presses it: +2 AC until your next turn, one charge. It also shows the other pod-holders as red dots on the screen. The Command Pod recharges four pods on a long rest, and the higher-ups reach you through it.');

    if (ch.level >= 7 && !ch.pod.archetype) {
      DH.ui.add(right, 'h3', '', 'CHOOSE A POD ARCHETYPE');
      [
        { id: 'attack', name: 'Attack', desc: 'Passive: one chosen weapon or spell deals +2 damage. At 7th, one charge fires a marker as a bonus action: +1d4 damage against that target for a minute.' },
        { id: 'defense', name: 'Defence', desc: 'Passive: a reaction reduces damage taken by 1d4. At 7th, one charge grants +1 AC until the start of your next turn as a bonus action.' },
        { id: 'utility', name: 'Utility', desc: 'Passive: proficiency in a skill of your choice. At 7th, one charge per eight hours makes the pod float beside you as a Mage Hand, and grants one 1st-level Bard, Cleric or Druid spell twice per long rest.' }
      ].forEach(a => {
        const f = DH.ui.el('div', 'feat');
        f.style.cursor = 'pointer';
        f.innerHTML = '<b>' + a.name + '</b><p>' + a.desc + '</p>';
        f.onclick = () => {
          ch.pod.archetype = a.id;
          C.derive(ch);
          DH.ui.toast('Pod personalised: ' + a.name, 'item', 3000);
          build();
        };
        right.appendChild(f);
      });
    } else {
      DH.ui.add(right, 'h3', '', 'PROGRESSION');
      [['Level 4', '3 charges'], ['Level 7', '4 charges, and you choose an archetype'],
      ['Level 9', '5 charges'], ['Level 10', 'you bond physically with the pod']].forEach(r => {
        const e = DH.ui.add(right, 'div', 'kv');
        e.innerHTML = '<span>' + r[0] + '</span><span>' + r[1] + '</span>';
      });
      if (ch.pod.archetype) {
        DH.ui.add(right, 'h3', '', 'YOUR ARCHETYPE');
        DH.ui.add(right, 'div', 'prose', U.titleCase(ch.pod.archetype));
      }
    }
  }

  /* ---------------- bestiary ---------------- */
  function drawBestiary(body) {
    const col = DH.ui.add(body, 'div', 'col');
    const right = DH.ui.add(body, 'div', 'col');
    DH.ui.add(col, 'h3', '', 'WHAT YOU HAVE FOUGHT');
    const seen = Object.keys(DH.game.state.bestiary);
    if (!seen.length) DH.ui.add(col, 'div', 'small faint', 'Nothing yet. Give it an hour.');
    seen.forEach(id => {
      const m = DH.monster(id);
      if (!m) return;
      const row = DH.ui.el('div', 'itemrow');
      row.innerHTML = '<div class="grow">' + DH.ui.esc(m.name) + '<div class="q">fought ' +
        DH.game.state.bestiary[id] + '×</div></div><div class="q">CR ' + m.cr + '</div>';
      row.onclick = () => {
        right.innerHTML = '';
        DH.ui.add(right, 'h3', '', DH.ui.esc(m.name));
        DH.ui.add(right, 'div', 'small gold', m.type + ' · CR ' + m.cr + ' · ' + m.xp + ' xp');
        DH.ui.add(right, 'div', 'prose', DH.ui.esc(m.blurb || ''));
        const e = DH.ui.add(right, 'div', 'kv');
        e.innerHTML = '<span>Hit points / AC / speed</span><span>' + m.hp + ' · ' + m.ac + ' · ' + m.speed + ' ft</span>';
        DH.ABILITIES.forEach(ab => {
          const k = DH.ui.add(right, 'div', 'kv');
          k.innerHTML = '<span>' + ab.short + '</span><span>' + m.abilities[ab.id] + ' (' + U.plus(C.mod(m.abilities[ab.id])) + ')</span>';
        });
        (m.traits || []).forEach(t => {
          const f = DH.ui.add(right, 'div', 'feat');
          f.innerHTML = '<b>' + DH.ui.esc(t.name) + '</b><p>' + DH.ui.esc(t.desc) + '</p>';
        });
        (m.actions || []).forEach(a => {
          const f = DH.ui.add(right, 'div', 'feat');
          const bits = [];
          if (a.atk != null) bits.push(U.plus(a.atk) + ' to hit');
          if (a.dmg) bits.push(a.dmg + ' ' + (a.type || ''));
          if (a.save) bits.push('DC ' + a.save.dc + ' ' + a.save.ab.toUpperCase());
          if (a.recharge) bits.push('recharge ' + a.recharge);
          f.innerHTML = '<b>' + DH.ui.esc(a.name) + '</b><p>' + bits.join(' · ') +
            (a.desc ? '<br>' + DH.ui.esc(a.desc) : '') + '</p>';
        });
      };
      col.appendChild(row);
    });
  }

  /* ---------------- rules ---------------- */
  function drawRules(body) {
    const col = DH.ui.add(body, 'div', 'col');
    const right = DH.ui.add(body, 'div', 'col');
    DH.ui.add(col, 'h3', '', 'HOUSE RULES');
    const rules = [
      ['Ending Action', 'Once per turn, after your Action, Bonus Action and movement are spent, you get one more thing: a knowledge or observation check (Arcana, Investigation, Nature, History, Perception, Religion, Insight, Survival), or a consumable used on yourself or fed to a willing creature within five feet.'],
      ['No Opportunity Attacks', 'Leave whoever you like. Nobody swings at your back.'],
      ['Critical Hits Carry', 'A critical hit that kills its target passes the leftover damage to a new target within reach.'],
      ['Shared Initiative', 'Tie with a party member and you choose who acts first, or act together. Tie with a monster and you go first.'],
      ['Death', 'Fail your third death save and you lose one character level. Keep the character, or make a new one a level below the rest.'],
      ['P.A.C.T. Pods', 'A reaction press of the blue "S" gives +2 AC until your next turn for one charge. Charges grow with level, to five at ninth. The Command Pod restores four charges per long rest and can charge four pods at a time. Archetype at seventh, bonding at tenth.']
    ];
    rules.forEach(r => {
      const f = DH.ui.add(col, 'div', 'feat');
      f.innerHTML = '<b>' + r[0] + '</b><p>' + r[1] + '</p>';
    });
    DH.ui.add(right, 'h3', '', 'CONDITIONS');
    Object.keys(DH.CONDITION_INFO).forEach(k => {
      const c = DH.CONDITION_INFO[k];
      const f = DH.ui.add(right, 'div', 'feat');
      f.innerHTML = '<b>' + c.name + '</b><p>' + DH.ui.esc(c.desc) + '</p>';
    });
  }

  function update() {
    if (DH.input.tapped('cancel') || DH.input.tapped('journal') || DH.input.tapped('sheet')) close();
  }
  function draw() {
    DH.gfx.rect(0, 0, DH.gfx.VW, DH.gfx.VH, '#0a0d14', true);
  }

  return { name: 'journal', enter, exit, update, draw, resume: build };
})();
