/* Drakehaven Island — DOM UI layer: dialogue, dice popups, toasts, modals, banners. */
window.DH = window.DH || {};

DH.ui = (function () {
  'use strict';
  const U = DH.util;
  const A = () => DH.audio;

  const root = () => document.getElementById('ui');
  const toastRoot = () => document.getElementById('toasts');

  /* ---------- element helpers ---------- */
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function add(parent, tag, cls, html) { const e = el(tag, cls, html); parent.appendChild(e); return e; }
  /* Clearing the UI root destroys the nodes we cache, so drop the references too —
     otherwise the next say() would write into a detached element and vanish.
     Anything waiting on a dialogue is released so a scene change cannot deadlock
     a running story script. */
  function clear(node) {
    const r = root();
    node = node || r;
    while (node.firstChild) node.removeChild(node.firstChild);
    if (node === r) {
      dlgEl = null; promptEl = null; tipEl = null; modalWrap = null;
      clearTimeout(typing); typing = null;
      if (dlgResolve) { const f = dlgResolve; dlgResolve = null; f(); }
    }
  }
  function esc(s) {
    return String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  }
  /* Allow a tiny markup subset in story prose: *emphasis* and [gold]text[/] */
  function rich(s) {
    return esc(s)
      .replace(/\*([^*]+)\*/g, '<i>$1</i>')
      .replace(/\[gold\]([^\[]+)\[\/\]/g, '<span class="gold">$1</span>')
      .replace(/\[bad\]([^\[]+)\[\/\]/g, '<span class="bad">$1</span>')
      .replace(/\[good\]([^\[]+)\[\/\]/g, '<span class="good">$1</span>')
      .replace(/\n/g, '<br>');
  }
  function btn(label, cls, fn) {
    const b = el('button', cls || '', esc(label));
    b.onclick = (e) => { A().sfx('select'); fn && fn(e); };
    return b;
  }

  /* ---------- toasts ---------- */
  function toast(msg, kind, ms) {
    const t = el('div', 'toast ' + (kind || ''), rich(msg));
    toastRoot().appendChild(t);
    if (kind === 'item') A().sfx('quest');
    setTimeout(() => {
      t.style.transition = 'opacity .4s, transform .4s';
      t.style.opacity = '0'; t.style.transform = 'translateY(-10px)';
      setTimeout(() => t.remove(), 420);
    }, ms || 2200);
  }

  /* ---------- modal ---------- */
  let modalWrap = null;
  function modal(o) {
    closeModal();
    modalWrap = el('div', ''); modalWrap.id = 'modal-wrap';
    const m = add(modalWrap, 'div', 'modal panel gilt');
    if (o.title) add(m, 'h2', '', esc(o.title));
    if (o.html) add(m, 'div', '', o.html);
    if (o.build) o.build(m);
    const row = add(m, 'div', 'row');
    (o.buttons || [{ label: 'Close' }]).forEach(b => {
      row.appendChild(btn(b.label, b.cls, () => {
        if (b.fn) { if (b.fn() === false) return; }
        if (b.keepOpen !== true) closeModal();
      }));
    });
    root().appendChild(modalWrap);
    return m;
  }
  function closeModal() { if (modalWrap) { modalWrap.remove(); modalWrap = null; } }
  function modalOpen() { return !!modalWrap; }

  /* ---------- interaction prompt ---------- */
  let promptEl = null;
  function showPrompt(html) {
    if (promptEl && promptEl.parentNode !== root()) promptEl = null;
    if (!promptEl) { promptEl = el('div'); promptEl.id = 'prompt'; root().appendChild(promptEl); }
    promptEl.innerHTML = html;
    promptEl.classList.remove('hidden');
  }
  function hidePrompt() { if (promptEl) promptEl.classList.add('hidden'); }

  /* ---------- banner ---------- */
  function banner(big, small, ms) {
    const b = el('div'); b.id = 'banner';
    add(b, 'div', 'big', esc(big));
    if (small) add(b, 'div', 'sm', esc(small));
    root().appendChild(b);
    setTimeout(() => {
      b.style.transition = 'opacity .5s'; b.style.opacity = '0';
      setTimeout(() => b.remove(), 520);
    }, ms || 1500);
  }

  /* ---------- fade / chapter cards ---------- */
  function fader() {
    let f = document.getElementById('fader');
    if (!f) { f = el('div'); f.id = 'fader'; document.getElementById('stage').appendChild(f); }
    return f;
  }
  function fadeOut(ms) {
    const f = fader(); f.style.transitionDuration = ((ms || 450) / 1000) + 's';
    f.classList.add('on');
    return U.wait(ms || 450);
  }
  function fadeIn(ms) {
    const f = fader(); f.style.transitionDuration = ((ms || 450) / 1000) + 's';
    f.classList.remove('on');
    return U.wait(ms || 450);
  }
  async function chapter(num, title, sub, ms) {
    const c = el('div'); c.id = 'chapter';
    if (num) add(c, 'div', 'n', esc(num));
    add(c, 'div', 't', esc(title));
    if (sub) add(c, 'div', 's', esc(sub));
    c.style.opacity = '0'; c.style.transition = 'opacity .6s';
    root().appendChild(c);
    await U.wait(30); c.style.opacity = '1';
    await U.wait(ms || 2600);
    c.style.opacity = '0';
    await U.wait(650);
    c.remove();
  }

  /* ---------- tooltip ---------- */
  let tipEl = null;
  function tip(html, sx, sy) {
    if (tipEl && tipEl.parentNode !== root()) tipEl = null;
    if (!tipEl) { tipEl = el('div'); tipEl.id = 'tooltip'; root().appendChild(tipEl); }
    tipEl.innerHTML = html;
    tipEl.classList.remove('hidden');
    const w = tipEl.offsetWidth, h = tipEl.offsetHeight;
    tipEl.style.left = Math.min(window.innerWidth - w - 8, sx + 14) + 'px';
    tipEl.style.top = Math.max(6, sy - h - 10) + 'px';
  }
  function hideTip() { if (tipEl) tipEl.classList.add('hidden'); }

  /* ================= DIALOGUE =================
     say() resolves when the player advances. */
  let dlgEl = null, dlgResolve = null, typing = null;

  function ensureDlg() {
    /* rebuild if it was never made, or if a scene change took it out of the page */
    if (dlgEl && dlgEl.parentNode !== root()) dlgEl = null;
    if (!dlgEl) {
      dlgEl = el('div'); dlgEl.id = 'dlg';
      const box = add(dlgEl, 'div', 'box');
      add(box, 'div', 'who');
      add(box, 'div', 'txt');
      add(box, 'div', 'next', '▼ space');
      add(dlgEl, 'div', 'choices');
      root().appendChild(dlgEl);
      dlgEl.addEventListener('mousedown', (e) => {
        if (e.target.closest('.ch')) return;
        advance();
      });
    }
    dlgEl.classList.remove('hidden');
    return dlgEl;
  }
  function hideDlg() { if (dlgEl) dlgEl.classList.add('hidden'); }
  function dlgVisible() { return dlgEl && !dlgEl.classList.contains('hidden'); }

  /* Type text out, then wait for input. */
  function say(o) {
    if (typeof o === 'string') o = { text: o };
    const d = ensureDlg();
    const box = d.querySelector('.box');
    const who = d.querySelector('.who'), txt = d.querySelector('.txt'), next = d.querySelector('.next');
    d.querySelector('.choices').innerHTML = '';
    who.textContent = o.who || '';
    who.className = 'who' + (o.who ? '' : ' narr') + (o.narr ? ' narr' : '');
    who.style.display = o.who ? '' : 'none';
    next.style.visibility = 'hidden';

    const full = rich(o.text || '');
    clearTimeout(typing);
    /* Typewriter that respects the html tags we inject. */
    const plain = (o.text || '');
    let i = 0;
    const speed = o.instant ? 0 : 14;
    function step() {
      i += o.fast ? 3 : 1;
      if (i >= plain.length) {
        txt.innerHTML = full;
        next.style.visibility = 'visible';
        typing = null;
        return;
      }
      txt.innerHTML = rich(plain.slice(0, i));
      typing = setTimeout(step, speed);
    }
    if (speed === 0) { txt.innerHTML = full; next.style.visibility = 'visible'; }
    else { txt.innerHTML = ''; step(); }

    return new Promise(res => { dlgResolve = res; });
  }
  /* Space/click: finish typing first, then resolve. */
  function advance() {
    if (!dlgVisible()) return false;
    if (typing) {
      clearTimeout(typing); typing = null;
      const txt = dlgEl.querySelector('.txt');
      if (txt && lastFull != null) txt.innerHTML = lastFull;
      const next = dlgEl.querySelector('.next');
      if (next) next.style.visibility = 'visible';
      return true;
    }
    if (dlgResolve) {
      const r = dlgResolve; dlgResolve = null;
      A().sfx('select');
      r();
      return true;
    }
    return false;
  }
  let lastFull = null;
  /* wrap say to remember the full html for skip-typing */
  const _say = say;
  say = function (o) {
    if (typeof o === 'string') o = { text: o };
    lastFull = rich(o.text || '');
    return _say(o);
  };

  /** choose(options) → index. Options: [{text, hint, locked, lockNote}] */
  function choose(options, o) {
    o = o || {};
    const d = ensureDlg();
    const wrap = d.querySelector('.choices');
    wrap.innerHTML = '';
    d.querySelector('.next').style.visibility = 'hidden';
    if (o.text != null) {
      const txt = d.querySelector('.txt'), who = d.querySelector('.who');
      who.textContent = o.who || ''; who.style.display = o.who ? '' : 'none';
      who.className = 'who' + (o.who ? '' : ' narr');
      txt.innerHTML = rich(o.text);
      lastFull = txt.innerHTML;
    }
    return new Promise(res => {
      dlgResolve = null;
      options.forEach((opt, i) => {
        const c = el('div', 'ch' + (opt.locked ? ' locked' : ''));
        c.innerHTML = rich(typeof opt === 'string' ? opt : opt.text) +
          (opt.hint ? '<span class="req">' + esc(opt.hint) + '</span>' : '') +
          (opt.locked && opt.lockNote ? '<span class="req">' + esc(opt.lockNote) + '</span>' : '');
        c.onmousedown = (e) => {
          e.stopPropagation();
          if (opt.locked) { A().sfx('cancel'); return; }
          A().sfx('confirm');
          wrap.innerHTML = '';
          res(i);
        };
        wrap.appendChild(c);
      });
    });
  }

  /* ================= DICE POPUP ================= */
  /* roller({label, dc, mod, adv, dis, bonusDice, kind:'check'|'save'|'attack'}) → result */
  function d20svg(natural) {
    const col = natural === 20 ? '#e8bd58' : natural === 1 ? '#c2453a' : '#7d8798';
    return '<svg viewBox="0 0 100 100"><polygon points="50,4 94,28 94,72 50,96 6,72 6,28" ' +
      'fill="#1b2233" stroke="' + col + '" stroke-width="4"/>' +
      '<polygon points="50,4 94,28 50,52 6,28" fill="#232c40" stroke="' + col + '" stroke-width="2"/>' +
      '<polygon points="50,52 94,28 94,72 50,96" fill="#161d2c" stroke="' + col + '" stroke-width="2"/>' +
      '</svg>';
  }
  async function roller(o) {
    const res = DH.dice.d20(o);
    const wrap = el('div'); wrap.id = 'roller'; wrap.className = 'spin';
    const card = add(wrap, 'div', 'card panel gilt');
    add(card, 'div', 'what', esc(o.label || 'Ability Check'));
    if (o.dc != null) add(card, 'div', 'dc', 'Difficulty Class ' + o.dc);
    if (res.adv) add(card, 'div', 'adv gold', '◆ ADVANTAGE ◆');
    if (res.dis) add(card, 'div', 'adv bad', '◆ DISADVANTAGE ◆');
    const die = add(card, 'div', 'die');
    die.innerHTML = d20svg(res.natural) + '<span class="n">?</span>';
    const math = add(card, 'div', 'math', '&nbsp;');
    const total = add(card, 'div', 'total', '&nbsp;');
    const verdict = add(card, 'div', 'verdict', '&nbsp;');
    const row = add(card, 'div', 'row');
    root().appendChild(wrap);

    A().sfx('dice');
    /* tumble through random faces */
    for (let i = 0; i < 9; i++) {
      die.querySelector('.n').textContent = DH.dice.d(20);
      await U.wait(45);
    }
    const nEl = die.querySelector('.n');
    nEl.textContent = res.natural;
    if (res.crit) { nEl.className = 'n nat20'; A().sfx('crit'); }
    else if (res.fumble) { nEl.className = 'n nat1'; A().sfx('cancel'); }
    else { nEl.className = 'n'; A().sfx('confirm'); }
    wrap.classList.remove('spin');

    const bits = [];
    if (res.both.length > 1) bits.push('rolled ' + res.both.join(' and ') + ', kept ' + res.natural);
    if (res.mod) bits.push(U.plus(res.mod) + ' ' + (o.modLabel || 'modifier'));
    if (res.bonus) bits.push(U.plus(res.bonus) + ' from ' + res.bonusDice);
    math.innerHTML = esc(bits.join('  •  ')) || '&nbsp;';
    total.textContent = res.total;
    await U.wait(220);

    if (o.dc != null) {
      verdict.textContent = res.crit && res.success ? 'CRITICAL SUCCESS'
        : res.fumble ? 'CRITICAL FAILURE'
          : res.success ? 'SUCCESS' : 'FAILURE';
      verdict.className = 'verdict ' + (res.success ? 'good' : 'bad');
    } else { verdict.textContent = ''; }

    await new Promise(done => {
      row.appendChild(btn('Continue', 'primary', done));
      const key = (e) => {
        if (e.code === 'Space' || e.code === 'Enter') { window.removeEventListener('keydown', key); done(); }
      };
      window.addEventListener('keydown', key);
      setTimeout(() => { if (wrap.parentNode) { /* let them read it */ } }, 50);
    });
    wrap.remove();
    return res;
  }

  /* Quick, no-popup roll that just logs — used by combat where the log is enough. */
  function quickRoll(o) { return DH.dice.d20(o); }

  /* ---------- key handling for dialogue ---------- */
  window.addEventListener('keydown', (e) => {
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    if ((e.code === 'Space' || e.code === 'Enter') && dlgVisible()) {
      e.preventDefault();
      advance();
    }
  });

  return {
    el, add, clear, esc, rich, btn, toast,
    modal, closeModal, modalOpen,
    showPrompt, hidePrompt, banner,
    fadeOut, fadeIn, chapter,
    tip, hideTip,
    say: (o) => say(o), choose, hideDlg, dlgVisible, advance,
    roller, quickRoll, d20svg
  };
})();
