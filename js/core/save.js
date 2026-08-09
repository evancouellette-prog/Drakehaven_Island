/* Drakehaven Island — three save slots in localStorage. */
window.DH = window.DH || {};

DH.save = (function () {
  'use strict';
  const KEY = 'drakehaven.slot.';
  const CFG = 'drakehaven.config';
  const VERSION = 1;

  function has(slot) { return !!read(slot); }

  function read(slot) {
    try {
      const raw = localStorage.getItem(KEY + slot);
      if (!raw) return null;
      const o = JSON.parse(raw);
      if (!o || o.version !== VERSION) return null;
      return o;
    } catch (e) { return null; }
  }

  function write(slot, state) {
    try {
      const blob = {
        version: VERSION,
        stamp: Date.now(),
        state: state
      };
      localStorage.setItem(KEY + slot, JSON.stringify(blob));
      return true;
    } catch (e) {
      DH.ui && DH.ui.toast('Could not save — storage is full or blocked.', 'bad');
      return false;
    }
  }

  function wipe(slot) { try { localStorage.removeItem(KEY + slot); } catch (e) { } }

  /** Short human summary for the load menu. */
  function summary(slot) {
    const s = read(slot);
    if (!s || !s.state || !s.state.party || !s.state.party[0]) return null;
    const pc = s.state.party[0];
    const d = new Date(s.stamp);
    return {
      name: pc.name || 'Unnamed',
      line: (pc.raceName || '') + ' ' + (pc.className || '') + ' — Level ' + (pc.level || 1),
      place: s.state.placeName || s.state.map || '',
      day: s.state.day || 1,
      when: d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  /* ---------- config (volumes, options) ---------- */
  function loadConfig() {
    try { return JSON.parse(localStorage.getItem(CFG)) || {}; } catch (e) { return {}; }
  }
  function saveConfig(c) {
    try { localStorage.setItem(CFG, JSON.stringify(c)); } catch (e) { }
  }

  return { has, read, write, wipe, summary, loadConfig, saveConfig, VERSION };
})();
