/**
 * Toy STARK Prover
 *
 * This module generates a proof that an execution trace satisfies
 * the AIR constraints. The proof can be verified without re-executing
 * the program.
 *
 * EDUCATIONAL NOTE: This is a simplified implementation for teaching.
 * A real STARK would evaluate constraint polynomials on the full LDE domain.
 */

import { mul, div, add } from './math';
import {
  computeLDE,
  domainPoints,
  nextPow2,
  evalVanishing,
  nextStepIndex,
} from './polynomial';
import { Transcript, commit } from './transcript';
import type { TraceRow } from './vm';
import type { AirModel } from './air';

// --- Proof Structure ---

export interface FriLayer {
  commitment: string;
  values: number[];
}

export interface QueryOpening {
  ldeIndex: number;
  // Trace values at this index and the "next step" index
  traceValues: Record<string, number>;
  nextTraceValues: Record<string, number>;
  // Computed values
  constraintValue: number; // H(x)
  vanishingValue: number;  // Z(x)
  quotientValue: number;   // Q(x)
}

export interface FriQueryOpening {
  layerIndex: number;
  index: number;
  value: number;
  siblingValue: number;
  foldedValue: number;
}

export interface ToyStarkProof {
  // Parameters
  params: {
    prime: number;
    traceLength: number;       // Original trace length
    paddedTraceLength: number; // N (padded to power of 2)
    blowup: number;            // B
    ldeDomainSize: number;     // M = N * B
    numQueries: number;        // q
  };

  // Commitments
  traceCommitment: string;
  quotientCommitment: string;

  // Challenges (derived from transcript)
  alphas: number[];           // Constraint combination coefficients
  queryIndices: number[];     // Indices to open

  // Query openings
  queryOpenings: QueryOpening[];

  // FRI proof
  friLayers: FriLayer[];
  friQueryOpenings: FriQueryOpening[][];
  friFinalValue: number;

  // For educational display
  ldeTrace: Record<string, number[]>;  // LDE of each trace column
  quotientLDE: number[];               // Q(x) on LDE domain
  constraintLDE: number[];             // H(x) on LDE domain
  vanishingLDE: number[];              // Z(x) on LDE domain
}

// --- Helper Functions ---

/**
 * Find the maximum trace length N (power of 2) that works for given prime and blowup.
 */
function findMaxN(prime: number, blowup: number): number {
  let n = 1;
  while ((prime - 1) % (n * blowup) === 0 && n * blowup <= prime - 1) {
    n *= 2;
  }
  return n / 2; // Go back to last valid N
}

// --- Prover ---

export interface ProverParams {
  blowup?: number;    // Default: 4
  numQueries?: number; // Default: 4
}

/**
 * Generate a STARK proof for the given trace and AIR.
 */
export function prove(
  trace: TraceRow[],
  air: AirModel,
  prime: number,
  regNames: string[],
  params: ProverParams = {}
): ToyStarkProof {
  const blowup = params.blowup ?? 4;
  const numQueries = params.numQueries ?? 4;

  // Step 1: Pad trace to power of 2
  const traceLength = trace.length;
  const N = nextPow2(traceLength);
  const M = N * blowup;

  // The LDE domain size M must divide p-1.
  // p=97:  p-1=96,  max N=8 with blowup=4
  // p=257: p-1=256, max N=64 with blowup=4
  if ((prime - 1) % M !== 0) {
    const maxN = findMaxN(prime, blowup);
    const suggestion = prime === 97
      ? ' Use "prime 257" for programs up to 64 instructions.'
      : '';
    throw new Error(
      `Trace too long! For p=${prime} with blowup=${blowup}, ` +
      `max trace length is ${maxN} rows (yours: ${traceLength}).${suggestion}`
    );
  }

  // Pad trace with copies of last row
  const paddedTrace: TraceRow[] = [...trace];
  while (paddedTrace.length < N) {
    paddedTrace.push({ ...trace[trace.length - 1] });
  }

  // Step 2: Extract columns and compute LDE
  const columns = ['pc', 'halted', ...regNames];
  const ldeTrace: Record<string, number[]> = {};

  for (const col of columns) {
    const values = paddedTrace.map(row =>
      col === 'pc' ? row.pc :
      col === 'halted' ? row.halted :
      row.regs[col] ?? 0
    );
    ldeTrace[col] = computeLDE(values, blowup, prime);
  }

  // Step 3: Commit to trace LDE
  const traceFlat = columns.flatMap(col => ldeTrace[col]);
  const traceCommitment = commit(traceFlat);

  // Step 4: Initialize transcript and derive alphas
  const transcript = new Transcript();
  transcript.absorb('trace_commitment', traceFlat);

  // Count total constraints
  const numConstraints = air.boundary.length +
    air.transitions.reduce((sum, t) => sum + t.constraints.length, 0);

  const alphas = transcript.squeezeFieldMany(numConstraints, prime);

  // Step 5: Compute constraint polynomial H(x) on LDE domain
  // In a real STARK, H(x) would be computed by evaluating constraint polynomials.
  // Here we use a simplified approach for educational purposes.
  const ldeDomain = domainPoints(M, prime);

  // Precompute vanishing polynomial Z(x) = x^N - 1 on LDE
  const vanishingLDE = ldeDomain.map(x => evalVanishing(x, N, prime));

  // Build constraint values at base points only (where constraints are defined)
  const baseConstraintValues: number[] = new Array(N).fill(0);

  let alphaIdx = 0;

  // Boundary constraints at step 0
  for (const c of air.boundary) {
    const val = c.eval();
    baseConstraintValues[0] = add(baseConstraintValues[0], mul(alphas[alphaIdx], val, prime), prime);
    alphaIdx++;
  }

  // Transition constraints at each step
  for (const t of air.transitions) {
    const stepIdx = t.stepIndex;
    if (stepIdx < N) {
      for (const c of t.constraints) {
        const val = c.eval();
        baseConstraintValues[stepIdx] = add(baseConstraintValues[stepIdx], mul(alphas[alphaIdx], val, prime), prime);
        alphaIdx++;
      }
    } else {
      alphaIdx += t.constraints.length;
    }
  }

  // Now extend H to the LDE domain
  // H should be zero at all base points if constraints are satisfied
  const constraintLDE = computeLDE(baseConstraintValues, blowup, prime);

  // Step 6: Compute quotient Q(x) = H(x) / Z(x)
  const quotientLDE: number[] = [];

  for (let i = 0; i < M; i++) {
    const Z = vanishingLDE[i];
    const H = constraintLDE[i];

    if (Z === 0) {
      // At base points where Z=0, H should also be 0 for valid trace
      // Q is undefined here but we set it to 0 (verifier won't query these)
      quotientLDE.push(0);
    } else {
      quotientLDE.push(div(H, Z, prime));
    }
  }

  // Step 7: Commit to quotient
  const quotientCommitment = commit(quotientLDE);
  transcript.absorb('quotient_commitment', quotientLDE);

  // Step 8: Derive query indices (avoiding base points where Z=0)
  const validIndices: number[] = [];
  for (let i = 0; i < M; i++) {
    if (i % blowup !== 0) { // Not a base point
      validIndices.push(i);
    }
  }

  // Get random query positions within valid indices
  const queryPositions = transcript.squeezeIndices(Math.min(numQueries, validIndices.length), validIndices.length);
  const queryIndices = queryPositions.map(pos => validIndices[pos]);

  // Step 9: Create query openings
  const queryOpenings: QueryOpening[] = queryIndices.map(ldeIdx => {
    const nextIdx = nextStepIndex(ldeIdx, blowup, M);

    const traceValues: Record<string, number> = {};
    const nextTraceValues: Record<string, number> = {};

    for (const col of columns) {
      traceValues[col] = ldeTrace[col][ldeIdx];
      nextTraceValues[col] = ldeTrace[col][nextIdx];
    }

    return {
      ldeIndex: ldeIdx,
      traceValues,
      nextTraceValues,
      constraintValue: constraintLDE[ldeIdx],
      vanishingValue: vanishingLDE[ldeIdx],
      quotientValue: quotientLDE[ldeIdx],
    };
  });

  // Step 10: FRI on quotient polynomial
  const { friLayers, friQueryOpenings, friFinalValue } = proveFRI(
    quotientLDE,
    queryIndices,
    transcript,
    prime
  );

  return {
    params: {
      prime,
      traceLength,
      paddedTraceLength: N,
      blowup,
      ldeDomainSize: M,
      numQueries: queryIndices.length,
    },
    traceCommitment,
    quotientCommitment,
    alphas,
    queryIndices,
    queryOpenings,
    friLayers,
    friQueryOpenings,
    friFinalValue,
    ldeTrace,
    quotientLDE,
    constraintLDE,
    vanishingLDE,
  };
}

// --- FRI Prover ---

function proveFRI(
  values: number[],
  queryIndices: number[],
  transcript: Transcript,
  prime: number
): {
  friLayers: FriLayer[];
  friQueryOpenings: FriQueryOpening[][];
  friFinalValue: number;
} {
  const friLayers: FriLayer[] = [];
  const friQueryOpenings: FriQueryOpening[][] = [];

  let currentValues = [...values];
  let currentIndices = [...queryIndices];

  // Fold until we reach a small constant
  while (currentValues.length > 1) {
    // Commit to current layer
    const commitment = commit(currentValues);
    friLayers.push({ commitment, values: [...currentValues] });

    transcript.absorb('fri_layer', currentValues);

    // Derive folding challenge beta
    const beta = transcript.squeezeField(prime);

    // Record query openings for this layer
    const layerOpenings: FriQueryOpening[] = [];
    const newIndices: number[] = [];

    for (const idx of currentIndices) {
      const halfLen = currentValues.length / 2;
      const i = idx % halfLen;
      const j = i + halfLen;

      const a = currentValues[Math.min(i, currentValues.length - 1)];
      const b = currentValues[Math.min(j, currentValues.length - 1)];

      // Fold: (a + beta * b)
      const folded = add(a, mul(beta, b, prime), prime);

      layerOpenings.push({
        layerIndex: friLayers.length - 1,
        index: idx,
        value: a,
        siblingValue: b,
        foldedValue: folded,
      });

      newIndices.push(i);
    }

    friQueryOpenings.push(layerOpenings);

    // Fold values for next layer
    const nextValues: number[] = [];
    const halfLen = currentValues.length / 2;
    for (let i = 0; i < halfLen; i++) {
      const a = currentValues[i];
      const b = currentValues[i + halfLen];
      nextValues.push(add(a, mul(beta, b, prime), prime));
    }

    currentValues = nextValues;
    currentIndices = [...new Set(newIndices)]; // Remove duplicates
  }

  const friFinalValue = currentValues[0];

  return { friLayers, friQueryOpenings, friFinalValue };
}
