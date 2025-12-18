/**
 * Polynomial utilities for the toy STARK verifier.
 *
 * This module provides:
 * - Domain construction (roots of unity)
 * - Barycentric Lagrange interpolation
 * - Low-degree extension (LDE) evaluation
 */

import { mod, mul, div, pow, sub } from './math';

// --- Domain Construction ---

/**
 * Supported primes and their primitive roots.
 *
 * p = 97:  p-1 = 96 = 2^5 * 3, max N with blowup 4 = 8
 * p = 257: p-1 = 256 = 2^8, max N with blowup 4 = 64
 * p = 769: p-1 = 768 = 2^8 * 3, max N with blowup 4 = 64
 *
 * For educational purposes, p=257 is recommended for longer programs.
 */
const PRIME_CONFIG: Record<number, { primitiveRoot: number; groupOrder: number }> = {
  97: { primitiveRoot: 5, groupOrder: 96 },
  257: { primitiveRoot: 3, groupOrder: 256 },
  769: { primitiveRoot: 11, groupOrder: 768 },
};

/**
 * Find a primitive n-th root of unity for the given prime.
 * Returns g such that g^n = 1 and g^k != 1 for 0 < k < n.
 */
export function rootOfUnity(n: number, p: number): number {
  const config = PRIME_CONFIG[p];
  if (!config) {
    throw new Error(
      `Prime ${p} is not supported. Supported primes: ${Object.keys(PRIME_CONFIG).join(', ')}. ` +
      `For longer programs, use prime 257.`
    );
  }

  const { primitiveRoot, groupOrder } = config;

  if (groupOrder % n !== 0) {
    throw new Error(`No ${n}-th root of unity exists for p=${p} (need ${n} | ${groupOrder})`);
  }

  // g^(groupOrder/n) has order n
  return pow(primitiveRoot, groupOrder / n, p);
}

/**
 * Generate domain points [g^0, g^1, ..., g^(n-1)] for a root of unity g.
 */
export function domainPoints(n: number, p: number = 97): number[] {
  const g = rootOfUnity(n, p);
  const points: number[] = [];
  let current = 1;
  for (let i = 0; i < n; i++) {
    points.push(current);
    current = mul(current, g, p);
  }
  return points;
}

/**
 * Next power of 2 >= n.
 */
export function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

// --- Barycentric Lagrange Interpolation ---

/**
 * Precompute barycentric weights for a given set of x-coordinates.
 * w_i = 1 / ∏_{j≠i}(x_i - x_j)
 */
export function barycentricWeights(xPoints: number[], p: number): number[] {
  const n = xPoints.length;
  const weights: number[] = [];

  for (let i = 0; i < n; i++) {
    let w = 1;
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        w = mul(w, sub(xPoints[i], xPoints[j], p), p);
      }
    }
    weights.push(div(1, w, p)); // w_i = 1 / product
  }

  return weights;
}

/**
 * Evaluate the Lagrange interpolating polynomial at point x.
 * Given (x_i, y_i) pairs, finds the unique polynomial P of degree < n
 * such that P(x_i) = y_i, then evaluates P(x).
 *
 * Uses the barycentric formula:
 * P(x) = (∑ w_i * y_i / (x - x_i)) / (∑ w_i / (x - x_i))
 */
export function lagrangeEval(
  xPoints: number[],
  yPoints: number[],
  weights: number[],
  x: number,
  p: number
): number {
  const n = xPoints.length;

  // Check if x is one of the interpolation points
  for (let i = 0; i < n; i++) {
    if (mod(x, p) === mod(xPoints[i], p)) {
      return mod(yPoints[i], p);
    }
  }

  // Barycentric formula
  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    const diff = sub(x, xPoints[i], p);
    const term = div(weights[i], diff, p);
    numerator = mod(numerator + mul(term, yPoints[i], p), p);
    denominator = mod(denominator + term, p);
  }

  return div(numerator, denominator, p);
}

// --- Low-Degree Extension ---

/**
 * Compute the low-degree extension of a polynomial.
 *
 * Given values on a base domain of size N, evaluate the unique
 * degree-(N-1) polynomial on a larger domain of size M = N * blowup.
 *
 * @param values - Values on the base domain (at roots of unity of order N)
 * @param blowup - Expansion factor (typically 4)
 * @param p - Prime modulus
 * @returns Values on the LDE domain (at roots of unity of order M)
 */
export function computeLDE(values: number[], blowup: number, p: number): number[] {
  const N = values.length;
  const M = N * blowup;

  // Ensure N is a power of 2 and M divides p-1
  if ((N & (N - 1)) !== 0) {
    throw new Error(`Base domain size must be power of 2, got ${N}`);
  }
  if ((p - 1) % M !== 0) {
    throw new Error(`LDE domain size ${M} must divide p-1=${p - 1}`);
  }

  // Base domain points (roots of unity of order N)
  const baseDomain = domainPoints(N, p);

  // LDE domain points (roots of unity of order M)
  const ldeDomain = domainPoints(M, p);

  // Precompute barycentric weights for base domain
  const weights = barycentricWeights(baseDomain, p);

  // Evaluate at each point in LDE domain
  const ldeValues: number[] = [];
  for (const x of ldeDomain) {
    ldeValues.push(lagrangeEval(baseDomain, values, weights, x, p));
  }

  return ldeValues;
}

/**
 * Get the mapping from base domain indices to LDE domain indices.
 * Base point i maps to LDE point i * blowup.
 */
export function baseToLDEIndex(baseIndex: number, blowup: number): number {
  return baseIndex * blowup;
}

/**
 * Get the "next step" index in the LDE domain.
 * For a base domain of size N with blowup B, the next step
 * from LDE index i is (i + B) mod M.
 */
export function nextStepIndex(ldeIndex: number, blowup: number, M: number): number {
  return (ldeIndex + blowup) % M;
}

// --- Vanishing Polynomial ---

/**
 * Evaluate the vanishing polynomial Z_N(x) = x^N - 1.
 * This polynomial is zero exactly on the N-th roots of unity.
 */
export function evalVanishing(x: number, N: number, p: number): number {
  return sub(pow(x, N, p), 1, p);
}

/**
 * Compute vanishing polynomial values on an LDE domain.
 */
export function computeVanishingOnLDE(N: number, blowup: number, p: number): number[] {
  const M = N * blowup;
  const ldeDomain = domainPoints(M, p);
  return ldeDomain.map(x => evalVanishing(x, N, p));
}
