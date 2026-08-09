/* Bundle Drakehaven Island into one self-contained .html file.

   Reads index.html, inlines the stylesheet and every script in the exact order
   the page lists them, and writes dist/drakehaven-island.html. The result needs
   no server and no network: double-click it, or host it anywhere.

   Run:  node tools/build-single-file.js
*/
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'dist');
const OUT = path.join(OUT_DIR, 'drakehaven-island.html');

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

/* A closing script tag inside a string literal would end our inline block. */
const guard = (js) => js.replace(/<\/script>/gi, '<\\/script>');

let out = html;
let inlined = 0, bytes = 0;

/* the stylesheet */
out = out.replace(/<link[^>]*href="([^"]+\.css)"[^>]*>/g, (_, href) => {
  const css = fs.readFileSync(path.join(ROOT, href), 'utf8');
  inlined++; bytes += css.length;
  return '<style>\n' + css + '\n</style>';
});

/* every script, in page order */
out = out.replace(/<script src="([^"]+)"><\/script>/g, (_, src) => {
  const js = fs.readFileSync(path.join(ROOT, src), 'utf8');
  inlined++; bytes += js.length;
  return '<script>\n/* ---- ' + src + ' ---- */\n' + guard(js) + '\n</script>';
});

/* nothing external may remain */
const leftovers = out.match(/(?:src|href)="(?!data:)[^"]+"/g) || [];
if (leftovers.length) {
  console.error('refusing to write: unresolved external references:', leftovers);
  process.exit(1);
}

out = out.replace('<title>Drakehaven Island</title>',
  '<title>Drakehaven Island</title>\n<meta name="description" content="A tactical D&D-style RPG built with no engine, no libraries and no asset files.">');

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT, out);
/* Also write it as dist/index.html, so dist/ is a complete deployable site on
   its own. A host pointed at either "." or "dist" then serves a working game. */
fs.writeFileSync(path.join(OUT_DIR, 'index.html'), out);

const kb = (n) => (n / 1024).toFixed(0) + ' KB';
console.log('inlined ' + inlined + ' files (' + kb(bytes) + ' of source)');
console.log('wrote   ' + path.relative(ROOT, OUT) + '  ' + kb(out.length));
console.log('wrote   dist/index.html (same bundle, so dist/ works as a site root)');
