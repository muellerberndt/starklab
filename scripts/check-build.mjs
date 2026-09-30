import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const dist = resolve(import.meta.dirname, '../dist');
const routes = ['', 'protocol', 'math', 'encoding', 'trace', 'polynomials', 'commitments', 'composition', 'composition-details', 'constraint-eval', 'prover-verifier', 'fri', 'zk', 'verify', 'proof-security', 'glossary', 'resources', 'implementation'];
for (const route of routes) {
  const html = await readFile(resolve(dist, route, 'index.html'), 'utf8');
  const canonical = `https://floatingpragma.io/starklab/${route ? route + '/' : ''}`;
  assert(html.includes(`rel="canonical" href="${canonical}"`), `Missing canonical: ${route}`);
  assert(html.includes('id="root"'), `Missing app root: ${route}`);
  assert(html.includes('floatingpragma.io/favicon.svg?v=5'), `Missing Pragma icon: ${route}`);
  assert(!/http-equiv="refresh"|location\.replace/.test(html), `Lesson replaced by redirect: ${route}`);
  const assets = [...html.matchAll(/(?:src|href)="\/starklab\/(assets\/[^"?#]+)[^"]*"/g)];
  assert(assets.some(([, asset]) => asset.endsWith('.js')), `Missing application bundle: ${route}`);
  for (const [, asset] of assets) assert((await stat(resolve(dist, asset))).isFile(), `Missing asset: ${asset}`);
}
assert((await readFile(resolve(dist, '404.html'), 'utf8')).includes('STARK Lab'));
console.log(`${routes.length} interactive lesson routes, their bundles, branding and 404 page verified.`);
