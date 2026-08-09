/* Drakehaven Island — keyboard and mouse. */
window.DH = window.DH || {};

DH.input = (function () {
  'use strict';

  const held = Object.create(null);      // physical code -> true
  const pressed = Object.create(null);   // consumed once per frame
  const mouse = { x: 0, y: 0, sx: 0, sy: 0, down: false, clicked: false, rclicked: false, wheel: 0 };
  let enabled = true;

  const MAP = {
    up: ['KeyW', 'ArrowUp'], down: ['KeyS', 'ArrowDown'],
    left: ['KeyA', 'ArrowLeft'], right: ['KeyD', 'ArrowRight'],
    use: ['Space', 'KeyE', 'Enter'], cancel: ['Escape'],
    sheet: ['KeyC'], journal: ['KeyJ'], inventory: ['KeyI'], map: ['KeyM'],
    run: ['ShiftLeft', 'ShiftRight'], endturn: ['KeyT'], pod: ['KeyP'], help: ['F1', 'Slash']
  };

  function isDown(action) {
    const codes = MAP[action]; if (!codes) return false;
    for (const c of codes) if (held[c]) return true;
    return false;
  }
  /** True once per key press. */
  function tapped(action) {
    const codes = MAP[action]; if (!codes) return false;
    for (const c of codes) if (pressed[c]) { delete pressed[c]; return true; }
    return false;
  }
  function anyTapped() {
    for (const k in pressed) { delete pressed[k]; return true; }
    return false;
  }
  /** Axis vector from held movement keys, normalised for diagonals. */
  function axis() {
    let x = (isDown('right') ? 1 : 0) - (isDown('left') ? 1 : 0);
    let y = (isDown('down') ? 1 : 0) - (isDown('up') ? 1 : 0);
    if (x && y) { const k = Math.SQRT1_2; x *= k; y *= k; }
    return { x, y };
  }

  function clearFrame() {
    mouse.clicked = false; mouse.rclicked = false; mouse.wheel = 0;
  }
  function clearAll() {
    for (const k in held) delete held[k];
    for (const k in pressed) delete pressed[k];
  }

  function init(canvas) {
    window.addEventListener('keydown', (e) => {
      if (!enabled) return;
      if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
      if (!held[e.code]) pressed[e.code] = true;
      held[e.code] = true;
      // stop the page scrolling / F1 help
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'F1', 'Tab'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => { delete held[e.code]; });
    window.addEventListener('blur', clearAll);

    /* Mouse in *virtual* canvas pixels (mouse.x/y) and screen pixels (sx/sy) */
    function updateMouse(e) {
      const r = canvas.getBoundingClientRect();
      mouse.sx = e.clientX; mouse.sy = e.clientY;
      mouse.x = (e.clientX - r.left) / r.width * canvas.width;
      mouse.y = (e.clientY - r.top) / r.height * canvas.height;
    }
    canvas.addEventListener('mousemove', updateMouse);
    canvas.addEventListener('mousedown', (e) => {
      updateMouse(e);
      if (e.button === 0) { mouse.down = true; mouse.clicked = true; }
      if (e.button === 2) mouse.rclicked = true;
    });
    window.addEventListener('mouseup', () => { mouse.down = false; });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.addEventListener('wheel', (e) => { mouse.wheel = Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });

    /* touch: treat as click-to-move */
    canvas.addEventListener('touchstart', (e) => {
      const t = e.touches[0]; if (!t) return;
      updateMouse({ clientX: t.clientX, clientY: t.clientY });
      mouse.clicked = true; mouse.down = true;
    }, { passive: true });
    canvas.addEventListener('touchend', () => { mouse.down = false; }, { passive: true });
  }

  return {
    init, isDown, tapped, anyTapped, axis, mouse, clearFrame, clearAll,
    set enabled(v) { enabled = v; if (!v) clearAll(); },
    get enabled() { return enabled; },
    MAP
  };
})();
