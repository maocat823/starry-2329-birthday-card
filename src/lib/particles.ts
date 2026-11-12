/**
 * Intro-page dust: a very faint, full-screen layer of warm points. It sits behind the
 * notice, so the count and the opacity are deliberately capped to stay out of reading's way.
 */

export const PARTICLE_FIELD_COUNT = 3000;

/** Each point stays in this opacity band, so the whole layer never gets brighter than 0.25. */
export const PARTICLE_FIELD_ALPHA = { min: 0.15, max: 0.25 } as const;

/** Warm white and pale gold, as literal rgb — canvas cannot read Tailwind tokens. */
export const PARTICLE_FIELD_COLORS = [
  [255, 245, 227],
  [255, 237, 206],
  [255, 224, 170],
] as const;

/** Upward drift in CSS px per second: slow enough to read as dust, not snowfall. */
export const PARTICLE_FIELD_DRIFT = { min: 2, max: 7 } as const;

/** Phones get half the points so the intro stays smooth while the cake is not even on screen yet. */
export function particleFieldCount(isMobile: boolean): number {
  return isMobile ? Math.round(PARTICLE_FIELD_COUNT / 2) : PARTICLE_FIELD_COUNT;
}
