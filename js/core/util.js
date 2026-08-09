/* Drakehaven Island — core utilities. Everything hangs off window.DH. */
window.DH = window.DH || {};

DH.util = (function () {
  'use strict';

  /* ---------- maths ---------- */
  const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
  const sign = (n) => n < 0 ? -1 : n > 0 ? 1 : 0;
  const mod = (n, m) => ((n % m) + m) % m;

  /* Grid distance in 5-ft squares, D&D "diagonals cost 5ft" style: Chebyshev. */
  const gdist = (ax, ay, bx, by) => Math.max(Math.abs(bx - ax), Math.abs(by - ay));
  const feet = (squares) => squares * 5;

  /* ---------- randomness ---------- */
  let seed = (Date.now() ^ 0x5f3759df) >>> 0;
  function setSeed(s) { seed = (s >>> 0) || 1; }
  /* xorshift32 — deterministic when seeded, good enough for a game */
  function rnd() {
    seed ^= seed << 13; seed >>>= 0;
    seed ^= seed >>> 17;
    seed ^= seed << 5; seed >>>= 0;
    return seed / 4294967296;
  }
  const rint = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));   // inclusive
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const chance = (p) => rnd() < p;
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function pickWeighted(pairs) { // [[value, weight], ...]
    let total = 0; for (const p of pairs) total += p[1];
    let r = rnd() * total;
    for (const p of pairs) { r -= p[1]; if (r <= 0) return p[0]; }
    return pairs[pairs.length - 1][0];
  }

  /* ---------- strings ---------- */
  const cap = (s) => s ? s[0].toUpperCase() + s.slice(1) : s;
  const plus = (n) => (n >= 0 ? '+' : '') + n;
  const ord = (n) => {
    const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };
  function titleCase(s) {
    return String(s).replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
  /* "1,350" */
  function commas(n) { return String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  /* Show a list as "a, b and c" */
  function listing(arr, join) {
    join = join || 'and';
    arr = arr.filter(Boolean);
    if (!arr.length) return '';
    if (arr.length === 1) return arr[0];
    return arr.slice(0, -1).join(', ') + ' ' + join + ' ' + arr[arr.length - 1];
  }
  /* time of day from minutes-since-midnight */
  function clockStr(mins) {
    mins = mod(Math.floor(mins), 1440);
    let h = Math.floor(mins / 60), m = mins % 60;
    const ap = h < 12 ? 'AM' : 'PM';
    let hh = h % 12; if (hh === 0) hh = 12;
    return hh + ':' + String(m).padStart(2, '0') + ' ' + ap;
  }

  /* ---------- collections ---------- */
  function sum(arr, f) { let t = 0; for (const x of arr) t += f ? f(x) : x; return t; }
  function byId(arr, id) { return arr.find(x => x.id === id); }
  function remove(arr, x) { const i = arr.indexOf(x); if (i >= 0) arr.splice(i, 1); return arr; }
  function deep(o) { return JSON.parse(JSON.stringify(o)); }
  function uid(pfx) { return (pfx || 'x') + '_' + Math.floor(Math.random() * 1e9).toString(36); }

  /* ---------- tiny event bus ---------- */
  const listeners = {};
  function on(ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); return fn; }
  function off(ev, fn) { if (listeners[ev]) remove(listeners[ev], fn); }
  function emit(ev, data) { (listeners[ev] || []).slice().forEach(fn => fn(data)); }

  /* ---------- pathfinding (BFS on a 4/8-dir grid) ----------
     passable(x,y) -> boolean. Returns {dist:Map, from:Map} keyed "x,y". */
  function flood(sx, sy, w, h, passable, maxCost, diag) {
    const key = (x, y) => x + ',' + y;
    const distM = new Map(), from = new Map();
    const q = [[sx, sy]]; distM.set(key(sx, sy), 0);
    const dirs = diag === false
      ? [[1, 0], [-1, 0], [0, 1], [0, -1]]
      : [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    let qi = 0;
    while (qi < q.length) {
      const [cx, cy] = q[qi++];
      const cd = distM.get(key(cx, cy));
      if (maxCost != null && cd >= maxCost) continue;
      for (const [dx, dy] of dirs) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const k = key(nx, ny);
        if (distM.has(k)) continue;
        const cost = passable(nx, ny, cx, cy);
        if (cost === false || cost == null) continue;
        const step = (cost === true ? 1 : cost);
        const nd = cd + step;
        if (maxCost != null && nd > maxCost) continue;
        distM.set(k, nd); from.set(k, key(cx, cy));
        q.push([nx, ny]);
      }
    }
    return { dist: distM, from: from };
  }
  /* Rebuild the path to (tx,ty) as an array of {x,y} excluding the start. */
  function tracePath(res, sx, sy, tx, ty) {
    const key = (x, y) => x + ',' + y;
    let k = key(tx, ty);
    if (!res.dist.has(k)) return null;
    const out = [];
    const start = key(sx, sy);
    while (k !== start) {
      const [x, y] = k.split(',').map(Number);
      out.unshift({ x, y });
      k = res.from.get(k);
      if (k === undefined) return null;
    }
    return out;
  }

  /* Bresenham line, used for line-of-sight and line spells */
  function line(x0, y0, x1, y1) {
    const pts = [];
    let dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    let sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, err = dx - dy;
    for (;;) {
      pts.push({ x: x0, y: y0 });
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x0 += sx; }
      if (e2 < dx) { err += dx; y0 += sy; }
    }
    return pts;
  }

  /* Tiles in a radius (sphere/burst), Chebyshev */
  function burst(cx, cy, r) {
    const out = [];
    for (let y = cy - r; y <= cy + r; y++)
      for (let x = cx - r; x <= cx + r; x++)
        if (gdist(cx, cy, x, y) <= r) out.push({ x, y });
    return out;
  }

  /* Cone: 90-degree wedge from origin toward a direction, length r */
  function cone(ox, oy, dx, dy, r) {
    const out = [];
    const len = Math.hypot(dx, dy) || 1; dx /= len; dy /= len;
    for (let y = oy - r; y <= oy + r; y++) {
      for (let x = ox - r; x <= ox + r; x++) {
        const vx = x - ox, vy = y - oy;
        const d = Math.hypot(vx, vy);
        if (d === 0 || d > r) continue;
        const dot = (vx / d) * dx + (vy / d) * dy;
        if (dot >= 0.6) out.push({ x, y });   // ~53deg half-angle
      }
    }
    return out;
  }

  /* ---------- easing / timers ---------- */
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const easeIn = t => t * t * t;
  const easeInOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

  return {
    clamp, lerp, dist, sign, mod, gdist, feet,
    setSeed, rnd, rint, pick, chance, shuffle, pickWeighted,
    cap, plus, ord, titleCase, commas, listing, clockStr,
    sum, byId, remove, deep, uid,
    on, off, emit,
    flood, tracePath, line, burst, cone,
    easeOut, easeIn, easeInOut, wait
  };
})();
