export type SeoMeta = {
  title: string;
  description: string;
};

export const DEFAULT_SEO: SeoMeta = {
  title: 'STARK Lab | Interactive proof tutorial | Pragma Research',
  description:
    'Explore STARK proof concepts through interactive lessons on execution traces, finite fields, commitments and FRI. An educational toy implementation.',
};

export const ROUTE_SEO: Record<string, SeoMeta> = {
  '/': DEFAULT_SEO,
  '/protocol': {
    title: 'STARK Lab | The STARK Protocol',
    description:
      'Follow the stages of an educational toy prover, from an execution trace through commitments, folding and verification.',
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
      'Inspect how this educational model combines constraint evaluations, quotients and transcript challenges.',
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
      'Explore FRI concepts and replay the folding steps used by this educational proof model.',
  },
  '/zk': {
    title: 'STARK Lab | Zero-Knowledge',
    description:
      'Explore masking and randomization as zero-knowledge concepts, and the limits of this educational toy implementation.',
  },
  '/verify': {
    title: 'STARK Lab | Proof Verification',
    description:
      'Inspect commitment openings, transcript challenges and verification checks in the educational proof model.',
  },
  '/proof-security': {
    title: 'STARK Lab | Proof Security',
    description:
      'Study proof-system assumptions and the limits of a toy implementation, including commitments, transcripts and constraint checks.',
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
      'Inspect the toy implementation behind the lessons, including traces, commitments, transcript flow and engineering tradeoffs.',
  },
};

export const SITE_ORIGIN = 'https://floatingpragma.io';
export const SITE_URL = `${SITE_ORIGIN}/starklab/`;
export const PREVIEW_IMAGE = `${SITE_ORIGIN}/assets/pragma-settling-networks-2026-09.png`;
export const PREVIEW_ALT = 'Cadence. Brains that learn. Pragma Research caret and three connected patches with state, error and feedback on charcoal.';
export const INDEX_ROBOTS = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

function normalizePathname(pathname: string): string {
  const path = pathname.split(/[?#]/, 1)[0].replace(/^\/starklab(?=\/|$)/, '');
  return path.replace(/\/+$/, '') || '/';
}

export function isKnownRoute(pathname: string): boolean {
  return Object.hasOwn(ROUTE_SEO, normalizePathname(pathname));
}

export function getSeoMeta(pathname: string): SeoMeta {
  return ROUTE_SEO[normalizePathname(pathname)] ?? {
    title: 'Lesson not found | STARK Lab',
    description: 'Choose a lesson from the STARK Lab interactive proof tutorial.',
  };
}

export function getCanonicalUrl(pathname: string): string {
  const normalized = normalizePathname(pathname);
  return normalized === '/' || !isKnownRoute(normalized)
    ? SITE_URL
    : `${SITE_URL}${normalized.slice(1)}/`;
}

export function getStructuredData(pathname: string) {
  if (!isKnownRoute(pathname)) return null;
  const canonical = getCanonicalUrl(pathname);
  const meta = getSeoMeta(pathname);
  const organization = `${SITE_ORIGIN}/#organization`;
  const website = `${SITE_URL}#website`;
  const breadcrumb = `${canonical}#breadcrumb`;
  const items = [
    { '@type': 'ListItem', position: 1, name: 'Pragma Research', item: `${SITE_ORIGIN}/` },
    { '@type': 'ListItem', position: 2, name: 'STARK Lab', item: SITE_URL },
  ];
  if (canonical !== SITE_URL) {
    items.push({ '@type': 'ListItem', position: 3, name: meta.title.replace(/^STARK Lab \| /, ''), item: canonical });
  }
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Organization', '@id': organization, name: 'Pragma Research', url: `${SITE_ORIGIN}/` },
      { '@type': 'WebSite', '@id': website, name: 'STARK Lab', url: SITE_URL,
        publisher: { '@id': organization }, inLanguage: 'en' },
      { '@type': ['WebPage', 'LearningResource'], '@id': canonical, url: canonical,
        name: meta.title, description: meta.description, inLanguage: 'en',
        learningResourceType: 'Interactive tutorial', isAccessibleForFree: true,
        isPartOf: { '@id': website }, publisher: { '@id': organization },
        breadcrumb: { '@id': breadcrumb } },
      { '@type': 'BreadcrumbList', '@id': breadcrumb, itemListElement: items },
    ],
  };
}
