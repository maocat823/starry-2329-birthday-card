/** Phones get half the hearts so the animation stays smooth. */
export function heartCount(base: number, isMobile: boolean): number {
  return isMobile ? Math.max(1, Math.round(base / 2)) : base;
}

/** Background hearts must stay subtle: opacity within 0.3–0.5. */
export const BACKGROUND_HEART_OPACITY = { min: 0.3, max: 0.5 } as const;

/** On the cake page hearts drop to this so they never compete with the 3D cake. */
export const CAKE_PAGE_HEART_OPACITY = 0.25;

export function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

/** Cyclic pick from a non-empty list (safe under noUncheckedIndexedAccess). */
export function cycle<T>(list: readonly [T, ...T[]], i: number): T {
  return list[((i % list.length) + list.length) % list.length] ?? list[0];
}
