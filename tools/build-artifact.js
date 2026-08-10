/* Emit the game as a hostable page fragment.

   Some hosts wrap uploaded HTML in their own document skeleton — they supply the
   doctype, <html> and <head> — and expect the page content only. Handing them a
   complete document means a nested <html>, which browsers flatten in ways that
   drop the <head> contents and leave the styles behind.

   This takes the finished single-file build and returns just what goes inside
   the body: the game's stylesheet, its markup, and its scripts. Everything is
   already inlined by build-single-file.js, so nothing here reaches the network.

     node tools/build-artifact.js [out.html]

   Default output is dist/artifact.html.
*/
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'dist/drakehaven-island.html');
const OUT = process.argv[2] || path.join(ROOT, 'dist/artifact.html');

if (!fs.existsSync(SRC)) {
  console.error('dist/drakehaven-island.html is missing — run `npm run build` first.');
  process.exit(1);
}
const doc = fs.readFileSync(SRC, 'utf8');

/* pull the two halves out of the document */
const headM = doc.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
const bodyM = doc.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
if (!headM || !bodyM) { console.error('could not find <head> and <body> in the build.'); process.exit(1); }

/* keep the <style> blocks from the head; drop <meta>, <title> and <link>, which
   the wrapping document owns. The favicon link goes too: a fragment cannot
   declare one, and the host sets the tab icon itself. */
const styles = (headM[1].match(/<style[\s\S]*?<\/style>/gi) || []).join('\n');
if (!styles) { console.error('no inlined <style> found — the build is not self-contained.'); process.exit(1); }

const body = bodyM[1].trim();

/* The game commits to one visual world: a storm at sea, near-black #05070b with
   gold. It has no light mode by design, so the fragment restates the ground and
   fills the frame rather than inheriting whatever the host paints behind it. */
const frame = `<style>
/* the game owns the whole frame; the host's page ground must not show through */
html, body { height: 100%; margin: 0; background: #05070b; }
#stage { width: 100vw; height: 100vh; }
@media (prefers-reduced-motion: reduce) { #stage, #ui, #ui * { animation: none !important; } }
</style>`;

const out = [
  '<!-- Drakehaven Island — the whole game, inlined. No external requests. -->',
  styles,
  frame,
  body,
  ''
].join('\n');

/* the point of the exercise: nothing may reach off the page */
const external = (out.match(/(?:src|href)="(?!data:|#)[^"]*"/g) || []);
if (external.length) {
  console.error('refusing to write — ' + external.length + ' external reference(s) survived:');
  external.slice(0, 5).forEach(e => console.error('  ' + e));
  process.exit(1);
}
for (const tag of ['<!DOCTYPE', '<html', '</html>', '<head', '</head>', '<body', '</body>']) {
  if (out.toLowerCase().includes(tag.toLowerCase())) {
    console.error('refusing to write — document wrapper survived: ' + tag);
    process.exit(1);
  }
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, out);
console.log('wrote ' + path.relative(ROOT, OUT) + '  (' + (out.length / 1024).toFixed(0) + ' KB, ' +
            (out.match(/<script/g) || []).length + ' inlined script block(s), no external requests)');
