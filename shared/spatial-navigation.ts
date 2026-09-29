export function normalizeFieldIndex(index: number, count: number): number {
  if (!Number.isInteger(count) || count <= 0) return 0;
  const safeIndex = Number.isFinite(index) ? Math.trunc(index) : 0;
  return ((safeIndex % count) + count) % count;
}

export function moveFieldIndex(current: number, direction: number, count: number): number {
  if (!Number.isFinite(direction)) return normalizeFieldIndex(current, count);
  return normalizeFieldIndex(current + Math.sign(direction), count);
}
