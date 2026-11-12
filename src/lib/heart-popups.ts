export type HeartFrame = { width: number; height: number };

/**
 * Classic heart parametric curve, sampled into a CSS/SVG path in px.
 * t = 0 is the top-center dip, and increasing t runs clockwise on screen.
 * The frame is the popup layer, so the path re-fits whenever the stage resizes.
 */
export function heartPathFor({ width, height }: HeartFrame): string {
  const margin = Math.max(34, Math.min(width, height) * 0.09);
  const scale = Math.min(
    Math.max(1, width - margin * 2) / 32,
    Math.max(1, height - margin * 2) / 29,
  );
  const cx = width / 2;
  const cy = height / 2;
  const segments = 96;
  const points: string[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    const sin = Math.sin(t);
    // x = 16 sin³t, y = 13 cos t − 5 cos 2t − 2 cos 3t − cos 4t; y flips for the screen.
    const x = 16 * sin ** 3;
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    const sx = cx + x * scale;
    const sy = cy - (y + 2.5) * scale;
    points.push(`${i === 0 ? "M" : "L"}${sx.toFixed(2)},${sy.toFixed(2)}`);
  }

  return `${points.join(" ")} Z`;
}
