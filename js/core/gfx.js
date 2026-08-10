/* Drakehaven Island — procedural renderer. Every sprite is drawn from code:
   there are no image files anywhere in this project. */
window.DH = window.DH || {};

DH.gfx = (function () {
  'use strict';
  const U = DH.util;

  /* Virtual resolution. An art pixel's size on screen is zoom × (screenWidth/VW),
     so raising VW without touching the zoom levels is what makes the picture
     finer: 800 instead of 640 puts 25% more pixels across the same window, and
     every art pixel lands 20% smaller. Sixteen-by-nine is preserved exactly, and
     TILE and CELL stay put so no painter's coordinates change. */
  const VW = 800, VH = 450;          // virtual resolution
  const TILE = 16;                   // overworld tile
  const CELL = 24;                   // combat grid cell

  let cv = null, ctx = null, scale = 1;
  /* World zoom: the overworld magnifies so its rooms fill the frame, while
     combat draws one-to-one. Everything after begin() works in this zoomed
     space, so viewW()/viewH() are the visible size in world pixels. */
  let zoom = 1;
  const cam = { x: 0, y: 0, tx: 0, ty: 0, shake: 0, shakeT: 0 };
  let tick = 0;
  const particles = [];
  const floaters = [];               // floating combat text

  /* ---------- palette ---------- */
  const C = {
    black: '#0a0d14', dark: '#121826', night: '#0d1526',
    wood: '#6b4a2c', wood2: '#8a613a', wood3: '#4a3220', woodLite: '#a67c4d',
    stone: '#4d5566', stone2: '#5f6879', stone3: '#3a4152', stoneLite: '#767f92',
    grass: '#4a7a3c', grass2: '#568a44', grass3: '#3d6631',
    sand: '#c2a668', sand2: '#d4b877', sand3: '#a68a52',
    water: '#2f6a8c', water2: '#3f89a8', water3: '#1f4a66', foam: '#c8e4f0',
    dirt: '#6b5340', dirt2: '#7d6350', path: '#8a7a5f', path2: '#9c8a6d',
    mud: '#4a3f2c', mud2: '#5c4f38',
    lava: '#d4571f', lava2: '#f0a03c', lava3: '#8a2f0f',
    metal: '#7d8798', metal2: '#98a2b3', gold: '#e8bd58', goldDim: '#9a7c33',
    cloth: '#8a3f3a', carpet: '#7a2a30', carpet2: '#96343c',
    ice: '#a8d8e8', snow: '#e8f4f8',
    blood: '#8a2320', poison: '#5f9a3a', arcane: '#9a6fd0',
    fungus: '#7a5f8a', fungus2: '#9a7faa',
    ink: '#f2e6cd', inkDim: '#bda887', shadow: 'rgba(0,0,0,.35)'
  };

  /* Lighten or darken a #rrggbb by a factor, for shading derived from whatever
     colour a spec happens to carry. k < 1 darkens, k > 1 lightens. */
  function shade(hex, k) {
    if (typeof hex !== 'string' || hex.charAt(0) !== '#' || hex.length < 7) return hex;
    const c = (i) => {
      const v = Math.round(parseInt(hex.substr(i, 2), 16) * k);
      return (v < 0 ? 0 : v > 255 ? 255 : v).toString(16).padStart(2, '0');
    };
    return '#' + c(1) + c(3) + c(5);
  }

  /* Random-but-stable value per tile so terrain has texture without noise arrays. */
  function hash(x, y, s) {
    let h = (x * 374761393 + y * 668265263 + (s || 0) * 2246822519) ^ 0x5f356495;
    h = (h ^ (h >>> 13)) * 1274126177;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  function init(canvas) {
    cv = canvas; ctx = cv.getContext('2d');
    cv.width = VW; cv.height = VH;
    ctx.imageSmoothingEnabled = false;
    resize();
    window.addEventListener('resize', resize);
    return ctx;
  }
  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    scale = Math.max(1, Math.min(Math.floor(w / VW * 100) / 100, Math.floor(h / VH * 100) / 100));
    cv.style.width = Math.floor(VW * scale) + 'px';
    cv.style.height = Math.floor(VH * scale) + 'px';
  }

  function setZoom(z) { zoom = z || 1; }
  function getZoom() { return zoom; }
  const viewW = () => VW / zoom;
  const viewH = () => VH / zoom;

  /* Convert a canvas coord (0..VW) into world coords. */
  function toWorld(vx, vy) { return { x: vx / zoom + cam.x, y: vy / zoom + cam.y }; }

  function begin() {
    tick++;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, VW, VH);
    if (cam.shakeT > 0) {
      cam.shakeT--;
      const a = cam.shake * (cam.shakeT / 12);
      ctx.translate(Math.round((Math.random() - .5) * a), Math.round((Math.random() - .5) * a));
    }
    if (zoom !== 1) ctx.scale(zoom, zoom);
  }
  function end() { ctx.setTransform(1, 0, 0, 1, 0, 0); }
  function shake(amt) { cam.shake = amt; cam.shakeT = 12; }

  function camFollow(wx, wy, bounds, lerpAmt) {
    const vw = viewW(), vh = viewH();
    cam.tx = wx - vw / 2; cam.ty = wy - vh / 2;
    if (bounds) {
      /* a room smaller than the frame is centred rather than shoved into a corner */
      cam.tx = bounds.w <= vw ? -(vw - bounds.w) / 2 : U.clamp(cam.tx, 0, bounds.w - vw);
      cam.ty = bounds.h <= vh ? -(vh - bounds.h) / 2 : U.clamp(cam.ty, 0, bounds.h - vh);
    }
    const k = lerpAmt == null ? 0.16 : lerpAmt;
    cam.x += (cam.tx - cam.x) * k; cam.y += (cam.ty - cam.y) * k;
    if (Math.abs(cam.tx - cam.x) < .4) cam.x = cam.tx;
    if (Math.abs(cam.ty - cam.y) < .4) cam.y = cam.ty;
  }
  function camSnap(wx, wy, bounds) {
    camFollow(wx, wy, bounds, 1);
  }

  /* ---------- primitives (world space unless raw) ---------- */
  const R = (n) => Math.round(n);
  function rect(x, y, w, h, col, raw) {
    ctx.fillStyle = col;
    ctx.fillRect(R(raw ? x : x - cam.x), R(raw ? y : y - cam.y), R(w), R(h));
  }
  function stroke(x, y, w, h, col, lw, raw) {
    ctx.strokeStyle = col; ctx.lineWidth = lw || 1;
    ctx.strokeRect(R(raw ? x : x - cam.x) + .5, R(raw ? y : y - cam.y) + .5, R(w) - 1, R(h) - 1);
  }
  function ellipse(x, y, rx, ry, col, raw) {
    ctx.fillStyle = col; ctx.beginPath();
    ctx.ellipse(R(raw ? x : x - cam.x), R(raw ? y : y - cam.y), Math.max(.5, rx), Math.max(.5, ry), 0, 0, 6.2832);
    ctx.fill();
  }
  function ellipseS(x, y, rx, ry, col, lw, raw) {
    ctx.strokeStyle = col; ctx.lineWidth = lw || 1; ctx.beginPath();
    ctx.ellipse(R(raw ? x : x - cam.x), R(raw ? y : y - cam.y), Math.max(.5, rx), Math.max(.5, ry), 0, 0, 6.2832);
    ctx.stroke();
  }
  function poly(pts, col, raw) {
    ctx.fillStyle = col; ctx.beginPath();
    pts.forEach((p, i) => {
      const x = R(raw ? p[0] : p[0] - cam.x), y = R(raw ? p[1] : p[1] - cam.y);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.closePath(); ctx.fill();
  }
  function lineTo(x1, y1, x2, y2, col, lw, raw) {
    ctx.strokeStyle = col; ctx.lineWidth = lw || 1;
    ctx.beginPath();
    ctx.moveTo(R(raw ? x1 : x1 - cam.x) + .5, R(raw ? y1 : y1 - cam.y) + .5);
    ctx.lineTo(R(raw ? x2 : x2 - cam.x) + .5, R(raw ? y2 : y2 - cam.y) + .5);
    ctx.stroke();
  }
  function text(str, x, y, o) {
    o = o || {};
    ctx.font = (o.bold ? 'bold ' : '') + (o.size || 8) + 'px ui-monospace, monospace';
    ctx.textAlign = o.align || 'left';
    ctx.textBaseline = o.base || 'top';
    const px = R(o.raw === false ? x - cam.x : x), py = R(o.raw === false ? y - cam.y : y);
    if (o.shadow !== false) { ctx.fillStyle = o.shadowCol || '#000'; ctx.fillText(str, px + 1, py + 1); }
    ctx.fillStyle = o.color || C.ink;
    ctx.fillText(str, px, py);
  }
  /* A label pinned to a world position that stays the same size on screen no
     matter how far the world is zoomed in. */
  function label(str, wx, wy, o) {
    o = o || {};
    text(str, wx, wy, Object.assign({}, o, { raw: false, size: (o.size || 8) / zoom }));
  }
  function measure(str, size) {
    ctx.font = (size || 8) + 'px ui-monospace, monospace';
    return ctx.measureText(str).width;
  }
  function alpha(a, fn) { const o = ctx.globalAlpha; ctx.globalAlpha = a; fn(); ctx.globalAlpha = o; }

  /* ================= TERRAIN ================= */
  /* Each painter fills one TILE at world (wx,wy). */
  const TILES = {
    grass(x, y, tx, ty) {
      rect(x, y, TILE, TILE, C.grass);
      const h = hash(tx, ty, 1);
      if (h > .55) rect(x + 3 + (h * 8 | 0), y + 4 + (h * 7 | 0), 2, 3, C.grass2);
      if (h < .2) rect(x + 9, y + 10, 3, 2, C.grass3);
      if (h > .93) { rect(x + 6, y + 5, 1, 5, C.grass3); rect(x + 5, y + 3, 3, 2, '#c8d45f'); }
    },
    grass2(x, y, tx, ty) {
      rect(x, y, TILE, TILE, C.grass3);
      const h = hash(tx, ty, 7);
      if (h > .5) rect(x + 4, y + 6, 3, 2, C.grass);
    },
    sand(x, y, tx, ty) {
      rect(x, y, TILE, TILE, C.sand);
      const h = hash(tx, ty, 2);
      if (h > .6) rect(x + (h * 12 | 0), y + (h * 11 | 0), 2, 1, C.sand2);
      if (h < .25) rect(x + 5, y + 9, 3, 1, C.sand3);
    },
    water(x, y, tx, ty) {
      const w = Math.sin((tick * .05) + tx * .7 + ty * .4);
      rect(x, y, TILE, TILE, w > .3 ? C.water2 : C.water);
      if (w > .82) rect(x + 3, y + 6, 8, 1, C.foam);
      if (w < -.85) rect(x + 6, y + 10, 5, 1, C.water3);
    },
    deepwater(x, y, tx, ty) {
      const w = Math.sin((tick * .04) + tx * .5 + ty * .3);
      rect(x, y, TILE, TILE, w > .4 ? C.water : C.water3);
    },
    deck(x, y, tx, ty) {  // ship planking
      rect(x, y, TILE, TILE, C.wood);
      rect(x, y + 15, TILE, 1, C.wood3);
      const h = hash(tx, ty, 3);
      if (h > .5) rect(x + 2, y + 4, 11, 1, C.wood2);
      if (h > .85) rect(x + 8, y, 1, 16, C.wood3);
    },
    floor(x, y, tx, ty) {  // interior boards
      rect(x, y, TILE, TILE, C.wood2);
      rect(x, y + 15, TILE, 1, C.wood);
      if (hash(tx, ty, 4) > .7) rect(x + 3, y + 7, 9, 1, C.woodLite);
    },
    stonefloor(x, y, tx, ty) {
      rect(x, y, TILE, TILE, C.stone);
      const h = hash(tx, ty, 5);
      rect(x, y, TILE, 1, C.stone3); rect(x, y, 1, TILE, C.stone3);
      if (h > .6) rect(x + 4, y + 5, 5, 4, C.stone2);
      if (h < .12) rect(x + 10, y + 11, 3, 2, C.stone3);
    },
    cave(x, y, tx, ty) {
      rect(x, y, TILE, TILE, '#2e3442');
      const h = hash(tx, ty, 6);
      if (h > .7) rect(x + 5, y + 6, 4, 3, '#3a4152');
      if (h < .1) rect(x + 2, y + 12, 6, 1, '#252a36');
    },
    wall(x, y, tx, ty) {
      rect(x, y, TILE, TILE, C.stone3);
      rect(x, y, TILE, 3, C.stone2);
      const off = (ty % 2) ? 8 : 0;
      lineTo(x + off, y, x + off, y + TILE, '#2b3140', 1);
      lineTo(x, y + 8, x + TILE, y + 8, '#2b3140', 1);
    },
    /* Timber walls read as buildings rather than slabs: a lit eave along the top,
       staggered boards, and the odd knot. */
    woodwall(x, y, tx, ty) {
      rect(x, y, TILE, TILE, C.wood3);
      const h = hash(tx, ty, 17);
      const off = (ty % 2) ? 0 : 3;
      for (let i = 0; i < 4; i++) {
        const bx = x + ((i * 4 + off) % TILE);
        rect(bx, y, 1, TILE, '#3a2618');
      }
      rect(x, y, TILE, 3, C.wood);
      rect(x, y, TILE, 1, C.woodLite);
      rect(x, y + TILE - 1, TILE, 1, '#2b1c10');
      if (h > .82) rect(x + 4 + (h * 6 | 0), y + 7, 2, 2, '#2f2013');
      if (h < .12) rect(x + 2, y + 10, 12, 1, C.wood2);
    },
    path(x, y, tx, ty) {
      rect(x, y, TILE, TILE, C.path);
      const h = hash(tx, ty, 8);
      if (h > .55) rect(x + 3, y + 4, 4, 3, C.path2);
      if (h < .2) rect(x + 9, y + 9, 3, 2, '#75664f');
    },
    dirt(x, y, tx, ty) {
      rect(x, y, TILE, TILE, C.dirt);
      if (hash(tx, ty, 9) > .6) rect(x + 5, y + 6, 3, 2, C.dirt2);
    },
    tilled(x, y) {
      rect(x, y, TILE, TILE, '#4a3826');
      for (let i = 1; i < 16; i += 4) rect(x, y + i, TILE, 2, '#5c4830');
    },
    mud(x, y, tx, ty) {
      const w = Math.sin(tick * .03 + tx + ty);
      rect(x, y, TILE, TILE, C.mud);
      if (w > .5) rect(x + 4, y + 7, 7, 2, C.mud2);
      if (hash(tx, ty, 11) > .8) ellipse(x + 8, y + 8, 3, 2, '#3a3222');
    },
    lava(x, y, tx, ty) {
      const w = Math.sin(tick * .07 + tx * .9 + ty * .6);
      rect(x, y, TILE, TILE, w > 0 ? C.lava : C.lava3);
      if (w > .6) { rect(x + 4, y + 5, 7, 4, C.lava2); }
      if (w < -.7) rect(x + 2, y + 10, 4, 2, '#ffd48a');
    },
    carpet(x, y, tx, ty) {
      rect(x, y, TILE, TILE, C.carpet);
      if ((tx + ty) % 2 === 0) rect(x + 2, y + 2, 12, 12, C.carpet2);
      rect(x + 6, y + 6, 4, 4, C.goldDim);
    },
    marble(x, y, tx, ty) {
      const lite = (tx + ty) % 2 === 0;
      rect(x, y, TILE, TILE, lite ? '#d8d4c8' : '#b8b4a8');
      if (hash(tx, ty, 12) > .8) lineTo(x + 2, y + 3, x + 12, y + 11, '#a8a498', 1);
    },
    rug(x, y) { rect(x, y, TILE, TILE, '#4a3560'); rect(x + 3, y + 3, 10, 10, '#5c4275'); },
    snow(x, y, tx, ty) { rect(x, y, TILE, TILE, C.snow); if (hash(tx, ty, 13) > .7) rect(x + 5, y + 6, 3, 2, '#d0e4ee'); },
    void: (x, y) => rect(x, y, TILE, TILE, C.black)
  };

  function drawTile(kind, tx, ty) {
    const f = TILES[kind] || TILES.void;
    f(tx * TILE, ty * TILE, tx, ty);
  }

  /* ================= PROPS ================= */
  const PROPS = {
    /* A barrel is a bulge, staves and two hoops. Drawing it as a plain rectangle
       with stripes read as a crate, so the silhouette carries the shape now:
       narrow at both rims, widest at the belly, with the lid seen slightly from
       above the way everything else on this tile grid is. */
    barrel(x, y, o) {
      if (o && o.broken) {
        rect(x + 1, y + 12, 14, 3, C.wood3);
        poly([[x + 2, y + 12], [x + 5, y + 5], [x + 7, y + 12]], C.wood);
        poly([[x + 9, y + 12], [x + 12, y + 7], [x + 14, y + 12]], C.wood2);
        rect(x + 2, y + 14, 12, 1, C.metal);
        return;
      }
      poly([[x + 4, y + 2], [x + 12, y + 2], [x + 14, y + 8], [x + 12, y + 15], [x + 4, y + 15], [x + 2, y + 8]], C.wood);
      poly([[x + 4, y + 2], [x + 6, y + 2], [x + 5, y + 15], [x + 3, y + 15]], C.wood2);  // lit stave
      for (const sx of [x + 7, x + 10]) rect(sx, y + 3, 1, 12, '#4a3220');
      rect(x + 3, y + 5, 11, 2, C.metal);            // upper hoop
      rect(x + 2, y + 11, 12, 2, C.metal);           // lower hoop, on the belly
      ellipse(x + 8, y + 3, 4, 1.5, C.woodLite);     // lid
      ellipseS(x + 8, y + 3, 4, 1.5, '#4a3220', 1);
    },
    coldbarrel(x, y) {
      poly([[x + 4, y + 2], [x + 12, y + 2], [x + 14, y + 8], [x + 12, y + 15], [x + 4, y + 15], [x + 2, y + 8]], '#3f5f7a');
      poly([[x + 4, y + 2], [x + 6, y + 2], [x + 5, y + 15], [x + 3, y + 15]], '#527794');
      rect(x + 3, y + 5, 11, 2, C.ice); rect(x + 2, y + 11, 12, 2, C.ice);
      ellipse(x + 8, y + 3, 4, 1.5, '#8fc4dc');      // water surface, iced over
      rect(x + 4, y + 1, 8, 2, C.snow);              // snow gathered on the rim
      alpha(.5 + Math.sin(tick * .1) * .2, () => rect(x + 5, y - 2, 2, 3, C.ice));
    },
    crate(x, y) {
      rect(x + 2, y + 3, 12, 12, C.wood2);
      rect(x + 2, y + 3, 12, 2, C.woodLite);         // lit lid edge
      lineTo(x + 3, y + 5, x + 13, y + 14, C.wood3, 1);
      lineTo(x + 13, y + 5, x + 3, y + 14, C.wood3, 1);
      for (const c of [[2, 3], [12, 3], [2, 13], [12, 13]]) rect(x + c[0], y + c[1], 2, 2, C.metal);
      stroke(x + 2, y + 3, 12, 12, '#33220f', 1);
    },
    bottle(x, y) {
      rect(x + 7, y + 3, 2, 1, '#7a5a3a');           // cork
      rect(x + 7, y + 4, 2, 4, '#3f7a5f');           // neck
      poly([[x + 6, y + 8], [x + 10, y + 8], [x + 11, y + 10], [x + 11, y + 14], [x + 5, y + 14], [x + 5, y + 10]], '#4a8a6a');
      rect(x + 6, y + 10, 1, 4, '#8ad4aa');          // highlight down the shoulder
      rect(x + 5, y + 11, 6, 2, '#d8cbb4');          // label
    },
    /* Coiled on the deck, not laid out in a line — a line of dashes looked like
       a ladder. */
    rope(x, y) {
      ellipseS(x + 8, y + 11, 6, 4, '#a68a5c', 2);
      ellipseS(x + 8, y + 10, 4, 2.5, '#8a7350', 2);
      ellipseS(x + 8, y + 9, 2, 1.5, '#a68a5c', 2);
    },
    rigging(x, y) {
      lineTo(x, y, x + 16, y + 16, '#8a7350', 1);
      lineTo(x + 16, y, x, y + 16, '#8a7350', 1);
    },
    mast(x, y) { rect(x + 5, y, 6, 16, C.wood3); rect(x + 6, y, 2, 16, C.wood); },
    table(x, y) {
      rect(x + 1, y + 4, 14, 7, C.wood2);
      rect(x + 1, y + 4, 14, 1, C.woodLite);         // lit near edge
      lineTo(x + 1, y + 7, x + 15, y + 7, C.wood, 1);   // plank seam
      rect(x + 1, y + 10, 14, 1, C.wood3);
      rect(x + 2, y + 11, 2, 4, C.wood3); rect(x + 12, y + 11, 2, 4, C.wood3);
    },
    chair(x, y) {
      rect(x + 4, y + 2, 8, 2, C.wood2);             // back rail
      rect(x + 4, y + 4, 1, 4, C.wood3); rect(x + 11, y + 4, 1, 4, C.wood3);
      rect(x + 3, y + 8, 10, 3, C.wood);             // seat
      rect(x + 3, y + 8, 10, 1, C.woodLite);
      rect(x + 4, y + 11, 2, 4, C.wood3); rect(x + 10, y + 11, 2, 4, C.wood3);
    },
    /* A bunk, read from above: headboard, pillow at the head, blanket turned
       down over the legs. The old one was two stacked rectangles that could as
       easily have been a rug. */
    bed(x, y) {
      rect(x + 1, y + 1, 14, 15, C.wood3);
      rect(x + 1, y + 1, 14, 2, C.wood);             // headboard rail
      rect(x + 1, y + 14, 14, 2, C.wood);            // foot rail
      rect(x + 2, y + 3, 12, 11, '#cfc3ad');         // mattress
      rect(x + 3, y + 4, 10, 3, '#efe7d6');          // pillow
      rect(x + 3, y + 6, 10, 1, '#bdb29c');
      rect(x + 2, y + 8, 12, 6, '#7f3a37');          // blanket
      rect(x + 2, y + 8, 12, 1, '#9c4a45');          // turned-down fold
      rect(x + 2, y + 11, 12, 1, '#6a2f2c');         // crease
      rect(x + 1, y + 1, 2, 2, C.woodLite); rect(x + 13, y + 1, 2, 2, C.woodLite);
      stroke(x + 1, y + 1, 14, 15, '#33220f', 1);
    },
    /* Seen from above, a hammock is a sling: two knots lashed to the beams, cords
       gathering to each end, and a long sagging hollow of canvas between them.
       Drawn as a trapezoid it read as a wash tub, which is not restful. */
    hammock(x, y) {
      const sw = Math.sin(tick * .04) * 1.5;
      rect(x, y + 7, 2, 2, '#6a5a3a'); rect(x + 14, y + 7, 2, 2, '#6a5a3a');   // lashings
      for (const t of [-2.5, 0, 2.5]) {
        lineTo(x + 2, y + 8, x + 5, y + 8 + t + sw, '#a68a5c', 1);
        lineTo(x + 14, y + 8, x + 11, y + 8 + t + sw, '#a68a5c', 1);
      }
      ellipse(x + 8, y + 9 + sw, 6, 4, '#c0b092');          // the sling
      ellipse(x + 8, y + 10 + sw, 4.5, 2.2, '#a89878');     // the hollow it sags into
      for (let i = 0; i < 4; i++) {
        lineTo(x + 5 + i * 2, y + 6.5 + sw, x + 5 + i * 2, y + 11.5 + sw, '#9a8460', 1);
      }
      ellipseS(x + 8, y + 9 + sw, 6, 4, '#8a7350', 1);
    },
    chest(x, y, o) {
      const open = o && o.open;
      rect(x + 2, y + 7, 12, 7, C.wood);
      rect(x + 2, y + 13, 12, 1, C.wood3);
      if (open) {
        rect(x + 2, y + 7, 12, 2, '#1a1209');        // dark interior
        rect(x + 2, y + 2, 12, 4, C.wood3);          // lid thrown back
      } else {
        poly([[x + 2, y + 7], [x + 3, y + 4], [x + 13, y + 4], [x + 14, y + 7]], C.wood2);
        rect(x + 2, y + 6, 12, 1, C.goldDim);
      }
      rect(x + 4, y + 4, 1, 10, C.metal); rect(x + 11, y + 4, 1, 10, C.metal);
      rect(x + 7, y + 7, 3, 4, open ? C.stone : C.gold);
      rect(x + 8, y + 8, 1, 2, '#1a1410');           // keyhole
    },
    /* horn, face, waist, foot — the outline a smith would recognise */
    anvil(x, y) {
      poly([[x + 2, y + 6], [x + 13, y + 6], [x + 15, y + 7], [x + 13, y + 8], [x + 2, y + 8]], C.metal2);
      rect(x + 2, y + 6, 11, 1, '#b8c0cc');          // polished face
      rect(x + 5, y + 8, 5, 3, C.metal);             // waist
      rect(x + 3, y + 11, 9, 3, C.stone3);           // foot
      rect(x + 3, y + 11, 9, 1, C.stone2);
    },
    forge(x, y) {
      rect(x + 2, y + 4, 12, 11, C.stone3);
      const f = Math.sin(tick * .13) * .5 + .5;
      rect(x + 5, y + 8, 6, 5, f > .5 ? C.lava2 : C.lava);
    },
    sign(x, y) {
      rect(x + 7, y + 9, 2, 7, C.wood3);
      rect(x + 6, y + 15, 4, 1, '#2b1c10');          // it stands in something
      rect(x + 1, y + 2, 14, 8, C.wood2);
      rect(x + 1, y + 2, 14, 1, C.woodLite);
      stroke(x + 1, y + 2, 14, 8, '#33220f', 1);
      rect(x + 3, y + 4, 9, 1, '#4a3220');           // lines of writing
      rect(x + 3, y + 6, 7, 1, '#4a3220');
      rect(x + 3, y + 8, 5, 1, '#4a3220');
    },
    tree(x, y) {
      rect(x + 6, y + 9, 4, 7, C.wood3);
      ellipse(x + 8, y + 5, 8, 7, C.grass3);
      ellipse(x + 6, y + 3, 5, 4, C.grass);
      ellipse(x + 11, y + 6, 4, 3, C.grass2);
    },
    pine(x, y) {
      rect(x + 7, y + 12, 2, 4, C.wood3);
      poly([[x + 8, y - 4], [x + 14, y + 12], [x + 2, y + 12]], '#2f5a34');
      poly([[x + 8, y - 1], [x + 12, y + 8], [x + 4, y + 8]], '#3a6b3f');
    },
    palm(x, y) {
      rect(x + 7, y + 6, 3, 10, C.wood);
      for (const a of [-1.1, -.4, .4, 1.1]) {
        poly([[x + 8, y + 6], [x + 8 + Math.cos(a) * 9, y + 5 + Math.sin(a) * 5 - 2], [x + 8 + Math.cos(a) * 8, y + 9 + Math.sin(a) * 5]], C.grass);
      }
    },
    bush(x, y) { ellipse(x + 8, y + 10, 6, 5, C.grass3); ellipse(x + 6, y + 8, 4, 3, C.grass); },
    rock(x, y) { ellipse(x + 8, y + 10, 6, 5, C.stone); ellipse(x + 6, y + 8, 3, 2, C.stoneLite); },
    boulder(x, y) { ellipse(x + 8, y + 8, 8, 8, C.stone3); ellipse(x + 6, y + 6, 4, 3, C.stone); },
    ore(x, y, o) {
      ellipse(x + 8, y + 9, 7, 6, C.stone3);
      const col = o && o.kind === 'silver' ? '#d8dce8' : o && o.kind === 'iron' ? '#8a8a92' : '#c47a3a';
      rect(x + 5, y + 7, 3, 3, col); rect(x + 9, y + 10, 2, 2, col);
    },
    herb(x, y) { rect(x + 7, y + 9, 2, 5, C.grass3); ellipse(x + 6, y + 8, 3, 2, C.grass); ellipse(x + 11, y + 9, 2, 2, C.grass2); ellipse(x + 8, y + 6, 2, 2, '#d45f8a'); },
    mushroom(x, y) { rect(x + 7, y + 10, 2, 4, '#e8dcc0'); ellipse(x + 8, y + 9, 4, 3, '#b8453a'); rect(x + 6, y + 8, 1, 1, C.snow); },
    crop(x, y, o) {
      const g = (o && o.growth) || 0;
      rect(x, y, TILE, TILE, '#4a3826');
      if (g > 0) rect(x + 7, y + 14 - g * 2, 2, 2 + g * 2, C.grass3);
      if (g >= 3) { ellipse(x + 6, y + 8, 2, 2, C.grass); ellipse(x + 10, y + 9, 2, 2, C.grass); }
      if (g >= 4) ellipse(x + 8, y + 6, 2, 3, '#d45f8a');
    },
    stall(x, y) {
      rect(x + 1, y + 8, 14, 7, C.wood);             // counter
      rect(x + 1, y + 8, 14, 1, C.woodLite);
      rect(x, y + 1, 16, 5, '#8a3f3a');              // striped awning
      for (let i = 0; i < 16; i += 4) rect(x + i, y + 1, 2, 5, '#c25f56');
      for (let i = 0; i < 16; i += 2) rect(x + i, y + 6, 2, 1, i % 4 ? '#8a3f3a' : '#c25f56');
      rect(x + 1, y + 6, 1, 3, C.wood3); rect(x + 14, y + 6, 1, 3, C.wood3);
      rect(x + 3, y + 9, 3, 3, C.arcane);            // wares laid out
      rect(x + 7, y + 10, 2, 2, C.poison);
      ellipse(x + 12, y + 11, 2, 2, C.gold);
    },
    torch(x, y) {
      rect(x + 7, y + 6, 2, 9, C.wood3);
      const f = Math.sin(tick * .2) * 2;
      ellipse(x + 8, y + 4 + f * .3, 3, 4 + f * .4, C.lava);
      ellipse(x + 8, y + 4, 2, 2, C.lava2);
    },
    brazier(x, y) {
      rect(x + 5, y + 9, 6, 6, C.metal);
      const f = Math.sin(tick * .16);
      ellipse(x + 8, y + 7 + f, 4, 4, C.lava); ellipse(x + 8, y + 6, 2, 2, '#ffd48a');
    },
    pillar(x, y) { rect(x + 3, y, 10, 16, C.stone2); rect(x + 3, y, 2, 16, C.stoneLite); rect(x + 2, y, 12, 2, C.stone); },
    statue(x, y) {
      rect(x + 4, y + 13, 8, 3, C.stone3);
      rect(x + 6, y + 5, 4, 9, C.stoneLite);
      ellipse(x + 8, y + 4, 3, 3, C.stoneLite);
      rect(x + 4, y + 7, 8, 2, C.stone2);
    },
    pedestal(x, y) { rect(x + 5, y + 8, 6, 7, C.stone2); rect(x + 3, y + 6, 10, 3, C.stoneLite); },
    lever(x, y, o) {
      rect(x + 6, y + 10, 4, 5, C.stone3);
      const pulled = o && o.on;
      lineTo(x + 8, y + 11, pulled ? x + 13 : x + 3, y + 4, C.metal2, 2);
      rect(pulled ? x + 12 : x + 2, y + 2, 3, 3, C.blood);
    },
    door(x, y, o) {
      rect(x + 1, y, 14, 16, o && o.open ? C.black : C.wood3);
      if (!(o && o.open)) { rect(x + 2, y + 1, 12, 14, C.wood); rect(x + 11, y + 7, 2, 2, C.gold); }
    },
    stairs(x, y) { for (let i = 0; i < 4; i++) rect(x + i * 4, y + i * 4, 16 - i * 4, 4, i % 2 ? C.stone2 : C.stone); },
    bar(x, y) {
      rect(x, y + 5, 16, 10, C.wood3);
      rect(x, y + 5, 16, 2, C.woodLite);             // polished top
      lineTo(x, y + 9, x + 16, y + 9, '#3a2618', 1);
      rect(x + 3, y + 1, 3, 4, C.metal);             // a tankard left out
      rect(x + 3, y + 1, 3, 1, '#c8e4a0');           // froth
      rect(x + 6, y + 2, 1, 2, C.metal);             // handle
      rect(x + 11, y + 3, 3, 2, '#c8bca8');          // bar rag
    },
    bookshelf(x, y) {
      rect(x + 1, y, 14, 16, C.wood3);
      for (let r = 0; r < 3; r++) for (let i = 0; i < 5; i++)
        if (hash(x + i, y + r, 21) > .25) rect(x + 2 + i * 2.4, y + 1 + r * 5, 2, 4, ['#8a3f3a', '#3f5f8a', '#4a7a3c', '#7a5f8a'][(i + r) % 4]);
    },
    boozewall(x, y) {
      rect(x + 1, y, 14, 16, C.wood3);
      for (let r = 0; r < 3; r++) for (let i = 0; i < 4; i++)
        rect(x + 2 + i * 3, y + 1 + r * 5, 2, 4, ['#8a6a3a', '#4a8a6a', '#8a3f6a', '#c2a668'][(i + r) % 4]);
    },
    dragonskull(x, y) {
      ellipse(x + 8, y + 7, 7, 5, '#d8d4c0');
      poly([[x + 2, y + 7], [x + 8, y + 14], [x + 14, y + 7]], '#c8c4b0');
      rect(x + 4, y + 5, 3, 3, C.black); rect(x + 9, y + 5, 3, 3, C.black);
    },
    web(x, y) { alpha(.5, () => { for (let i = 0; i < 4; i++) lineTo(x, y, x + 16, y + i * 5, '#d8d4c8', 1); lineTo(x + 4, y, x + 4, y + 16, '#d8d4c8', 1); }); },
    fungus(x, y) { ellipse(x + 5, y + 10, 4, 3, C.fungus); ellipse(x + 11, y + 8, 3, 3, C.fungus2); rect(x + 5, y + 12, 1, 3, '#5a4a68'); },
    pole(x, y, o) {
      rect(x + 6, y, 4, 16, C.metal);
      if (o && o.rope) { for (let i = 0; i < 3; i++) rect(x + 4, y + 5 + i * 3, 8, 2, '#a68a5c'); }
      else { rect(x + 3, y + 9, 5, 2, '#a68a5c'); rect(x + 1, y + 11, 4, 1, '#a68a5c'); }
    },
    banner(x, y) { rect(x + 3, y, 10, 12, '#5c2a4a'); poly([[x + 3, y + 12], [x + 8, y + 16], [x + 13, y + 12]], '#5c2a4a'); rect(x + 6, y + 3, 4, 4, C.gold); },
    window(x, y) { rect(x + 1, y + 1, 14, 14, '#2f4a6a'); rect(x + 2, y + 2, 12, 12, '#4a7a9a'); lineTo(x + 8, y + 1, x + 8, y + 15, C.wood3, 1); },
    cauldron(x, y) {
      ellipse(x + 8, y + 10, 6, 5, '#2b3140');
      const b = Math.sin(tick * .1) > 0 ? 1 : 0;
      ellipse(x + 8, y + 8, 5, 2, b ? C.poison : '#4a8a2a');
    },
    pod(x, y) {
      ellipse(x + 8, y + 9, 4, 6, '#6a3f9a');
      ellipse(x + 8, y + 7, 2, 3, C.arcane);
      alpha(.4 + Math.sin(tick * .12) * .3, () => rect(x + 7, y + 5, 2, 2, '#d8c0ff'));
    },
    commandpod(x, y) {
      ellipse(x + 8, y + 8, 7, 9, '#5a2f8a');
      ellipse(x + 8, y + 5, 4, 4, C.arcane);
      alpha(.5 + Math.sin(tick * .09) * .4, () => ellipse(x + 8, y + 5, 2, 2, '#f0e0ff'));
    },
    egg(x, y, o) {
      const golden = !o || o.golden !== false;
      ellipse(x + 8, y + 9, 5, 7, golden ? C.gold : '#c8c4b0');
      ellipse(x + 6, y + 6, 2, 3, golden ? '#ffe8a8' : C.snow);
      if (golden) alpha(.3 + Math.sin(tick * .08) * .2, () => ellipseS(x + 8, y + 9, 8, 10, C.gold, 1));
    },
    gel(x, y) {
      alpha(.45, () => rect(x, y, TILE, TILE, '#8ac4a8'));
      alpha(.7, () => { stroke(x, y, TILE, TILE, '#a8e4c8', 1); });
    },
    fishspot(x, y) {
      const w = Math.sin(tick * .08);
      if (w > .5) { ellipseS(x + 8, y + 8, 4, 3, C.foam, 1); }
    },
    bones(x, y) { rect(x + 3, y + 10, 9, 2, '#d8d4c0'); rect(x + 4, y + 7, 2, 4, '#d8d4c0'); ellipse(x + 11, y + 8, 2, 2, '#d8d4c0'); },
    rune(x, y, o) {
      const g = .4 + Math.sin(tick * .1 + (o && o.i || 0)) * .3;
      alpha(g, () => { ellipse(x + 8, y + 8, 5, 5, C.arcane); });
      rect(x + 7, y + 4, 2, 8, '#d8c0ff'); rect(x + 4, y + 7, 8, 2, '#d8c0ff');
    },
    glowtile(x, y) {
      const g = .5 + Math.sin(tick * .07) * .3;
      alpha(g, () => rect(x + 2, y + 2, 12, 12, '#8ad4e8'));
      stroke(x + 1, y + 1, 14, 14, C.ice, 1);
    }
  };

  function drawProp(kind, tx, ty, o) {
    const f = PROPS[kind];
    if (f) f(tx * TILE, ty * TILE, o);
  }

  /* ================= CREATURES =================
     Drawn from a palette + flags so any race/monster is a data description. */

  function shadowBlob(cx, by, w) { alpha(.3, () => ellipse(cx, by, w, w * .35, '#000')); }

  /* Humanoid: 16x22-ish, feet at (cx, by). */
  function humanoid(cx, by, p, o) {
    o = o || {};
    const s = o.scale || 1;
    const bob = o.bob === false ? 0 : Math.round(Math.sin(tick * .12 + (o.phase || 0)) * (o.moving ? 1.4 : .7));
    const f = o.facing || 'down';
    const sk = p.skin || '#d8a878', hair = p.hair || '#3a2618';
    const cl = p.cloth || '#5a4a7a', cl2 = p.cloth2 || '#3a3050';
    const H = 22 * s, W = 12 * s;
    const x = cx - W / 2, top = by - H + bob;
    shadowBlob(cx, by, 6 * s);

    /* Tail first, so the legs and body paint over its root. Drawn after them it
       lay across the thighs like a belt, which is what looked wrong. It sweeps
       out low and behind, and thins toward the tip. */
    if (p.tail) {
      const w = Math.sin(tick * .1 + (o.phase || 0)) * 3 * s;
      const tc = p.tailCol || p.scales || p.fur || sk;
      const root = by - 7 * s + bob;                  // hip height, behind the legs
      poly([[cx - 1 * s, root - 1 * s], [cx - 7 * s + w, root - 3 * s],
      [cx - 10 * s + w, root + 1 * s], [cx - 6 * s + w, root + 2 * s],
      [cx - 1 * s, root + 2.5 * s]], tc);
      /* a darker underside sells the curve without a second silhouette */
      alpha(.35, () => poly([[cx - 6 * s + w, root + 1.2 * s],
      [cx - 10 * s + w, root + 1 * s], [cx - 6 * s + w, root + 2 * s]], '#000'));
    }

    // legs
    const stride = o.moving ? Math.round(Math.sin(tick * .3) * 2) : 0;
    rect(x + 2 * s, by - 7 * s + bob, 3.5 * s, 7 * s, cl2);
    rect(x + 6.5 * s, by - 7 * s + bob, 3.5 * s, 7 * s, cl2);
    /* the trailing leg sits in its own shadow, which is what separates the two */
    rect(x + 6.5 * s, by - 7 * s + bob, 1 * s, 7 * s, shade(cl2, .72));
    const boot = '#2b2118';
    rect(x + 1.5 * s + stride, by - 1.5 * s + bob, 4 * s, 2 * s, boot);
    rect(x + 6.5 * s - stride, by - 1.5 * s + bob, 4 * s, 2 * s, boot);
    rect(x + 1.5 * s + stride, by - .5 * s + bob, 4 * s, .75 * s, shade(boot, .6));   // soles
    rect(x + 6.5 * s - stride, by - .5 * s + bob, 4 * s, .75 * s, shade(boot, .6));
    // torso
    rect(x + 1.5 * s, top + 7 * s, 9 * s, 9 * s, cl);
    rect(x + 1.5 * s, top + 7 * s, 9 * s, 2 * s, p.cloth3 || cl2);
    /* lit from the upper left, so the body reads as a body and not a flat panel */
    rect(x + 1.5 * s, top + 9 * s, 1 * s, 7 * s, shade(cl, 1.18));
    rect(x + 9.5 * s, top + 9 * s, 1 * s, 7 * s, shade(cl, .74));
    if (p.armor) {
      rect(x + 1.5 * s, top + 8 * s, 9 * s, 5 * s, p.armor);
      rect(x + 1.5 * s, top + 8 * s, 9 * s, 1 * s, shade(p.armor, 1.25));
      rect(x + 5 * s, top + 8 * s, 2 * s, 5 * s, C.metal2);
    }
    if (p.belt) rect(x + 1.5 * s, top + 13 * s, 9 * s, 1.5 * s, p.belt);
    // arms
    const swing = o.moving ? Math.round(Math.sin(tick * .3) * 2) : 0;
    rect(x - .5 * s, top + 8 * s - swing, 2.5 * s, 7 * s, sk);
    rect(x + 10 * s, top + 8 * s + swing, 2.5 * s, 7 * s, sk);
    rect(x + 12 * s, top + 8 * s + swing, .5 * s, 7 * s, shade(sk, .76));   // outer edge
    if (p.sleeves) { rect(x - .5 * s, top + 8 * s - swing, 2.5 * s, 3.5 * s, cl); rect(x + 10 * s, top + 8 * s + swing, 2.5 * s, 3.5 * s, cl); }
    // head
    const hy = top + 1 * s;
    rect(x + 3.5 * s, hy + 6 * s, 5 * s, 1.5 * s, shade(sk, .7));     // neck, in shadow
    rect(x + 2.5 * s, hy, 7 * s, 7 * s, sk);
    rect(x + 8.5 * s, hy + 1 * s, 1 * s, 6 * s, shade(sk, .8));       // cheek turning away
    if (p.scales) { rect(x + 2.5 * s, hy, 7 * s, 2 * s, p.scales); rect(x + 8 * s, hy + 2 * s, 2 * s, 4 * s, p.scales); }
    // face
    if (f !== 'up') {
      const ey = hy + 3 * s;
      rect(x + 3 * s, ey - 1 * s, 6 * s, .75 * s, shade(sk, .72));    // brow
      if (f === 'left') { rect(x + 3 * s, ey, 1.5 * s, 1.5 * s, '#1a1410'); }
      else if (f === 'right') { rect(x + 7.5 * s, ey, 1.5 * s, 1.5 * s, '#1a1410'); }
      else {
        rect(x + 3.5 * s, ey, 1.5 * s, 1.5 * s, '#1a1410'); rect(x + 7 * s, ey, 1.5 * s, 1.5 * s, '#1a1410');
        rect(x + 5.5 * s, ey + 2.5 * s, 1.5 * s, .75 * s, shade(sk, .74));   // mouth
      }
    }
    if (p.snout && f !== 'up') { rect(x + (f === 'left' ? 1 * s : f === 'right' ? 8.5 * s : 4.5 * s), hy + 4.5 * s, 3 * s, 2.5 * s, p.scales || sk); }
    if (p.beard) { rect(x + 3 * s, hy + 5.5 * s, 6 * s, 3.5 * s, p.beard); rect(x + 4 * s, hy + 8 * s, 4 * s, 2 * s, p.beard); }
    // hair
    if (p.hairStyle !== 'bald') {
      rect(x + 2 * s, hy - 1 * s, 8 * s, 2.5 * s, hair);
      if (p.hairStyle === 'long') { rect(x + 1.5 * s, hy, 1.5 * s, 8 * s, hair); rect(x + 9 * s, hy, 1.5 * s, 8 * s, hair); }
      if (p.hairStyle === 'mohawk') { rect(x + 5 * s, hy - 3.5 * s, 2 * s, 3 * s, hair); }
      if (p.hairStyle === 'braid') { rect(x + 9 * s, hy + 1 * s, 1.5 * s, 9 * s, hair); }
      if (p.hairStyle === 'seaweed') { for (let i = 0; i < 4; i++) rect(x + 1 * s + i * 2.6 * s, hy - 1 * s, 1.5 * s, (7 + i % 2 * 4) * s, hair); }
    }
    // ears
    if (p.ears === 'long') { poly([[x + 2 * s, hy + 2 * s], [x - 1.5 * s, hy - 1 * s], [x + 2 * s, hy + 4 * s]], sk); poly([[x + 10 * s, hy + 2 * s], [x + 13.5 * s, hy - 1 * s], [x + 10 * s, hy + 4 * s]], sk); }
    if (p.ears === 'cat') { poly([[x + 3 * s, hy], [x + 4 * s, hy - 3.5 * s], [x + 6 * s, hy]], p.fur || sk); poly([[x + 6.5 * s, hy], [x + 8.5 * s, hy - 3.5 * s], [x + 9.5 * s, hy]], p.fur || sk); }
    // horns
    if (p.horns === 'curved') { poly([[x + 2 * s, hy], [x - 2 * s, hy - 3 * s], [x + 1 * s, hy + 2 * s]], p.hornCol || '#c8b898'); poly([[x + 10 * s, hy], [x + 14 * s, hy - 3 * s], [x + 11 * s, hy + 2 * s]], p.hornCol || '#c8b898'); }
    if (p.horns === 'bull') { rect(x - 2 * s, hy - 1 * s, 4 * s, 1.5 * s, '#e8dcc0'); rect(x + 10 * s, hy - 1 * s, 4 * s, 1.5 * s, '#e8dcc0'); rect(x - 2.5 * s, hy - 3 * s, 1.5 * s, 2.5 * s, '#e8dcc0'); rect(x + 13 * s, hy - 3 * s, 1.5 * s, 2.5 * s, '#e8dcc0'); }
    if (p.horns === 'spike') { poly([[x + 3 * s, hy - 1 * s], [x + 4 * s, hy - 4.5 * s], [x + 5 * s, hy - 1 * s]], p.hornCol || '#8a3f3a'); poly([[x + 7 * s, hy - 1 * s], [x + 8 * s, hy - 4.5 * s], [x + 9 * s, hy - 1 * s]], p.hornCol || '#8a3f3a'); }
    if (p.tusks) { rect(x + 3.5 * s, hy + 6 * s, 1.5 * s, 2 * s, '#e8dcc0'); rect(x + 7 * s, hy + 6 * s, 1.5 * s, 2 * s, '#e8dcc0'); }
    if (p.wings) {
      const flap = Math.sin(tick * .15) * 3;
      poly([[cx - 4 * s, by - 15 * s + bob], [cx - 13 * s, by - 20 * s - flap + bob], [cx - 11 * s, by - 11 * s + bob]], p.wingCol || '#5a4a7a');
      poly([[cx + 4 * s, by - 15 * s + bob], [cx + 13 * s, by - 20 * s - flap + bob], [cx + 11 * s, by - 11 * s + bob]], p.wingCol || '#5a4a7a');
    }
    // weapon
    if (o.weapon) drawWeapon(o.weapon, cx, by, s, f, bob, o);
    if (p.hat) { rect(x + 1 * s, hy - 2 * s, 10 * s, 2 * s, p.hat); rect(x + 3 * s, hy - 5 * s, 6 * s, 3 * s, p.hat); }
    if (p.hood) { rect(x + 1.5 * s, hy - 1.5 * s, 9 * s, 5 * s, p.hood); rect(x + 3 * s, hy + 3 * s, 6 * s, 2 * s, '#00000055'); }
    if (p.cloak) { rect(x + .5 * s, top + 6 * s, 11 * s, 12 * s, p.cloak); rect(x + 1.5 * s, top + 7 * s, 9 * s, 9 * s, cl); }
  }

  function drawWeapon(w, cx, by, s, f, bob, o) {
    const side = f === 'left' ? -1 : 1;
    const hx = cx + side * 7 * s, hy = by - 12 * s + bob;
    const swing = o && o.attacking ? -0.9 : 0;
    ctx.save();
    ctx.translate(R(hx - cam.x), R(hy - cam.y));
    ctx.rotate(side * (0.35 + swing));
    const P = (x, y, w2, h2, c) => { ctx.fillStyle = c; ctx.fillRect(R(x), R(y), R(w2), R(h2)); };
    switch (w) {
      case 'sword': P(-1 * s, -12 * s, 2 * s, 12 * s, C.metal2); P(-3 * s, -1 * s, 6 * s, 1.5 * s, C.goldDim); P(-1 * s, 0, 2 * s, 4 * s, C.wood3); break;
      case 'greatsword': P(-1.5 * s, -17 * s, 3 * s, 17 * s, C.metal2); P(-4 * s, -1 * s, 8 * s, 2 * s, C.goldDim); P(-1 * s, 0, 2 * s, 5 * s, C.wood3); break;
      case 'axe': P(-1 * s, -12 * s, 2 * s, 15 * s, C.wood3); poly([[0, -12 * s], [6 * s, -14 * s], [6 * s, -7 * s], [0, -8 * s]].map(p => [p[0], p[1]]), C.metal2, true); break;
      case 'mace': P(-1 * s, -10 * s, 2 * s, 13 * s, C.wood3); P(-3 * s, -14 * s, 6 * s, 5 * s, C.metal); break;
      case 'staff': P(-1 * s, -16 * s, 2 * s, 21 * s, C.wood); ctx.fillStyle = C.arcane; ctx.beginPath(); ctx.arc(0, -17 * s, 2.5 * s, 0, 6.3); ctx.fill(); break;
      case 'bow': ctx.strokeStyle = C.wood; ctx.lineWidth = 1.5 * s; ctx.beginPath(); ctx.arc(0, -6 * s, 7 * s, -1.2, 1.2); ctx.stroke(); P(3 * s, -13 * s, 1, 14 * s, '#e8dcc0'); break;
      case 'dagger': P(-.8 * s, -7 * s, 1.6 * s, 7 * s, C.metal2); P(-2 * s, -.5 * s, 4 * s, 1 * s, C.goldDim); break;
      case 'spear': P(-1 * s, -16 * s, 2 * s, 22 * s, C.wood); poly([[0, -21 * s], [2.5 * s, -15 * s], [-2.5 * s, -15 * s]], C.metal2, true); break;
      case 'hammer': P(-1 * s, -11 * s, 2 * s, 14 * s, C.wood3); P(-4 * s, -15 * s, 8 * s, 5 * s, C.stone2); break;
      case 'fists': P(-2 * s, -3 * s, 4 * s, 4 * s, o && o.brass ? '#4a7a9a' : '#d8a878'); break;
      case 'shield': break;
      default: break;
    }
    ctx.restore();
    if (o && o.shield) {
      ellipse(cx - side * 7 * s, by - 12 * s + bob, 4 * s, 5 * s, '#7a4a2a');
      ellipse(cx - side * 7 * s, by - 12 * s + bob, 2 * s, 2.5 * s, C.metal);
    }
  }

  /* Dragon-ish: from kobold-scale up to ancient. size in px of body length. */
  function dragon(cx, by, p, o) {
    o = o || {};
    const s = o.scale || 1;
    const col = p.scales || '#3a6b3f', col2 = p.belly || '#8a9a6a', wing = p.wingCol || col;
    const bob = Math.round(Math.sin(tick * .07 + (o.phase || 0)) * 1.6 * s);
    const y = by + bob;
    shadowBlob(cx, by, 14 * s);
    // tail
    const tw = Math.sin(tick * .06) * 5 * s;
    poly([[cx + 4 * s, y - 10 * s], [cx + 20 * s + tw, y - 16 * s], [cx + 24 * s + tw, y - 12 * s], [cx + 5 * s, y - 6 * s]], col);
    // wings behind
    const flap = Math.sin(tick * .09) * 5 * s;
    poly([[cx, y - 16 * s], [cx - 8 * s, y - 30 * s - flap], [cx + 10 * s, y - 26 * s - flap * .6], [cx + 4 * s, y - 14 * s]], wing);
    // legs
    rect(cx - 8 * s, y - 8 * s, 4 * s, 8 * s, col);
    rect(cx + 3 * s, y - 8 * s, 4 * s, 8 * s, col);
    rect(cx - 9 * s, y - 2 * s, 6 * s, 2 * s, '#2b2118');
    rect(cx + 2 * s, y - 2 * s, 6 * s, 2 * s, '#2b2118');
    // body
    ellipse(cx, y - 12 * s, 11 * s, 8 * s, col);
    ellipse(cx - 1 * s, y - 9 * s, 8 * s, 4 * s, col2);
    // neck + head
    const nx = cx - 10 * s, ny = y - 20 * s;
    poly([[cx - 4 * s, y - 16 * s], [nx - 2 * s, ny + 2 * s], [nx + 3 * s, ny + 6 * s], [cx + 1 * s, y - 12 * s]], col);
    ellipse(nx - 2 * s, ny, 7 * s, 5 * s, col);
    poly([[nx - 8 * s, ny + 1 * s], [nx - 14 * s, ny + 3 * s], [nx - 7 * s, ny + 4 * s]], col);  // snout
    // eye
    const glow = o.glowEyes;
    rect(nx - 4 * s, ny - 2 * s, 2.5 * s, 2 * s, glow ? C.gold : '#e8d048');
    if (glow) alpha(.5 + Math.sin(tick * .2) * .3, () => ellipse(nx - 3 * s, ny - 1 * s, 4 * s, 3 * s, C.gold));
    // horns
    poly([[nx - 1 * s, ny - 4 * s], [nx + 4 * s, ny - 10 * s], [nx + 2 * s, ny - 3 * s]], '#d8cca8');
    poly([[nx + 1 * s, ny - 4 * s], [nx + 7 * s, ny - 8 * s], [nx + 4 * s, ny - 3 * s]], '#c8bc98');
    // spine
    for (let i = 0; i < 4; i++) poly([[cx - 6 * s + i * 5 * s, y - 19 * s], [cx - 4 * s + i * 5 * s, y - 24 * s], [cx - 2 * s + i * 5 * s, y - 19 * s]], p.spine || '#d8cca8');
  }

  /* Blob with eye-tendrils: the fungal horror. */
  function eyeball(cx, by, p, o) {
    o = o || {};
    const s = o.scale || 1;
    const bob = Math.sin(tick * .05) * 3 * s;
    const y = by - 20 * s + bob;
    shadowBlob(cx, by, 13 * s);
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * 6.283 + tick * .02;
      const len = (14 + Math.sin(tick * .06 + i) * 4) * s;
      const ex = cx + Math.cos(a) * len, ey = y + Math.sin(a) * len * .7;
      lineTo(cx, y, ex, ey, '#8a5f6a', 2 * s);
      ellipse(ex, ey, 3 * s, 3 * s, '#e8dcd0');
      ellipse(ex + Math.cos(a) * s, ey + Math.sin(a) * s, 1.4 * s, 1.4 * s, '#1a1410');
    }
    ellipse(cx, y, 13 * s, 12 * s, p.body || '#9a5f6a');
    ellipse(cx - 3 * s, y - 3 * s, 5 * s, 4 * s, '#b87f8a');
    ellipse(cx, y + 3 * s, 6 * s, 4 * s, '#5a2f3a');
  }

  function construct(cx, by, p, o) {
    o = o || {};
    const s = o.scale || 1;
    const bob = o.moving ? Math.sin(tick * .2) * 1 : 0;
    const y = by + bob;
    shadowBlob(cx, by, 10 * s);
    rect(cx - 8 * s, y - 12 * s, 5 * s, 12 * s, p.metal || C.stone2);
    rect(cx + 3 * s, y - 12 * s, 5 * s, 12 * s, p.metal || C.stone2);
    rect(cx - 9 * s, y - 26 * s, 18 * s, 15 * s, p.metal2 || C.stone);
    rect(cx - 9 * s, y - 26 * s, 18 * s, 3 * s, C.stoneLite);
    rect(cx - 13 * s, y - 24 * s, 4 * s, 13 * s, p.metal || C.stone2);
    rect(cx + 9 * s, y - 24 * s, 4 * s, 13 * s, p.metal || C.stone2);
    rect(cx - 5 * s, y - 33 * s, 10 * s, 8 * s, p.metal2 || C.stone);
    rect(cx - 3 * s, y - 30 * s, 2 * s, 2 * s, p.eye || C.lava2);
    rect(cx + 1 * s, y - 30 * s, 2 * s, 2 * s, p.eye || C.lava2);
    if (p.rune) { alpha(.6 + Math.sin(tick * .1) * .3, () => rect(cx - 3 * s, y - 22 * s, 6 * s, 6 * s, C.arcane)); }
  }

  /* Quadruped beast: cat, owlbear, wolf. */
  function beast(cx, by, p, o) {
    o = o || {};
    const s = o.scale || 1;
    const fur = p.fur || '#7a7a82';
    const bob = o.moving ? Math.sin(tick * .3) * 1 : Math.sin(tick * .07) * .5;
    const y = by + bob;
    shadowBlob(cx, by, 8 * s);
    const tw = Math.sin(tick * .12) * 3 * s;
    lineTo(cx + 7 * s, y - 8 * s, cx + 12 * s + tw, y - 13 * s, fur, 2 * s);
    rect(cx - 7 * s, y - 5 * s, 2.5 * s, 5 * s, fur);
    rect(cx + 4 * s, y - 5 * s, 2.5 * s, 5 * s, fur);
    ellipse(cx, y - 8 * s, 9 * s, 5 * s, fur);
    ellipse(cx - 8 * s, y - 11 * s, 4.5 * s, 4 * s, fur);
    if (p.beak) { poly([[cx - 12 * s, y - 11 * s], [cx - 16 * s, y - 10 * s], [cx - 12 * s, y - 8 * s]], '#e8b048'); }
    else { poly([[cx - 10 * s, y - 14 * s], [cx - 9 * s, y - 17 * s], [cx - 7 * s, y - 13 * s]], fur); poly([[cx - 7 * s, y - 14 * s], [cx - 5 * s, y - 17 * s], [cx - 5 * s, y - 13 * s]], fur); }
    rect(cx - 10 * s, y - 11.5 * s, 1.5 * s, 1.5 * s, p.eye || '#e8d048');
    rect(cx - 7 * s, y - 11.5 * s, 1.5 * s, 1.5 * s, p.eye || '#e8d048');
  }

  function ooze(cx, by, p, o) {
    o = o || {};
    const s = o.scale || 1;
    const wob = Math.sin(tick * .06) * 2 * s;
    alpha(.55, () => {
      rect(cx - 12 * s, by - 24 * s - wob, 24 * s, 24 * s + wob, p.body || '#8ac4a8');
    });
    alpha(.85, () => { stroke(cx - 12 * s, by - 24 * s - wob, 24 * s, 24 * s + wob, '#a8e4c8', 1); });
    if (p.rotten) { alpha(.6, () => { ellipse(cx - 4 * s, by - 12 * s, 4 * s, 3 * s, '#6a7a5a'); ellipse(cx + 5 * s, by - 16 * s, 3 * s, 2 * s, '#6a7a5a'); }); }
  }

  const BODIES = { humanoid, dragon, eyeball, construct, beast, ooze };

  /** Main entry: draw any creature from its visual spec. */
  function creature(spec, cx, by, o) {
    const body = BODIES[(spec && spec.body) || 'humanoid'] || humanoid;
    body(cx, by, spec || {}, o || {});
  }

  /* ---------- portraits ----------
     A head-and-shoulders bust on its own canvas, for the dialogue box. The
     creature painters all draw through this module's ctx and camera, so rather
     than duplicating every sprite at portrait scale we point those two at a
     scratch canvas and let the existing art draw itself much larger.

     Framing differs by body: a humanoid is cropped to the head, while a dragon
     or a beast is only recognisable whole, and its head sits off to one side. */
  const FRAMING = {
    /* scale is derived so `keep` world-pixels of the figure fill the canvas.
       `feet` sits below the frame for a bust; pushing it past 22 leaves headroom
       for hair, horns and a mohawk, which were being clipped at the top. */
    humanoid: { keep: 13, feet: 24.5, cx: .5 },
    dragon: { keep: 42, feet: 4, cx: .66 },
    beast: { keep: 24, feet: 3, cx: .62 },
    construct: { keep: 38, feet: 3, cx: .5 },
    eyeball: { keep: 34, feet: 6, cx: .5 },
    ooze: { keep: 28, feet: 3, cx: .5 }
  };
  function portrait(spec, px) {
    px = px || 72;
    const c = document.createElement('canvas');
    c.width = px; c.height = px;
    const pctx = c.getContext('2d');
    pctx.imageSmoothingEnabled = false;

    /* a lit ground behind the figure, so pale and dark skins both read */
    const g = pctx.createLinearGradient(0, 0, 0, px);
    g.addColorStop(0, '#1d2740'); g.addColorStop(1, '#0c1120');
    pctx.fillStyle = g; pctx.fillRect(0, 0, px, px);

    const fr = FRAMING[(spec && spec.body) || 'humanoid'] || FRAMING.humanoid;
    const s = px / fr.keep;

    const savedCtx = ctx, sx = cam.x, sy = cam.y;
    ctx = pctx; cam.x = 0; cam.y = 0;
    try {
      creature(spec, px * fr.cx, fr.feet * s, { scale: s, facing: 'down', bob: false });
    } catch (e) {
      /* a portrait is decoration; never let a bad spec take the dialogue down */
      console.warn('portrait failed', e);
    } finally { ctx = savedCtx; cam.x = sx; cam.y = sy; }
    return c;
  }

  /* ================= PARTICLES ================= */
  function emit(kind, x, y, n, opts) {
    n = n || 8; opts = opts || {};
    for (let i = 0; i < n; i++) {
      const a = opts.dir != null ? opts.dir + (Math.random() - .5) * (opts.spread || 1) : Math.random() * 6.283;
      const sp = (opts.speed || 1) * (.5 + Math.random());
      particles.push({
        kind, x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (opts.up || 0),
        life: (opts.life || 30) * (.6 + Math.random() * .6), max: opts.life || 30,
        col: opts.col, size: opts.size || 2, grav: opts.grav == null ? .06 : opts.grav
      });
    }
  }
  const PCOL = {
    blood: ['#8a2320', '#c2453a', '#5a1512'], spark: ['#e8bd58', '#fff0c0', '#c2953a'],
    fire: ['#d4571f', '#f0a03c', '#ffd48a'], ice: ['#a8d8e8', '#e8f4f8', '#6aa8c8'],
    arcane: ['#9a6fd0', '#d8c0ff', '#6a3f9a'], poison: ['#5f9a3a', '#8ac45a', '#3a6a20'],
    smoke: ['#5a5a62', '#7a7a82', '#3a3a42'], water: ['#3f89a8', '#c8e4f0', '#2f6a8c'],
    dust: ['#8a7a5f', '#a89878', '#6b5340'], heal: ['#7fbf5f', '#c8e6b8', '#4a8a3a'],
    gold: ['#e8bd58', '#ffe8a8'], necro: ['#4a2a5a', '#7a4a8a', '#2a1a3a'],
    acid: ['#8ac42a', '#c8e45a', '#5a8a10'], spore: ['#9a7faa', '#c8b0d8']
  };
  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.vy += p.grav; p.life--;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      const pal = PCOL[p.kind] || PCOL.spark;
      const col = p.col || pal[(p.life * 0.3 | 0) % pal.length];
      const a = Math.min(1, p.life / (p.max * .6));
      alpha(a, () => rect(p.x, p.y, p.size, p.size, col));
    }
  }
  function clearParticles() { particles.length = 0; }

  /* ---------- hit flash ----------
     Every colour in a creature spec swapped for one flat colour, so the same
     painters that drew the figure can redraw it as a silhouette. That is how a
     hit registers on the body itself rather than only in a floating number. */
  function silhouette(spec, col) {
    const out = {};
    for (const k in spec) {
      const v = spec[k];
      out[k] = (typeof v === 'string' && v.charAt(0) === '#') ? col : v;
    }
    return out;
  }

  /* ---------- projectiles ----------
     An arrow or a firebolt has to cross the ground between two people, or the
     only evidence anything happened is the number that appears at the far end.
     bolt() resolves when the mote lands, so combat can await the travel and
     apply the damage on arrival. */
  const bolts = [];
  function bolt(x1, y1, x2, y2, o) {
    o = o || {};
    const b = {
      x1, y1, x2, y2, t: 0, dur: o.dur || 13, kind: o.kind || 'spark',
      size: o.size || 3, arc: o.arc || 0, trail: o.trail !== false, done: null
    };
    bolts.push(b);
    return new Promise(res => { b.done = res; });
  }
  function updateBolts() {
    for (let i = bolts.length - 1; i >= 0; i--) {
      const b = bolts[i];
      b.t++;
      const k = Math.min(1, b.t / b.dur);
      const x = b.x1 + (b.x2 - b.x1) * k;
      const y = b.y1 + (b.y2 - b.y1) * k - Math.sin(k * Math.PI) * b.arc;
      const pal = PCOL[b.kind] || PCOL.spark;
      if (b.trail) emit(b.kind, x, y, 1, { life: 11, speed: .25, grav: 0, size: 2 });
      alpha(.55, () => ellipse(x, y, b.size * 1.9, b.size * 1.9, pal[1] || pal[0]));
      rect(x - b.size / 2, y - b.size / 2, b.size, b.size, pal[0]);
      if (k >= 1) { bolts.splice(i, 1); if (b.done) b.done(); }
    }
  }
  function clearBolts() {
    /* a scene change must not leave combat waiting on a mote that will never land */
    while (bolts.length) { const b = bolts.pop(); if (b.done) b.done(); }
  }
  const boltCount = () => bolts.length;

  /* Floating combat text */
  function floater(str, x, y, col, size) {
    floaters.push({ str, x, y, col: col || C.ink, size: size || 10, life: 60, vy: -.6 });
  }
  function updateFloaters() {
    for (let i = floaters.length - 1; i >= 0; i--) {
      const f = floaters[i];
      f.y += f.vy; f.vy *= .96; f.life--;
      if (f.life <= 0) { floaters.splice(i, 1); continue; }
      alpha(Math.min(1, f.life / 24), () => {
        text(f.str, f.x - cam.x, f.y - cam.y, { color: f.col, size: f.size, align: 'center', bold: true });
      });
    }
  }
  function clearFloaters() { floaters.length = 0; }

  /* ================= OVERLAYS ================= */
  /* Drops are scattered by a stable hash rather than an arithmetic sequence,
     otherwise they line up into visible diagonal bands. */
  function rain(intensity, windX) {
    const n = Math.floor(90 * (intensity || 1));
    const wind = windX == null ? 3 : windX;
    ctx.lineWidth = 1;
    for (let pass = 0; pass < 2; pass++) {
      /* two passes: a faint far layer and a brighter near one */
      ctx.strokeStyle = pass ? 'rgba(198,224,245,.55)' : 'rgba(150,180,210,.28)';
      ctx.beginPath();
      const count = pass ? Math.floor(n * 0.45) : Math.floor(n * 0.55);
      for (let i = 0; i < count; i++) {
        const k = i + pass * 500;
        const x0 = hash(k, 7, 3) * (viewW() + 90) - 45;
        const speed = (pass ? 15 : 9) + hash(k, 13, 5) * 9;
        const len = pass ? 11 : 7;
        const y = mod2(hash(k, 3, 9) * (viewH() + 60) + tick * speed, viewH() + 60) - 30;
        const w = wind * (pass ? 1 : 0.7);
        ctx.moveTo(x0, y); ctx.lineTo(x0 - w, y + len);
      }
      ctx.stroke();
    }
  }
  function mod2(n, m) { return ((n % m) + m) % m; }
  function snowfall() {
    for (let i = 0; i < 40; i++) {
      const x = (i * 131 + Math.sin(tick * .02 + i) * 20 + tick * .6) % viewW();
      const y = (i * 71 + tick * (1.2 + i % 3 * .4)) % viewH();
      alpha(.7, () => rect(x, y, 2, 2, C.snow, true));
    }
  }
  function tintOverlay(col) { rect(0, 0, viewW(), viewH(), col, true); }
  /* Night lighting with light sources: [{x,y,r,col}] in world space */
  function lighting(darkness, lights) {
    if (darkness <= 0) return;
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(8,14,30,' + darkness + ')';
    ctx.fillRect(0, 0, viewW(), viewH());
    if (lights && lights.length) {
      ctx.globalCompositeOperation = 'destination-out';
      for (const L of lights) {
        const gx = L.x - cam.x, gy = L.y - cam.y;
        const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, L.r);
        const flick = L.flicker ? (1 + Math.sin(tick * .2 + gx) * .06) : 1;
        g.addColorStop(0, 'rgba(0,0,0,' + Math.min(1, darkness * 1.15 * flick) + ')');
        g.addColorStop(.6, 'rgba(0,0,0,' + darkness * .55 + ')');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(gx, gy, L.r * flick, 0, 6.283); ctx.fill();
      }
    }
    ctx.restore();
  }
  function vignette(strength) {
    const vw = viewW(), vh = viewH();
    const g = ctx.createRadialGradient(vw / 2, vh / 2, vh * .35, vw / 2, vh / 2, vh * .85);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,' + (strength || .5) + ')');
    ctx.fillStyle = g; ctx.fillRect(0, 0, vw, vh);
  }
  /* Lightning flash — call with 0..1 */
  function flash(a) { if (a > 0) rect(0, 0, viewW(), viewH(), 'rgba(200,225,255,' + a + ')', true); }

  /* Health bar above a creature */
  function healthBar(cx, y, w, frac, col) {
    const bw = w || 20;
    rect(cx - bw / 2 - 1, y - 1, bw + 2, 5, '#000');
    rect(cx - bw / 2, y, bw, 3, '#3a1a17');
    rect(cx - bw / 2, y, Math.max(0, bw * U.clamp(frac, 0, 1)), 3, col || '#d4574a');
  }

  return {
    VW, VH, TILE, CELL, C,
    init, resize, begin, end, shake, camFollow, camSnap, cam, toWorld,
    setZoom, getZoom, viewW, viewH,
    rect, stroke, ellipse, ellipseS, poly, lineTo, text, label, measure, alpha,
    drawTile, drawProp, TILES, PROPS,
    creature, humanoid, dragon, drawWeapon, portrait,
    emit, updateParticles, clearParticles, floater, updateFloaters, clearFloaters,
    silhouette, bolt, updateBolts, clearBolts, boltCount,
    rain, snowfall, tintOverlay, lighting, vignette, flash, healthBar, hash,
    get ctx() { return ctx; },
    get tick() { return tick; },
    get scale() { return scale; }
  };
})();
