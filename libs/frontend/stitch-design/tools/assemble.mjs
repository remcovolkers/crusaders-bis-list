#!/usr/bin/env node
// Assembles the split Stitch screens back into standalone, previewable HTML files.
//
//   node tools/assemble.mjs            -> build all targets into _build/
//   node tools/assemble.mjs raid-planner
//   node tools/assemble.mjs --verify   -> build + compare with the untouched originals in _source/
//
// Directives understood inside layout.html / parts / sections:
//   <!--@include path/to/file-->   replaced by the file's content (path is relative to the target folder; nests)
//   <!--@head <shell-type>-->      replaced by shared/head.html with the shared Tailwind theme inlined
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TARGETS = {
  'admin-user-management': 'screens/admin-user-management',
  'raid-planner': 'screens/raid-planner',
  'design-system': 'design-system',
};

const read = (...p) => fs.readFileSync(path.join(ROOT, ...p), 'utf8').replace(/\n$/, '');

function head(shellType) {
  const theme = JSON.stringify(JSON.parse(read('design-system/tailwind-theme.json')));
  return read('shared/head.html').replace('{{shell-type}}', shellType).replace('{{config}}', theme);
}

function expand(text, dir, seen = []) {
  return text
    .replace(/^[ \t]*<!--@head (\S+)-->[ \t]*$/gm, (_, t) => head(t))
    .replace(/^[ \t]*<!--@include (\S+)-->[ \t]*$/gm, (_, rel) => {
      const file = path.join(dir, rel);
      if (seen.includes(file)) throw new Error(`include cycle: ${file}`);
      return expand(read(path.relative(ROOT, file)), dir, [...seen, file]);
    });
}

function build(name) {
  const dir = TARGETS[name];
  return expand(read(dir, 'layout.html'), path.join(ROOT, dir)) + '\n';
}

// whitespace/formatting-insensitive form, used only for --verify
const norm = html => html
  .replace(/<script id="tailwind-config">[\s\S]*?<\/script>/g, '<tailwind-config/>')
  .replace(/\s*\/>/g, '>')
  .replace(/\s+/g, '');

const args = process.argv.slice(2);
const verify = args.includes('--verify');
const names = args.filter(a => !a.startsWith('--'));
const targets = names.length ? names : Object.keys(TARGETS);
fs.mkdirSync(path.join(ROOT, '_build'), { recursive: true });

let failed = false;
for (const name of targets) {
  if (!TARGETS[name]) throw new Error(`unknown target "${name}" (known: ${Object.keys(TARGETS).join(', ')})`);
  const html = build(name);
  fs.writeFileSync(path.join(ROOT, '_build', `${name}.html`), html);
  console.log(`built _build/${name}.html (${html.split('\n').length} lines)`);
  if (verify) {
    let original;
    if (name === 'design-system') original = read('_source/vanguard-tokens-components.html');
    else {
      // screens.html holds both screens as two concatenated documents
      const [admin, planner] = read('_source/screens.html').split(/\n(?=<!-- Raid Planner & Comp Analysis)/);
      original = name === 'admin-user-management' ? admin : planner;
    }
    const ok = norm(original) === norm(html);
    console.log(`  verify vs _source: ${ok ? 'IDENTICAL (ignoring whitespace/formatting)' : 'DIFFERENT'}`);
    failed ||= !ok;
  }
}
process.exit(failed ? 1 : 0);
