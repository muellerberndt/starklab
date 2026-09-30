# STARK Lab

An interactive, visual explorer for **STARK** (Scalable Transparent Argument of Knowledge) proofs.

🚀 **The page is live at:** [https://floatingpragma.io/starklab](https://floatingpragma.io/starklab)

## Overview

STARKs are a powerful cryptographic primitive used for Verifiable Computation. However, they are often treated as "Moon Math" due to their complexity.

This repo is a learning/visualization tool — not a production prover/verifier.

**STARK Lab** breaks down the protocol into interactive steps, allowing you to:
1.  **Trace**: Write simple programs and see the execution trace.
2.  **Encode**: Visualize how traces become polynomials.
3.  **Commit/FRI (Concepts)**: Explore Merkle commitments and FRI-style folding at an intuition level.
4.  **Verify (Concepts)**: See the key checks a verifier would perform and how violations get caught.

## Running Locally

To run the visualizer on your machine:

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Then visit `http://localhost:5173/starklab/`.

## Publishing

The interactive app is served at `/starklab/`, with a direct HTML entry for
each lesson. The Pragma Research header, caret icon and responsive lesson
navigation are part of the app.

```bash
npm run build
node scripts/check-build.mjs
node scripts/check-fri-replay.mjs
```

Pushing `main` runs the build and publishes `dist/` to the `gh-pages` branch.
`npm run deploy` performs the same build before a manual deployment. Edit
`src/` and the build scripts; the generated deployment is not an authoring
surface.

Page titles, descriptions, canonical URLs and structured data come from
`src/seo.ts`. The app uses them during navigation, and `scripts/postbuild.mjs`
uses the same source for the static lesson pages and `dist/sitemap.xml`.
The sitemap omits `lastmod`: a deployment date does not establish when a
lesson's content changed. Metadata describes an educational toy implementation
and makes no claim of production security.
