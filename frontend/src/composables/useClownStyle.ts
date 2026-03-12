const PRIMES = [2, 3, 5, 7, 11];

function randomDeg(min: number, max: number): string {
  return `${(Math.random() * (max - min) + min).toFixed(1)}deg`;
}

function pickUniquePrimes(n: number): number[] {
  const shuffled = [...PRIMES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function jitteredDuration(prime: number): string {
  return `${(prime + (Math.random() - 0.5) * 0.4).toFixed(1)}s`;
}

function randomDelay(): string {
  return `${(Math.random() * -10).toFixed(1)}s`;
}

export function useClownStyle(): Record<string, string> {
  const [rPrime, sPrime, scPrime] = pickUniquePrimes(3);

  return {
    "--clown-r": randomDeg(5, 15),
    "--clown-s": randomDeg(3, 8),
    "--clown-sc": `${(1.03 + Math.random() * 0.12).toFixed(2)}`,
    "--clown-r-dur": jitteredDuration(rPrime),
    "--clown-s-dur": jitteredDuration(sPrime),
    "--clown-sc-dur": jitteredDuration(scPrime),
    "--clown-r-delay": randomDelay(),
    "--clown-s-delay": randomDelay(),
    "--clown-sc-delay": randomDelay(),
  };
}
