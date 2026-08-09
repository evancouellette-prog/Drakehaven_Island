/* Drakehaven Island — buying and selling. Stock is real and runs out. */
window.DH = window.DH || {};

DH.scenes.shop = (function () {
  'use strict';
  const U = DH.util, C = DH.char;

  let def = null, id = null, stock = null, sel = null, selSide = 'buy', onDone = null;

  function enter(arg) {
    id = arg.id;
    def = DH.SHOPS[id];
    onDone = arg.onDone || null;
    if (!def) { close(); return; }
    stock = DH.game.shopStock(id);
    sel = null;
    if (def.music) DH.audio.play(def.music);
    build();
  }
  function exit() { DH.ui.clear(); }
  function resume() { build(); }
  function pause() { DH.ui.clear(); }

  function close() {
    DH.game.pop();
    DH.game.flushOps();
    if (onDone) onDone();
  }

  function build() {
    DH.ui.clear();
    const root = document.getElementById('ui');
    const wrap = DH.ui.el('div'); wrap.id = 'shop';
    root.appendChild(wrap);
    const win = DH.ui.add(wrap, 'div', 'win panel gilt');

    const hd = DH.ui.add(win, 'div', 'hd');
    DH.ui.add(hd, 'h2', '', DH.ui.esc(def.name));
    const g = DH.ui.add(hd, 'div', 'gold');
    g.id = 'shop-gold';
    g.textContent = U.commas(DH.game.partyGold()) + ' gp';
    hd.appendChild(DH.ui.btn('Leave (Esc)', '', close));

    const cols = DH.ui.add(win, 'div', 'cols');

    /* buy side */
    const buy = DH.ui.add(cols, 'div', 'side');
    DH.ui.add(buy, 'h3', '', (def.shady ? 'ON OFFER — QUIETLY' : 'FOR SALE'));
    const buyList = DH.ui.add(buy, 'div', 'list'); buyList.id = 'shop-buy';
    /* sell side */
    const sell = DH.ui.add(cols, 'div', 'side');
    DH.ui.add(sell, 'h3', '', 'YOUR PACK — SELLS FOR A THIRD');
    const sellList = DH.ui.add(sell, 'div', 'list'); sellList.id = 'shop-sell';

    const detail = DH.ui.add(win, 'div', 'detail'); detail.id = 'shop-detail';
    detail.innerHTML = '<b>' + DH.ui.esc(def.keeper) + '</b><p>' + DH.ui.esc(def.greet) + '</p>';

    refresh();
  }

  function refresh() {
    const buyList = document.getElementById('shop-buy');
    const sellList = document.getElementById('shop-sell');
    const gold = DH.game.partyGold();
    if (!buyList) return;
    buyList.innerHTML = '';
    stock.forEach(row => {
      const it = DH.item(row.id);
      if (!it) return;
      const afford = gold >= it.price && row.qty > 0;
      const e = DH.ui.el('div', 'wares' + (afford ? '' : ' poor') +
        (sel && selSide === 'buy' && sel.id === row.id ? ' on' : ''));
      e.innerHTML = '<div class="grow">' + DH.ui.esc(it.name) +
        '<div class="st">' + (row.qty > 0 ? row.qty + ' in stock' : 'sold out') + '</div></div>' +
        '<div class="pr">' + U.commas(it.price) + ' gp</div>';
      e.onclick = () => { sel = row; selSide = 'buy'; showDetail(it, 'buy', row); refresh(); };
      e.ondblclick = () => doBuy(row);
      buyList.appendChild(e);
    });

    sellList.innerHTML = '';
    const pc = DH.game.pc();
    pc.inv.forEach(slot => {
      const it = DH.item(slot.id);
      if (!it) return;
      if (it.quest) return;                 // story items are not for sale
      if (def.buys && def.buys.length && def.buys.indexOf(slot.id) < 0 && it.kind !== 'material') {
        /* specialised buyers still take general goods at a worse rate */
      }
      const price = DH.sellPrice(slot.id);
      const e = DH.ui.el('div', 'wares' + (sel && selSide === 'sell' && sel.id === slot.id ? ' on' : ''));
      const equipped = Object.keys(pc.equipped).some(k => pc.equipped[k] === slot.id);
      e.innerHTML = '<div class="grow">' + DH.ui.esc(it.name) + (slot.qty > 1 ? ' ×' + slot.qty : '') +
        (equipped ? '<div class="st">equipped</div>' : '') + '</div>' +
        '<div class="pr">' + U.commas(price) + ' gp</div>';
      e.onclick = () => { sel = slot; selSide = 'sell'; showDetail(it, 'sell', slot); refresh(); };
      e.ondblclick = () => doSell(slot);
      sellList.appendChild(e);
    });
    const gd = document.getElementById('shop-gold');
    if (gd) gd.textContent = U.commas(gold) + ' gp';
  }

  function showDetail(it, side, row) {
    const d = document.getElementById('shop-detail');
    if (!d) return;
    d.innerHTML = '';
    const title = DH.ui.add(d, 'b', '', DH.ui.esc(it.name) +
      (it.rarity ? ' <span class="dim small">(' + it.rarity + ')</span>' : ''));
    const bits = [];
    if (it.kind === 'weapon') bits.push(it.dmg + ' ' + it.type + (it.props ? ' · ' + it.props.join(', ') : ''));
    if (it.kind === 'armor') bits.push(it.armorKind + (it.ac ? ' · AC ' + it.ac : '') + (it.acBonus ? ' · +' + it.acBonus + ' AC' : ''));
    if (it.attune) bits.push('requires attunement');
    if (it.illegal) bits.push('very much illegal');
    DH.ui.add(d, 'p', '', DH.ui.esc(it.desc || bits.join(' · ') || '') + (it.desc && bits.length ? '<br><span class="dim small">' + DH.ui.esc(bits.join(' · ')) + '</span>' : ''));
    const row2 = DH.ui.add(d, 'div', 'row');
    if (side === 'buy') {
      const b = DH.ui.btn('Buy — ' + U.commas(it.price) + ' gp', 'primary', () => doBuy(row));
      b.disabled = DH.game.partyGold() < it.price || row.qty <= 0;
      row2.appendChild(b);
      if (row.qty >= 5) {
        const b5 = DH.ui.btn('Buy 5', '', () => { for (let i = 0; i < 5; i++) doBuy(row, true); refresh(); });
        b5.disabled = DH.game.partyGold() < it.price * 5;
        row2.appendChild(b5);
      }
    } else {
      row2.appendChild(DH.ui.btn('Sell — ' + U.commas(DH.sellPrice(it.id)) + ' gp', 'primary', () => doSell(row)));
      if (row.qty > 1) row2.appendChild(DH.ui.btn('Sell all ' + row.qty, '', () => {
        const n = row.qty; for (let i = 0; i < n; i++) doSell(row, true); refresh();
      }));
    }
  }

  function doBuy(row, quiet) {
    const it = DH.item(row.id);
    if (!it || row.qty <= 0) return;
    if (!DH.game.spendGold(it.price)) { if (!quiet) DH.ui.toast('Not enough coin.', 'bad'); return; }
    row.qty--;
    C.addItem(DH.game.pc(), row.id, 1);
    DH.audio.sfx('coin');
    if (!quiet) { DH.ui.toast('Bought ' + it.name, 'item', 1400); refresh(); showDetail(it, 'buy', row); }
    DH.game.addAffinity('shop_' + id, 1);
  }
  function doSell(slot, quiet) {
    const it = DH.item(slot.id);
    if (!it) return;
    const price = DH.sellPrice(slot.id);
    C.removeItem(DH.game.pc(), slot.id, 1);
    DH.game.pc().gold += price;
    DH.audio.sfx('coin');
    if (!quiet) { DH.ui.toast('Sold ' + it.name + ' for ' + price + ' gp', '', 1400); refresh(); }
  }

  function update() {
    if (DH.input.tapped('cancel') && !DH.ui.modalOpen()) close();
  }
  function draw() {
    /* the world keeps ticking faintly behind the shop window */
    DH.gfx.rect(0, 0, DH.gfx.VW, DH.gfx.VH, '#0a0d14', true);
    DH.gfx.vignette(0.6);
  }

  return { name: 'shop', enter, exit, resume, pause, update, draw };
})();
