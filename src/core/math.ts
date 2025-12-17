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
