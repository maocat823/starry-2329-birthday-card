export type HeartFrame = { width: number; height: number };
export type HeartPoint = { x: number; y: number };

/**
 * Classic heart parametric curve, sampled into points in px.
 * t = 0 is the top-center dip, and increasing t runs clockwise on screen.
 * The frame is the popup layer, so the path re-fits whenever the stage resizes.
 */
export function heartPointsFor({ width, height }: HeartFrame, segments = 96): HeartPoint[] {
  const marginX = Math.max(130, Math.min(width, height) * 0.24);
  const marginY = 72;
  const scale = Math.min(
    Math.max(1, width - marginX * 2) / 32,
    Math.max(1, height - marginY * 2) / 29,
  );
  const cx = width / 2;
  const cy = height / 2;
  const points: HeartPoint[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    const sin = Math.sin(t);
    // x = 16 sin³t, y = 13 cos t − 5 cos 2t − 2 cos 3t − cos 4t; y flips for the screen.
    const x = 16 * sin ** 3;
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    points.push({ x: cx + x * scale, y: cy - (y + 2.5) * scale });
  }

  return points;
}

export function heartPathFromPoints(points: readonly HeartPoint[]): string {
  if (points.length === 0) return "";
  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`)
    .join(" ");
  return `${path} Z`;
}

export function heartPathFor(frame: HeartFrame): string {
  return heartPathFromPoints(heartPointsFor(frame));
}
