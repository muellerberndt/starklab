import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
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

const routeMeta = {
  protocol: {
    title: 'STARK Lab | The STARK Protocol',
    description:
      'Follow the full STARK protocol end to end, from algebraic execution traces to commitments, FRI, and final proof verification.',
  },
  math: {
    title: 'STARK Lab | Basics I: Fields and Trees',
    description:
      'Build the finite-field and Merkle-tree intuition behind STARK proofs in the first STARK Lab foundations lesson.',
  },
  encoding: {
    title: 'STARK Lab | Basics II: Encoding',
    description:
      'Learn how STARK witnesses are encoded into low-degree polynomial structure for efficient commitment and verification.',
  },
  trace: {
    title: 'STARK Lab | Trace and AIR',
    description:
      'See how computation traces and algebraic intermediate representations turn programs into objects a STARK prover can commit to.',
  },
  polynomials: {
    title: 'STARK Lab | Polynomials',
    description:
      'Understand the polynomial layer of STARK proofs, including interpolation, degree bounds, and why low-degree structure matters.',
  },
  commitments: {
    title: 'STARK Lab | Commitments',
    description:
      'Explore Merkle commitments and the commitment phase that lets STARK provers bind themselves to algebraic data.',
  },
  composition: {
    title: 'STARK Lab | Composition Polynomial',
    description:
      'Learn how STARK constraints are merged into a composition polynomial that can be checked efficiently by the verifier.',
  },
  'composition-details': {
    title: 'STARK Lab | Composition Details',
    description:
      'Dive deeper into the composition step, including quotient structure, randomization, and why the combined checks stay sound.',
  },
  'constraint-eval': {
    title: 'STARK Lab | Constraint Evaluation',
    description:
      'See how transition constraints are evaluated across the execution trace and converted into algebraic checks for a STARK proof.',
  },
  'prover-verifier': {
    title: 'STARK Lab | Prover and Verifier',
    description:
      'Compare the roles of the prover and verifier and understand how STARK proofs trade work, soundness, and transparency.',
  },
  fri: {
    title: 'STARK Lab | FRI',
    description:
      'Understand the FRI low-degree test that powers STARK scalability and keeps proof verification efficient.',
  },
  zk: {
    title: 'STARK Lab | Zero-Knowledge',
    description:
      'Learn how STARK proofs achieve zero-knowledge and why masking and randomization matter for privacy.',
  },
  verify: {
    title: 'STARK Lab | Proof Verification',
    description:
      'Step through STARK proof verification and see how the verifier checks commitments, queries, and low-degree guarantees.',
  },
  'proof-security': {
    title: 'STARK Lab | Proof Security',
    description:
      'Review the security assumptions and failure modes behind STARK soundness, transparency, and proof integrity.',
  },
  glossary: {
    title: 'STARK Lab | Glossary',
    description:
      'Use the STARK Lab glossary for concise definitions of the algebra, protocol, and proof-system terms used throughout the tutorial.',
  },
  resources: {
    title: 'STARK Lab | Further Reading',
    description:
      'Find papers, references, and next-step material for going deeper into STARKs, FRI, algebraic proofs, and implementation practice.',
  },
  implementation: {
    title: 'STARK Lab | Implementation Details',
    description:
      'Inspect practical implementation details for STARK systems, including traces, commitments, transcript flow, and engineering tradeoffs.',
  },
};

function applyRouteMeta(html, canonicalUrl, meta) {
  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${meta.title}</title>`)
    .replace(/<meta name="title" content="[^"]*" \/>/, `<meta name="title" content="${meta.title}" />`)
    .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${meta.description}" />`)
    .replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${canonicalUrl}" />`)
    .replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${canonicalUrl}" />`)
    .replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${meta.title}" />`)
    .replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${meta.description}" />`)
    .replace(/<meta property="twitter:url" content="[^"]*" \/>/, `<meta property="twitter:url" content="${canonicalUrl}" />`)
    .replace(/<meta property="twitter:title" content="[^"]*" \/>/, `<meta property="twitter:title" content="${meta.title}" />`)
    .replace(/<meta property="twitter:description" content="[^"]*" \/>/, `<meta property="twitter:description" content="${meta.description}" />`)
    .replace('"url": "https://floatingpragma.io/starklab/"', `"url": "${canonicalUrl}"`);
}

const rootHtml = await readFile(indexHtml, 'utf8');

for (const route of routes) {
  const routeDir = path.join(distDir, route);
  const routeIndexHtml = path.join(routeDir, 'index.html');
  const canonicalUrl = `https://floatingpragma.io/starklab/${route}/`;
  const meta = routeMeta[route];

  await mkdir(routeDir, { recursive: true });
  await cp(indexHtml, routeIndexHtml);
  await writeFile(routeIndexHtml, applyRouteMeta(rootHtml, canonicalUrl, meta));
}
