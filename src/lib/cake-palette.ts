/**
 * Warm palette for the particle cake. The three anchors come from the visual brief;
 * tier colours are blends between them, jittered per particle by the cake renderer.
 * Deliberately no white: the cake should read as dark gold/amber/dark red under bloom.
 */

export const CAKE_PALETTE = {
  gold: "#D4AF37",
  amber: "#B87333",
  deepRed: "#8B0000",
} as const;

export type Hsl = { h: number; s: number; l: number };

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** sRGB hex to HSL with 0–1 channels, the same convention as three's Color.setHSL. */
export function hexToHsl(hex: string): Hsl {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const l = (max + min) / 2;
  if (delta === 0) return { h: 0, s: 0, l };
  const s = delta / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === r) h = ((g - b) / delta) % 6;
  else if (max === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;
  h /= 6;
  if (h < 0) h += 1;
  return { h, s, l };
}

/** Linear blend between two HSL colours; callers keep both hues on the same side of the wheel. */
export function mixHsl(a: Hsl, b: Hsl, t: number): Hsl {
  const k = clamp01(t);
  return { h: a.h + (b.h - a.h) * k, s: a.s + (b.s - a.s) * k, l: a.l + (b.l - a.l) * k };
}
