import { cp, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '..', 'dist');
const indexHtml = path.join(distDir, 'index.html');

const routes = [
  'protocol',
  'math',
  'encoding',
  'trace',
  'polynomials',
  'commitments',
  'composition',
  'composition-details',
  'constraint-eval',
  'prover-verifier',
  'fri',
  'zk',
  'verify',
  'proof-security',
  'glossary',
  'resources',
  'implementation',
];

for (const route of routes) {
  const routeDir = path.join(distDir, route);
  await mkdir(routeDir, { recursive: true });
  await cp(indexHtml, path.join(routeDir, 'index.html'));
}
