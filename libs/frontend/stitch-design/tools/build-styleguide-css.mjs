// Compiles the app's global stylesheet (apps/crusaders-bis-list-frontend/src/styles.scss) to
// _build/app.css so that styleguide.html can be opened straight from disk.
//   node libs/frontend/stitch-design/tools/build-styleguide-css.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..', '..', '..');
const require = createRequire(path.join(root, 'package.json'));
const sass = require('sass');

const entry = path.join(root, 'apps', 'crusaders-bis-list-frontend', 'src', 'styles.scss');
const out = path.resolve(here, '..', '_build', 'app.css');
const result = sass.compile(entry, { style: 'expanded' });
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, result.css);
console.log(`wrote ${path.relative(root, out)} (${(result.css.length / 1024).toFixed(1)} kB)`);
