/* Drakehaven Island — dice and the d20 test engine.
   Every roll returns a structured result so the UI can show the maths. */
window.DH = window.DH || {};

DH.dice = (function () {
  'use strict';
  const U = DH.util;

  /** Roll one die. */
  function d(sides) { return U.rint(1, sides); }

  /** Roll n dice of s sides, returns {rolls, total}. */
  function nd(n, s) {
    const rolls = [];
    for (let i = 0; i < n; i++) rolls.push(d(s));
    return { rolls, total: U.sum(rolls) };
  }

  /** Parse and roll dice expressions: "2d6+3", "d20", "4d6dl1", "1d8-1", "3".
      opts.crit doubles the dice (not the flat modifier).
      opts.min raises each die (Great Weapon Fighting style rerolls handled separately). */
  function roll(expr, opts) {
    opts = opts || {};
    const out = { expr: String(expr), rolls: [], flat: 0, total: 0, parts: [] };
    const terms = String(expr).replace(/\s+/g, '').replace(/-/g, '+-').split('+').filter(Boolean);
    for (const term of terms) {
      const neg = term[0] === '-';
      const body = neg ? term.slice(1) : term;
      const m = /^(\d*)d(\d+)(?:dl(\d+))?$/i.exec(body);
      if (m) {
        let n = m[1] === '' ? 1 : parseInt(m[1], 10);
        const s = parseInt(m[2], 10);
        const dropLowest = m[3] ? parseInt(m[3], 10) : 0;
        if (opts.crit) n *= 2;
        let rolls = [];
        for (let i = 0; i < n; i++) {
          let r = d(s);
          if (opts.rerollBelow && r <= opts.rerollBelow) r = d(s);   // GWF
          rolls.push(r);
        }
        if (dropLowest) {
          rolls = rolls.slice().sort((a, b) => a - b);
          const dropped = rolls.splice(0, dropLowest);
          out.dropped = (out.dropped || []).concat(dropped);
        }
        const t = U.sum(rolls) * (neg ? -1 : 1);
        out.rolls = out.rolls.concat(rolls);
        out.parts.push({ die: s, n, rolls, neg });
        out.total += t;
      } else {
        const v = parseInt(body, 10);
        if (!isNaN(v)) { const t = neg ? -v : v; out.flat += t; out.total += t; }
      }
    }
    if (opts.floorOne && out.total < 1) out.total = 1;
    return out;
  }

  /** Average of an expression, for AI and shop valuation. */
  function avg(expr) {
    let t = 0;
    const terms = String(expr).replace(/\s+/g, '').replace(/-/g, '+-').split('+').filter(Boolean);
    for (const term of terms) {
      const neg = term[0] === '-'; const body = neg ? term.slice(1) : term;
      const m = /^(\d*)d(\d+)/i.exec(body);
      if (m) {
        const n = m[1] === '' ? 1 : parseInt(m[1], 10), s = parseInt(m[2], 10);
        t += (neg ? -1 : 1) * n * (s + 1) / 2;
      } else { const v = parseInt(body, 10); if (!isNaN(v)) t += neg ? -v : v; }
    }
    return t;
  }

  /** The one true d20 test.
      opts: {mod, adv, dis, dc, bonusDice:'1d4', label, luckyMin}
      Advantage and disadvantage cancel out, as at the table. */
  function d20(opts) {
    opts = opts || {};
    let adv = !!opts.adv, dis = !!opts.dis;
    if (adv && dis) { adv = dis = false; }
    const a = d(20), b = (adv || dis) ? d(20) : null;
    let natural = a;
    if (adv) natural = Math.max(a, b);
    if (dis) natural = Math.min(a, b);
    if (opts.luckyMin && natural < opts.luckyMin) natural = opts.luckyMin;

    const mod = opts.mod || 0;
    let bonus = 0, bonusRolls = null;
    if (opts.bonusDice) { const r = roll(opts.bonusDice); bonus = r.total; bonusRolls = r.rolls; }

    const total = natural + mod + bonus;
    const res = {
      natural, both: b === null ? [a] : [a, b], adv, dis,
      mod, bonus, bonusDice: opts.bonusDice || null, bonusRolls,
      total, label: opts.label || '',
      crit: natural === 20, fumble: natural === 1
    };
    if (opts.dc != null) {
      res.dc = opts.dc;
      res.success = natural === 20 ? true : natural === 1 ? false : total >= opts.dc;
    }
    return res;
  }

  /** Format a roll result as "14 (d20 11 +3)" for the log. */
  function fmt(r) {
    const bits = [];
    bits.push('d20 ' + (r.both.length > 1 ? '[' + r.both.join('/') + ']→' + r.natural : r.natural));
    if (r.mod) bits.push(U.plus(r.mod));
    if (r.bonus) bits.push(U.plus(r.bonus) + ' (' + r.bonusDice + ')');
    return r.total + ' (' + bits.join(' ') + ')';
  }

  /** Damage roll formatting: "9 slashing (1d8+4: 5)" */
  function fmtDamage(pkt) {
    return pkt.total + ' ' + pkt.type;
  }

  return { d, nd, roll, avg, d20, fmt, fmtDamage };
})();
