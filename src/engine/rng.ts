/** Seeded RNG (mulberry32). The seed lives in state so games replay exactly. */
export function nextRand(s: { rng: number }): number {
  s.rng = (s.rng + 0x6d2b79f5) | 0;
  let t = s.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function rollDie(s: { rng: number; forcedDice: number[] }): number {
  if (s.forcedDice.length) return s.forcedDice.shift()!;
  return 1 + Math.floor(nextRand(s) * 6);
}

export function shuffle<T>(s: { rng: number }, items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(nextRand(s) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
