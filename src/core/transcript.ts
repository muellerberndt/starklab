/**
 * Fiat-Shamir Transcript for the toy STARK.
 *
 * This provides a deterministic way to derive "random" challenges
 * from commitments, making the interactive protocol non-interactive.
 *
 * For educational purposes, we use a simple hash-based approach.
 */

import { mod } from './math';

/**
 * Simple non-cryptographic hash for educational purposes.
 * Uses FNV-1a style hashing.
 */
function simpleHash(data: number[]): number {
  let hash = 0x811c9dc5; // FNV offset basis
  for (const byte of data) {
    hash ^= byte & 0xff;
    hash = Math.imul(hash, 0x01000193); // FNV prime
    hash ^= (byte >> 8) & 0xff;
    hash = Math.imul(hash, 0x01000193);
    hash ^= (byte >> 16) & 0xff;
    hash = Math.imul(hash, 0x01000193);
    hash ^= (byte >> 24) & 0xff;
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0; // Convert to unsigned
}

/**
 * Transcript for Fiat-Shamir transform.
 * Absorbs data and squeezes out field elements.
 */
export class Transcript {
  private state: number[] = [];
  private counter = 0;

  /**
   * Absorb a labeled piece of data into the transcript.
   */
  absorb(label: string, data: number | number[]): void {
    // Add label (convert string to numbers)
    for (let i = 0; i < label.length; i++) {
      this.state.push(label.charCodeAt(i));
    }
    this.state.push(0); // separator

    // Add data
    if (typeof data === 'number') {
      this.state.push(data);
    } else {
      this.state.push(data.length);
      this.state.push(...data);
    }
  }

  /**
   * Squeeze a field element from the transcript.
   */
  squeezeField(p: number): number {
    this.state.push(this.counter++);
    const hash = simpleHash(this.state);
    return mod(hash, p);
  }

  /**
   * Squeeze multiple field elements.
   */
  squeezeFieldMany(count: number, p: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < count; i++) {
      result.push(this.squeezeField(p));
    }
    return result;
  }

  /**
   * Squeeze indices in range [0, max).
   * Used for query index generation.
   */
  squeezeIndices(count: number, max: number): number[] {
    const indices: number[] = [];
    const seen = new Set<number>();

    while (indices.length < count) {
      this.state.push(this.counter++);
      const hash = simpleHash(this.state);
      const idx = (hash >>> 0) % max;

      if (!seen.has(idx)) {
        seen.add(idx);
        indices.push(idx);
      }
    }

    return indices;
  }

  /**
   * Get a string representation of the current state (for display).
   */
  getStateDigest(): string {
    const hash = simpleHash(this.state);
    return hash.toString(16).padStart(8, '0');
  }
}

/**
 * Simple Merkle-like commitment for an array of field elements.
 * Returns a short hex string that commits to the data.
 */
export function commit(data: number[]): string {
  const hash = simpleHash(data);
  return hash.toString(16).padStart(8, '0');
}
