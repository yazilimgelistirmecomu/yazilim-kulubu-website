// Resolves a CSS color ("#rrggbb" or "var(--token)") to an "r, g, b" string for canvas drawing.
export function resolveRgb(color: string, fallback = '84, 163, 199'): string {
  let value = color.trim();
  const m = value.match(/^var\((--[\w-]+)\)$/);
  if (m) {
    value = getComputedStyle(document.documentElement).getPropertyValue(m[1]).trim();
  }
  const hex = value.match(/^#([0-9a-f]{6})$/i);
  if (!hex) return fallback;
  const n = parseInt(hex[1], 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}
