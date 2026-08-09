/* Drakehaven Island — the captain's ship games, the dig site, the mine's puzzles,
   fishing and crafting. Every game uses the rules as written at the table. */
window.DH = window.DH || {};

DH.scenes.minigames = (function () {
  'use strict';
  const U = DH.util, C = DH.char;

  let which = null, onDone = null, state = null, opts = null;
  let elWin = null, elField = null, elMsg = null, elRow = null;
  let timerHandle = null;

  const GAMES = {};

  function enter(arg) {
    which = arg.game;
    opts = arg;
    onDone = arg.onDone || null;
    state = {};
    build();
    const g = GAMES[which];
    if (!g) { say('That game is not set up yet.'); return; }
    g.start();
  }
  function exit() {
    DH.ui.clear();
    clearInterval(timerHandle); timerHandle = null;
  }
  function resume() { build(); const g = GAMES[which]; if (g && g.redraw) g.redraw(); }
  function pause() { DH.ui.clear(); }

  function close(result) {
    clearInterval(timerHandle); timerHandle = null;
    DH.game.pop(result);
    DH.game.flushOps();
    if (onDone) onDone(result);
  }

  /* =============== shell =============== */
  function build() {
    DH.ui.clear();
    const root = document.getElementById('ui');
    const wrap = DH.ui.el('div'); wrap.id = 'mini';
    root.appendChild(wrap);
    elWin = DH.ui.add(wrap, 'div', 'win panel gilt');
    const g = GAMES[which] || { title: 'Game', rules: '' };
    DH.ui.add(elWin, 'h2', '', g.title || 'Game');
    DH.ui.add(elWin, 'div', 'rules', g.rules || '');
    elField = DH.ui.add(elWin, 'div', 'field');
    elMsg = DH.ui.add(elWin, 'div', 'msg');
    elRow = DH.ui.add(elWin, 'div', 'row');
  }
  function say(html) { if (elMsg) elMsg.innerHTML = DH.ui.rich(html); }
  function addLine(html) { if (elMsg) elMsg.innerHTML += '<br>' + DH.ui.rich(html); }
  function buttons(list) {
    elRow.innerHTML = '';
    list.forEach(b => {
      if (!b) return;
      const btn = DH.ui.btn(b.label, b.cls || '', b.fn);
      if (b.disabled) btn.disabled = true;
      elRow.appendChild(btn);
    });
  }
  function field(html) { elField.innerHTML = html; return elField; }

  const pc = () => DH.game.pc();
  const gold = () => DH.game.partyGold();

  /* Opponents for the ship games: the captain and whoever is around. */
  function makeTable(includeParty, extra) {
    const list = [{ id: 'me', name: pc().name, me: true, ch: pc() }];
    if (includeParty) {
      DH.game.party().slice(1, 3).forEach(c => list.push({ id: c.companionId, name: c.name, ch: c }));
    }
    (extra || [{ name: 'Captain Hobbs', str: 4, dex: 3, con: 4, cheat: true }]).forEach(e => {
      list.push({
        name: e.name, npc: true, cheat: e.cheat,
        ch: { name: e.name, abilities: { str: 10 + e.str * 2, dex: 10 + e.dex * 2, con: 10 + e.con * 2, int: 10, wis: 10, cha: 10 }, prof: 3, skills: [], expertise: [], effects: [], conditions: [] }
      });
    });
    return list;
  }
  function abMod(p, ab) {
    if (p.ch && p.ch.abilities) return C.mod(p.ch.abilities[ab]);
    return 0;
  }
  function renderPlayers(players, extra) {
    let html = '<div class="players">';
    players.forEach(p => {
      html += '<div class="pl' + (p.me ? ' me' : '') + (p.out ? ' out' : '') + '">' +
        '<div class="nm">' + DH.ui.esc(p.name) + '</div>' +
        '<div class="grow">' + (extra ? extra(p) : '') + '</div>' +
        '</div>';
    });
    return html + '</div>';
  }
  function dice(vals, opts2) {
    opts2 = opts2 || {};
    return '<div class="dice">' + vals.map(v =>
      '<div class="d' + (opts2.hidden ? ' hid' : '') + (opts2.win ? ' win' : '') + '">' +
      (opts2.hidden ? '?' : v) + '</div>').join('') + '</div>';
  }

  /* ============================================================
     DRAGON'S HOARD
     Ante 10 gp. Roll 3d6 in secret. The house rolls a d6 and every
     die showing that number is taken away. Bet. Repeat once. Highest total wins.
     ============================================================ */
  GAMES.dragons_hoard = {
    title: 'Dragon\'s Hoard',
    rules: 'Everybody antes 10 gold and rolls 3d6, kept secret. The house rolls a d6 and every die showing that number is confiscated. Then everyone bets. That happens twice. All dice are shown, and the highest total takes the pot.',
    start() {
      if (!DH.game.spendGold(10)) { say('You cannot cover the ten gold ante.'); buttons([{ label: 'Leave', fn: () => close() }]); return; }
      state.players = makeTable(true);
      state.pot = 10 * state.players.length;
      state.phase = 0;
      state.players.forEach(p => { p.dice = DH.dice.nd(3, 6).rolls; p.bet = 0; });
      say('Ten gold each into the pot — <b>' + state.pot + ' gold</b> on the table. Three dice apiece, and nobody shows.');
      this.redraw();
      buttons([{ label: 'The house rolls', cls: 'primary', fn: () => this.houseRoll() }]);
    },
    redraw() {
      field(renderPlayers(state.players, p =>
        (p.me ? dice(p.dice) : dice(p.dice.map(() => '?'), { hidden: !state.revealed })) +
        (p.bet ? ' <span class="gold">bet ' + p.bet + '</span>' : '')
      ) + '<div class="small dim" style="margin-top:8px">Pot: <b class="gold">' + state.pot + ' gold</b></div>');
    },
    houseRoll() {
      const d = DH.dice.d(6);
      DH.audio.sfx('dice');
      let taken = 0;
      state.players.forEach(p => {
        const before = p.dice.length;
        p.dice = p.dice.filter(x => x !== d);
        taken += before - p.dice.length;
      });
      say('The house rolls a <b>' + d + '</b>. Every die showing a ' + d + ' is confiscated — ' + taken + ' gone from the table.');
      this.redraw();
      buttons([
        { label: 'Bet 10', fn: () => this.bet(10) },
        { label: 'Bet 25', fn: () => this.bet(25) },
        { label: 'Bet 50', fn: () => this.bet(50) },
        { label: 'Check', fn: () => this.bet(0) }
      ]);
    },
    bet(n) {
      if (n > 0 && !DH.game.spendGold(n)) { addLine('[bad]Not enough coin for that.[/]'); return; }
      state.pot += n;
      const me = state.players[0];
      me.bet += n;
      /* the others bet according to how their dice look */
      state.players.forEach(p => {
        if (p.me) return;
        const total = U.sum(p.dice);
        const want = total > 12 ? 25 : total > 7 ? 10 : 0;
        p.bet += want; state.pot += want;
      });
      state.phase++;
      this.redraw();
      if (state.phase < 2) {
        say('Round ' + (state.phase + 1) + '. The house rolls again.');
        buttons([{ label: 'The house rolls', cls: 'primary', fn: () => this.houseRoll() }]);
      } else this.reveal();
    },
    reveal() {
      state.revealed = true;
      /* the captain's charlatan's dice tilt his total */
      state.players.forEach(p => { if (p.cheat && p.dice.length) p.dice = p.dice.map(() => U.rint(4, 6)); });
      let best = -1, winners = [];
      state.players.forEach(p => {
        p.total = U.sum(p.dice);
        if (p.total > best) { best = p.total; winners = [p]; }
        else if (p.total === best) winners.push(p);
      });
      field(renderPlayers(state.players, p => dice(p.dice, { win: winners.indexOf(p) >= 0 }) +
        ' <b>' + p.total + '</b>'));
      const iWon = winners.some(p => p.me);
      if (iWon) {
        const share = Math.floor(state.pot / winners.length);
        DH.game.giveGold(share);
        say('You show ' + best + ' and take ' + (winners.length > 1 ? 'a share of ' : '') + 'the pot: [gold]' + share + ' gold[/].');
      } else {
        say('[bad]' + winners[0].name + ' shows ' + best + ' and sweeps the pot.[/]' +
          (winners[0].cheat ? '\n\nThe captain grins and shifts in his chair.' : ''));
        if (winners[0].cheat) DH.game.setFlag('captain_won_a_hand');
      }
      buttons([
        { label: 'Again', cls: 'primary', fn: () => { state = {}; build(); GAMES.dragons_hoard.start(); } },
        { label: 'Stop playing', fn: () => close({ played: 'dragons_hoard' }) }
      ]);
    }
  };

  /* ============================================================ ARM WRESTLING */
  GAMES.arm_wrestling = {
    title: 'Arm Wrestling',
    rules: 'Each player makes a Strength saving throw. The higher number takes a point. First to three points wins.',
    start() {
      state.me = 0; state.them = 0;
      state.foe = { name: 'Captain Hobbs', mod: 7 };
      say('The captain plants his elbow on the desk and grins. His forearm is the size of your thigh.');
      this.redraw();
      buttons([{ label: 'Take his hand', cls: 'primary', fn: () => this.round() }]);
    },
    redraw() {
      field('<div class="row" style="justify-content:space-around;font-size:15px">' +
        '<div>' + DH.ui.esc(pc().name) + '<br><b class="gold" style="font-size:26px">' + state.me + '</b></div>' +
        '<div class="dim" style="align-self:center">first to 3</div>' +
        '<div>' + DH.ui.esc(state.foe.name) + '<br><b class="bad" style="font-size:26px">' + state.them + '</b></div>' +
        '</div>');
    },
    async round() {
      buttons([]);
      const mine = await DH.ui.roller({ label: 'Strength Saving Throw', mod: C.saveMod(pc(), 'str'), modLabel: 'STR save' });
      const theirs = DH.dice.d20({ mod: state.foe.mod });
      if (mine.total > theirs.total) { state.me++; say('You force his wrist a hand\'s breadth toward the wood. ' + mine.total + ' to ' + theirs.total + '.'); }
      else if (theirs.total > mine.total) { state.them++; say('[bad]Your arm folds.[/] ' + mine.total + ' to ' + theirs.total + '.'); }
      else say('Deadlock. ' + mine.total + ' each. Neither of you gives an inch.');
      this.redraw();
      if (state.me >= 3) return this.win();
      if (state.them >= 3) return this.lose();
      buttons([{ label: 'Push again', cls: 'primary', fn: () => this.round() }]);
    },
    win() {
      say('[good]The captain\'s hand hits the desk.[/] He roars with laughter and shakes out his arm. "Ya got a grip on ya!"');
      DH.game.giveGold(50);
      DH.game.addAffinity('captain', 2, 'Captain Hobbs');
      buttons([{ label: 'Done', cls: 'primary', fn: () => close({ won: true }) }]);
    },
    lose() {
      say('Your knuckles meet the wood. "Don\' feel bad," he says, "I been haulin\' rope since I were six."');
      DH.game.addAffinity('captain', 1, 'Captain Hobbs');
      buttons([{ label: 'Done', fn: () => close({ won: false }) }]);
    }
  };

  /* ============================================================ DARTS */
  GAMES.darts = {
    title: 'Darts',
    rules: 'Three darts each — a Dexterity check per dart. The tightest cluster of three wins. A +1 or +2 Dexterity modifier lets you reroll one die; +3 or better lets you reroll two.',
    start() {
      state.players = makeTable(true);
      state.players.forEach(p => { p.throws = []; p.rerolls = rerollsFor(abMod(p, 'dex')); });
      state.turn = 0;
      say('A board with more holes than paint. The captain hands you three darts, points first.');
      this.redraw();
      this.next();
    },
    redraw() {
      field(renderPlayers(state.players, p =>
        dice(p.throws) + (p.spread != null ? ' <span class="dim">spread ' + p.spread + '</span>' : '') +
        (p.me && p.rerolls ? ' <span class="gold">' + p.rerolls + ' reroll' + (p.rerolls > 1 ? 's' : '') + '</span>' : '')
      ));
    },
    next() {
      const me = state.players[0];
      if (me.throws.length < 3) {
        buttons([{ label: 'Throw dart ' + (me.throws.length + 1), cls: 'primary', fn: () => this.throwDart() }]);
        return;
      }
      /* rerolls, then the others */
      if (me.rerolls > 0) {
        buttons(me.throws.map((v, i) => ({
          label: 'Reroll the ' + v, fn: () => {
            me.rerolls--;
            me.throws[i] = DH.dice.d20({ mod: C.abMod(pc(), 'dex') }).total;
            DH.audio.sfx('dice');
            this.redraw(); this.next();
          }
        })).concat([{ label: 'Keep these', cls: 'primary', fn: () => this.finish() }]));
        return;
      }
      this.finish();
    },
    async throwDart() {
      const me = state.players[0];
      const r = await DH.ui.roller({ label: 'Dexterity Check — dart ' + (me.throws.length + 1), mod: C.abMod(pc(), 'dex'), modLabel: 'DEX' });
      me.throws.push(r.total);
      this.redraw();
      this.next();
    },
    finish() {
      state.players.forEach(p => {
        if (!p.me) {
          p.throws = [];
          for (let i = 0; i < 3; i++) p.throws.push(DH.dice.d20({ mod: abMod(p, 'dex') }).total);
          let rr = rerollsFor(abMod(p, 'dex'));
          while (rr-- > 0) {
            const worst = p.throws.indexOf(Math.min.apply(null, p.throws));
            p.throws[worst] = DH.dice.d20({ mod: abMod(p, 'dex') }).total;
          }
        }
        p.spread = Math.max.apply(null, p.throws) - Math.min.apply(null, p.throws);
      });
      const best = state.players.slice().sort((a, b) => a.spread - b.spread)[0];
      this.redraw();
      if (best.me) {
        say('[good]Three darts inside a coin\'s width.[/] Spread of ' + best.spread + ' — nobody comes close.');
        DH.game.giveGold(40);
        DH.game.addAffinity('captain', 1, 'Captain Hobbs');
      } else {
        say('[bad]' + best.name + ' takes it[/] with a spread of ' + best.spread + '. Yours was ' + state.players[0].spread + '.');
      }
      buttons([
        { label: 'Again', fn: () => { state = {}; build(); GAMES.darts.start(); } },
        { label: 'Stop playing', cls: 'primary', fn: () => close({ played: 'darts' }) }
      ]);
    }
  };
  function rerollsFor(mod) { return mod >= 3 ? 2 : mod >= 1 ? 1 : 0; }

  /* ============================================================ DRINKING */
  GAMES.drinking = {
    title: 'Drinking',
    rules: 'Everyone drinks the same thing, then makes a DC 10 Constitution save. Each round the DC goes up by one. Fail twice and you are incapacitated. Last one upright wins.',
    start() {
      state.players = makeTable(true);
      state.players.forEach(p => { p.fails = 0; p.out = false; });
      state.dc = 10; state.round = 1;
      say('Little glasses. Something the colour of lamp oil. The captain pours without measuring.');
      this.redraw();
      buttons([{ label: 'Drink', cls: 'primary', fn: () => this.round() }]);
    },
    redraw() {
      field(renderPlayers(state.players, p =>
        p.out ? '<span class="bad">out cold</span>' :
          '<span class="dim">failed ' + p.fails + '/2</span>') +
        '<div class="small dim" style="margin-top:8px">Round ' + state.round + ' — DC <b class="gold">' + state.dc + '</b></div>');
    },
    async round() {
      buttons([]);
      const me = state.players[0];
      const mine = await DH.ui.roller({ label: 'Constitution Save — round ' + state.round, mod: C.saveMod(pc(), 'con'), dc: state.dc, modLabel: 'CON save' });
      if (!mine.success) { me.fails++; if (me.fails >= 2) me.out = true; }
      const lines = [];
      state.players.forEach(p => {
        if (p.me || p.out) return;
        const r = DH.dice.d20({ mod: abMod(p, 'con') + 2, dc: state.dc });
        if (!r.success) {
          p.fails++;
          if (p.fails >= 2) { p.out = true; lines.push(p.name + ' slides gently off the bench.'); }
          else lines.push(p.name + ' coughs and thumps their chest.');
        }
      });
      say((mine.success ? 'It goes down like a lit match, but it goes down.' : '[bad]That one hurt.[/]') +
        (lines.length ? '\n' + lines.join('\n') : ''));
      state.round++; state.dc++;
      this.redraw();
      const standing = state.players.filter(p => !p.out);
      if (me.out && standing.length) {
        say('[bad]You are done.[/] The room tips politely sideways.');
        C.addCondition(pc(), 'poisoned', 100);
        buttons([{ label: 'Ugh', fn: () => close({ won: false }) }]);
        return;
      }
      if (standing.length === 1 && standing[0].me) {
        say('[good]Last one upright.[/] The captain salutes you with an empty glass and then falls off his stool.');
        DH.game.giveGold(60);
        DH.game.addAffinity('captain', 3, 'Captain Hobbs');
        buttons([{ label: 'Victory, of a sort', cls: 'primary', fn: () => close({ won: true }) }]);
        return;
      }
      buttons([{ label: 'Drink again', cls: 'primary', fn: () => this.round() }]);
    }
  };

  /* ============================================================ ROULETTE */
  GAMES.roulette = {
    title: 'Roulette',
    rules: 'Bet on up to four numbers from 1 to 20, staking what you like on each. The house rolls a d20. Any number that comes up pays four times your stake.',
    start() {
      state.bets = {}; state.stake = 25;
      say('A wheel painted with twenty numbers, and a single die the captain claims is fair.');
      this.redraw();
    },
    redraw() {
      let html = '<div class="numgrid">';
      for (let n = 1; n <= 20; n++) {
        html += '<div class="n' + (state.bets[n] ? ' on' : '') + (state.rolled === n ? ' hit' : '') +
          '" data-n="' + n + '">' + n + '</div>';
      }
      html += '</div><div class="bet">Stake per number: ';
      [10, 25, 50, 100].forEach(v => html += '<span class="tag' + (state.stake === v ? ' gold' : '') + '" data-stake="' + v + '" style="cursor:pointer">' + v + '</span> ');
      html += '</div>';
      const total = Object.keys(state.bets).reduce((a, k) => a + state.bets[k], 0);
      html += '<div class="small dim" style="margin-top:6px">Staked: <b class="gold">' + total + '</b> · Purse: ' + U.commas(gold()) + '</div>';
      const f = field(html);
      f.querySelectorAll('.n').forEach(e => {
        e.onclick = () => {
          if (state.rolled) return;
          const n = +e.dataset.n;
          if (state.bets[n]) { DH.game.pc().gold += state.bets[n]; delete state.bets[n]; }
          else {
            if (Object.keys(state.bets).length >= 4) { DH.ui.toast('Four numbers is the limit.', 'bad'); return; }
            if (!DH.game.spendGold(state.stake)) { DH.ui.toast('Not enough coin.', 'bad'); return; }
            state.bets[n] = state.stake;
          }
          DH.audio.sfx('select');
          this.redraw();
        };
      });
      f.querySelectorAll('[data-stake]').forEach(e => {
        e.onclick = () => { state.stake = +e.dataset.stake; this.redraw(); };
      });
      buttons([
        { label: 'Spin', cls: 'primary', disabled: !Object.keys(state.bets).length || state.rolled, fn: () => this.spin() },
        { label: 'Leave the table', fn: () => close({ played: 'roulette' }) }
      ]);
    },
    async spin() {
      const r = await DH.ui.roller({ label: 'The House Rolls' });
      state.rolled = r.natural;
      this.redraw();
      if (state.bets[r.natural]) {
        const win = state.bets[r.natural] * 4;
        DH.game.giveGold(win);
        say('[good]' + r.natural + '.[/] Four times your stake: [gold]' + win + ' gold[/].');
      } else {
        say('[bad]' + r.natural + '.[/] Not one of yours. The captain rakes it in without looking at you.');
      }
      buttons([
        { label: 'Again', cls: 'primary', fn: () => { state = { stake: 25, bets: {} }; build(); GAMES.roulette.start(); } },
        { label: 'Walk away', fn: () => close({ played: 'roulette' }) }
      ]);
    }
  };

  /* ============================================================ THE WINNING ROLL */
  GAMES.winning_roll = {
    title: 'The Winning Roll',
    rules: 'Everyone pays in, rolls a hidden d20, and secretly bids how many rounds they will win. On three, everyone shows their bid on their fingers. Highest roll takes the round. Match your bid and you score: 1 round is worth 2 points, 2 is worth 3, 3 is worth 5. Bid zero and you score the round number instead. Each round adds another d20 to your roll.',
    start() {
      if (!DH.game.spendGold(25)) { say('Twenty-five gold to sit down, and you have not got it.'); buttons([{ label: 'Leave', fn: () => close() }]); return; }
      state.players = makeTable(true);
      state.pot = 25 * state.players.length;
      state.round = 1; state.wins = {}; state.players.forEach(p => state.wins[p.name] = 0);
      state.bid = null;
      say('Twenty-five gold each. The pot is <b>' + state.pot + '</b>. Now — how many of the three rounds do you think you will win?');
      this.bidPhase();
    },
    bidPhase() {
      field('<div class="small dim">Round ' + state.round + ' of 3. Bid on your fingers.</div>');
      buttons([0, 1, 2, 3].map(n => ({
        label: n + ' round' + (n === 1 ? '' : 's'), cls: n === 1 ? 'primary' : '',
        fn: () => { state.bid = n; state.players.forEach(p => { if (!p.me) p.bid = U.rint(0, 3); }); this.playRound(); }
      })));
    },
    async playRound() {
      const nDice = state.round;
      const me = state.players[0];
      state.players.forEach(p => {
        p.roll = 0; p.rolls = [];
        for (let i = 0; i < nDice; i++) { const d = DH.dice.d(20); p.rolls.push(d); p.roll += d; }
      });
      DH.audio.sfx('dice');
      field(renderPlayers(state.players, p => dice(p.rolls) + ' <b>' + p.roll + '</b>' +
        ' <span class="dim">bid ' + (p.bid == null ? '?' : p.bid) + '</span>'));
      const best = state.players.slice().sort((a, b) => b.roll - a.roll)[0];
      state.wins[best.name]++;
      say('Round ' + state.round + ': <b>' + best.name + '</b> shows ' + best.roll + ' and takes it.' +
        '\nRounds won so far: ' + state.players.map(p => p.name + ' ' + state.wins[p.name]).join(', '));
      state.round++;
      if (state.round <= 3) {
        buttons([{ label: 'Next round (one more die)', cls: 'primary', fn: () => this.playRound() }]);
      } else this.score();
    },
    score() {
      const POINTS = { 1: 2, 2: 3, 3: 5 };
      const results = state.players.map(p => {
        const won = state.wins[p.name];
        let pts = 0;
        if (p.bid === 0 && won === 0) pts = 3;                 // bid zero: the round number, three rounds played
        else if (p.bid === won) pts = POINTS[p.bid] || 0;
        return { p, won, pts };
      });
      const top = Math.max.apply(null, results.map(r => r.pts));
      const winners = results.filter(r => r.pts === top && top > 0);
      field(renderPlayers(state.players, p => {
        const r = results.find(x => x.p === p);
        return 'bid ' + p.bid + ', won ' + r.won + ' → <b class="gold">' + r.pts + '</b> points';
      }));
      if (winners.some(w => w.p.me)) {
        const share = Math.floor(state.pot / winners.length);
        DH.game.giveGold(share);
        say('[good]You called it exactly.[/] ' + share + ' gold.');
      } else if (!winners.length) {
        DH.game.giveGold(Math.floor(state.pot / state.players.length));
        say('Nobody matched their bid. The pot is split and the captain looks personally offended.');
      } else {
        say('[bad]' + U.listing(winners.map(w => w.p.name)) + ' called it. You did not.[/]');
      }
      buttons([
        { label: 'Again', fn: () => { state = {}; build(); GAMES.winning_roll.start(); } },
        { label: 'Stop playing', cls: 'primary', fn: () => close({ played: 'winning_roll' }) }
      ]);
    }
  };

  /* ============================================================
     THE DIG SITE
     Three shovels between you. Shovel-holders save at DC 12, the rest at DC 14.
     Everyone succeeds: the rock scale goes up by one. Anyone fails: a boulder
     rains down and everyone makes a DC 14 Dexterity save or takes damage, and
     that damage grows by 1d6 each time. A natural 20 takes three off the scale.
     Fifteen on the scale and the cave is open.
     ============================================================ */
  GAMES.dig = {
    title: 'Clearing the Cave Mouth',
    rules: 'Three shovels between everyone. With a shovel it is a DC 12 Strength save; without, DC 14. If everyone succeeds the rock scale rises by one. If anybody fails, a boulder comes down: DC 14 Dexterity save or take damage — and the damage grows by 1d6 every time it happens. A natural 20 shifts three rocks at once. Fifteen on the scale opens the way.',
    start() {
      state.scale = 0; state.dmgDice = 1; state.attempts = 0;
      const party = DH.game.party().filter(c => !c.dead);
      state.diggers = party.slice(0, 6);
      state.shovels = {};
      /* the orc and the minotaur keep one; two are free, and you may have your own */
      const withShovel = state.diggers.slice(0, C.hasItem(pc(), 'shovel') ? 3 : 2);
      withShovel.forEach(c => state.shovels[c.name] = true);
      say('The orc wipes his forehead. "Hey, you want to help?" There are three shovels and one of them is bent.');
      this.redraw();
      buttons([{ label: 'Start digging', cls: 'primary', fn: () => this.round() }]);
    },
    redraw() {
      const pct = Math.min(100, (state.scale / 15) * 100);
      field('<div class="scale"><i style="width:' + pct + '%"></i><span>' + state.scale + ' / 15 rocks shifted</span></div>' +
        renderPlayers(state.diggers.map(c => ({ name: c.name + (state.shovels[c.name] ? ' (shovel)' : ''), ch: c, me: c.isPlayer })),
          p => '<span class="dim">HP ' + p.ch.hp + '/' + p.ch.hpMax + '</span>') +
        '<div class="small dim" style="margin-top:6px">Next boulder would be ' + state.dmgDice + 'd6.</div>');
    },
    async round() {
      buttons([]);
      state.attempts++;
      const lines = [];
      let anyFail = false, nat20 = false;
      for (const c of state.diggers) {
        const dc = state.shovels[c.name] ? 12 : 14;
        const r = DH.dice.d20({ mod: C.saveMod(c, 'str'), dc: dc });
        if (r.natural === 20) nat20 = true;
        if (!r.success) { anyFail = true; lines.push('[bad]' + c.name + ' fails (' + r.total + ' vs ' + dc + ')[/]'); }
        else lines.push(c.name + ' heaves (' + r.total + ' vs ' + dc + ')');
      }
      DH.audio.sfx('dig');
      if (nat20) {
        state.scale += 3;
        lines.push('[good]A natural twenty — a whole shelf of stone slides away. Three rocks off the scale.[/]');
      } else if (!anyFail) {
        state.scale += 1;
        lines.push('[good]All together — one more rock shifted.[/]');
      }
      if (anyFail) {
        lines.push('Stone shifts overhead. [bad]Boulder![/] ' + state.dmgDice + 'd6, DC 14 Dexterity.');
        for (const c of state.diggers) {
          const r = DH.dice.d20({ mod: C.saveMod(c, 'dex'), dc: 14 });
          if (!r.success) {
            const d = DH.dice.roll(state.dmgDice + 'd6');
            C.applyDamage(c, d.total, 'bludgeoning');
            lines.push(c.name + ' takes ' + d.total + ' bludgeoning.');
          }
        }
        state.dmgDice++;
        DH.audio.sfx('hit');
      }
      say(lines.join('\n'));
      this.redraw();
      const down = state.diggers.filter(c => c.hp <= 0).length;
      if (state.scale >= 15) return this.done();
      if (down >= Math.ceil(state.diggers.length / 2)) {
        say('Too many of you are down. The orc waves you off. "Rest up, come back to it."');
        buttons([{ label: 'Step back', fn: () => close({ won: false }) }]);
        return;
      }
      buttons([
        { label: 'Keep digging', cls: 'primary', fn: () => this.round() },
        { label: 'Take a break', fn: () => close({ won: false }) }
      ]);
    },
    done() {
      DH.audio.sfx('door');
      say('[good]The final rock falls to the ground and the workers cheer.[/]\n\n"Thank you travellers, here take some gold."');
      DH.game.giveGold(175);
      DH.game.giveItem('ring_of_protection');
      DH.game.setFlag('dig_done');
      DH.game.completeQuest('dig', 250);
      buttons([{ label: 'Wonderful', cls: 'primary', fn: () => close({ won: true }) }]);
    }
  };

  /* ============================================================
     THE STATUE
     "I'm difficult for you to hear, say my name and I disappear."
     The answer is Silence. Thirty full seconds of it opens the door — and there
     is a fly in the room with AC 26 that will not shut up unless an area effect
     catches it.
     ============================================================ */
  GAMES.statue_riddle = {
    title: 'The Statue and the Fly',
    rules: 'Thirty seconds of complete silence opens the door. The statue asks a riddle. There is also a fly, and its AC is 26 unless it is caught in something that fills a space.',
    start() {
      state.silence = 0; state.flyAlive = true; state.guesses = 0; state.solved = false;
      say('The statue of a woman sparks to life and speaks:\n\n*"I\'m difficult for you to hear, say my name and I disappear."*\n\nAnd somewhere near the ceiling, a fly is buzzing.');
      this.redraw();
      this.menu();
    },
    redraw() {
      field('<div class="timer' + (state.silence > 20 ? '' : ' warn') + '">' + state.silence + ' / 30 seconds of silence</div>' +
        '<div class="small dim" style="margin-top:8px">' +
        (state.flyAlive ? 'The fly is still going. <b>AC 26</b> unless you hit it with an area effect.' : 'The fly is dealt with.') +
        '</div>');
    },
    menu() {
      buttons([
        { label: 'Say "Silence"', cls: 'primary', fn: () => this.answer('silence') },
        { label: 'Say "Quiet"', fn: () => this.answer('quiet') },
        { label: 'Say "A whisper"', fn: () => this.answer('whisper') },
        { label: state.flyAlive ? 'Swat the fly' : 'The fly is gone', disabled: !state.flyAlive, fn: () => this.swat() },
        { label: state.flyAlive ? 'Catch it in an area effect' : '—', disabled: !state.flyAlive, fn: () => this.aoe() },
        { label: 'Everyone stand perfectly still and shut up', fn: () => this.beQuiet() },
        { label: 'Leave the room', fn: () => close({ won: false }) }
      ]);
    },
    answer(a) {
      state.guesses++;
      if (a === 'silence') {
        DH.audio.sfx('confirm');
        say('You say the word, and the statue is simply not there any more. There is no sound as it goes.\n\nThe riddle is answered — but the door still wants its thirty seconds, and something is buzzing.');
        state.riddleSolved = true;
        DH.game.setFlag('statue_named');
      } else {
        DH.audio.sfx('cancel');
        say('The statue waits. That was not the word. (Attempt ' + state.guesses + '.)');
      }
      this.redraw(); this.menu();
    },
    async swat() {
      const r = await DH.ui.roller({ label: 'Attack the Fly', mod: C.abMod(pc(), 'dex') + pc().prof, dc: 26, modLabel: 'attack' });
      if (r.success) { state.flyAlive = false; say('[good]An impossible swing connects.[/] The buzzing stops.'); }
      else say('You miss it by a distance that feels insulting. Also, you made noise.');
      state.silence = 0;
      this.redraw(); this.menu();
    },
    async aoe() {
      const opts2 = [];
      const spells = C.knownSpells(pc()).filter(s => s.shape);
      spells.forEach(s => opts2.push({ label: 'Cast ' + s.name, fn: () => this.resolveAoe(s.name) }));
      opts2.push({ label: 'Throw a cloak over the whole corner', fn: () => this.resolveAoe('a thrown cloak') });
      opts2.push({ label: 'Back', fn: () => this.menu() });
      say('Something that fills a space, rather than something that hits a point.');
      buttons(opts2);
    },
    resolveAoe(what) {
      state.flyAlive = false;
      state.silence = 0;
      DH.audio.sfx('spell');
      say('[good]' + U.cap(what) + ' fills the corner and the buzzing stops mid-note.[/]\n\nNow: thirty seconds of nothing at all.');
      this.redraw(); this.menu();
    },
    beQuiet() {
      if (state.flyAlive) {
        say('You all hold still. For eleven seconds it is beautiful. Then the fly lands on the Ball Wizard\'s ear and the silence ends in swearing.');
        state.silence = 0;
        this.redraw(); this.menu();
        return;
      }
      buttons([]);
      say('Nobody moves. Nobody breathes louder than they have to.');
      clearInterval(timerHandle);
      timerHandle = setInterval(() => {
        state.silence++;
        this.redraw();
        if (state.silence >= 30) {
          clearInterval(timerHandle); timerHandle = null;
          DH.audio.sfx('door');
          say('[good]After a full thirty seconds of silence, the door opens.[/]');
          DH.game.setFlag('statue_solved');
          DH.game.awardXp(200);
          buttons([{ label: 'Go through', cls: 'primary', fn: () => close({ won: true }) }]);
        }
      }, 250);
    }
  };

  /* ============================================================
     THE SEALED ROOM
     "You must get to the next room, or die. A poisonous gas will fill the room in
     some time. Tamper as much as you please, especially you imposter."
     Twenty minutes on the clock. A pedestal with a ten-sided die. The way out is
     a screw, and behind the screw a key.
     ============================================================ */
  GAMES.gas_room = {
    title: 'The Sealed Room',
    rules: 'Twenty minutes before the gas fills the room. Every action costs time. There is a pedestal with a ten-sided die on it, and a door that will not open.',
    start() {
      state.minutes = 20; state.found = {}; state.done = false;
      say('A voice comes out of a speaker in the ceiling:\n\n*"You must get to the next room, or die. A poisonous gas will fill the room in some time. Tamper as much as you please — especially you, imposter."*\n\nEnvelopes drop from a slot, one for each of you.');
      this.redraw(); this.menu();
    },
    redraw() {
      field('<div class="timer' + (state.minutes <= 6 ? ' warn' : '') + '">' + state.minutes + ' minutes left</div>' +
        '<div class="small dim" style="margin-top:8px">' +
        (state.found.envelope ? '✓ You have read the envelopes.<br>' : '') +
        (state.found.die ? '✓ You have handled the ten-sided die.<br>' : '') +
        (state.found.plate ? '✓ You have found a plate on the door frame, held by one screw.<br>' : '') +
        (state.found.key ? '✓ You have the key.<br>' : '') +
        '</div>');
    },
    spend(n) {
      state.minutes -= n;
      if (state.minutes <= 0) return this.gas();
      return false;
    },
    menu() {
      buttons([
        { label: 'Open the envelopes', disabled: state.found.envelope, fn: () => this.act('envelope') },
        { label: 'Examine the pedestal and the d10', disabled: state.found.die, fn: () => this.act('die') },
        { label: 'Search the walls and the door frame', fn: () => this.act('search') },
        { label: state.found.plate && !state.found.key ? 'Unscrew the plate' : 'Unscrew the plate', disabled: !state.found.plate || state.found.key, fn: () => this.act('unscrew') },
        { label: 'Use the key on the door', disabled: !state.found.key, cls: state.found.key ? 'primary' : '', fn: () => this.act('unlock') },
        { label: 'Force the door', fn: () => this.act('force') }
      ]);
    },
    async act(a) {
      buttons([]);
      if (a === 'envelope') {
        state.found.envelope = true;
        if (this.spend(1) === false) { }
        say('Inside each envelope is a card. Four of them read: *"You are not the imposter."* One of them reads something else, and whoever is holding it does not say what.\n\nThe speaker crackles as if amused.');
        DH.game.setFlag('imposter_envelope');
      } else if (a === 'die') {
        state.found.die = true;
        this.spend(2);
        const r = await DH.ui.roller({ label: 'Investigation — the pedestal', mod: C.skillMod(pc(), 'investigation'), dc: 13 });
        if (r.success) {
          say('The die spins freely. Underneath the pedestal, scratched into the stone: *"the way out is held by one thing."* Something metal glints on the door frame.');
          state.found.plate = true;
        } else {
          say('It is a ten-sided die on a stone pedestal. You turn it over. It is still a ten-sided die on a stone pedestal.');
        }
      } else if (a === 'search') {
        this.spend(3);
        const r = await DH.ui.roller({ label: 'Perception — the room', mod: C.skillMod(pc(), 'perception'), dc: 12 });
        if (r.success) {
          state.found.plate = true;
          say('[good]There.[/] A small plate on the inside of the door frame, held on by a single screw.');
        } else say('Stone, stone, a speaker grille you cannot reach, and stone.');
      } else if (a === 'unscrew') {
        this.spend(3);
        const tools = C.hasItem(pc(), 'thieves_tools');
        const r = await DH.ui.roller({
          label: 'Sleight of Hand — one screw' + (tools ? ' (with tools)' : ' (with a dagger tip)'),
          mod: C.skillMod(pc(), 'sleight_of_hand') + (tools ? 2 : -2), dc: 12
        });
        if (r.success) {
          state.found.key = true;
          say('[good]The screw comes out. The plate swings aside. Behind it, on a nail, is a key.[/]');
          DH.audio.sfx('coin');
        } else say('The screw head is soft and your grip slips. It has turned, though. It will come.');
      } else if (a === 'unlock') {
        DH.audio.sfx('door');
        state.done = true;
        say('[good]The key turns. The door opens onto a corridor with no gas in it at all.[/]\n\nThe speaker says nothing, which somehow feels worse.');
        DH.game.setFlag('gas_escaped');
        DH.game.awardXp(300);
        this.redraw();
        buttons([{ label: 'Get out', cls: 'primary', fn: () => close({ won: true }) }]);
        return;
      } else if (a === 'force') {
        this.spend(2);
        const r = await DH.ui.roller({ label: 'Athletics — force the door', mod: C.skillMod(pc(), 'athletics'), dc: 20 });
        if (r.success) {
          state.done = true;
          say('[good]The frame splits and the door goes with it.[/] Grimble is going to be furious.');
          DH.game.setFlag('gas_escaped');
          DH.game.awardXp(300);
          buttons([{ label: 'Out', cls: 'primary', fn: () => close({ won: true }) }]);
          return;
        }
        say('It does not move, and your shoulder tells you about it.');
      }
      this.redraw();
      if (state.minutes > 0) this.menu();
    },
    gas() {
      say('[bad]A hiss from four corners at once.[/] The gas comes in fast and sweet-smelling.');
      DH.game.party().forEach(c => {
        const r = DH.dice.d20({ mod: C.saveMod(c, 'con'), dc: 15 });
        if (!r.success) { C.applyDamage(c, DH.dice.roll('4d6').total, 'poison'); C.addCondition(c, 'poisoned', 100); }
      });
      addLine('You crawl to the door and it opens from the other side — Grimble, looking horrified. "That one is meant to be *possible*!"');
      DH.game.setFlag('gas_escaped');
      buttons([{ label: 'Cough', fn: () => close({ won: false }) }]);
      return true;
    }
  };

  /* ============================================================ FISHING */
  GAMES.fishing = {
    title: 'Fishing off the Dock',
    rules: 'Wait for the line to dip, then strike. A Wisdom check sets the difficulty, and something bigger is always out there.',
    start() {
      state.stage = 'wait';
      say('You drop a line into the harbour. Salt, weed and the slow slap of water against the piles.');
      field('<div class="timer">…</div>');
      buttons([]);
      const delay = U.rint(900, 3200);
      state.biteAt = Date.now() + delay;
      state.window = 1100;
      clearInterval(timerHandle);
      timerHandle = setInterval(() => this.tick(), 60);
      buttons([{ label: 'Strike!', cls: 'primary', fn: () => this.strike() }, { label: 'Reel in and stop', fn: () => close() }]);
    },
    tick() {
      const now = Date.now();
      if (state.stage === 'wait' && now >= state.biteAt) {
        state.stage = 'bite';
        DH.audio.sfx('splash');
        field('<div class="timer warn">A BITE — strike now!</div>');
      } else if (state.stage === 'bite' && now > state.biteAt + state.window) {
        state.stage = 'wait';
        state.biteAt = now + U.rint(900, 2600);
        field('<div class="timer">…it lets go…</div>');
      }
    },
    async strike() {
      if (state.stage !== 'bite') {
        say('Nothing there. The line comes up bare and a gull laughs at you.');
        state.biteAt = Date.now() + U.rint(900, 2600);
        state.stage = 'wait';
        return;
      }
      clearInterval(timerHandle); timerHandle = null;
      const r = await DH.ui.roller({ label: 'Wisdom Check — set the hook', mod: C.abMod(pc(), 'wis') + (C.isProficient(pc(), 'survival') ? pc().prof : 0), dc: 11 });
      if (r.success) {
        const fish = r.natural >= 18 ? 'fish_glimmer' : U.pickWeighted([['fish_cod', 6], ['fish_eel', 3], ['fish_glimmer', 0.6], ['driftwood', 1.4]]);
        DH.game.giveItem(fish);
        say('[good]Landed:[/] ' + DH.item(fish).name + '.');
      } else {
        say('It rolls once, snaps the line and is gone. You have lost a hook and gained a grudge.');
      }
      DH.game.advanceMinutes(20);
      buttons([
        { label: 'Cast again', cls: 'primary', fn: () => { state = {}; GAMES.fishing.start(); } },
        { label: 'Done', fn: () => close() }
      ]);
    }
  };

  /* ============================================================ CRAFTING */
  GAMES.craft = {
    title: 'The Workbench',
    rules: 'Herbs, mushrooms and ore become something useful. What you can make depends on what you have gathered.',
    start() { this.redraw(); },
    redraw() {
      const inv = pc();
      let html = '';
      DH.RECIPES.forEach((rec, i) => {
        const can = Object.keys(rec.need).every(k => C.countItem(inv, k) >= rec.need[k]);
        const out = DH.item(rec.out);
        html += '<div class="wares' + (can ? '' : ' poor') + '" data-i="' + i + '">' +
          '<div class="grow">' + DH.ui.esc(out.name) + (rec.qty > 1 ? ' ×' + rec.qty : '') +
          '<div class="st">' + Object.keys(rec.need).map(k =>
            DH.item(k).name + ' ×' + rec.need[k] + ' (' + C.countItem(inv, k) + ')').join(', ') + '</div></div>' +
          '<div class="pr">' + (can ? 'make' : '—') + '</div></div>';
      });
      const f = field(html);
      f.querySelectorAll('.wares').forEach(e => {
        e.onclick = () => {
          const rec = DH.RECIPES[+e.dataset.i];
          const can = Object.keys(rec.need).every(k => C.countItem(pc(), k) >= rec.need[k]);
          if (!can) { DH.ui.toast('Not enough materials.', 'bad'); return; }
          Object.keys(rec.need).forEach(k => C.removeItem(pc(), k, rec.need[k]));
          DH.game.giveItem(rec.out, rec.qty);
          DH.game.advanceMinutes(30);
          DH.audio.sfx('confirm');
          this.redraw();
        };
      });
      say('Glass, a burner, and a great many stains.');
      buttons([{ label: 'Done', cls: 'primary', fn: () => close() }]);
    }
  };

  /* ============================================================ ARENA BRACKET */
  GAMES.arena_signup = {
    title: 'The Arena',
    rules: 'Four rounds. A crazed silver dragon until ten fighters remain. Then keep hold of an egg. Then two three-way fights. Then one against one.',
    start() {
      const done = DH.game.counter('arena_round');
      say('The Arena Master looks you over. "Four rounds. Most people stop after the first. You have cleared ' + done + '."');
      field('<div class="players">' +
        ['A crazed silver dragon, until ten are left standing',
          'Hold an egg when the timer runs out',
          'Two three-way fights',
          'One against one'].map((t, i) =>
            '<div class="pl' + (i < done ? ' out' : '') + '"><div class="nm">Round ' + (i + 1) + '</div><div class="grow">' + t +
            (i < done ? ' <span class="good">cleared</span>' : '') + '</div></div>').join('') + '</div>');
      buttons([
        { label: done >= 4 ? 'All four are done' : 'Enter round ' + (done + 1), cls: 'primary', disabled: done >= 4, fn: () => close({ enter: done + 1 }) },
        { label: 'Not today', fn: () => close({}) }
      ]);
    }
  };

  function update() {
    if (DH.input.tapped('cancel') && !DH.ui.modalOpen() && GAMES[which] && which !== 'gas_room') close();
  }
  function draw() {
    DH.gfx.rect(0, 0, DH.gfx.VW, DH.gfx.VH, '#0a0d14', true);
    DH.gfx.vignette(0.6);
  }

  return { name: 'minigames', enter, exit, resume, pause, update, draw, GAMES };
})();
