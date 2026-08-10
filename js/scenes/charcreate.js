/* Drakehaven Island — character creation, staged like Baldur's Gate 3:
   Race ▸ Class ▸ Subclass ▸ Abilities ▸ Background ▸ Skills ▸ Look ▸ Name ▸ Review */
window.DH = window.DH || {};

DH.scenes.charcreate = (function () {
  'use strict';
  const U = DH.util, C = DH.char;

  const STEPS = ['Race', 'Class', 'Subclass', 'Abilities', 'Background', 'Skills', 'Look', 'Name', 'Review'];
  /* You are one of five adventurers already posted together, so you begin as
     their peer rather than three levels behind them. */
  const START_LEVEL = 3;
  const POINT_BUY_COST = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
  const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

  let step = 0, draft = null, slot = 1, portraitCv = null, tick = 0;

  function enter(arg) {
    slot = (arg && arg.slot) || 1;
    step = 0;
    draft = {
      raceId: null, ancestry: null, classId: null, subclassId: null,
      backgroundId: null, skills: [], expertise: [],
      method: 'pointbuy', pool: 27,
      base: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },
      rolled: null, arrayAssign: {},
      flexBonus: {},
      appearance: { skin: null, hair: null, cloth: '#5a4a7a', cloth2: '#3a3050', hairStyle: 'short' },
      name: '', fightingStyle: null, cantrips: [], spellsKnown: [], metamagic: [], invocations: [], pactBoon: null
    };
    DH.audio.play('title');
    DH.audio.ambience('sea');
    render();
  }
  function exit() { DH.ui.clear(); }

  /* =============== helpers =============== */
  const race = () => draft.raceId ? DH.raceById(draft.raceId) : null;
  const cls = () => draft.classId ? DH.classById(draft.classId) : null;
  const sub = () => {
    const c = cls();
    return c && draft.subclassId ? (c.subclasses || []).find(s => s.id === draft.subclassId) : null;
  };
  const bg = () => draft.backgroundId ? DH.backgroundById(draft.backgroundId) : null;

  function finalAbilities() {
    const out = Object.assign({}, draft.base);
    const r = race();
    if (r) {
      Object.keys(r.bonus || {}).forEach(k => out[k] += r.bonus[k]);
      Object.keys(r.penalty || {}).forEach(k => out[k] += r.penalty[k]);
    }
    Object.keys(draft.flexBonus || {}).forEach(k => out[k] += draft.flexBonus[k]);
    return out;
  }
  function racialFor(ab) {
    const r = race(); let n = 0;
    if (r) { n += (r.bonus || {})[ab] || 0; n += (r.penalty || {})[ab] || 0; }
    n += (draft.flexBonus || {})[ab] || 0;
    return n;
  }

  /** A live preview character so the side panel can show real numbers. */
  function preview() {
    const ch = C.blank();
    ch.name = draft.name || 'Unnamed';
    if (race()) { ch.raceId = draft.raceId; ch.raceName = race().name; }
    ch.ancestry = draft.ancestry;
    if (cls()) { ch.classId = draft.classId; ch.className = cls().name; }
    ch.subclassId = draft.subclassId;
    if (bg()) { ch.backgroundId = draft.backgroundId; ch.backgroundName = bg().name; }
    ch.base = Object.assign({}, draft.base);
    ch.flexBonus = Object.assign({}, draft.flexBonus);
    ch.level = START_LEVEL;
    ch.skills = draft.skills.slice();
    if (bg()) (bg().skills || []).forEach(s => { if (ch.skills.indexOf(s) < 0) ch.skills.push(s); });
    ch.fightingStyle = draft.fightingStyle;
    ch.appearance = Object.assign({}, draft.appearance);
    if (cls()) {
      ch.saveProfs = (cls().saves || []).slice();
      ch.profs.armor = (cls().armor || []).slice();
      ch.profs.weapons = (cls().weapons || []).slice();
      (cls().kit || []).forEach(id => C.addItem(ch, id));
    }
    if (bg()) (bg().kit || []).forEach(id => C.addItem(ch, id));
    C.derive(ch);
    C.autoEquip(ch);
    C.derive(ch);
    return ch;
  }

  function canAdvance() {
    switch (STEPS[step]) {
      case 'Race': return !!draft.raceId && (!race().ancestries || !!draft.ancestry) &&
        (!race().flexBonus || Object.keys(draft.flexBonus).length === race().flexBonus.count);
      case 'Class': return !!draft.classId;
      case 'Subclass': return subclassNeededNow() ? !!draft.subclassId : true;
      case 'Abilities': return abilitiesValid();
      case 'Background': return !!draft.backgroundId;
      case 'Skills': return draft.skills.length === skillsToPick();
      case 'Look': return true;
      case 'Name': return (draft.name || '').trim().length > 0;
      case 'Review': return true;
    }
    return true;
  }
  /* Every class has its subclass by 3rd level, so it is always part of creation. */
  function subclassNeededNow() {
    const c = cls(); if (!c) return false;
    return C.subclassLevel(c) <= START_LEVEL;
  }
  function abilitiesValid() {
    if (draft.method === 'pointbuy') return draft.pool === 0 || draft.pool >= 0;
    if (draft.method === 'array') return Object.keys(draft.arrayAssign).length === 6;
    if (draft.method === 'roll') return !!draft.rolled && Object.keys(draft.arrayAssign).length === 6;
    return true;
  }
  function skillsToPick() {
    const c = cls(); if (!c) return 0;
    let n = c.skillCount || 2;
    n += C.effectValue({ effects: raceEffects() }, 'skill_choice');
    return n;
  }
  function raceEffects() {
    const r = race(); const out = [];
    if (r) (r.traits || []).forEach(t => (t.effects || []).forEach(e => out.push(e)));
    return out;
  }
  function skillPool() {
    const c = cls();
    const extra = C.effectValue({ effects: raceEffects() }, 'skill_choice') > 0;
    let pool = c ? c.skillList.slice() : [];
    if (extra) pool = DH.ALL_SKILLS.slice();
    /* background skills come free and cannot be double-picked */
    const b = bg();
    if (b) pool = pool.filter(s => (b.skills || []).indexOf(s) < 0);
    const rEff = raceEffects();
    pool = pool.filter(s => rEff.indexOf('skill:' + s) < 0);
    return pool;
  }

  /* =============== rendering =============== */
  function render() {
    DH.ui.clear();
    const root = document.getElementById('ui');
    const wrap = DH.ui.el('div'); wrap.id = 'cc';
    root.appendChild(wrap);

    /* step rail */
    const rail = DH.ui.add(wrap, 'div'); rail.id = 'cc-steps';
    STEPS.forEach((s, i) => {
      const e = DH.ui.add(rail, 'div', 'st' + (i === step ? ' on' : i < step ? ' done' : ''), (i + 1) + '. ' + s);
      if (i < step) e.onclick = () => { step = i; render(); };
    });

    const body = DH.ui.add(wrap, 'div'); body.id = 'cc-body';
    const list = DH.ui.add(body, 'div'); list.id = 'cc-list';
    const mid = DH.ui.add(body, 'div'); mid.id = 'cc-mid';
    const side = DH.ui.add(body, 'div'); side.id = 'cc-side';

    const foot = DH.ui.add(wrap, 'div'); foot.id = 'cc-foot';
    const back = DH.ui.btn(step === 0 ? '← Main Menu' : '← Back', 'ghost', () => {
      if (step === 0) DH.game.replace(DH.scenes.title);
      else { step--; render(); }
    });
    foot.appendChild(back);
    DH.ui.add(foot, 'div', 'grow');
    const hint = DH.ui.add(foot, 'div', 'tiny faint', '');
    const next = DH.ui.btn(step === STEPS.length - 1 ? 'Begin the Story  ▸' : 'Next  ▸', 'primary', () => {
      if (step === STEPS.length - 1) { finish(); return; }
      step++;
      /* skip the subclass step for any class that has not got one by now */
      if (STEPS[step] === 'Subclass' && !subclassNeededNow()) step++;
      render();
    });
    next.disabled = !canAdvance();
    if (!canAdvance()) hint.textContent = hintFor();
    foot.appendChild(next);

    switch (STEPS[step]) {
      case 'Race': stepRace(list, mid); break;
      case 'Class': stepClass(list, mid); break;
      case 'Subclass': stepSubclass(list, mid); break;
      case 'Abilities': stepAbilities(list, mid); break;
      case 'Background': stepBackground(list, mid); break;
      case 'Skills': stepSkills(list, mid); break;
      case 'Look': stepLook(list, mid); break;
      case 'Name': stepName(list, mid); break;
      case 'Review': stepReview(list, mid); break;
    }
    sidePanel(side);
  }

  function hintFor() {
    switch (STEPS[step]) {
      case 'Race': {
        if (!draft.raceId) return 'Choose a people.';
        if (race().ancestries && !draft.ancestry) return 'Choose your draconic ancestry.';
        return 'Assign your two flexible +1 bonuses.';
      }
      case 'Class': return 'Choose a class.';
      case 'Subclass': return 'Choose a subclass.';
      case 'Abilities': return draft.method === 'pointbuy' ? 'Spend your points.' : 'Assign every score.';
      case 'Background': return 'Choose a background.';
      case 'Skills': return 'Pick ' + skillsToPick() + ' skill' + (skillsToPick() === 1 ? '' : 's') +
        ' (' + draft.skills.length + ' chosen).';
      case 'Name': return 'Your character needs a name.';
    }
    return '';
  }

  /* ---------- step: race ---------- */
  function stepRace(list, mid) {
    DH.RACES.forEach(r => {
      const o = DH.ui.el('div', 'opt' + (draft.raceId === r.id ? ' on' : ''));
      const chip = DH.ui.el('div', 'chip');
      chip.style.background = (r.look.skin && r.look.skin[0]) || '#888';
      o.appendChild(chip);
      const nm = DH.ui.el('div', 'nm', DH.ui.esc(r.name) +
        '<div class="bit">' + bonusText(r) + '</div>');
      o.appendChild(nm);
      o.onclick = () => {
        draft.raceId = r.id;
        draft.ancestry = r.ancestries ? (draft.ancestry || null) : null;
        draft.flexBonus = {};
        draft.appearance.skin = r.look.skin ? r.look.skin[0] : null;
        draft.appearance.hair = r.look.hair ? r.look.hair[0] : null;
        DH.audio.sfx('select');
        render();
      };
      list.appendChild(o);
    });

    const r = race();
    if (!r) { DH.ui.add(mid, 'h1', '', 'Choose a People'); DH.ui.add(mid, 'div', 'prose', 'Fifteen peoples sail these waters, and most of them end up on Drakehaven eventually. Your choice sets your speed, your senses and a handful of things you can simply do.'); return; }
    DH.ui.add(mid, 'h1', '', r.name);
    DH.ui.add(mid, 'div', 'sub', r.size + ' · ' + r.speed + ' ft speed');
    DH.ui.add(mid, 'div', 'prose', DH.ui.esc(r.blurb));
    const tags = DH.ui.add(mid, 'div', 'tagrow');
    tags.innerHTML = Object.keys(r.bonus || {}).map(k =>
      '<span class="tag gold">' + k.toUpperCase() + ' ' + U.plus(r.bonus[k]) + '</span>').join('') +
      Object.keys(r.penalty || {}).map(k =>
        '<span class="tag">' + k.toUpperCase() + ' ' + U.plus(r.penalty[k]) + '</span>').join('');
    DH.ui.add(mid, 'div', 'body-h2', 'Traits');
    (r.traits || []).forEach(t => {
      const f = DH.ui.add(mid, 'div', 'feat');
      f.innerHTML = '<b>' + DH.ui.esc(t.name) + '</b><p>' + DH.ui.esc(t.desc) + '</p>';
    });

    if (r.ancestries) {
      DH.ui.add(mid, 'div', 'body-h2', 'Draconic Ancestry');
      DH.ui.add(mid, 'div', 'prose', 'This sets your breath weapon and what you shrug off. On an island where dragons have started shouting about their eggs, it also sets how people look at you.');
      const row = DH.ui.add(mid, 'div', 'swrow');
      r.ancestries.forEach(a => {
        const s = DH.ui.el('div', 'sw' + (draft.ancestry === a.id ? ' on' : ''));
        s.style.background = a.col;
        s.title = a.name + ' — ' + a.dmg + ' (' + a.shape + ')';
        s.onclick = () => { draft.ancestry = a.id; draft.appearance.skin = a.col; DH.audio.sfx('select'); render(); };
        row.appendChild(s);
      });
      if (draft.ancestry) {
        const a = r.ancestries.find(x => x.id === draft.ancestry);
        DH.ui.add(mid, 'div', 'small dim', a.name + ' dragonborn — ' + a.dmg + ' damage, ' + a.shape + ' breath, resistance to ' + a.dmg + '.');
      }
    }

    if (r.flexBonus) {
      DH.ui.add(mid, 'div', 'body-h2', 'Two Flexible Bonuses');
      DH.ui.add(mid, 'div', 'prose', 'Assign +1 to two different abilities other than Charisma.');
      DH.ABILITIES.forEach(ab => {
        if ((r.flexBonus.exclude || []).indexOf(ab.id) >= 0) return;
        const on = !!draft.flexBonus[ab.id];
        const o = DH.ui.el('div', 'opt' + (on ? ' on' : ''));
        o.innerHTML = '<div class="nm">' + ab.name + ' <span class="bit">' + (on ? '+1' : '') + '</span></div>';
        o.style.marginBottom = '4px';
        o.onclick = () => {
          if (on) delete draft.flexBonus[ab.id];
          else if (Object.keys(draft.flexBonus).length < r.flexBonus.count) draft.flexBonus[ab.id] = 1;
          DH.audio.sfx('select'); render();
        };
        mid.appendChild(o);
      });
    }
  }
  function bonusText(r) {
    const parts = Object.keys(r.bonus || {}).map(k => k.toUpperCase() + U.plus(r.bonus[k]));
    if (r.flexBonus) parts.push('+1 ×2 free');
    return parts.join(' ');
  }

  /* ---------- step: class ---------- */
  function stepClass(list, mid) {
    DH.CLASSES.forEach(c => {
      const o = DH.ui.el('div', 'opt' + (draft.classId === c.id ? ' on' : ''));
      o.innerHTML = '<div class="nm">' + c.name +
        '<div class="bit">d' + c.hitDie + ' · ' + c.primary.map(p => p.toUpperCase()).join('/') +
        (c.caster ? ' · caster' : '') + '</div></div>';
      o.onclick = () => {
        draft.classId = c.id;
        draft.subclassId = null;
        draft.skills = [];
        draft.fightingStyle = null;
        draft.cantrips = []; draft.spellsKnown = [];
        DH.audio.sfx('select'); render();
      };
      list.appendChild(o);
    });
    const c = cls();
    if (!c) {
      DH.ui.add(mid, 'h1', '', 'Choose a Class');
      DH.ui.add(mid, 'div', 'prose', 'All twelve are here. This is the single biggest decision on the sheet: it sets your hit points, your saves, what you can wear, and whether you solve problems with a sword, a spell, a bargain, or a very good idea.');
      return;
    }
    DH.ui.add(mid, 'h1', '', c.name);
    DH.ui.add(mid, 'div', 'sub', 'Hit die d' + c.hitDie + ' · saves in ' +
      c.saves.map(s => s.toUpperCase()).join(' and ') + ' · ' + c.skillCount + ' skills');
    DH.ui.add(mid, 'div', 'prose', DH.ui.esc(c.blurb));
    if (c.flavor) DH.ui.add(mid, 'div', 'prose faint', DH.ui.esc('“' + c.flavor + '”'));
    const tags = DH.ui.add(mid, 'div', 'tagrow');
    const bits = [];
    if (c.armor && c.armor.length) bits.push('Armor: ' + c.armor.join(', '));
    bits.push('Weapons: ' + (c.weapons || []).slice(0, 4).join(', '));
    if (c.caster) bits.push('Casts with ' + c.caster.ability.toUpperCase());
    tags.innerHTML = bits.map(b => '<span class="tag">' + DH.ui.esc(b) + '</span>').join('');

    DH.ui.add(mid, 'div', 'body-h2', 'What You Have by Third Level');
    for (let L = 1; L <= START_LEVEL; L++) {
      (c.features[L] || []).forEach(f => {
        const e = DH.ui.add(mid, 'div', 'feat');
        e.innerHTML = '<b>' + DH.ui.esc(f.name) + '</b><p>' + DH.ui.esc(f.desc) + '</p>';
      });
    }
    DH.ui.add(mid, 'div', 'body-h2', 'And Later');
    for (let L = START_LEVEL + 1; L <= 10; L++) {
      (c.features[L] || []).forEach(f => {
        const e = DH.ui.add(mid, 'div', 'kv');
        e.innerHTML = '<span>Level ' + L + '</span><span>' + DH.ui.esc(f.name) + '</span>';
      });
    }
    let stylesGranted = false;
    for (let L = 1; L <= START_LEVEL; L++) {
      if ((c.features[L] || []).some(f => (f.effects || []).indexOf('fighting_style') >= 0)) stylesGranted = true;
    }
    if (stylesGranted) {
      DH.ui.add(mid, 'div', 'body-h2', 'Fighting Style');
      DH.FIGHTING_STYLES.forEach(fs => {
        const on = draft.fightingStyle === fs.id;
        const o = DH.ui.el('div', 'opt' + (on ? ' on' : ''));
        o.style.marginBottom = '4px';
        o.innerHTML = '<div class="nm">' + fs.name + '<div class="bit">' + DH.ui.esc(fs.desc) + '</div></div>';
        o.onclick = () => { draft.fightingStyle = fs.id; DH.audio.sfx('select'); render(); };
        mid.appendChild(o);
      });
    }
  }

  /* ---------- step: subclass ---------- */
  function stepSubclass(list, mid) {
    const c = cls();
    if (!c) return;
    (c.subclasses || []).forEach(s => {
      const o = DH.ui.el('div', 'opt' + (draft.subclassId === s.id ? ' on' : ''));
      o.innerHTML = '<div class="nm">' + s.name + '</div>';
      o.onclick = () => { draft.subclassId = s.id; DH.audio.sfx('select'); render(); };
      list.appendChild(o);
    });
    const s = sub();
    const at = C.subclassLevel(c);
    if (!s) {
      DH.ui.add(mid, 'h1', '', 'Choose a Path');
      DH.ui.add(mid, 'div', 'prose', c.name + 's choose their speciality at level ' + at +
        ', and you are starting at ' + START_LEVEL + '.');
      return;
    }
    DH.ui.add(mid, 'h1', '', s.name);
    DH.ui.add(mid, 'div', 'sub', 'Begins at level ' + at);
    DH.ui.add(mid, 'div', 'prose', DH.ui.esc(s.blurb));
    Object.keys(s.features || {}).sort((a, b) => a - b).forEach(k => {
      s.features[k].forEach(f => {
        const e = DH.ui.add(mid, 'div', 'feat');
        e.innerHTML = '<b>Level ' + k + ' — ' + DH.ui.esc(f.name) + '</b><p>' + DH.ui.esc(f.desc) + '</p>';
      });
    });
    if (s.caster) DH.ui.add(mid, 'div', 'small dim', 'This path grants spellcasting using ' + s.caster.ability.toUpperCase() + '.');
  }

  /* ---------- step: abilities ---------- */
  function stepAbilities(list, mid) {
    const methods = [
      { id: 'pointbuy', name: 'Point Buy', bit: '27 points, nothing above 15 before racials' },
      { id: 'array', name: 'Standard Array', bit: '15, 14, 13, 12, 10, 8 — assign them' }
    ];
    methods.forEach(m => {
      const o = DH.ui.el('div', 'opt' + (draft.method === m.id ? ' on' : ''));
      o.innerHTML = '<div class="nm">' + m.name + '<div class="bit">' + m.bit + '</div></div>';
      o.onclick = () => {
        draft.method = m.id;
        draft.arrayAssign = {};
        if (m.id === 'pointbuy') { draft.base = { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 }; draft.pool = 27; }
        if (m.id === 'array') draft.base = { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };
        if (m.id === 'roll') { draft.rolled = null; draft.base = { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 }; }
        DH.audio.sfx('select'); render();
      };
      list.appendChild(o);
    });

    DH.ui.add(mid, 'h1', '', 'Ability Scores');
    const c = cls();
    if (c) DH.ui.add(mid, 'div', 'sub', c.name + 's lean on ' + c.primary.map(p =>
      DH.ABILITIES.find(a => a.id === p).name).join(' and ') + '.');

    if (draft.method === 'pointbuy') {
      const bar = DH.ui.add(mid, 'div', 'prose');
      bar.innerHTML = 'Points left: <b class="gold">' + draft.pool + '</b> of 27. ' +
        'Scores run 8 to 15 before your racial bonuses; 14 and 15 cost extra.';
      DH.ABILITIES.forEach(ab => mid.appendChild(abRowPointBuy(ab)));
      const row = DH.ui.add(mid, 'div', 'swrow');
      row.appendChild(DH.ui.btn('Reset', '', () => {
        draft.base = { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 }; draft.pool = 27; render();
      }));
      row.appendChild(DH.ui.btn('Recommend for my class', '', () => { recommend(); render(); }));
    } else if (draft.method === 'array') {
      DH.ui.add(mid, 'div', 'prose', 'Click a score, then click the ability it belongs to.');
      mid.appendChild(numberBank(STANDARD_ARRAY));
      DH.ABILITIES.forEach(ab => mid.appendChild(abRowAssign(ab)));
    } else {
      if (!draft.rolled) {
        DH.ui.add(mid, 'div', 'prose', 'Six sets of four dice, the lowest of each discarded. No takebacks — that is the point.');
        mid.appendChild(DH.ui.btn('Roll the dice', 'primary', () => {
          draft.rolled = [];
          for (let i = 0; i < 6; i++) {
            const r = DH.dice.roll('4d6dl1');
            draft.rolled.push(r.total);
          }
          draft.rolled.sort((a, b) => b - a);
          DH.audio.sfx('dice');
          render();
        }));
      } else {
        DH.ui.add(mid, 'div', 'prose', 'You rolled: <b class="gold">' + draft.rolled.join(', ') + '</b>. Assign them.');
        mid.appendChild(numberBank(draft.rolled));
        DH.ABILITIES.forEach(ab => mid.appendChild(abRowAssign(ab)));
        mid.appendChild(DH.ui.btn('Roll again (fresh set)', '', () => {
          draft.rolled = null; draft.arrayAssign = {};
          draft.base = { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };
          render();
        }));
      }
    }
  }
  function abRowPointBuy(ab) {
    const row = DH.ui.el('div', 'abrow');
    const v = draft.base[ab.id], rac = racialFor(ab.id), fin = v + rac;
    row.innerHTML =
      '<div class="ab">' + ab.short + '</div>' +
      '<div class="full">' + ab.name + '</div>' +
      '<div class="val">' + v + '</div>' +
      '<div class="rac">' + (rac ? U.plus(rac) : '') + '</div>' +
      '<div class="mod">' + U.plus(C.mod(fin)) + '</div>';
    const minus = DH.ui.btn('−', '', () => {
      if (draft.base[ab.id] <= 8) return;
      const cost = POINT_BUY_COST[draft.base[ab.id]] - POINT_BUY_COST[draft.base[ab.id] - 1];
      draft.base[ab.id]--; draft.pool += cost; render();
    });
    const plus = DH.ui.btn('+', '', () => {
      if (draft.base[ab.id] >= 15) return;
      const cost = POINT_BUY_COST[draft.base[ab.id] + 1] - POINT_BUY_COST[draft.base[ab.id]];
      if (cost > draft.pool) return;
      draft.base[ab.id]++; draft.pool -= cost; render();
    });
    row.appendChild(minus); row.appendChild(plus);
    const pips = DH.ui.el('div', 'pips');
    for (let i = 8; i <= 15; i++) {
      const p = DH.ui.el('div', 'pip' + (i <= v ? ' f' : ''));
      pips.appendChild(p);
    }
    for (let i = 0; i < rac; i++) pips.appendChild(DH.ui.el('div', 'pip r'));
    row.appendChild(pips);
    return row;
  }
  let bankPick = null;
  function numberBank(nums) {
    const wrap = DH.ui.el('div', 'swrow');
    nums.forEach((n, i) => {
      const used = Object.keys(draft.arrayAssign).some(k => draft.arrayAssign[k] === i);
      const b = DH.ui.el('div', 'sw' + (bankPick === i ? ' on' : ''));
      b.style.width = '38px'; b.style.height = '32px';
      b.style.display = 'flex'; b.style.alignItems = 'center'; b.style.justifyContent = 'center';
      b.style.fontSize = '15px';
      b.style.opacity = used ? '0.3' : '1';
      b.textContent = n;
      b.onclick = () => { if (used) return; bankPick = (bankPick === i ? null : i); render(); };
      wrap.appendChild(b);
    });
    return wrap;
  }
  function abRowAssign(ab) {
    const row = DH.ui.el('div', 'abrow');
    const assigned = draft.arrayAssign[ab.id];
    const nums = draft.method === 'array' ? STANDARD_ARRAY : (draft.rolled || []);
    const v = assigned != null ? nums[assigned] : null;
    const rac = racialFor(ab.id);
    row.innerHTML =
      '<div class="ab">' + ab.short + '</div>' +
      '<div class="full">' + ab.name + '</div>' +
      '<div class="val">' + (v == null ? '–' : v) + '</div>' +
      '<div class="rac">' + (rac ? U.plus(rac) : '') + '</div>' +
      '<div class="mod">' + (v == null ? '' : U.plus(C.mod(v + rac))) + '</div>';
    row.style.cursor = 'pointer';
    row.onclick = () => {
      if (bankPick != null) {
        /* clear any ability already holding this number */
        Object.keys(draft.arrayAssign).forEach(k => { if (draft.arrayAssign[k] === bankPick) delete draft.arrayAssign[k]; });
        draft.arrayAssign[ab.id] = bankPick;
        bankPick = null;
      } else if (assigned != null) {
        delete draft.arrayAssign[ab.id];
      }
      syncAssign(); render();
    };
    return row;
  }
  function syncAssign() {
    const nums = draft.method === 'array' ? STANDARD_ARRAY : (draft.rolled || []);
    DH.ABILITIES.forEach(ab => {
      const i = draft.arrayAssign[ab.id];
      draft.base[ab.id] = i != null ? nums[i] : 8;
    });
  }
  function recommend() {
    const c = cls(); if (!c) return;
    const order = c.primary.concat(['con', 'dex', 'wis', 'cha', 'int', 'str'].filter(a => c.primary.indexOf(a) < 0));
    const targets = [15, 14, 13, 12, 10, 8];
    draft.base = { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };
    draft.pool = 27;
    order.forEach((ab, i) => {
      const want = targets[i];
      while (draft.base[ab] < want) {
        const cost = POINT_BUY_COST[draft.base[ab] + 1] - POINT_BUY_COST[draft.base[ab]];
        if (cost > draft.pool) break;
        draft.base[ab]++; draft.pool -= cost;
      }
    });
  }

  /* ---------- step: background ---------- */
  function stepBackground(list, mid) {
    DH.BACKGROUNDS.forEach(b => {
      const o = DH.ui.el('div', 'opt' + (draft.backgroundId === b.id ? ' on' : ''));
      o.innerHTML = '<div class="nm">' + b.name + '<div class="bit">' +
        b.skills.map(s => DH.SKILLS[s].name).join(', ') + '</div></div>';
      o.onclick = () => {
        draft.backgroundId = b.id;
        draft.skills = draft.skills.filter(s => b.skills.indexOf(s) < 0);
        DH.audio.sfx('select'); render();
      };
      list.appendChild(o);
    });
    const b = bg();
    if (!b) {
      DH.ui.add(mid, 'h1', '', 'Where You Came From');
      DH.ui.add(mid, 'div', 'prose', 'Two free skill proficiencies, some starting gear and coin, and a hook the story will actually use.');
      return;
    }
    DH.ui.add(mid, 'h1', '', b.name);
    DH.ui.add(mid, 'div', 'sub', 'Starting gold ' + b.gold + ' gp, plus 2d4×2 from your class');
    DH.ui.add(mid, 'div', 'prose', DH.ui.esc(b.blurb));
    const tags = DH.ui.add(mid, 'div', 'tagrow');
    tags.innerHTML = b.skills.map(s => '<span class="tag gold">' + DH.SKILLS[s].name + '</span>').join('') +
      (b.tools || []).map(t => '<span class="tag">' + U.titleCase(t) + '</span>').join('');
    const f = DH.ui.add(mid, 'div', 'feat');
    f.innerHTML = '<b>' + DH.ui.esc(b.feature.name) + '</b><p>' + DH.ui.esc(b.feature.desc) + '</p>';
    DH.ui.add(mid, 'div', 'body-h2', 'How This Comes Up');
    DH.ui.add(mid, 'div', 'prose faint', DH.ui.esc(b.hook));
    DH.ui.add(mid, 'div', 'body-h2', 'Kit');
    DH.ui.add(mid, 'div', 'prose', (b.kit || []).map(id => (DH.item(id) || {}).name || id).join(', '));
  }

  /* ---------- step: skills ---------- */
  function stepSkills(list, mid) {
    const pool = skillPool();
    const need = skillsToPick();
    DH.ui.add(mid, 'h1', '', 'Skill Proficiencies');
    DH.ui.add(mid, 'div', 'sub', 'Choose ' + need + ' — ' + draft.skills.length + ' chosen');
    const b = bg();
    if (b) DH.ui.add(mid, 'div', 'prose faint', 'Your background already gives you ' +
      b.skills.map(s => DH.SKILLS[s].name).join(' and ') + '.');
    const rEff = raceEffects().filter(e => e.indexOf('skill:') === 0).map(e => DH.SKILLS[e.slice(6)].name);
    if (rEff.length) DH.ui.add(mid, 'div', 'prose faint', 'Your people already give you ' + U.listing(rEff) + '.');

    pool.forEach(s => {
      const info = DH.SKILLS[s];
      const on = draft.skills.indexOf(s) >= 0;
      const o = DH.ui.el('div', 'opt' + (on ? ' on' : ''));
      const m = C.mod(finalAbilities()[info.ab]) + (on ? 2 : 0);
      o.style.marginBottom = '4px';
      o.innerHTML = '<div class="nm">' + info.name +
        '<div class="bit">' + info.ab.toUpperCase() + ' · ' + U.plus(m) + ' if taken</div></div>';
      o.onclick = () => {
        if (on) U.remove(draft.skills, s);
        else if (draft.skills.length < need) draft.skills.push(s);
        else { DH.audio.sfx('cancel'); return; }
        DH.audio.sfx('select'); render();
      };
      mid.appendChild(o);
    });
    /* rogue and bard expertise */
    const c = cls();
    if (c && (c.id === 'rogue' || c.id === 'bard')) {
      DH.ui.add(mid, 'div', 'body-h2', 'Expertise — double proficiency in two');
      const all = draft.skills.concat(b ? b.skills : []);
      all.forEach(s => {
        const on = draft.expertise.indexOf(s) >= 0;
        const o = DH.ui.el('div', 'opt' + (on ? ' on' : ''));
        o.style.marginBottom = '4px';
        o.innerHTML = '<div class="nm">' + DH.SKILLS[s].name + '</div>';
        o.onclick = () => {
          if (on) U.remove(draft.expertise, s);
          else if (draft.expertise.length < 2) draft.expertise.push(s);
          render();
        };
        mid.appendChild(o);
      });
    }
  }

  /* ---------- step: look ---------- */
  function stepLook(list, mid) {
    const r = race();
    DH.ui.add(mid, 'h1', '', 'Appearance');
    DH.ui.add(mid, 'div', 'sub', 'This is what everyone on the island will see.');
    if (!r) return;

    const mkSwatches = (title, colours, key) => {
      DH.ui.add(mid, 'div', 'body-h2', title);
      const row = DH.ui.add(mid, 'div', 'swrow');
      colours.forEach(col => {
        const s = DH.ui.el('div', 'sw' + (draft.appearance[key] === col ? ' on' : ''));
        s.style.background = col;
        s.onclick = () => { draft.appearance[key] = col; DH.audio.sfx('select'); render(); };
        row.appendChild(s);
      });
    };
    mkSwatches(r.look.flags && r.look.flags.scalesFromSkin ? 'Scale Colour' : 'Skin', r.look.skin || ['#d8a878'], 'skin');
    if (!(r.look.flags && r.look.flags.hairStyle === 'bald')) {
      mkSwatches('Hair', r.look.hair || ['#2b1f16'], 'hair');
      DH.ui.add(mid, 'div', 'body-h2', 'Hair Style');
      const styles = ['short', 'long', 'braid', 'mohawk', 'bald'];
      const row = DH.ui.add(mid, 'div', 'swrow');
      styles.forEach(st => {
        const b = DH.ui.btn(U.cap(st), draft.appearance.hairStyle === st ? 'primary' : '', () => {
          draft.appearance.hairStyle = st; render();
        });
        row.appendChild(b);
      });
    }
    mkSwatches('Clothing', ['#5a4a7a', '#8a3f3a', '#3a5a3a', '#3f5f7a', '#7a5f3a', '#2b2b3a', '#7a2a4a', '#4a6a7a'], 'cloth');
    mkSwatches('Trim', ['#3a3050', '#5a2a28', '#2b4229', '#2b4258', '#5a4228', '#1a1a24', '#5a1f38', '#33485a'], 'cloth2');
  }

  /* ---------- step: name ---------- */
  function stepName(list, mid) {
    DH.ui.add(mid, 'h1', '', 'What Do They Call You?');
    DH.ui.add(mid, 'div', 'sub', 'The captain will use it. So will the higher-ups.');
    const inp = DH.ui.el('input');
    inp.type = 'text'; inp.maxLength = 24; inp.value = draft.name;
    inp.placeholder = 'Your name';
    inp.oninput = () => {
      draft.name = inp.value;
      const n = document.querySelector('#cc-foot button.primary');
      if (n) n.disabled = !canAdvance();
      const port = document.querySelector('#cc-side .who-name');
      if (port) port.textContent = draft.name || 'Unnamed';
    };
    inp.onkeydown = (e) => { if (e.key === 'Enter' && canAdvance()) { step++; render(); } };
    mid.appendChild(inp);
    setTimeout(() => inp.focus(), 30);

    DH.ui.add(mid, 'div', 'body-h2', 'Or take one of these');
    const pool = NAMES[draft.raceId] || NAMES._default;
    const row = DH.ui.add(mid, 'div', 'swrow');
    U.shuffle(pool).slice(0, 8).forEach(n => {
      row.appendChild(DH.ui.btn(n, '', () => { draft.name = n; render(); }));
    });
  }

  const NAMES = {
    _default: ['Ashen', 'Corwin', 'Delle', 'Fenn', 'Halla', 'Iver', 'Marrow', 'Nix', 'Orrin', 'Perrin', 'Sable', 'Wren'],
    human: ['Ansel', 'Bryn', 'Cade', 'Della', 'Halric', 'Joss', 'Maren', 'Rook', 'Sela', 'Tobias'],
    wood_elf: ['Aelric', 'Caladwen', 'Faeryl', 'Ithil', 'Lirien', 'Sylvar', 'Thessaly', 'Yvarien'],
    high_elf: ['Aureliath', 'Celoril', 'Elenwe', 'Ithanor', 'Myrrha', 'Vaelen'],
    hill_dwarf: ['Baern', 'Dagra', 'Hobbard', 'Korran', 'Morgra', 'Thrain'],
    mountain_dwarf: ['Brannock', 'Durgeddin', 'Helja', 'Kordrun', 'Vistra'],
    halfling: ['Bramble', 'Cora', 'Milo', 'Nettie', 'Pip', 'Rosbin', 'Tansy'],
    dragonborn: ['Arkhosh', 'Balasar', 'Kriv', 'Nadarr', 'Rhogar', 'Shamash', 'Thava', 'Verthisathurgiesh'],
    gnome: ['Bimble', 'Cogsworth', 'Fenwick', 'Gimble', 'Nyx', 'Pennywhistle', 'Wobble'],
    half_elf: ['Ardan', 'Cassia', 'Eiran', 'Lissa', 'Rhoen', 'Vessa'],
    half_orc: ['Grash', 'Krusk', 'Mahra', 'Ronk', 'Shump', 'Ulga'],
    tiefling: ['Akmenos', 'Ember', 'Kallista', 'Mordai', 'Rue', 'Sorrow', 'Zaraq'],
    tabaxi: ['Cloud on the Water', 'Four Bells', 'Nine Lives', 'Quiet Paw', 'Sunset Rain'],
    minotaur: ['Bellowhorn', 'Cassorak', 'Dunmar', 'Horrun', 'Tauressa'],
    kobold: ['Chip', 'Grik', 'Meepo', 'Snik', 'Tikk', 'Yipyap'],
    orc: ['Baggi', 'Gharzul', 'Kansif', 'Murnig', 'Thokk', 'Yevelda']
  };

  /* ---------- step: review ---------- */
  function stepReview(list, mid) {
    const ch = preview();
    DH.ui.add(mid, 'h1', '', ch.name);
    DH.ui.add(mid, 'div', 'sub', 'Level ' + ch.level + ' ' + ch.raceName + ' ' + ch.className +
      (sub() ? ' — ' + sub().name : '') + ' · ' + ch.backgroundName);

    const grid = DH.ui.add(mid, 'div', 'statgrid');
    const stat = (k, v) => {
      const s = DH.ui.add(grid, 'div', 'stat');
      s.innerHTML = '<div class="k">' + k + '</div><div class="v">' + v + '</div>';
    };
    stat('HIT POINTS', ch.hpMax);
    stat('ARMOUR CLASS', ch.ac);
    stat('SPEED', ch.speed + ' ft');
    stat('PROFICIENCY', U.plus(ch.prof));
    stat('INITIATIVE', U.plus(ch.initBonus));
    stat('LEVEL', ch.level);

    DH.ui.add(mid, 'div', 'body-h2', 'Abilities');
    DH.ABILITIES.forEach(ab => {
      const v = ch.abilities[ab.id];
      const e = DH.ui.add(mid, 'div', 'kv');
      e.innerHTML = '<span>' + ab.name + '</span><span>' + v + ' (' + U.plus(C.mod(v)) + ')' +
        ((ch.saveProfs || []).indexOf(ab.id) >= 0 ? '  · save ' + U.plus(C.saveMod(ch, ab.id)) : '') + '</span>';
    });

    DH.ui.add(mid, 'div', 'body-h2', 'Skills');
    const skl = ch.skills.slice().sort();
    skl.forEach(s => {
      const e = DH.ui.add(mid, 'div', 'kv');
      e.innerHTML = '<span>' + DH.SKILLS[s].name + '</span><span>' + U.plus(C.skillMod(ch, s)) + '</span>';
    });

    if (ch.caster) {
      DH.ui.add(mid, 'div', 'body-h2', 'Spellcasting');
      const e = DH.ui.add(mid, 'div', 'kv');
      e.innerHTML = '<span>Spell save DC / attack</span><span>' + ch.spellDC + ' / ' + U.plus(ch.spellAtk) + '</span>';
      const e2 = DH.ui.add(mid, 'div', 'kv');
      const slots = C.slotsAvailable(ch).map(s => s.max + '×L' + s.level).join(', ');
      e2.innerHTML = '<span>Slots</span><span>' + (slots || '—') + '</span>';
      C.ensureSpells(ch);
      DH.ui.add(mid, 'div', 'prose faint', 'Cantrips: ' +
        (ch.spells.cantrips.map(id => DH.spellById(id).name).join(', ') || '—') + '. ' +
        'Spells: ' + ((ch.caster.prepares ? ch.spells.prepared : ch.spells.known)
          .map(id => DH.spellById(id).name).join(', ') || '—') +
        '. You can change these later from your character sheet.');
    }

    DH.ui.add(mid, 'div', 'body-h2', 'Starting Kit');
    DH.ui.add(mid, 'div', 'prose', ch.inv.map(s =>
      (DH.item(s.id) || {}).name + (s.qty > 1 ? ' ×' + s.qty : '')).join(', '));

    DH.ui.add(mid, 'div', 'body-h2', 'Then What?');
    DH.ui.add(mid, 'div', 'prose faint',
      'You are asleep — or nearly — in the crew quarters of the Mary Parker, somewhere off Drakehaven Island, ' +
      'in the early hours of a thunderstorm. Four other people are aboard who will matter enormously to you. ' +
      'One of them is punching a metal bar.');
  }

  /* ---------- the live side panel ---------- */
  function sidePanel(side) {
    const ch = preview();
    const port = DH.ui.add(side, 'div'); port.id = 'cc-portrait';
    portraitCv = document.createElement('canvas');
    portraitCv.width = 96; portraitCv.height = 128;
    port.appendChild(portraitCv);

    const nm = DH.ui.add(side, 'div', 'body-h2 who-name', draft.name || 'Unnamed');
    DH.ui.add(side, 'div', 'small dim',
      (race() ? race().name : '—') + ' ' + (cls() ? cls().name : '') +
      (cls() ? ' ' + START_LEVEL : '') + (sub() ? ' · ' + sub().name : ''));
    DH.ui.add(side, 'div', 'hr');

    const grid = DH.ui.add(side, 'div', 'statgrid');
    const stat = (k, v) => {
      const s = DH.ui.add(grid, 'div', 'stat');
      s.innerHTML = '<div class="k">' + k + '</div><div class="v">' + v + '</div>';
    };
    stat('HP', cls() ? ch.hpMax : '–');
    stat('AC', cls() ? ch.ac : '–');
    stat('SPEED', race() ? ch.speed : '–');
    stat('INIT', U.plus(ch.initBonus));

    DH.ABILITIES.forEach(ab => {
      const v = ch.abilities[ab.id];
      const rac = racialFor(ab.id);
      const e = DH.ui.add(side, 'div', 'kv');
      e.innerHTML = '<span>' + ab.short + (rac ? ' <span class="good">' + U.plus(rac) + '</span>' : '') +
        '</span><span>' + v + '  ' + U.plus(C.mod(v)) + '</span>';
    });
    if (ch.caster) {
      DH.ui.add(side, 'div', 'hr');
      const e = DH.ui.add(side, 'div', 'kv');
      e.innerHTML = '<span>Spell DC</span><span>' + ch.spellDC + '</span>';
    }
    drawPortrait(ch);
  }

  /* The creature painters draw to the shared world canvas, so render the portrait
     into a scratch corner of it and copy the pixels across. The DOM panel covers
     the canvas during creation, so nothing shows through. */
  function drawPortrait(ch) {
    if (!portraitCv) return;
    const g = DH.gfx, realCtx = g.ctx;
    const ctx = portraitCv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 96, 128);
    const keep = { x: g.cam.x, y: g.cam.y };
    g.cam.x = 0; g.cam.y = 0;
    realCtx.save();
    realCtx.setTransform(1, 0, 0, 1, 0, 0);
    realCtx.clearRect(0, 0, 100, 132);
    g.creature(C.visualFor(ch), 48, 118, { scale: 2.6, facing: 'down', weapon: C.weaponArt(ch) });
    ctx.drawImage(realCtx.canvas, 0, 0, 96, 128, 0, 0, 96, 128);
    realCtx.clearRect(0, 0, 100, 132);
    realCtx.restore();
    g.cam.x = keep.x; g.cam.y = keep.y;
  }

  /* ---------- finish ---------- */
  function finish() {
    const ch = C.create({
      name: draft.name.trim() || 'Adventurer',
      raceId: draft.raceId, ancestry: draft.ancestry,
      classId: draft.classId, subclassId: draft.subclassId,
      backgroundId: draft.backgroundId,
      abilities: draft.base,
      skills: draft.skills.concat(bg() ? bg().skills : []),
      expertise: draft.expertise,
      appearance: draft.appearance,
      fightingStyle: draft.fightingStyle,
      level: START_LEVEL
    });
    ch.flexBonus = Object.assign({}, draft.flexBonus);
    C.derive(ch);
    ch.hp = ch.hpMax;
    const st = DH.game.state;
    st.party = [ch];
    st.slot = slot;
    DH.ui.clear();
    DH.game.replace(DH.scenes.script, { script: 'prologue' });
  }

  function update(dt) { tick += dt; }
  function draw() {
    /* the DOM panel covers the canvas; only the portrait needs painting */
    if (portraitCv && DH.gfx.tick % 4 === 0) drawPortrait(preview());
  }

  return { name: 'charcreate', enter, exit, update, draw, resume: render };
})();
