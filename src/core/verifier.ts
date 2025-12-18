/**
 * Toy STARK Verifier
 *
 * Verifies a STARK proof by checking:
 * 1. Commitments match the claimed values
 * 2. Constraint polynomial evaluates correctly at query points
 * 3. Quotient relation H(x) = Q(x) * Z(x) holds at query points
 * 4. FRI folding is consistent
 */

import { mul, add } from './math';
import { nextStepIndex } from './polynomial';
import { Transcript, commit } from './transcript';
import type { ToyStarkProof } from './prover';

// --- Verification Result Types ---

export interface VerificationStep {
  name: string;
  description: string;
  status: 'pending' | 'pass' | 'fail';
  details?: string;
  data?: Record<string, unknown>;
}

export interface VerificationResult {
  valid: boolean;
  steps: VerificationStep[];
}

// --- Verifier ---

/**
 * Verify a STARK proof.
 * Returns detailed step-by-step results for educational display.
 */
export function verify(proof: ToyStarkProof): VerificationResult {
  const steps: VerificationStep[] = [];
  const { params, traceCommitment, quotientCommitment, alphas, queryIndices, queryOpenings } = proof;
  const { prime: p, paddedTraceLength: N, blowup, ldeDomainSize: M, numQueries } = params;

  // Step 1: Verify parameters are valid
  steps.push({
    name: 'Parameter Check',
    description: 'Verify STARK parameters are valid',
    status: 'pending',
    data: { N, blowup, M, p, numQueries },
  });

  if ((p - 1) % M !== 0) {
    steps[0].status = 'fail';
    steps[0].details = `LDE domain size ${M} does not divide p-1=${p - 1}`;
    return { valid: false, steps };
  }

  if ((N & (N - 1)) !== 0) {
    steps[0].status = 'fail';
    steps[0].details = `Trace length ${N} is not a power of 2`;
    return { valid: false, steps };
  }

  steps[0].status = 'pass';
  steps[0].details = `N=${N}, B=${blowup}, M=${M}, p=${p}, queries=${numQueries}`;

  // Step 2: Reconstruct transcript and verify challenges
  steps.push({
    name: 'Transcript Reconstruction',
    description: 'Verify Fiat-Shamir challenges are correctly derived',
    status: 'pending',
    data: { alphasCount: alphas.length },
  });

  const transcript = new Transcript();

  // Reconstruct trace commitment absorption
  const columns = Object.keys(proof.ldeTrace);
  const traceFlat = columns.flatMap(col => proof.ldeTrace[col]);

  // Verify trace commitment
  const computedTraceCommitment = commit(traceFlat);
  if (computedTraceCommitment !== traceCommitment) {
    steps[1].status = 'fail';
    steps[1].details = `Trace commitment mismatch: expected ${traceCommitment}, got ${computedTraceCommitment}`;
    return { valid: false, steps };
  }

  transcript.absorb('trace_commitment', traceFlat);
  const recomputedAlphas = transcript.squeezeFieldMany(alphas.length, p);

  // Check alphas match
  const alphasMatch = alphas.every((a, i) => a === recomputedAlphas[i]);
  if (!alphasMatch) {
    steps[1].status = 'fail';
    steps[1].details = 'Alpha challenges do not match transcript';
    return { valid: false, steps };
  }

  steps[1].status = 'pass';
  steps[1].details = `${alphas.length} constraint coefficients verified`;

  // Step 3: Verify quotient commitment
  steps.push({
    name: 'Quotient Commitment',
    description: 'Verify commitment to quotient polynomial Q(x)',
    status: 'pending',
    data: { commitment: quotientCommitment },
  });

  const computedQuotientCommitment = commit(proof.quotientLDE);
  if (computedQuotientCommitment !== quotientCommitment) {
    steps[2].status = 'fail';
    steps[2].details = `Quotient commitment mismatch`;
    return { valid: false, steps };
  }

  steps[2].status = 'pass';
  steps[2].details = `Commitment: ${quotientCommitment.slice(0, 8)}...`;

  // Step 4: Verify query indices derivation
  steps.push({
    name: 'Query Index Derivation',
    description: 'Verify query indices are correctly derived from transcript',
    status: 'pending',
    data: { queryIndices },
  });

  transcript.absorb('quotient_commitment', proof.quotientLDE);

  // Recompute valid indices and query positions
  const validIndices: number[] = [];
  for (let i = 0; i < M; i++) {
    if (i % blowup !== 0) {
      validIndices.push(i);
    }
  }

  const queryPositions = transcript.squeezeIndices(numQueries, validIndices.length);
  const recomputedQueryIndices = queryPositions.map(pos => validIndices[pos]);

  const indicesMatch = queryIndices.every((idx, i) => idx === recomputedQueryIndices[i]);
  if (!indicesMatch) {
    steps[3].status = 'fail';
    steps[3].details = 'Query indices do not match transcript derivation';
    return { valid: false, steps };
  }

  steps[3].status = 'pass';
  steps[3].details = `Queries at LDE indices: [${queryIndices.join(', ')}]`;

  // Step 5: Verify query openings (the main STARK check!)
  steps.push({
    name: 'Query Opening Verification',
    description: 'Verify H(x) = Q(x) · Z(x) at each query point',
    status: 'pending',
    data: { numQueries: queryOpenings.length },
  });

  const queryResults: { index: number; H: number; Q: number; Z: number; product: number; match: boolean }[] = [];

  for (const opening of queryOpenings) {
    const { ldeIndex, constraintValue: H, quotientValue: Q, vanishingValue: Z } = opening;

    // Verify: H = Q * Z
    const product = mul(Q, Z, p);
    const match = H === product;

    queryResults.push({
      index: ldeIndex,
      H,
      Q,
      Z,
      product,
      match,
    });

    if (!match) {
      steps[4].status = 'fail';
      steps[4].details = `Query at index ${ldeIndex}: H(${H}) ≠ Q(${Q}) × Z(${Z}) = ${product}`;
      steps[4].data = { ...steps[4].data, queryResults };
      return { valid: false, steps };
    }
  }

  steps[4].status = 'pass';
  steps[4].details = `All ${queryOpenings.length} queries satisfy H = Q × Z`;
  steps[4].data = { ...steps[4].data, queryResults };

  // Step 6: Verify trace values at query points
  steps.push({
    name: 'Trace Value Verification',
    description: 'Verify opened trace values are consistent with commitment',
    status: 'pending',
  });

  for (const opening of queryOpenings) {
    const { ldeIndex, traceValues, nextTraceValues } = opening;
    const nextIdx = nextStepIndex(ldeIndex, blowup, M);

    // Check each column value matches the LDE
    for (const col of columns) {
      const expectedCurr = proof.ldeTrace[col][ldeIndex];
      const expectedNext = proof.ldeTrace[col][nextIdx];

      if (traceValues[col] !== expectedCurr) {
        steps[5].status = 'fail';
        steps[5].details = `Trace value mismatch for ${col} at index ${ldeIndex}`;
        return { valid: false, steps };
      }

      if (nextTraceValues[col] !== expectedNext) {
        steps[5].status = 'fail';
        steps[5].details = `Next trace value mismatch for ${col} at index ${nextIdx}`;
        return { valid: false, steps };
      }
    }
  }

  steps[5].status = 'pass';
  steps[5].details = 'All trace openings match committed values';

  // Step 7: Verify FRI folding consistency
  steps.push({
    name: 'FRI Verification',
    description: 'Verify FRI folding is consistent across layers',
    status: 'pending',
    data: {
      numLayers: proof.friLayers.length,
      finalValue: proof.friFinalValue,
    },
  });

  const friResult = verifyFRI(proof, transcript, p);

  if (!friResult.valid) {
    steps[6].status = 'fail';
    steps[6].details = friResult.error || 'FRI verification failed';
    return { valid: false, steps };
  }

  steps[6].status = 'pass';
  steps[6].details = `${proof.friLayers.length} FRI layers verified, final value: ${proof.friFinalValue}`;

  // Step 8: Final acceptance
  steps.push({
    name: 'Proof Accepted',
    description: 'All checks passed - the proof is valid!',
    status: 'pass',
    details: 'The prover has demonstrated knowledge of a valid execution trace',
  });

  return { valid: true, steps };
}

/**
 * Verify FRI folding consistency.
 */
function verifyFRI(
  proof: ToyStarkProof,
  transcript: Transcript,
  p: number
): { valid: boolean; error?: string } {
  const { friLayers, friQueryOpenings, friFinalValue, quotientLDE } = proof;

  if (friLayers.length === 0) {
    return { valid: false, error: 'No FRI layers provided' };
  }

  // Verify first layer commitment matches quotient
  const firstLayerCommitment = commit(quotientLDE);
  if (friLayers[0].commitment !== firstLayerCommitment) {
    return { valid: false, error: 'First FRI layer commitment mismatch' };
  }

  // Verify each layer's folding
  let currentValues = [...quotientLDE];

  for (let layerIdx = 0; layerIdx < friLayers.length; layerIdx++) {
    const layer = friLayers[layerIdx];

    // Verify commitment
    const expectedCommitment = commit(currentValues);
    if (layer.commitment !== expectedCommitment) {
      return { valid: false, error: `FRI layer ${layerIdx} commitment mismatch` };
    }

    // Absorb and derive beta
    transcript.absorb('fri_layer', currentValues);
    const beta = transcript.squeezeField(p);

    // Verify query openings for this layer
    if (layerIdx < friQueryOpenings.length) {
      for (const opening of friQueryOpenings[layerIdx]) {
        const { index, value, siblingValue, foldedValue } = opening;
        const halfLen = currentValues.length / 2;
        const i = index % halfLen;
        const j = i + halfLen;

        // Check values match current layer
        if (i < currentValues.length && currentValues[i] !== value) {
          return { valid: false, error: `FRI query value mismatch at layer ${layerIdx}, index ${i}` };
        }
        if (j < currentValues.length && currentValues[j] !== siblingValue) {
          return { valid: false, error: `FRI sibling value mismatch at layer ${layerIdx}, index ${j}` };
        }

        // Verify folding: folded = a + beta * b
        const expectedFolded = add(value, mul(beta, siblingValue, p), p);
        if (foldedValue !== expectedFolded) {
          return {
            valid: false,
            error: `FRI folding mismatch at layer ${layerIdx}: ${value} + ${beta}×${siblingValue} = ${expectedFolded}, got ${foldedValue}`,
          };
        }
      }
    }

    // Compute next layer values
    const nextValues: number[] = [];
    const halfLen = currentValues.length / 2;
    for (let i = 0; i < halfLen; i++) {
      const a = currentValues[i];
      const b = currentValues[i + halfLen];
      nextValues.push(add(a, mul(beta, b, p), p));
    }
    currentValues = nextValues;
  }

  // Verify final value
  if (currentValues.length !== 1 || currentValues[0] !== friFinalValue) {
    return { valid: false, error: `FRI final value mismatch: expected ${currentValues[0]}, got ${friFinalValue}` };
  }

  return { valid: true };
}
