/** Settings for the 3D particle cake on the last page. Pure values so tests can pin them. */

/** Same breakpoint the particle-cake library uses for its own mobile mode. */
export const CAKE_MOBILE_MAX_WIDTH = 767;

export const isCakeMobile = (viewportWidth: number) => viewportWidth <= CAKE_MOBILE_MAX_WIDTH;

export function particleCakeOptions(text: string, isMobile: boolean) {
  return {
    text,
    // Passing particleCount overrides the library's own phone reduction, so pick it here.
    particleCount: isMobile ? 5000 : 15000,
    textSize: 150,
    candleColor: "#FFD700",
  };
}

/** Blow-out sequence, in ms from the button tap. */
export const CAKE_TIMELINE = {
  /** flame particles dim to nothing over this long; smoke rises meanwhile */
  flameFadeMs: 800,
  /** cake.explode() — after the flame is out and the smoke has risen */
  explodeAt: 1500,
  /** particle-cake turns the firework into text this long after explode() */
  textFormsAfter: 2000,
  /** blessing note appears once the text has gathered */
  messageAt: 4200,
  /** "重新播放": cake re-forms, then blows out again after this long */
  replayBlowAt: 2200,
} as const;
