/* Drakehaven Island — character construction and derived statistics.
   Everything a sheet shows is computed here from race + class + level + gear. */
window.DH = window.DH || {};

DH.char = (function () {
  'use strict';
  const U = DH.util;

  const mod = (score) => Math.floor((score - 10) / 2);
  const profFor = (level) => 2 + Math.floor((level - 1) / 4);
  const MAX_LEVEL = 10;

  const XP_TABLE = [0, 0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000];

  /* ---------------- creation ---------------- */
  function blank() {
    return {
      name: 'Adventurer',
      raceId: 'human', raceName: 'Human', ancestry: null,
      classId: 'fighter', className: 'Fighter', subclassId: null, subclassName: null,
      backgroundId: 'sailor', backgroundName: 'Sailor',
      level: 1, xp: 0,
      base: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      skills: [], expertise: [], saveProfs: [],
      profs: { armor: [], weapons: [], tools: [] },
      effects: [],
      inv: [], equipped: {},
      spells: { known: [], prepared: [], cantrips: [], slots: {}, slotsMax: {}, pactLevel: 0 },
      gold: 0,
      pod: null,
      res: {},                    // per-rest resources
      fightingStyle: null, metamagic: [], invocations: [], pactBoon: null,
      appearance: { skin: null, hair: null, cloth: '#5a4a7a', cloth2: '#3a3050', hairStyle: 'short' },
      hp: 1, hpMax: 1, tempHp: 0, hitDiceLeft: 1,
      deathSaves: { s: 0, f: 0 }, dying: false, dead: false,
      conditions: [], concentration: null,
      isPlayer: false, kind: 'pc'
    };
  }

  /** Build a fresh player character from the creator's choices. */
  function create(o) {
    const ch = blank();
    const race = DH.raceById(o.raceId) || DH.RACES[0];
    const cls = DH.classById(o.classId) || DH.CLASSES[0];
    const bg = DH.backgroundById(o.backgroundId) || DH.BACKGROUNDS[0];

    ch.name = (o.name || 'Adventurer').slice(0, 24);
    ch.raceId = race.id; ch.raceName = race.name;
    ch.ancestry = o.ancestry || null;
    ch.classId = cls.id; ch.className = cls.name;
    ch.subclassId = o.subclassId || null;
    ch.backgroundId = bg.id; ch.backgroundName = bg.name;
    ch.level = o.level || 1;
    ch.xp = XP_TABLE[ch.level] || 0;
    ch.base = Object.assign({}, o.abilities || ch.base);
    ch.skills = (o.skills || []).slice();
    ch.appearance = Object.assign(ch.appearance, o.appearance || {});
    ch.isPlayer = true;
    ch.fightingStyle = o.fightingStyle || null;
    ch.gold = (bg.gold || 10) + DH.dice.roll('4d4').total * 2;

    /* background skills, tools */
    (bg.skills || []).forEach(s => { if (ch.skills.indexOf(s) < 0) ch.skills.push(s); });
    (bg.tools || []).forEach(t => { if (ch.profs.tools.indexOf(t) < 0) ch.profs.tools.push(t); });

    /* class proficiencies */
    ch.saveProfs = (cls.saves || []).slice();
    ch.profs.armor = (cls.armor || []).slice();
    ch.profs.weapons = (cls.weapons || []).slice();

    /* starting kit */
    (cls.kit || []).forEach(id => addItem(ch, id));
    (bg.kit || []).forEach(id => addItem(ch, id));

    /* expertise picks (rogue/bard) default to the first proficient skills */
    if (o.expertise) ch.expertise = o.expertise.slice();

    /* spells chosen at creation */
    if (o.cantrips) ch.spells.cantrips = o.cantrips.slice();
    if (o.spellsKnown) ch.spells.known = o.spellsKnown.slice();
    if (o.prepared) ch.spells.prepared = o.prepared.slice();
    if (o.metamagic) ch.metamagic = o.metamagic.slice();
    if (o.invocations) ch.invocations = o.invocations.slice();
    if (o.pactBoon) ch.pactBoon = o.pactBoon;

    derive(ch);
    autoEquip(ch);
    derive(ch);
    ch.hp = ch.hpMax;
    /* prepare a sensible default spell list if the player skipped the step */
    ensureSpells(ch);
    return ch;
  }

  /* ---------------- effect gathering ---------------- */
  function gatherEffects(ch) {
    const out = [];
    const race = DH.raceById(ch.raceId);
    if (race) (race.traits || []).forEach(t => (t.effects || []).forEach(e => out.push(e)));

    const cls = DH.classById(ch.classId);
    if (cls) {
      for (let L = 1; L <= ch.level; L++) {
        (cls.features[L] || []).forEach(f => (f.effects || []).forEach(e => out.push(e)));
      }
      const sub = subclass(ch);
      if (sub) {
        Object.keys(sub.features || {}).forEach(k => {
          if (+k <= ch.level) (sub.features[k] || []).forEach(f => (f.effects || []).forEach(e => out.push(e)));
        });
      }
    }
    if (ch.fightingStyle) out.push('style:' + ch.fightingStyle);
    (ch.invocations || []).forEach(i => out.push('invocation:' + i));

    /* equipped magic items */
    Object.keys(ch.equipped || {}).forEach(slot => {
      const it = DH.item(ch.equipped[slot]);
      if (it && it.effects) it.effects.forEach(e => out.push(e));
    });
    if (ch.pod) out.push('pod');
    if (ch.podArchetype) out.push('pod_arch:' + ch.podArchetype);
    return out;
  }
  function hasEffect(ch, token) { return (ch.effects || []).indexOf(token) >= 0; }
  function effectValue(ch, prefix) {
    let total = 0;
    (ch.effects || []).forEach(e => {
      if (e.indexOf(prefix + ':') === 0) {
        const v = parseInt(e.slice(prefix.length + 1), 10);
        if (!isNaN(v)) total += v;
      }
    });
    return total;
  }
  function effectArg(ch, prefix) {
    const hit = (ch.effects || []).find(e => e.indexOf(prefix + ':') === 0);
    return hit ? hit.slice(prefix.length + 1) : null;
  }
  function subclass(ch) {
    const cls = DH.classById(ch.classId);
    if (!cls || !ch.subclassId) return null;
    return (cls.subclasses || []).find(s => s.id === ch.subclassId) || null;
  }

  /* ---------------- derivation ---------------- */
  function derive(ch) {
    const race = DH.raceById(ch.raceId);
    const cls = DH.classById(ch.classId);

    /* abilities = base + racial */
    const ab = Object.assign({}, ch.base);
    if (race) {
      Object.keys(race.bonus || {}).forEach(k => ab[k] += race.bonus[k]);
      Object.keys(race.penalty || {}).forEach(k => ab[k] += race.penalty[k]);
    }
    if (ch.flexBonus) Object.keys(ch.flexBonus).forEach(k => ab[k] += ch.flexBonus[k]);
    if (ch.asi) Object.keys(ch.asi).forEach(k => ab[k] += ch.asi[k]);
    Object.keys(ab).forEach(k => ab[k] = U.clamp(ab[k], 1, 20));
    ch.abilities = ab;

    ch.prof = profFor(ch.level);
    ch.effects = gatherEffects(ch);

    /* skills from race/subclass effects */
    (ch.effects || []).forEach(e => {
      if (e.indexOf('skill:') === 0) {
        const s = e.slice(6);
        if (ch.skills.indexOf(s) < 0) ch.skills.push(s);
      }
      if (e.indexOf('armor:') === 0) {
        const a = e.slice(6);
        if (ch.profs.armor.indexOf(a) < 0) ch.profs.armor.push(a);
      }
      if (e.indexOf('weapons:') === 0) {
        const w = e.slice(8);
        if (ch.profs.weapons.indexOf(w) < 0) ch.profs.weapons.push(w);
      }
      if (e.indexOf('tool:') === 0) {
        const t = e.slice(5);
        if (ch.profs.tools.indexOf(t) < 0) ch.profs.tools.push(t);
      }
    });

    /* hit points */
    const hd = (cls && cls.hitDie) || 8;
    ch.hitDie = hd;
    const conM = mod(ab.con);
    let hp = hd + conM;
    for (let L = 2; L <= ch.level; L++) hp += Math.floor(hd / 2) + 1 + conM;
    hp += effectValue(ch, 'hp_per_level') * ch.level;
    ch.hpMax = Math.max(1, hp);
    if (ch.hp == null || ch.hp > ch.hpMax) ch.hp = ch.hpMax;
    if (ch.hitDiceLeft == null) ch.hitDiceLeft = ch.level;

    /* speed */
    let sp = (race && race.speed) || 30;
    if (hasEffect(ch, 'speed:10') && !heavyArmorWorn(ch)) sp += 10;
    ch.speed = sp;
    ch.size = (race && race.size) || 'Medium';

    /* armor class */
    ch.ac = computeAC(ch);

    /* initiative */
    ch.initBonus = mod(ab.dex) + (hasEffect(ch, 'adv_initiative') ? 0 : 0)
      + (hasEffect(ch, 'dread_ambusher') ? mod(ab.wis) : 0);

    /* spellcasting */
    deriveSpellcasting(ch);

    /* per-rest resources */
    deriveResources(ch);

    /* P.A.C.T. pod capacity: 2 charges to start, 5 by level 9 */
    if (ch.pod) {
      const cap = ch.level >= 9 ? 5 : ch.level >= 7 ? 4 : ch.level >= 4 ? 3 : 2;
      ch.pod.max = cap;
      if (ch.pod.charges == null) ch.pod.charges = cap;
      ch.pod.charges = Math.min(ch.pod.charges, cap);
    }
    return ch;
  }

  function heavyArmorWorn(ch) {
    const a = DH.item(ch.equipped.armor);
    return !!(a && a.armorKind === 'heavy');
  }
  function armorWorn(ch) { return !!DH.item(ch.equipped.armor); }

  function computeAC(ch) {
    const ab = ch.abilities, dexM = mod(ab.dex);
    const armor = DH.item(ch.equipped.armor);
    let ac;
    if (armor) {
      const cap = armor.dexCap == null ? 99 : armor.dexCap;
      ac = armor.ac + Math.min(dexM, cap);
    } else {
      const ud = effectArg(ch, 'unarmored_defense');
      if (ud === 'con') ac = 10 + dexM + mod(ab.con);
      else if (ud === 'wis' && !ch.equipped.shield) ac = 10 + dexM + mod(ab.wis);
      else if (hasEffect(ch, 'draconic_ac')) ac = 13 + dexM;
      else ac = 10 + dexM;
    }
    const shield = DH.item(ch.equipped.shield);
    if (shield && shield.acBonus) ac += shield.acBonus;
    if (hasEffect(ch, 'style:defense') && armor) ac += 1;
    ac += effectValue(ch, 'ac');
    return ac;
  }

  function casterInfo(ch) {
    const cls = DH.classById(ch.classId);
    if (!cls) return null;
    const sub = subclass(ch);
    if (sub && sub.caster) return sub.caster;
    return cls.caster || null;
  }

  function deriveSpellcasting(ch) {
    const ci = casterInfo(ch);
    ch.caster = ci;
    if (!ci) { ch.spells.slotsMax = {}; ch.spellDC = null; return; }
    const abMod = mod(ch.abilities[ci.ability]);
    ch.spellAbility = ci.ability;
    ch.spellDC = 8 + ch.prof + abMod;
    ch.spellAtk = ch.prof + abMod;

    /* effective caster level for the slot table */
    let eff = ch.level;
    if (ci.type === 'half') eff = ch.level;          // table already accounts
    if (ci.type === 'third') eff = ch.level;
    const table = DH.SLOTS[ci.type] || DH.SLOTS.full;
    const row = table[Math.min(eff, MAX_LEVEL)] || {};
    if (ci.type === 'pact') {
      ch.spells.slotsMax = {}; ch.spells.pactLevel = row.lv || 0;
      if (row.n) ch.spells.slotsMax[row.lv] = row.n;
    } else {
      ch.spells.slotsMax = Object.assign({}, row);
    }
    /* current slots default to full */
    Object.keys(ch.spells.slotsMax).forEach(k => {
      if (ch.spells.slots[k] == null) ch.spells.slots[k] = ch.spells.slotsMax[k];
      ch.spells.slots[k] = Math.min(ch.spells.slots[k], ch.spells.slotsMax[k]);
    });
    Object.keys(ch.spells.slots).forEach(k => {
      if (ch.spells.slotsMax[k] == null) delete ch.spells.slots[k];
    });

    /* how many cantrips and spells */
    const cl = ci.cantrips || DH.CANTRIPS[ch.classId];
    ch.cantripCount = cl ? (cl[Math.min(ch.level, MAX_LEVEL)] || 0) : 0;
    if (ci.known) ch.spellsKnownCount = ci.known[Math.min(ch.level, MAX_LEVEL)] || 0;
    else ch.spellsKnownCount = null;      // prepared caster
    if (ci.prepares) {
      const base = ci.type === 'half' ? Math.floor(ch.level / 2) : ch.level;
      ch.preparedCount = Math.max(1, mod(ch.abilities[ci.ability]) + base);
    } else ch.preparedCount = null;
    ch.maxSpellLevel = maxSpellLevel(ch);
  }

  function maxSpellLevel(ch) {
    if (!ch.caster) return 0;
    if (ch.caster.type === 'pact') return ch.spells.pactLevel || 0;
    let m = 0;
    Object.keys(ch.spells.slotsMax).forEach(k => { m = Math.max(m, +k); });
    return m;
  }

  function deriveResources(ch) {
    const r = ch.res || (ch.res = {});
    const ab = ch.abilities;
    const set = (k, max) => {
      if (max <= 0) { delete r[k]; return; }
      if (!r[k]) r[k] = { cur: max, max: max };
      else { r[k].max = max; r[k].cur = Math.min(r[k].cur, max); }
    };
    if (hasEffect(ch, 'rage')) set('rage', ch.level >= 6 ? 4 : ch.level >= 3 ? 3 : 2);
    if (hasEffect(ch, 'ki')) set('ki', ch.level);
    if (hasEffect(ch, 'second_wind')) set('second_wind', 1);
    if (hasEffect(ch, 'action_surge')) set('action_surge', 1);
    if (hasEffect(ch, 'bardic_inspiration')) set('inspiration', Math.max(1, mod(ab.cha)));
    if (hasEffect(ch, 'lay_on_hands')) set('lay_on_hands', ch.level * 5);
    if (hasEffect(ch, 'divine_sense')) set('divine_sense', 1 + mod(ab.cha));
    if (hasEffect(ch, 'channel_divinity:1')) set('channel_divinity', ch.level >= 6 ? 2 : 1);
    if (hasEffect(ch, 'wild_shape')) set('wild_shape', 2);
    if (hasEffect(ch, 'sorcery_points')) set('sorcery', ch.level);
    if (hasEffect(ch, 'arcane_recovery')) set('arcane_recovery', 1);
    if (hasEffect(ch, 'superiority:4')) set('superiority', 4);
    if (hasEffect(ch, 'feline_agility')) set('feline_agility', 1);
    if (hasEffect(ch, 'breath')) set('breath', 1);
    if (hasEffect(ch, 'relentless')) set('relentless', 1);
    if (hasEffect(ch, 'indomitable:1')) set('indomitable', 1);
    if (hasEffect(ch, 'war_priest')) set('war_priest', Math.max(1, mod(ab.wis)));
    if (hasEffect(ch, 'warding_flare')) set('warding_flare', Math.max(1, mod(ab.wis)));
    if (hasEffect(ch, 'wrath_of_storm')) set('wrath_of_storm', Math.max(1, mod(ab.wis)));
    if (hasEffect(ch, 'portent')) set('portent', 2);
    if (hasEffect(ch, 'fey_presence')) set('fey_presence', 1);
    if (hasEffect(ch, 'tides_of_chaos')) set('tides_of_chaos', 1);
    if (hasEffect(ch, 'divine_intervention')) set('divine_intervention', 1);
  }

  /* ---------------- modifiers ---------------- */
  function abMod(ch, ab) { return mod(ch.abilities[ab]); }
  function saveMod(ch, ab) {
    let m = mod(ch.abilities[ab]);
    if ((ch.saveProfs || []).indexOf(ab) >= 0) m += ch.prof;
    m += effectValue(ch, 'saves');
    if (hasEffect(ch, 'aura_protection')) m += mod(ch.abilities.cha);
    return m;
  }
  function skillMod(ch, skill) {
    const info = DH.SKILLS[skill];
    if (!info) return 0;
    let m = mod(ch.abilities[info.ab]);
    if ((ch.expertise || []).indexOf(skill) >= 0) m += ch.prof * 2;
    else if ((ch.skills || []).indexOf(skill) >= 0) m += ch.prof;
    else if (hasEffect(ch, 'jack_of_all_trades')) m += Math.floor(ch.prof / 2);
    return m;
  }
  function passive(ch, skill) { return 10 + skillMod(ch, skill); }
  function isProficient(ch, skill) {
    return (ch.skills || []).indexOf(skill) >= 0 || (ch.expertise || []).indexOf(skill) >= 0;
  }

  /* Advantage sources the engine knows about, given a tag describing the test. */
  function advantageFor(ch, tag) {
    if (!tag) return false;
    if (tag === 'vs_charmed' && hasEffect(ch, 'adv_vs_charmed')) return true;
    if (tag === 'vs_poison' && hasEffect(ch, 'adv_vs_poison')) return true;
    if (tag === 'vs_frightened' && hasEffect(ch, 'adv_vs_frightened')) return true;
    if (tag === 'vs_gas' && hasEffect(ch, 'adv_vs_gas')) return true;
    if (tag === 'stealth' && hasEffect(ch, 'adv_stealth')) return true;
    if (tag === 'initiative' && hasEffect(ch, 'adv_initiative')) return true;
    return false;
  }

  /* ---------------- damage & healing ---------------- */
  function resistances(ch) {
    const out = { resist: [], immune: [], vuln: [] };
    (ch.effects || []).forEach(e => {
      if (e.indexOf('resist:') === 0) out.resist.push(e.slice(7));
      if (e.indexOf('immune:') === 0) out.immune.push(e.slice(7));
      if (e.indexOf('vuln:') === 0) out.vuln.push(e.slice(5));
    });
    if (ch.ancestry) {
      const race = DH.raceById(ch.raceId);
      const anc = race && (race.ancestries || []).find(a => a.id === ch.ancestry);
      if (anc && hasEffect(ch, 'draconic_resist')) out.resist.push(anc.dmg);
    }
    if (hasCondition(ch, 'raging') && !hasEffect(ch, 'bear_totem')) {
      out.resist.push('bludgeoning', 'piercing', 'slashing');
    }
    if (hasCondition(ch, 'raging') && hasEffect(ch, 'bear_totem')) {
      ['bludgeoning', 'piercing', 'slashing', 'fire', 'cold', 'acid', 'lightning', 'thunder', 'poison', 'necrotic', 'radiant', 'force'].forEach(t => out.resist.push(t));
    }
    (ch.runtimeResist || []).forEach(t => out.resist.push(t));
    return out;
  }

  function applyDamage(ch, amount, type, opts) {
    opts = opts || {};
    const R = resistances(ch);
    let dmg = Math.max(0, Math.floor(amount));
    if (type && R.immune.indexOf(type) >= 0) dmg = 0;
    else if (type && R.resist.indexOf(type) >= 0) dmg = Math.floor(dmg / 2);
    else if (type && R.vuln.indexOf(type) >= 0) dmg = dmg * 2;
    if (opts.halve) dmg = Math.floor(dmg / 2);

    /* temporary hit points soak first */
    if (ch.tempHp > 0) {
      const soak = Math.min(ch.tempHp, dmg);
      ch.tempHp -= soak; dmg -= soak;
    }
    ch.hp -= dmg;
    const out = { dealt: dmg, dropped: false, killed: false };

    if (ch.hp <= 0) {
      const over = -ch.hp;
      ch.hp = 0;
      /* Relentless Endurance / Death Ward */
      if (ch.res && ch.res.relentless && ch.res.relentless.cur > 0 && !opts.noSave) {
        ch.res.relentless.cur--; ch.hp = 1;
        out.relentless = true;
      } else if (ch.deathWard) {
        ch.deathWard = false; ch.hp = 1; out.deathWard = true;
      } else if (over >= ch.hpMax || opts.instantKill) {
        ch.dead = true; ch.dying = false; out.killed = true;
      } else {
        ch.dying = true; out.dropped = true;
        addCondition(ch, 'unconscious');
        removeCondition(ch, 'concentrating');
        ch.concentration = null;
      }
    }
    /* concentration check */
    if (dmg > 0 && ch.concentration) {
      const dc = Math.max(10, Math.floor(dmg / 2));
      const r = DH.dice.d20({ mod: saveMod(ch, 'con'), dc: dc });
      if (!r.success) { out.lostConcentration = ch.concentration; ch.concentration = null; removeCondition(ch, 'concentrating'); }
      else out.keptConcentration = true;
    }
    return out;
  }

  function heal(ch, amount) {
    if (ch.dead) return 0;
    const before = ch.hp;
    ch.hp = Math.min(ch.hpMax, ch.hp + Math.max(0, Math.floor(amount)));
    if (ch.hp > 0 && ch.dying) {
      ch.dying = false; ch.deathSaves = { s: 0, f: 0 };
      removeCondition(ch, 'unconscious');
    }
    return ch.hp - before;
  }
  function addTempHp(ch, amount) { ch.tempHp = Math.max(ch.tempHp || 0, Math.floor(amount)); }

  /* ---------------- conditions ---------------- */
  function addCondition(ch, id, rounds, source) {
    ch.conditions = ch.conditions || [];
    const ex = ch.conditions.find(c => c.id === id);
    if (ex) { if (rounds != null) ex.rounds = Math.max(ex.rounds || 0, rounds); return ex; }
    const c = { id: id, rounds: rounds == null ? -1 : rounds, source: source || null };
    ch.conditions.push(c);
    return c;
  }
  function removeCondition(ch, id) {
    if (!ch.conditions) return;
    ch.conditions = ch.conditions.filter(c => c.id !== id);
  }
  function hasCondition(ch, id) {
    return !!(ch.conditions || []).find(c => c.id === id);
  }
  function tickConditions(ch) {
    if (!ch.conditions) return;
    ch.conditions.forEach(c => { if (c.rounds > 0) c.rounds--; });
    ch.conditions = ch.conditions.filter(c => c.rounds !== 0);
  }
  function incapacitated(ch) {
    return ch.dead || ch.dying || hasCondition(ch, 'unconscious') ||
      hasCondition(ch, 'paralyzed') || hasCondition(ch, 'stunned') ||
      hasCondition(ch, 'incapacitated') || hasCondition(ch, 'charmed_incapacitated');
  }

  /* Death saves — house rule: dying for good costs a level. */
  function deathSave(ch) {
    const r = DH.dice.d20({ dc: 10, label: 'Death Saving Throw' });
    if (r.natural === 20) { heal(ch, 1); ch.deathSaves = { s: 0, f: 0 }; return { r, stabilised: true, revived: true }; }
    if (r.natural === 1) ch.deathSaves.f += 2;
    else if (r.success) ch.deathSaves.s += 1;
    else ch.deathSaves.f += 1;
    if (ch.deathSaves.s >= 3) { ch.dying = false; ch.stable = true; return { r, stabilised: true }; }
    if (ch.deathSaves.f >= 3) { ch.dead = true; ch.dying = false; return { r, died: true }; }
    return { r };
  }

  /* ---------------- inventory ---------------- */
  function addItem(ch, id, qty) {
    const it = DH.item(id);
    if (!it) return null;
    qty = qty || 1;
    if (it.kind === 'pack' && it.contains) {
      it.contains.forEach(c => addItem(ch, c, 1));
      return null;
    }
    const stackable = it.stack || it.kind === 'potion' || it.kind === 'food' ||
      it.kind === 'material' || it.kind === 'ammo' || it.kind === 'gem' || it.kind === 'poison';
    if (stackable) {
      const ex = ch.inv.find(s => s.id === id);
      if (ex) { ex.qty += qty; return ex; }
    }
    const slot = { id: id, qty: qty };
    if (it.charges) slot.charges = it.charges;
    ch.inv.push(slot);
    return slot;
  }
  function removeItem(ch, id, qty) {
    qty = qty || 1;
    const i = ch.inv.findIndex(s => s.id === id);
    if (i < 0) return false;
    ch.inv[i].qty -= qty;
    if (ch.inv[i].qty <= 0) {
      /* unequip if it was worn */
      Object.keys(ch.equipped).forEach(k => { if (ch.equipped[k] === id) delete ch.equipped[k]; });
      ch.inv.splice(i, 1);
    }
    return true;
  }
  function countItem(ch, id) {
    const s = ch.inv.find(x => x.id === id);
    return s ? s.qty : 0;
  }
  function hasItem(ch, id) { return countItem(ch, id) > 0; }

  function slotFor(it) {
    if (!it) return null;
    if (it.kind === 'armor') return it.armorKind === 'shield' ? 'shield' : 'armor';
    if (it.kind === 'weapon') return it.slot || 'mainHand';
    return it.slot || null;
  }
  function canEquip(ch, id) {
    const it = DH.item(id);
    if (!it) return false;
    if (it.kind === 'armor' && it.armorKind !== 'shield') {
      return ch.profs.armor.indexOf(it.armorKind) >= 0 || ch.classId === 'barbarian';
    }
    if (it.kind === 'armor' && it.armorKind === 'shield') return ch.profs.armor.indexOf('shields') >= 0;
    return true;
  }
  function equip(ch, id) {
    const it = DH.item(id);
    if (!it) return false;
    const slot = slotFor(it);
    if (!slot) return false;
    ch.equipped[slot] = id;
    /* two-handed weapons drop the shield */
    if (it.props && it.props.indexOf('two_handed') >= 0) delete ch.equipped.shield;
    derive(ch);
    return true;
  }
  function unequip(ch, slot) { delete ch.equipped[slot]; derive(ch); }
  function autoEquip(ch) {
    /* best armor we can use, best weapon for our primary stat */
    const armors = ch.inv.map(s => DH.item(s.id)).filter(i => i && i.kind === 'armor' && i.armorKind !== 'shield' && canEquip(ch, i.id));
    armors.sort((a, b) => b.ac - a.ac);
    if (armors[0]) equip(ch, armors[0].id);
    const shield = ch.inv.map(s => DH.item(s.id)).find(i => i && i.armorKind === 'shield');
    if (shield && canEquip(ch, shield.id)) equip(ch, shield.id);
    const weapons = ch.inv.map(s => DH.item(s.id)).filter(i => i && i.kind === 'weapon' && i.cat !== 'natural');
    weapons.sort((a, b) => DH.dice.avg(b.dmg) - DH.dice.avg(a.dmg));
    /* a monk keeps their fists free */
    if (ch.classId === 'monk') { /* leave unarmed */ }
    else if (weapons[0]) {
      const two = weapons[0].props && weapons[0].props.indexOf('two_handed') >= 0;
      if (two && ch.equipped.shield) {
        const oneH = weapons.find(w => !(w.props && w.props.indexOf('two_handed') >= 0));
        equip(ch, (oneH || weapons[0]).id);
      } else equip(ch, weapons[0].id);
    }
  }

  /* ---------------- weapons & attacks ---------------- */
  function weaponAbility(ch, it) {
    if (!it) return 'str';
    const finesse = it.props && it.props.indexOf('finesse') >= 0;
    if (it.ranged) return 'dex';
    if (it.cat === 'natural' && hasEffect(ch, 'martial_arts')) return mod(ch.abilities.dex) > mod(ch.abilities.str) ? 'dex' : 'str';
    if (finesse) return mod(ch.abilities.dex) > mod(ch.abilities.str) ? 'dex' : 'str';
    return 'str';
  }
  function proficientWith(ch, it) {
    if (!it) return false;
    if (it.cat === 'natural') return true;
    const w = ch.profs.weapons || [];
    if (w.indexOf(it.cat) >= 0) return true;
    if (w.indexOf(it.id) >= 0) return true;
    return false;
  }
  function martialArtsDie(ch) {
    const L = ch.level;
    return L >= 11 ? '1d8' : L >= 5 ? '1d6' : '1d4';
  }
  /** Every attack the character can make, as UI-ready options. */
  function attacks(ch) {
    const out = [];
    const push = (it, tag) => {
      if (!it) return;
      const ab = weaponAbility(ch, it);
      let atk = mod(ch.abilities[ab]) + (proficientWith(ch, it) ? ch.prof : 0);
      let dmgDie = it.dmg;
      if (it.cat === 'natural' && hasEffect(ch, 'martial_arts')) dmgDie = martialArtsDie(ch);
      if (it.id === 'unarmed' && hasEffect(ch, 'claws')) dmgDie = '1d4';
      if (it.id === 'unarmed' && hasEffect(ch, 'horns')) dmgDie = '1d6';
      let dmgMod = mod(ch.abilities[ab]);
      if (hasEffect(ch, 'style:archery') && it.ranged) atk += 2;
      if (hasEffect(ch, 'style:dueling') && !it.ranged && !(it.props || []).includes('two_handed') && !ch.equipped.offHand) dmgMod += 2;
      const magic = effectValue(ch, 'weapon_plus');
      atk += magic; dmgMod += magic;
      out.push({
        kind: 'weapon', id: it.id, name: it.name, tag: tag || null,
        atk: atk, dmg: dmgDie, dmgMod: dmgMod, type: it.type,
        reach: it.ranged ? null : ((it.props || []).includes('reach') ? 10 : 5),
        range: it.ranged || (it.props || []).includes('thrown') ? (it.range || [20, 60]) : null,
        props: it.props || [], art: it.art, ranged: !!it.ranged,
        count: 1 + effectValue(ch, 'extra_attack')
      });
    };
    const mh = DH.item(ch.equipped.mainHand);
    if (mh) push(mh);
    const oh = DH.item(ch.equipped.offHand);
    if (oh) push(oh, 'off-hand');
    const brass = DH.item(ch.equipped.hands);
    if (brass && brass.kind === 'weapon') push(brass);
    /* natural attacks */
    if (!mh || hasEffect(ch, 'martial_arts')) push(DH.item('unarmed'));
    if (hasEffect(ch, 'horns')) push(DH.item('horns'));
    if (hasEffect(ch, 'claws') && !hasEffect(ch, 'martial_arts')) push(DH.item('claws'));
    return out;
  }

  /* Bonus damage riders that apply on any hit. */
  function bonusDamage(ch) {
    const out = [];
    (ch.effects || []).forEach(e => {
      if (e.indexOf('attack_bonus_dmg:') === 0) {
        const p = e.split(':');
        out.push({ dmg: p[1], type: p[2] || 'necrotic', src: 'Crown of the Pale King' });
      }
      if (e.indexOf('unarmed_bonus:') === 0) out.push({ dmg: e.split(':')[1], type: 'bludgeoning', unarmedOnly: true, src: 'Blue Brass Knuckles' });
    });
    if (hasCondition(ch, 'raging')) out.push({ flat: ch.level >= 9 ? 3 : ch.level >= 3 ? 3 : 2, type: null, strOnly: true, src: 'Rage' });
    if (hasCondition(ch, 'enlarged')) out.push({ dmg: '1d4', type: null, src: 'Enlarged' });
    if (hasCondition(ch, 'reduced')) out.push({ dmg: '-1d4', type: null, src: 'Reduced' });
    if (ch.buffs) {
      Object.keys(ch.buffs).forEach(k => {
        const b = ch.buffs[k];
        if (b && b.weaponDmg) out.push({ dmg: b.weaponDmg, type: b.weaponType || null, src: k });
        if (b && b.unarmedBonus) out.push({ dmg: b.unarmedBonus, type: 'bludgeoning', unarmedOnly: true, src: k });
      });
    }
    return out;
  }

  function sneakAttackDice(ch) {
    if (!hasEffect(ch, 'sneak_attack')) return 0;
    return Math.ceil(ch.level / 2);
  }
  function critRange(ch) { return hasEffect(ch, 'crit_range:19') ? 19 : 20; }

  /* ---------------- spells ---------------- */
  function knownSpells(ch) {
    if (!ch.caster) return [];
    const list = (ch.spells.cantrips || []).concat(ch.caster.prepares ? (ch.spells.prepared || []) : (ch.spells.known || []));
    return list.map(id => DH.spellById(id)).filter(Boolean);
  }
  function castableSpells(ch) {
    return knownSpells(ch).filter(s => {
      if (s.lv === 0) return true;
      if (ch.caster.type === 'pact') return (ch.spells.slots[ch.spells.pactLevel] || 0) > 0 && s.lv <= ch.spells.pactLevel;
      for (let L = s.lv; L <= 9; L++) if ((ch.spells.slots[L] || 0) > 0) return true;
      return false;
    });
  }
  function spendSlot(ch, level) {
    if (level === 0) return true;
    if (ch.caster && ch.caster.type === 'pact') {
      const pl = ch.spells.pactLevel;
      if ((ch.spells.slots[pl] || 0) > 0) { ch.spells.slots[pl]--; return pl; }
      return false;
    }
    for (let L = level; L <= 9; L++) {
      if ((ch.spells.slots[L] || 0) > 0) { ch.spells.slots[L]--; return L; }
    }
    return false;
  }
  function slotsAvailable(ch) {
    const out = [];
    Object.keys(ch.spells.slotsMax).forEach(k => {
      out.push({ level: +k, cur: ch.spells.slots[k] || 0, max: ch.spells.slotsMax[k] });
    });
    out.sort((a, b) => a.level - b.level);
    return out;
  }
  /* If the player skipped spell selection, give them a solid default. */
  function ensureSpells(ch) {
    if (!ch.caster) return;
    const code = DH.LIST_CODE[ch.classId] || (ch.caster.list ? DH.LIST_CODE[ch.caster.list] : null) || 'w';
    const pool = DH.spellsFor(code, ch.maxSpellLevel);
    const cantrips = pool.filter(s => s.lv === 0);
    const leveled = pool.filter(s => s.lv > 0);
    while ((ch.spells.cantrips || []).length < (ch.cantripCount || 0) && cantrips.length) {
      const pickable = cantrips.filter(s => ch.spells.cantrips.indexOf(s.id) < 0);
      if (!pickable.length) break;
      pickable.sort((a, b) => (b.dmg ? 1 : 0) - (a.dmg ? 1 : 0));
      ch.spells.cantrips.push(pickable[0].id);
    }
    const target = ch.caster.prepares ? ch.preparedCount : ch.spellsKnownCount;
    const bucket = ch.caster.prepares ? 'prepared' : 'known';
    while (target && (ch.spells[bucket] || []).length < target && leveled.length) {
      const pickable = leveled.filter(s => ch.spells[bucket].indexOf(s.id) < 0);
      if (!pickable.length) break;
      pickable.sort((a, b) => (b.ai || 1) - (a.ai || 1));
      ch.spells[bucket].push(pickable[0].id);
    }
    if (ch.caster.prepares && ch.caster.spellbook) {
      ch.spells.known = (ch.spells.known || []).slice();
      ch.spells.prepared.forEach(id => { if (ch.spells.known.indexOf(id) < 0) ch.spells.known.push(id); });
    }
  }

  /* ---------------- rests ---------------- */
  function shortRest(ch) {
    const notes = [];
    /* spend hit dice */
    let healed = 0;
    while (ch.hitDiceLeft > 0 && ch.hp < ch.hpMax) {
      ch.hitDiceLeft--;
      const r = DH.dice.roll('1d' + ch.hitDie);
      healed += heal(ch, r.total + abMod(ch, 'con'));
      if (ch.hp >= ch.hpMax) break;
    }
    if (healed) notes.push('recovered ' + healed + ' hit points');
    /* short-rest resources */
    const shortKeys = ['ki', 'second_wind', 'action_surge', 'channel_divinity', 'wild_shape',
      'superiority', 'warding_flare', 'wrath_of_storm', 'war_priest', 'breath', 'fey_presence'];
    if (hasEffect(ch, 'font_of_inspiration')) shortKeys.push('inspiration');
    shortKeys.forEach(k => { if (ch.res[k]) ch.res[k].cur = ch.res[k].max; });
    if (ch.caster && ch.caster.type === 'pact') {
      Object.keys(ch.spells.slotsMax).forEach(k => ch.spells.slots[k] = ch.spells.slotsMax[k]);
      notes.push('pact slots restored');
    }
    if (hasEffect(ch, 'arcane_recovery') && ch.res.arcane_recovery && ch.res.arcane_recovery.cur > 0) {
      ch.res.arcane_recovery.cur--;
      let budget = Math.ceil(ch.level / 2);
      for (let L = 1; L <= 5 && budget > 0; L++) {
        while (budget >= L && (ch.spells.slots[L] || 0) < (ch.spells.slotsMax[L] || 0)) {
          ch.spells.slots[L]++; budget -= L;
        }
      }
      notes.push('arcane recovery');
    }
    /* item charges that come back on a short rest */
    ch.inv.forEach(s => {
      const it = DH.item(s.id);
      if (it && it.recharge === 'short' && it.charges) s.charges = it.charges;
    });
    ch.conditions = (ch.conditions || []).filter(c => ['exhaustion'].indexOf(c.id) >= 0);
    return notes;
  }

  function longRest(ch) {
    ch.hp = ch.hpMax;
    ch.tempHp = 0;
    ch.hitDiceLeft = Math.max(1, Math.ceil(ch.level / 2)) === ch.level ? ch.level : ch.level;
    ch.dying = false; ch.deathSaves = { s: 0, f: 0 }; ch.stable = false;
    Object.keys(ch.res).forEach(k => ch.res[k].cur = ch.res[k].max);
    Object.keys(ch.spells.slotsMax).forEach(k => ch.spells.slots[k] = ch.spells.slotsMax[k]);
    ch.conditions = [];
    ch.concentration = null;
    ch.buffs = {};
    ch.runtimeResist = [];
    ch.inv.forEach(s => {
      const it = DH.item(s.id);
      if (it && it.charges) s.charges = it.charges;
    });
    if (ch.pod) ch.pod.charges = Math.min(ch.pod.max, (ch.pod.charges || 0) + 4);
    return true;
  }

  /* ---------------- advancement ---------------- */
  function xpForLevel(L) { return XP_TABLE[Math.min(L, MAX_LEVEL)] || 0; }
  function gainXp(ch, amount) {
    if (ch.level >= MAX_LEVEL) { ch.xp += amount; return false; }
    ch.xp += amount;
    let levelled = false;
    while (ch.level < MAX_LEVEL && ch.xp >= xpForLevel(ch.level + 1)) {
      ch.level++; levelled = true;
      ch.hitDiceLeft = ch.level;
    }
    if (levelled) { derive(ch); ensureSpells(ch); ch.hp = ch.hpMax; }
    return levelled;
  }
  /* House rule: dying for real costs one character level. */
  function loseLevel(ch) {
    if (ch.level > 1) {
      ch.level--;
      ch.xp = xpForLevel(ch.level);
      derive(ch);
    }
    ch.dead = false; ch.dying = false; ch.deathSaves = { s: 0, f: 0 };
    ch.hp = Math.max(1, Math.floor(ch.hpMax / 2));
    return ch;
  }
  function newFeaturesAt(ch, level) {
    const cls = DH.classById(ch.classId);
    const out = (cls.features[level] || []).slice();
    const sub = subclass(ch);
    if (sub && sub.features && sub.features[level]) out.push.apply(out, sub.features[level]);
    return out;
  }
  function needsSubclassAt(ch) {
    const cls = DH.classById(ch.classId);
    if (!cls) return false;
    for (let L = 1; L <= ch.level; L++) {
      if ((cls.features[L] || []).some(f => f.subclass)) return !ch.subclassId;
    }
    return false;
  }
  function subclassLevel(cls) {
    for (let L = 1; L <= 10; L++) if ((cls.features[L] || []).some(f => f.subclass)) return L;
    return 3;
  }

  /* ---------------- companions ---------------- */
  function fromCompanion(c) {
    const ch = blank();
    Object.assign(ch, {
      name: c.name, companionId: c.id, kind: 'pc', isPlayer: false,
      raceName: c.raceName, className: c.className, subclassName: c.subclassName,
      level: c.level, base: Object.assign({}, c.abilities), abilities: Object.assign({}, c.abilities),
      hpMax: c.hp, hp: c.hp, ac: c.ac, speed: c.speed,
      prof: profFor(c.level), skills: (c.skills || []).slice(),
      effects: (c.features || []).slice(),
      visual: c.visual, scale: c.scale || 1, ai: c.ai || { prefer: 'melee' },
      npcActions: (c.actions || []).slice(),
      blurb: c.blurb, intro: c.intro,
      hitDie: c.hitDie || 8, hitDiceLeft: c.level,
      spellList: c.spells || null,
      res: {}
    });
    if (c.ki) ch.res.ki = { cur: c.ki, max: c.ki };
    if (c.superiority) ch.res.superiority = { cur: c.superiority, max: c.superiority };
    if (c.slots) { ch.spells.slots = Object.assign({}, c.slots); ch.spells.slotsMax = Object.assign({}, c.slots); }
    if (c.spells) ch.spells.known = c.spells.slice();
    if (c.weapon) ch.equipped.mainHand = c.weapon;
    if (c.shield) ch.equipped.shield = 'shield';
    ch.art = c.art;
    (c.actions || []).forEach(a => { if (a.uses) { ch.res['act_' + a.name] = { cur: a.uses, max: a.uses }; } });
    return ch;
  }

  /* Visual spec for rendering any character. */
  function visualFor(ch) {
    if (ch.visual) return ch.visual;
    const race = DH.raceById(ch.raceId);
    const spec = DH.raceLook(race || DH.RACES[0], ch.appearance || {});
    if (ch.ancestry && race && race.ancestries) {
      const anc = race.ancestries.find(a => a.id === ch.ancestry);
      if (anc) { spec.skin = anc.col; spec.scales = anc.col; }
    }
    const armor = DH.item(ch.equipped && ch.equipped.armor);
    if (armor) {
      spec.armor = armor.armorKind === 'heavy' ? '#8a92a2'
        : armor.armorKind === 'medium' ? '#7d8798' : '#6a5a3a';
    }
    return spec;
  }
  /* What a character is drawn holding. The equipped weapon wins, but the
     fallback has to suit the class: a monk fights empty-handed and should not be
     drawn brandishing a pair of fists like a prop, a warlock or sorcerer never
     carries a bow, and a bard carries an instrument rather than a longsword. */
  const CLASS_HELD = {
    monk: 'none', sorcerer: 'staff', warlock: 'staff', wizard: 'staff',
    bard: 'lute', druid: 'staff', cleric: 'mace', paladin: 'sword',
    fighter: 'sword', barbarian: 'axe', ranger: 'bow', rogue: 'dagger'
  };
  function weaponArt(ch) {
    if (ch.art) return ch.art;
    const mh = DH.item(ch.equipped && ch.equipped.mainHand);
    if (mh && mh.art) return mh.art;
    return CLASS_HELD[ch.classId] || 'none';
  }

  /* Short label for the UI. */
  function label(ch) {
    return ch.name + ' — ' + (ch.raceName || '') + ' ' + (ch.className || '') + ' ' + ch.level;
  }

  return {
    mod, profFor, MAX_LEVEL, XP_TABLE,
    blank, create, derive, subclass, casterInfo,
    hasEffect, effectValue, effectArg, gatherEffects,
    abMod, saveMod, skillMod, passive, isProficient, advantageFor, computeAC,
    resistances, applyDamage, heal, addTempHp,
    addCondition, removeCondition, hasCondition, tickConditions, incapacitated, deathSave,
    addItem, removeItem, countItem, hasItem, equip, unequip, canEquip, autoEquip, slotFor,
    attacks, bonusDamage, sneakAttackDice, critRange, weaponAbility, proficientWith, martialArtsDie,
    knownSpells, castableSpells, spendSlot, slotsAvailable, ensureSpells, maxSpellLevel,
    shortRest, longRest, gainXp, xpForLevel, loseLevel, newFeaturesAt, needsSubclassAt, subclassLevel,
    fromCompanion, visualFor, weaponArt, label
  };
})();
