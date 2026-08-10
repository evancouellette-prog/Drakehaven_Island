/* A line-level audit of the shipped code, looking for the kinds of bug that pass
   local tests and only break once deployed.

   Run:  node tools/audit.js
*/
'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
let problems = 0, checks = 0;
const bad = (m) => { problems++; console.log('  PROBLEM  ' + m); };
const ok = (m) => { checks++; if (process.env.VERBOSE) console.log('  ok       ' + m); };
const section = (s) => console.log('\n=== ' + s + ' ===');

const tracked = execSync('git ls-files', { cwd: ROOT }).toString().trim().split('\n');
const trackedSet = new Set(tracked);

/* ---------- 1. every asset the page asks for is committed, with exact case ---------- */
section('assets referenced by index.html');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const refs = [];
html.replace(/(?:src|href)="([^"]+)"/g, (_, r) => { refs.push(r); return _; });
if (!refs.length) bad('index.html references nothing at all');
/* a data: URI carries its own payload — it is the opposite of an external
   reference, so it needs no file on disk and no server route */
const inline = (r) => r.startsWith('data:');
refs.forEach(r => {
  checks++;
  if (inline(r)) return;
  if (/^(https?:)?\/\//.test(r)) { bad('external reference "' + r + '" — will break offline / under CSP'); return; }
  const abs = path.join(ROOT, r);
  if (!fs.existsSync(abs)) { bad('index.html references "' + r + '" which does not exist'); return; }
  if (!trackedSet.has(r)) { bad('index.html references "' + r + '" which is NOT COMMITTED — a fresh clone would 404'); return; }
  /* case check: the on-disk name must match byte for byte */
  const dir = path.dirname(abs), base = path.basename(abs);
  if (!fs.readdirSync(dir).includes(base)) bad('case mismatch for "' + r + '" (fails on a case-sensitive host)');
});
console.log('  ' + refs.length + ' references checked');

/* ---------- 2. nothing the game needs is gitignored ---------- */
section('gitignore does not hide the game');
const ignored = execSync('git ls-files --others --ignored --exclude-standard', { cwd: ROOT })
  .toString().trim().split('\n').filter(Boolean);
ignored.forEach(f => {
  checks++;
  if (/^(js|css)\//.test(f) || f === 'index.html') bad('gitignore hides "' + f + '" which the game loads');
});
console.log('  ' + ignored.length + ' ignored paths, none of them part of the site');

/* ---------- 3. script order matches the dependency order ---------- */
section('script load order');
const scripts = [];
html.replace(/<script src="([^"]+)"><\/script>/g, (_, s) => { scripts.push(s); return _; });
const idx = (f) => scripts.indexOf(f);
const mustPrecede = [
  ['js/core/util.js', 'js/core/gfx.js'],
  ['js/core/util.js', 'js/rules/dice.js'],
  ['js/core/gfx.js', 'js/data/maps.js'],       // maps.js reads DH.gfx.TILE at load
  ['js/data/classes.js', 'js/rules/character.js'],
  ['js/data/races.js', 'js/rules/character.js'],
  ['js/data/items.js', 'js/rules/character.js'],
  ['js/rules/character.js', 'js/core/game.js'],
  ['js/core/game.js', 'js/main.js'],
  ['js/data/story.js', 'js/main.js']
];
mustPrecede.forEach(([a, b]) => {
  checks++;
  if (idx(a) < 0) { bad(a + ' is not loaded at all'); return; }
  if (idx(b) < 0) { bad(b + ' is not loaded at all'); return; }
  if (idx(a) > idx(b)) bad(a + ' must load before ' + b);
});
console.log('  ' + scripts.length + ' scripts, order consistent');

/* ---------- 4. things that only bite on a real host ---------- */
section('host hazards in the source');
const jsFiles = tracked.filter(f => f.endsWith('.js') && !f.startsWith('tools/'));
jsFiles.concat(['index.html', 'css/style.css']).forEach(f => {
  const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
  checks++;
  if (/https?:\/\/(?!localhost)/.test(src.replace(/^\s*(\/\/|\/\*|\*).*$/gm, ''))) {
    /* w3.org URLs are XML namespaces (xmlns="http://www.w3.org/2000/svg") — an
       identifier the parser compares as a string, never a request */
    const hit = (src.match(/https?:\/\/[^\s"'`)]+/g) || []).filter(u =>
      !/localhost|claude\.ai|render\.com|github\.com|pip\.pypa\.io|www\.w3\.org/.test(u));
    if (hit.length) bad(f + ' fetches from the network: ' + hit.slice(0, 2).join(', '));
  }
  if (/\bfile:\/\//.test(src) && f !== 'index.html') bad(f + ' hardcodes a file:// path');
  if (/\/home\/|C:\\\\/.test(src)) bad(f + ' hardcodes an absolute local path');
});
console.log('  ' + jsFiles.length + ' game scripts scanned for network and path assumptions');

/* ---------- 5. localStorage must not be fatal when a host blocks it ---------- */
section('storage is optional');
const save = fs.readFileSync(path.join(ROOT, 'js/core/save.js'), 'utf8');
checks++;
const accesses = (save.match(/localStorage/g) || []).length;
const guards = (save.match(/try\s*{/g) || []).length;
if (guards < 3) bad('save.js touches localStorage ' + accesses + ' times but has only ' + guards + ' try blocks');
else ok('every localStorage access is guarded (' + guards + ' try blocks)');
console.log('  localStorage used ' + accesses + ' times, ' + guards + ' guarded blocks');

/* ---------- 6. the deploy entry points agree with each other ---------- */
section('deploy entry points');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
checks++;
if (!pkg.scripts || !pkg.scripts.start) bad('package.json has no start script');
else {
  const target = pkg.scripts.start.replace(/^node\s+/, '');
  if (!fs.existsSync(path.join(ROOT, target))) bad('package.json start runs "' + target + '" which does not exist');
}
['server.js', 'server.py', 'app.py', 'gunicorn.conf.py', 'requirements.txt', 'render.yaml'].forEach(f => {
  checks++;
  if (!trackedSet.has(f)) bad(f + ' is not committed');
});
/* gunicorn.conf.py must bind the injected port, or a host can never reach it */
const gconf = fs.readFileSync(path.join(ROOT, 'gunicorn.conf.py'), 'utf8');
checks++;
if (!/PORT/.test(gconf) || !/0\.0\.0\.0/.test(gconf)) bad('gunicorn.conf.py does not bind 0.0.0.0:$PORT');
/* the python servers must bind 0.0.0.0 too, not localhost */
['server.py', 'app.py'].forEach(f => {
  checks++;
  const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
  if (!/0\.0\.0\.0/.test(src)) bad(f + ' does not bind 0.0.0.0 — unreachable behind a proxy');
  if (!/PORT/.test(src)) bad(f + ' ignores the PORT environment variable');
});
const sjs = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
checks++;
if (!/process\.env\.PORT/.test(sjs)) bad('server.js ignores process.env.PORT');
/* requirements.txt must actually install what a gunicorn start command needs */
const reqs = fs.readFileSync(path.join(ROOT, 'requirements.txt'), 'utf8');
checks++;
if (!/^\s*gunicorn/m.test(reqs)) bad('requirements.txt does not install gunicorn, but app.py exists for `gunicorn app:app`');

/* ---------- 7. app.py's allowlist must cover everything the page loads ---------- */
section('app.py serves everything the page needs');
const appPy = fs.readFileSync(path.join(ROOT, 'app.py'), 'utf8');
const dirsM = appPy.match(/SERVE_DIRS\s*=\s*\(([^)]*)\)/);
const filesM = appPy.match(/SERVE_FILES\s*=\s*\(([^)]*)\)/);
const allow = new Set();
[dirsM, filesM].forEach(m => {
  if (!m) return;
  m[1].split(',').forEach(s => { s = s.trim().replace(/^["']|["']$/g, ''); if (s) allow.add(s); });
});
refs.forEach(r => {
  if (inline(r)) return;                 // never leaves the page, never hits app.py
  checks++;
  const top = r.replace(/^\.?\//, '').split('/')[0];
  if (!allow.has(top)) bad('app.py would refuse "' + r + '" (top-level "' + top + '" not in its allowlist)');
});
/* the docs are part of the published site too — a new one is easy to forget */
tracked.filter(f => f.endsWith('.md') && !f.includes('/')).forEach(f => {
  checks++;
  if (!allow.has(f)) bad('app.py would refuse "' + f + '" — add it to SERVE_FILES');
});
console.log('  allowlist: ' + [...allow].join(', '));

/* ---------- 7a. a catch-all rewrite silently breaks a multi-file site ----------
   `/*` -> `/index.html` also matches /js/util.js, so scripts come back as HTML,
   the browser says "Unexpected token '<'", and the page is blank while the
   deploy reports success. hostsim.js reproduces it. The game is one page with
   no client-side routing, so no such rule is ever justified here. */
section('no catch-all rewrite');
const ry = fs.readFileSync(path.join(ROOT, 'render.yaml'), 'utf8');
checks++;
{
  const routes = ry.replace(/^\s*#.*$/gm, '');          // ignore the explanation
  if (/type:\s*rewrite/.test(routes) && /source:\s*['"]?\/\*/.test(routes))
    bad('render.yaml declares a catch-all rewrite — it will serve HTML for /js/*.js and blank the page');
  else console.log('  render.yaml has no rewrite that could swallow /js or /css');
}
section('favicon');
checks++;
if (!/rel="icon"/.test(html)) bad('no favicon declared — browsers will request /favicon.ico and log a 404');
else if (!/rel="icon"[^>]*href="data:/.test(html)) bad('favicon is a separate file; inline it as a data URI to keep the project asset-free');
else console.log('  inline SVG favicon present, no extra request');

/* ---------- 8. the single-file build really is self-contained ---------- */
section('single-file build');
const distFile = path.join(ROOT, 'dist/drakehaven-island.html');
checks++;
if (!fs.existsSync(distFile)) bad('dist/drakehaven-island.html missing — run npm run build');
else {
  const dist = fs.readFileSync(distFile, 'utf8');
  const ext = (dist.match(/(?:src|href)="(?!data:)[^"]+"/g) || []);
  if (ext.length) bad('single-file build still references ' + ext.length + ' external files: ' + ext.slice(0, 3));
  checks++;
  if (!/id="screen"/.test(dist)) bad('single-file build has no canvas');
  /* staleness against EVERY inlined source, not just main.js — editing
     index.html or a css file must invalidate the build too */
  checks++;
  const built = fs.statSync(distFile).mtimeMs;
  const newer = ['index.html', 'css/style.css'].concat(jsFiles)
    .filter(f => fs.statSync(path.join(ROOT, f)).mtimeMs > built);
  if (newer.length) bad('dist build predates ' + newer.length + ' source file(s) (' +
    newer.slice(0, 3).join(', ') + ') — rerun npm run build');
  /* the build must carry the page's own <head>, favicon included */
  checks++;
  if (/rel="icon"/.test(html) && !/rel="icon"/.test(dist)) bad('single-file build dropped the favicon');
  checks++;
  if (!fs.existsSync(path.join(ROOT, 'dist/index.html'))) bad('dist/index.html missing — dist/ is not a servable site root');
}

/* ---------- 9. data the engine dereferences by string ---------- */
section('string references between data files');
const sandboxCheck = execSync('node tools/smoketest.js', { cwd: ROOT }).toString();
checks++;
if (!/ALL \d+ CHECKS PASSED/.test(sandboxCheck)) bad('the headless suite is not green');
else console.log('  ' + (sandboxCheck.match(/ALL (\d+) CHECKS PASSED/) || [])[1] + ' data and rules assertions pass');

/* ---------- report ---------- */
console.log('\n' + '='.repeat(52));
console.log(problems === 0
  ? 'AUDIT CLEAN — ' + checks + ' checks, no problems found'
  : problems + ' PROBLEMS FOUND across ' + checks + ' checks');
console.log('='.repeat(52));
process.exit(problems === 0 ? 0 : 1);
