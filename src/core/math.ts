export function mod(n: number, p: number): number {
  const r = n % p;
  return r < 0 ? r + p : r;
}

export function isProbablyPrime(n: number): boolean {
  if (!Number.isInteger(n) || n < 2) return false;
  if (n % 2 === 0) return n === 2;
  for (let d = 3; d * d <= n; d += 2) {
    if (n % d === 0) return false;
  }
  return true;
}

// --- Field Arithmetic ---

export function add(a: number, b: number, p: number): number {
  return mod(a + b, p);
}

export function sub(a: number, b: number, p: number): number {
  return mod(a - b, p);
}

export function mul(a: number, b: number, p: number): number {
  return mod(a * b, p);
}

/**
 * Modular exponentiation using square-and-multiply.
 * Computes base^exp mod p.
 */
export function pow(base: number, exp: number, p: number): number {
  if (exp < 0) {
    // Negative exponent: compute inverse first, then positive power
    return pow(inv(base, p), -exp, p);
  }
  let result = 1;
  base = mod(base, p);
  while (exp > 0) {
    if (exp % 2 === 1) {
      result = mod(result * base, p);
    }
    exp = Math.floor(exp / 2);
    base = mod(base * base, p);
  }
  return result;
}

/**
 * Modular inverse using Fermat's little theorem.
 * For prime p: a^(-1) = a^(p-2) mod p
 */
export function inv(a: number, p: number): number {
  a = mod(a, p);
  if (a === 0) {
    throw new Error("Cannot invert zero");
  }
  return pow(a, p - 2, p);
}

/**
 * Field division: a / b mod p
 */
export function div(a: number, b: number, p: number): number {
  return mul(a, inv(b, p), p);
}
