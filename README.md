# STARK Lab

An interactive, visual explorer for **STARK** (Scalable Transparent Argument of Knowledge) proofs.

🚀 **The page is live at:** [https://floatingpragma.io/starklab](https://floatingpragma.io/starklab)

## Overview

STARKs are a powerful cryptographic primitive used for Verifiable Computation. However, they are often treated as "Moon Math" due to their complexity.

**STARK Lab** breaks down the protocol into interactive steps, allowing you to:
1.  **Trace**: Write simple programs and see the execution trace.
2.  **Encode**: Visualize how traces become polynomials.
3.  **Prove**: Step through the FRI protocol and Merkle Commitments.
4.  **Verify**: See how the Verifier cryptographically checks the proof.

## Running Locally

To run the visualizer on your machine:

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Then visit `http://localhost:5173/`.
