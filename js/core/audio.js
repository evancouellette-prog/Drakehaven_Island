/* Drakehaven Island — all sound is synthesized at runtime. No audio files.
   A small subtractive synth + a 16th-note step sequencer + noise ambience. */
window.DH = window.DH || {};

DH.audio = (function () {
  'use strict';
  const U = DH.util;

  let ac = null, master = null, musicBus = null, sfxBus = null, ambBus = null;
  let noiseBuf = null;
  let vol = { master: 0.7, music: 0.5, sfx: 0.8 };
  let current = null;         // current track id
  let seqTimer = null, step = 0, nextTime = 0, playing = null, trackGain = null;
  let ambNodes = null, ambKind = null;
  let ready = false, muted = false;

  /* ---------- note names ---------- */
  const NOTES = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
  function freq(name) {
    if (typeof name === 'number') return name;
    const m = /^([A-G][#b]?)(-?\d)$/.exec(name);
    if (!m) return 440;
    const semis = NOTES[m[1]] + (parseInt(m[2], 10) + 1) * 12;   // C4 = 60
    return 440 * Math.pow(2, (semis - 69) / 12);
  }

  function init() {
    if (ac) return true;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return false;
    ac = new Ctx();
    master = ac.createGain(); master.gain.value = vol.master; master.connect(ac.destination);
    musicBus = ac.createGain(); musicBus.gain.value = vol.music; musicBus.connect(master);
    sfxBus = ac.createGain(); sfxBus.gain.value = vol.sfx; sfxBus.connect(master);
    ambBus = ac.createGain(); ambBus.gain.value = 0.0; ambBus.connect(master);

    // 2s of white noise, reused for drums, rain, thunder, breath weapons
    const n = ac.sampleRate * 2;
    noiseBuf = ac.createBuffer(1, n, ac.sampleRate);
    const dd = noiseBuf.getChannelData(0);
    for (let i = 0; i < n; i++) dd[i] = Math.random() * 2 - 1;
    ready = true;
    return true;
  }
  /* Browsers require a gesture before audio starts. */
  function unlock() {
    if (!init()) return;
    if (ac.state === 'suspended') ac.resume();
  }

  /* ---------- one synth voice ---------- */
  function voice(o) {
    if (!ready || muted) return;
    const t = o.at != null ? o.at : ac.currentTime;
    const dur = o.dur || 0.2;
    const bus = o.bus || sfxBus;
    const g = ac.createGain();
    const peak = (o.gain == null ? 0.3 : o.gain);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + (o.atk || 0.01));
    if (o.hold) g.gain.setValueAtTime(Math.max(0.0002, peak), t + (o.atk || 0.01) + o.hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    let src;
    if (o.wave === 'noise') {
      src = ac.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
      src.playbackRate.value = o.rate || 1;
    } else {
      src = ac.createOscillator();
      src.type = o.wave || 'square';
      const f0 = freq(o.note || o.freq || 220);
      src.frequency.setValueAtTime(f0, t);
      if (o.to) src.frequency.exponentialRampToValueAtTime(Math.max(1, freq(o.to)), t + dur);
      if (o.vib) {
        const lfo = ac.createOscillator(), la = ac.createGain();
        lfo.frequency.value = o.vib; la.gain.value = o.vibDepth || 4;
        lfo.connect(la); la.connect(src.frequency); lfo.start(t); lfo.stop(t + dur);
      }
    }
    let node = src;
    if (o.filter) {
      const f = ac.createBiquadFilter();
      f.type = o.filter; f.frequency.setValueAtTime(o.cut || 1200, t);
      if (o.cutTo) f.frequency.exponentialRampToValueAtTime(Math.max(40, o.cutTo), t + dur);
      f.Q.value = o.q || 1;
      node.connect(f); node = f;
    }
    node.connect(g); g.connect(bus);
    src.start(t); src.stop(t + dur + 0.02);
    return src;
  }

  /* ================= SFX ================= */
  const SFX = {
    select:   () => voice({ wave: 'square', note: 'E5', dur: 0.06, gain: 0.10 }),
    confirm:  () => { voice({ wave: 'square', note: 'C5', dur: 0.07, gain: 0.13 }); voice({ wave: 'square', note: 'G5', dur: 0.1, gain: 0.11, at: ac.currentTime + 0.06 }); },
    cancel:   () => voice({ wave: 'square', note: 'A3', to: 'E3', dur: 0.12, gain: 0.12 }),
    step:     () => voice({ wave: 'noise', dur: 0.05, gain: 0.05, filter: 'bandpass', cut: 900, q: 2 }),
    hit:      () => { voice({ wave: 'noise', dur: 0.14, gain: 0.3, filter: 'lowpass', cut: 1800, cutTo: 200 }); voice({ wave: 'triangle', note: 110, to: 55, dur: 0.16, gain: 0.24 }); },
    crit:     () => { voice({ wave: 'noise', dur: 0.25, gain: 0.34, filter: 'lowpass', cut: 3000, cutTo: 200 }); [0, .05, .1].forEach((d, i) => voice({ wave: 'square', note: ['C5', 'E5', 'G5'][i], dur: 0.16, gain: 0.16, at: ac.currentTime + d })); },
    miss:     () => voice({ wave: 'noise', dur: 0.13, gain: 0.16, filter: 'highpass', cut: 1400 }),
    dice:     () => { for (let i = 0; i < 5; i++) voice({ wave: 'noise', dur: 0.03, gain: 0.11, filter: 'bandpass', cut: 1600 + i * 500, q: 6, at: ac.currentTime + i * 0.045 }); },
    coin:     () => { voice({ wave: 'square', note: 'B5', dur: 0.07, gain: 0.12 }); voice({ wave: 'square', note: 'E6', dur: 0.14, gain: 0.10, at: ac.currentTime + 0.06 }); },
    heal:     () => [0, .07, .14].forEach((d, i) => voice({ wave: 'sine', note: ['E5', 'A5', 'C6'][i], dur: 0.4, gain: 0.16, at: ac.currentTime + d })),
    spell:    () => voice({ wave: 'triangle', note: 'A4', to: 'A6', dur: 0.35, gain: 0.16, vib: 14, vibDepth: 20 }),
    fire:     () => voice({ wave: 'noise', dur: 0.7, gain: 0.3, filter: 'lowpass', cut: 900, cutTo: 160, rate: 0.6 }),
    ice:      () => { voice({ wave: 'noise', dur: 0.4, gain: 0.18, filter: 'highpass', cut: 3200 }); voice({ wave: 'sine', note: 'C6', to: 'C5', dur: 0.4, gain: 0.1 }); },
    thunder:  () => { voice({ wave: 'noise', dur: 1.8, gain: 0.42, filter: 'lowpass', cut: 420, cutTo: 60, rate: 0.35 }); voice({ wave: 'sine', note: 46, to: 24, dur: 1.4, gain: 0.3 }); },
    splash:   () => voice({ wave: 'noise', dur: 0.5, gain: 0.24, filter: 'bandpass', cut: 1300, cutTo: 320, q: 1.4 }),
    door:     () => { voice({ wave: 'noise', dur: 0.35, gain: 0.14, filter: 'lowpass', cut: 500, rate: 0.5 }); voice({ wave: 'triangle', note: 70, to: 48, dur: 0.35, gain: 0.14 }); },
    roar:     () => { voice({ wave: 'sawtooth', note: 78, to: 42, dur: 1.1, gain: 0.3, vib: 22, vibDepth: 14, filter: 'lowpass', cut: 1100, cutTo: 300 }); voice({ wave: 'noise', dur: 1.1, gain: 0.2, filter: 'lowpass', cut: 700, rate: 0.5 }); },
    shield:   () => { voice({ wave: 'sine', note: 'D5', to: 'D6', dur: 0.26, gain: 0.16 }); voice({ wave: 'square', note: 'A5', dur: 0.1, gain: 0.08, at: ac.currentTime + 0.1 }); },
    levelup:  () => ['C5', 'E5', 'G5', 'C6', 'E6'].forEach((n, i) => voice({ wave: 'square', note: n, dur: 0.3, gain: 0.15, at: ac.currentTime + i * 0.1 })),
    death:    () => ['A4', 'F4', 'D4', 'A3'].forEach((n, i) => voice({ wave: 'triangle', note: n, dur: 0.6, gain: 0.2, at: ac.currentTime + i * 0.18 })),
    quest:    () => ['G5', 'B5', 'D6'].forEach((n, i) => voice({ wave: 'triangle', note: n, dur: 0.35, gain: 0.14, at: ac.currentTime + i * 0.09 })),
    dig:      () => voice({ wave: 'noise', dur: 0.22, gain: 0.2, filter: 'lowpass', cut: 700, cutTo: 200, rate: 0.7 }),
    bottle:   () => { voice({ wave: 'noise', dur: 0.3, gain: 0.2, filter: 'highpass', cut: 2600 }); voice({ wave: 'square', note: 'B6', dur: 0.1, gain: 0.07 }); },
    growl:    () => voice({ wave: 'sawtooth', note: 60, to: 40, dur: 0.5, gain: 0.16, filter: 'lowpass', cut: 500 }),
    meow:     () => voice({ wave: 'sawtooth', note: 'A5', to: 'D5', dur: 0.3, gain: 0.12, vib: 10, vibDepth: 22, filter: 'lowpass', cut: 2400 })
  };
  function sfx(id) { if (!ready) return; if (ac.state === 'suspended') return; const f = SFX[id]; if (f) try { f(); } catch (e) { } }

  /* ================= MUSIC ================= */
  /* A track: {bpm, steps, chans:[{wave,gain,oct,pat:[...]}]}
     Pattern entries: note name, or null for rest, or '-' to sustain. */
  const _ = null;
  const TRACKS = {
    /* Title: slow, wide, minor-key sea */
    title: {
      bpm: 68, steps: 32,
      chans: [
        { wave: 'triangle', gain: 0.15, dur: 1.6, pat: ['D3', _, _, _, _, _, _, _, 'A2', _, _, _, _, _, _, _, 'F3', _, _, _, _, _, _, _, 'C3', _, _, _, _, _, _, _] },
        { wave: 'sine', gain: 0.11, dur: 1.2, pat: ['A4', _, _, _, 'D5', _, _, _, 'F5', _, _, _, 'E5', _, _, _, 'D5', _, _, _, 'C5', _, _, _, 'A4', _, _, _, _, _, _, _] },
        { wave: 'sine', gain: 0.06, dur: 2.4, pat: ['D4', _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, 'F4', _, _, _, _, _, _, _, _, _, _, _, _, _, _, _] }
      ]
    },
    /* The storm aboard the Mary Parker: tense, rolling */
    storm: {
      bpm: 96, steps: 32,
      chans: [
        { wave: 'sawtooth', gain: 0.11, dur: 0.36, filter: 'lowpass', cut: 700, pat: ['D2', 'D2', _, 'D2', _, 'D2', 'D2', _, 'C2', 'C2', _, 'C2', _, 'C2', 'C2', _, 'Bb1', 'Bb1', _, 'Bb1', _, 'Bb1', 'Bb1', _, 'C2', 'C2', _, 'C2', 'A1', _, 'A1', _] },
        { wave: 'square', gain: 0.07, dur: 0.3, pat: [_, _, 'A4', _, 'D5', _, _, 'C5', _, _, 'A4', _, 'F4', _, _, _, _, _, 'A4', _, 'D5', _, 'E5', _, 'F5', _, 'E5', _, 'D5', _, _, _] },
        { wave: 'noise', gain: 0.10, dur: 0.1, filter: 'bandpass', cut: 220, q: 1.2, pat: ['x', _, _, _, 'x', _, 'x', _, 'x', _, _, _, 'x', _, 'x', _, 'x', _, _, _, 'x', _, 'x', _, 'x', _, 'x', _, 'x', 'x', _, _] }
      ]
    },
    /* Town of Drakehaven: bright, bouncing, Stardew-ish */
    town: {
      bpm: 118, steps: 32,
      chans: [
        { wave: 'triangle', gain: 0.13, dur: 0.24, pat: ['G2', _, 'D3', _, 'G2', _, 'D3', _, 'C3', _, 'G3', _, 'C3', _, 'G3', _, 'D3', _, 'A3', _, 'D3', _, 'A3', _, 'G2', _, 'D3', _, 'G3', _, 'D3', _] },
        { wave: 'square', gain: 0.085, dur: 0.2, pat: ['G4', 'A4', 'B4', _, 'D5', _, 'B4', _, 'C5', _, 'E5', _, 'D5', 'C5', 'B4', _, 'A4', 'B4', 'C5', _, 'E5', _, 'D5', _, 'B4', _, 'G4', _, 'G4', _, _, _] },
        { wave: 'sine', gain: 0.05, dur: 0.5, pat: ['B3', _, _, _, _, _, _, _, 'E4', _, _, _, _, _, _, _, 'F#4', _, _, _, _, _, _, _, 'D4', _, _, _, _, _, _, _] },
        { wave: 'noise', gain: 0.055, dur: 0.06, filter: 'bandpass', cut: 2400, q: 3, pat: [_, _, 'x', _, _, _, 'x', _, _, _, 'x', _, _, _, 'x', _, _, _, 'x', _, _, _, 'x', _, _, _, 'x', _, _, 'x', 'x', _] }
      ]
    },
    /* The Dragon's Keg: folk waltz, 3/4 feel */
    tavern: {
      bpm: 132, steps: 24,
      chans: [
        { wave: 'triangle', gain: 0.13, dur: 0.3, pat: ['C3', _, _, 'G3', _, _, 'C3', _, _, 'G3', _, _, 'F3', _, _, 'C4', _, _, 'G3', _, _, 'G3', _, _] },
        { wave: 'square', gain: 0.09, dur: 0.22, pat: ['E5', _, 'G5', 'E5', _, 'C5', 'D5', _, 'E5', 'D5', _, 'C5', 'A4', _, 'C5', 'F5', _, 'E5', 'D5', _, 'B4', 'C5', _, _] },
        { wave: 'sine', gain: 0.055, dur: 0.28, pat: [_, 'G4', _, _, 'B4', _, _, 'G4', _, _, 'B4', _, _, 'A4', _, _, 'C5', _, _, 'B4', _, _, 'D5', _] }
      ]
    },
    /* Battle: driving, low, percussive */
    battle: {
      bpm: 146, steps: 32,
      chans: [
        { wave: 'sawtooth', gain: 0.12, dur: 0.16, filter: 'lowpass', cut: 900, pat: ['E2', 'E2', 'E2', _, 'E2', _, 'G2', _, 'E2', 'E2', 'E2', _, 'A2', _, 'B2', _, 'E2', 'E2', 'E2', _, 'E2', _, 'G2', _, 'C3', _, 'B2', _, 'A2', _, 'G2', _] },
        { wave: 'square', gain: 0.08, dur: 0.14, pat: ['E4', _, 'G4', _, 'B4', _, 'A4', _, 'G4', _, 'E4', _, 'B4', _, 'C5', _, 'B4', _, 'G4', _, 'E4', _, 'F#4', _, 'G4', 'A4', 'B4', _, 'E5', _, _, _] },
        { wave: 'noise', gain: 0.12, dur: 0.07, filter: 'bandpass', cut: 180, q: 1, pat: ['x', _, _, 'x', _, _, 'x', _, 'x', _, _, 'x', _, _, 'x', _, 'x', _, _, 'x', _, _, 'x', _, 'x', _, 'x', _, 'x', 'x', 'x', _] },
        { wave: 'noise', gain: 0.045, dur: 0.04, filter: 'highpass', cut: 5200, pat: ['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x'] }
      ]
    },
    /* Boss: same engine, bigger and slower */
    boss: {
      bpm: 132, steps: 32,
      chans: [
        { wave: 'sawtooth', gain: 0.14, dur: 0.3, filter: 'lowpass', cut: 620, pat: ['D2', _, _, 'D2', _, 'Eb2', _, _, 'D2', _, _, 'D2', _, 'F2', _, _, 'D2', _, _, 'D2', _, 'Eb2', _, _, 'G2', _, 'F2', _, 'Eb2', _, 'D2', _] },
        { wave: 'square', gain: 0.075, dur: 0.26, pat: ['D5', _, 'Eb5', _, 'D5', _, 'A4', _, 'Bb4', _, 'A4', _, 'F4', _, _, _, 'D5', _, 'F5', _, 'Eb5', _, 'D5', _, 'C5', _, 'Bb4', _, 'A4', _, _, _] },
        { wave: 'noise', gain: 0.14, dur: 0.1, filter: 'lowpass', cut: 160, pat: ['x', _, _, _, 'x', _, _, _, 'x', _, _, _, 'x', _, 'x', _, 'x', _, _, _, 'x', _, _, _, 'x', _, 'x', _, 'x', 'x', _, _] },
        { wave: 'sine', gain: 0.05, dur: 1.2, pat: ['D3', _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, 'Bb2', _, _, _, _, _, _, _, _, _, _, _, _, _, _, _] }
      ]
    },
    /* The mine: sparse, dripping, unsettling */
    mine: {
      bpm: 74, steps: 32,
      chans: [
        { wave: 'sine', gain: 0.10, dur: 2.2, pat: ['C2', _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, 'Ab1', _, _, _, _, _, _, _, _, _, _, _, _, _, _, _] },
        { wave: 'triangle', gain: 0.07, dur: 0.5, pat: [_, _, _, _, 'C4', _, _, _, _, _, 'Eb4', _, _, _, _, _, _, _, _, _, 'B3', _, _, _, _, _, 'Db4', _, _, _, _, _] },
        { wave: 'noise', gain: 0.03, dur: 0.05, filter: 'bandpass', cut: 3400, q: 8, pat: [_, _, _, _, _, _, 'x', _, _, _, _, _, _, _, _, _, _, _, 'x', _, _, _, _, _, _, _, _, _, 'x', _, _, _] }
      ]
    },
    /* Swamp: humid, slithering */
    swamp: {
      bpm: 84, steps: 32,
      chans: [
        { wave: 'triangle', gain: 0.11, dur: 0.7, filter: 'lowpass', cut: 800, pat: ['E2', _, _, _, 'E2', _, _, _, 'G2', _, _, _, 'F#2', _, _, _, 'E2', _, _, _, 'D2', _, _, _, 'C2', _, _, _, 'B1', _, _, _] },
        { wave: 'sine', gain: 0.07, dur: 0.9, vib: 5, vibDepth: 6, pat: ['B4', _, _, _, _, _, 'A4', _, _, _, 'G4', _, _, _, _, _, 'F#4', _, _, _, _, _, 'E4', _, _, _, _, _, _, _, _, _] },
        { wave: 'noise', gain: 0.035, dur: 0.3, filter: 'bandpass', cut: 700, q: 2, pat: ['x', _, _, _, _, _, _, _, 'x', _, _, _, _, _, _, _, 'x', _, _, _, _, _, _, _, 'x', _, _, _, _, _, _, _] }
      ]
    },
    /* The royal ball: a proper waltz */
    ball: {
      bpm: 150, steps: 24,
      chans: [
        { wave: 'triangle', gain: 0.12, dur: 0.28, pat: ['Bb2', _, _, 'F3', _, _, 'Bb2', _, _, 'F3', _, _, 'Eb3', _, _, 'Bb3', _, _, 'F3', _, _, 'C4', _, _] },
        { wave: 'sine', gain: 0.10, dur: 0.36, pat: ['D5', _, _, 'F5', _, 'D5', 'Bb4', _, _, 'D5', _, 'Bb4', 'G5', _, 'F5', 'Eb5', _, 'D5', 'C5', _, _, 'Bb4', _, _] },
        { wave: 'sine', gain: 0.045, dur: 0.24, pat: [_, 'F4', 'Bb4', _, 'A4', 'D5', _, 'F4', 'Bb4', _, 'A4', 'D5', _, 'G4', 'C5', _, 'Bb4', 'Eb5', _, 'F4', 'A4', _, 'F4', 'A4'] }
      ]
    },
    /* Golden dragon vision: awe */
    vision: {
      bpm: 60, steps: 16,
      chans: [
        { wave: 'sine', gain: 0.13, dur: 3.0, pat: ['F2', _, _, _, _, _, _, _, 'C3', _, _, _, _, _, _, _] },
        { wave: 'triangle', gain: 0.09, dur: 1.6, pat: ['C5', _, _, 'F5', _, _, _, 'A5', _, _, 'G5', _, _, _, 'F5', _] },
        { wave: 'sine', gain: 0.06, dur: 2.4, vib: 3, vibDepth: 3, pat: ['A4', _, _, _, _, _, _, _, 'F4', _, _, _, _, _, _, _] }
      ]
    },
    victory: {
      bpm: 130, steps: 16, once: true,
      chans: [
        { wave: 'square', gain: 0.13, dur: 0.22, pat: ['C5', 'C5', 'C5', 'C5', 'G5', _, 'A5', _, 'C6', _, _, _, 'G5', _, _, _] },
        { wave: 'triangle', gain: 0.1, dur: 0.4, pat: ['C3', _, _, _, 'E3', _, _, _, 'G3', _, _, _, 'C4', _, _, _] }
      ]
    },
    defeat: {
      bpm: 66, steps: 16, once: true,
      chans: [
        { wave: 'triangle', gain: 0.13, dur: 0.9, pat: ['A3', _, 'G3', _, 'F3', _, _, _, 'E3', _, _, _, 'A2', _, _, _] },
        { wave: 'sine', gain: 0.08, dur: 1.6, pat: ['A2', _, _, _, _, _, _, _, 'E2', _, _, _, _, _, _, _] }
      ]
    }
  };

  /* Sequencer with lookahead scheduling. */
  function scheduler() {
    if (!playing || !ready) return;
    const trk = playing;
    const spb = 60 / trk.bpm / 4;              // one 16th note
    const lookahead = 0.25;
    while (nextTime < ac.currentTime + lookahead) {
      for (const ch of trk.chans) {
        const cell = ch.pat[step % ch.pat.length];
        if (cell) {
          voice({
            wave: ch.wave, note: cell === 'x' ? (ch.freq || 120) : cell,
            dur: ch.dur || spb * 2, gain: ch.gain, at: nextTime, bus: trackGain,
            filter: ch.filter, cut: ch.cut, q: ch.q, vib: ch.vib, vibDepth: ch.vibDepth,
            atk: ch.wave === 'noise' ? 0.002 : 0.012
          });
        }
      }
      step++;
      nextTime += spb;
      if (trk.once && step >= trk.steps) { stopMusic(1.2); return; }
    }
    seqTimer = setTimeout(scheduler, 60);
  }

  function play(id, opts) {
    if (!init()) return;
    unlock();
    opts = opts || {};
    if (current === id && playing && !opts.restart) return;
    const trk = TRACKS[id];
    if (!trk) return;
    stopMusic(0.4);
    current = id;
    playing = trk;
    step = 0;
    nextTime = ac.currentTime + 0.06;
    trackGain = ac.createGain();
    trackGain.gain.setValueAtTime(0.0001, ac.currentTime);
    trackGain.gain.exponentialRampToValueAtTime(1, ac.currentTime + (opts.fade || 0.9));
    trackGain.connect(musicBus);
    clearTimeout(seqTimer);
    scheduler();
  }

  function stopMusic(fade) {
    clearTimeout(seqTimer); seqTimer = null;
    if (trackGain && ready) {
      const g = trackGain, t = ac.currentTime;
      try {
        g.gain.cancelScheduledValues(t);
        g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + (fade || 0.5));
        setTimeout(() => { try { g.disconnect(); } catch (e) { } }, (fade || 0.5) * 1000 + 120);
      } catch (e) { }
    }
    trackGain = null; playing = null; current = null;
  }

  /* ---------- looping ambience (rain, sea, cave drips, fire) ---------- */
  const AMB = {
    rain: { cut: 2600, q: 0.6, type: 'bandpass', gain: 0.10, rate: 1 },
    sea: { cut: 420, q: 0.5, type: 'lowpass', gain: 0.13, rate: 0.35 },
    cave: { cut: 200, q: 0.7, type: 'lowpass', gain: 0.07, rate: 0.25 },
    fire: { cut: 800, q: 0.8, type: 'lowpass', gain: 0.08, rate: 0.5 },
    crowd: { cut: 900, q: 0.9, type: 'bandpass', gain: 0.05, rate: 0.3 }
  };
  function ambience(kind) {
    if (!init()) return;
    if (ambKind === kind) return;
    if (ambNodes) {
      const old = ambNodes;
      try {
        old.g.gain.cancelScheduledValues(ac.currentTime);
        old.g.gain.setValueAtTime(old.g.gain.value, ac.currentTime);
        old.g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.8);
      } catch (e) { }
      setTimeout(() => { try { old.src.stop(); old.g.disconnect(); } catch (e) { } }, 1000);
      ambNodes = null;
    }
    ambKind = kind;
    const spec = AMB[kind];
    if (!spec) return;
    const src = ac.createBufferSource();
    src.buffer = noiseBuf; src.loop = true; src.playbackRate.value = spec.rate;
    const f = ac.createBiquadFilter(); f.type = spec.type; f.frequency.value = spec.cut; f.Q.value = spec.q;
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(spec.gain, ac.currentTime + 1.4);
    src.connect(f); f.connect(g); g.connect(master);
    src.start();
    ambNodes = { src, g, f };
  }
  /* Randomly rumble while it storms. */
  let thunderTimer = null;
  function stormThunder(on) {
    clearTimeout(thunderTimer);
    if (!on) return;
    const tick = () => {
      sfx('thunder');
      thunderTimer = setTimeout(tick, U.rint(9000, 22000));
    };
    thunderTimer = setTimeout(tick, U.rint(3000, 9000));
  }

  function setVolume(which, v) {
    vol[which] = U.clamp(v, 0, 1);
    if (!ready) return;
    if (which === 'master') master.gain.value = vol.master;
    if (which === 'music') musicBus.gain.value = vol.music;
    if (which === 'sfx') sfxBus.gain.value = vol.sfx;
  }
  function getVolume(which) { return vol[which]; }
  function setMuted(m) { muted = m; if (ready) master.gain.value = m ? 0 : vol.master; }
  function isMuted() { return muted; }

  return {
    init, unlock, play, stopMusic, sfx, ambience, stormThunder,
    setVolume, getVolume, setMuted, isMuted, voice,
    get current() { return current; },
    TRACKS
  };
})();
