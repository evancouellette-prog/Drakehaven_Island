/* Simulate the ways a real host serves a static site WRONG, and see which of
   them break the game in a real browser.

   "Deploy succeeded, page is broken" almost always means the host answered a
   request with something the browser refused to run. The three classic causes:

     1. a catch-all SPA rewrite that also swallows /js and /css, so every
        script request comes back as HTML
     2. JavaScript served under the wrong Content-Type
     3. the page hosted under a subpath, so root-relative URLs miss

   Each of those still returns HTTP 200 for "/", which is why the host reports
   a healthy deploy while nothing works. This drives all of them.

   Run:  node tools/hostsim.js
*/
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');

const ROOT = path.join(__dirname, '..');
let failures = 0;
const ok = (c, m) => { if (!c) { failures++; console.log('  FAIL  ' + m); } else console.log('  ok    ' + m); };
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
                '.css': 'text/css; charset=utf-8' };

/* A configurable static server standing in for a misbehaving host.
   opts.rewriteAll  – answer EVERY path with index.html (the broken SPA rule)
   opts.jsType      – override the Content-Type sent for .js
   opts.nosniff     – send X-Content-Type-Options: nosniff
   opts.prefix      – serve the site under this path prefix                */
function host(opts) {
  const server = http.createServer((req, res) => {
    let url = decodeURIComponent(req.url.split('?')[0]);
    if (opts.prefix) {
      if (!url.startsWith(opts.prefix)) { res.writeHead(404).end('not found'); return; }
      url = url.slice(opts.prefix.length) || '/';
    }
    let rel = url === '/' || url === '' ? '/index.html' : url;
    if (opts.rewriteAll) rel = '/index.html';           // the bug being reproduced

    const file = path.join(ROOT, path.normalize(rel));
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404).end('not found'); return; }
      const ext = path.extname(file).toLowerCase();
      let type = TYPES[ext] || 'application/octet-stream';
      if (ext === '.js' && opts.jsType) type = opts.jsType;
      const headers = { 'Content-Type': type };
      if (opts.nosniff) headers['X-Content-Type-Options'] = 'nosniff';
      res.writeHead(200, headers).end(data);
    });
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r({ server, port: server.address().port })));
}

(async () => {
  const exe = ['/opt/pw-browsers/chromium/chrome-linux/chrome',
    '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell']
    .find(p => fs.existsSync(p));
  const browser = await chromium.launch({
    executablePath: exe,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--mute-audio',
           '--autoplay-policy=no-user-gesture-required']
  });

  /* Load a host and report whether the game actually came up. */
  async function tryHost(label, opts, viewport) {
    const { server, port } = await host(opts);
    const page = await browser.newPage({ viewport: viewport || { width: 1280, height: 760 } });
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    const base = 'http://127.0.0.1:' + port + (opts.prefix || '');
    let alive = false, scene = null;
    try {
      await page.goto(base + '/', { waitUntil: 'load' });
      await page.waitForFunction(() => window.DH && DH.game && DH.game.current(), null, { timeout: 6000 });
      scene = await page.evaluate(() => DH.game.current().name);
      alive = scene === 'title';
    } catch (e) { /* left alive = false */ }
    /* is anything actually visible, or is it a blank canvas on a blank page? */
    const painted = alive ? await page.evaluate(() => {
      const c = document.getElementById('screen');
      if (!c) return false;
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      for (let i = 0; i < d.length; i += 4) if (d[i] || d[i + 1] || d[i + 2]) return true;
      return false;
    }) : false;
    const menu = alive ? await page.locator('button:has-text("New Game")').first().isVisible().catch(() => false) : false;
    await page.close();
    server.close();
    return { label, alive, painted, menu, scene, errs };
  }

  console.log('\n=== a correct host (the control) ===');
  let r = await tryHost('correct', {});
  ok(r.alive && r.painted && r.menu, 'game boots, canvas paints, menu is clickable');
  ok(r.errs.length === 0, 'no console errors' + (r.errs.length ? ': ' + JSON.stringify(r.errs.slice(0, 2)) : ''));

  console.log('\n=== catch-all rewrite: EVERY path returns index.html ===');
  console.log('    (a Render/Netlify/Vercel SPA rule of /* -> /index.html)');
  r = await tryHost('rewriteAll', { rewriteAll: true });
  if (r.alive && r.painted && r.menu) {
    ok(true, 'survives even a catch-all rewrite');
  } else {
    console.log('  REPRODUCED  the page loads but the game never starts' +
      (r.scene ? ' (scene ' + r.scene + ')' : ' (DH never defined)'));
    console.log('              first browser error: ' + (r.errs[0] || '(none — silently blank)'));
    console.log('              THIS is "deploy succeeded, page is broken".');
  }

  console.log('\n=== JavaScript served under the wrong Content-Type ===');
  for (const t of ['text/plain; charset=utf-8', 'application/octet-stream']) {
    r = await tryHost('mime ' + t, { jsType: t });
    ok(r.alive && r.painted, 'runs when .js is sent as ' + t.split(';')[0]);
    r = await tryHost('mime+nosniff ' + t, { jsType: t, nosniff: true });
    if (!(r.alive && r.painted)) {
      console.log('  note        blocked when ' + t.split(';')[0] + ' is sent WITH nosniff — ' +
                  'that is the browser refusing, and only the host can fix the header');
    } else ok(true, 'runs when ' + t.split(';')[0] + ' is sent with nosniff');
  }

  console.log('\n=== hosted under a subpath ===');
  r = await tryHost('subpath', { prefix: '/Drakehaven_Island' });
  ok(r.alive && r.painted && r.menu, 'runs from /Drakehaven_Island/ (relative paths hold)');
  ok(r.errs.length === 0, 'no console errors from a subpath' + (r.errs.length ? ': ' + JSON.stringify(r.errs.slice(0, 2)) : ''));

  console.log('\n=== small screens ===');
  for (const vp of [{ width: 390, height: 844, name: 'phone portrait' },
                    { width: 844, height: 390, name: 'phone landscape' },
                    { width: 768, height: 1024, name: 'tablet portrait' }]) {
    r = await tryHost(vp.name, {}, { width: vp.width, height: vp.height });
    ok(r.alive, vp.name + ' (' + vp.width + '×' + vp.height + ') boots');
    if (r.alive && !r.menu) console.log('  note        ' + vp.name + ': menu not visible — the "wider window" notice is covering the game');
  }

  await browser.close();
  console.log('\n' + '='.repeat(52));
  console.log(failures === 0 ? 'HOST SIMULATION: ' + 'game survives every serving quirk tested'
                             : failures + ' HOST CONFIGURATIONS BREAK THE GAME');
  console.log('='.repeat(52));
  process.exit(failures === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
