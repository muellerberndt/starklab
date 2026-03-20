export type SeoMeta = {
  title: string;
  description: string;
};

const DEFAULT_SEO: SeoMeta = {
  title: 'STARK Lab - Interactive STARK Proof Tutorial',
  description:
    'Learn how STARK proofs work through interactive visualizations. Write programs, explore execution traces, polynomial encoding, FRI protocol, and zero-knowledge proofs step by step.',
};

const ROUTE_SEO: Record<string, SeoMeta> = {
  '/': DEFAULT_SEO,
  '/protocol': {
    title: 'STARK Lab | The STARK Protocol',
    description:
      'Follow the full STARK protocol end to end, from algebraic execution traces to commitments, FRI, and final proof verification.',
  },
  '/math': {
    title: 'STARK Lab | Basics I: Fields and Trees',
    description:
      'Build the finite-field and Merkle-tree intuition behind STARK proofs in the first STARK Lab foundations lesson.',
  },
  '/encoding': {
    title: 'STARK Lab | Basics II: Encoding',
    description:
      'Learn how STARK witnesses are encoded into low-degree polynomial structure for efficient commitment and verification.',
  },
  '/trace': {
    title: 'STARK Lab | Trace and AIR',
    description:
      'See how computation traces and algebraic intermediate representations turn programs into objects a STARK prover can commit to.',
  },
  '/polynomials': {
    title: 'STARK Lab | Polynomials',
    description:
      'Understand the polynomial layer of STARK proofs, including interpolation, degree bounds, and why low-degree structure matters.',
  },
  '/commitments': {
    title: 'STARK Lab | Commitments',
    description:
      'Explore Merkle commitments and the commitment phase that lets STARK provers bind themselves to algebraic data.',
  },
  '/composition': {
    title: 'STARK Lab | Composition Polynomial',
    description:
      'Learn how STARK constraints are merged into a composition polynomial that can be checked efficiently by the verifier.',
  },
  '/composition-details': {
    title: 'STARK Lab | Composition Details',
    description:
      'Dive deeper into the composition step, including quotient structure, randomization, and why the combined checks stay sound.',
  },
  '/constraint-eval': {
    title: 'STARK Lab | Constraint Evaluation',
    description:
      'See how transition constraints are evaluated across the execution trace and converted into algebraic checks for a STARK proof.',
  },
  '/prover-verifier': {
    title: 'STARK Lab | Prover and Verifier',
    description:
      'Compare the roles of the prover and verifier and understand how STARK proofs trade work, soundness, and transparency.',
  },
  '/fri': {
    title: 'STARK Lab | FRI',
    description:
      'Understand the FRI low-degree test that powers STARK scalability and keeps proof verification efficient.',
  },
  '/zk': {
    title: 'STARK Lab | Zero-Knowledge',
    description:
      'Learn how STARK proofs achieve zero-knowledge and why masking and randomization matter for privacy.',
  },
  '/verify': {
    title: 'STARK Lab | Proof Verification',
    description:
      'Step through STARK proof verification and see how the verifier checks commitments, queries, and low-degree guarantees.',
  },
  '/proof-security': {
    title: 'STARK Lab | Proof Security',
    description:
      'Review the security assumptions and failure modes behind STARK soundness, transparency, and proof integrity.',
  },
  '/glossary': {
    title: 'STARK Lab | Glossary',
    description:
      'Use the STARK Lab glossary for concise definitions of the algebra, protocol, and proof-system terms used throughout the tutorial.',
  },
  '/resources': {
    title: 'STARK Lab | Further Reading',
    description:
      'Find papers, references, and next-step material for going deeper into STARKs, FRI, algebraic proofs, and implementation practice.',
  },
  '/implementation': {
    title: 'STARK Lab | Implementation Details',
    description:
      'Inspect practical implementation details for STARK systems, including traces, commitments, transcript flow, and engineering tradeoffs.',
  },
};

function normalizePathname(pathname: string): string {
  if (!pathname || pathname === '/') {
    return '/';
  }

  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

export function getSeoMeta(pathname: string): SeoMeta {
  return ROUTE_SEO[normalizePathname(pathname)] ?? DEFAULT_SEO;
}

export function getCanonicalUrl(pathname: string): string {
  const normalized = normalizePathname(pathname);

  if (normalized === '/') {
    return 'https://floatingpragma.io/starklab/';
  }

  return `https://floatingpragma.io/starklab${normalized}/`;
}
