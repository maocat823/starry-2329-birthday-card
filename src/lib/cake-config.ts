/** Settings for the 3D particle cake on the last page. Pure values so tests can pin them. */

/** Same breakpoint the particle-cake library uses for its own mobile mode. */
export const CAKE_MOBILE_MAX_WIDTH = 767;

export const isCakeMobile = (viewportWidth: number) => viewportWidth <= CAKE_MOBILE_MAX_WIDTH;

export function particleCakeOptions(text: string, isMobile: boolean) {
  return {
    text,
    // Passing particleCount overrides the library's own phone reduction, so pick it here.
    // Phones stay inside the 8000–10000 budget the bloom pass can afford.
    particleCount: isMobile ? 9000 : 15000,
    // Small points leave gaps between particles, which is what makes the cake read as grain.
    particleSize: isMobile ? 1.2 : 2,
    textSize: 150,
    candleColor: "#FFD700",
  };
}

/** Three stacked tiers plus candles: the shares are of the whole particle budget. */
export const CAKE_STRUCTURE = {
  tiers: [
    { share: 0.5, radius: 100, height: 40, baseY: -50 },
    { share: 0.3, radius: 70, height: 34, baseY: -10 },
    { share: 0.15, radius: 45, height: 30, baseY: 24 },
  ],
  candleCount: 5,
  candle: { ringRadius: 24, radius: 3.4, height: 48 },
  /** Each flame is its own little particle plume, not a static cone. */
  flamesPerCandle: { desktop: 30, mobile: 20 },
} as const;

/** UnrealBloomPass settings; kept low so the cake keeps its silhouette instead of a white blob. */
export const CAKE_BLOOM = {
  threshold: 0.05,
  strength: 1.0,
  mobileStrength: 0.8,
  radius: 0.5,
} as const;

/** Additive particles at full opacity stack to pure white; halve them instead. */
export const CAKE_PARTICLE_OPACITY = 0.45;

/** The whole cake breathes on the Y axis so even a paused frame feels alive. */
export const CAKE_BOB = { amplitude: 2.5, periodMs: 4000 } as const;

/**
 * Drag-to-orbit settings for the 3D cake (three r128 OrbitControls).
 * The cake stays the hero: no panning, no pinch zoom, just looking around it.
 */
export const CAKE_ORBIT = {
  /** vertical drag limits in degrees; 60° keeps the view above the plate, 100° stops under it */
  minPolarDeg: 60,
  maxPolarDeg: 100,
  /** 0–1: lower glides longer after the finger leaves the screen (damping) */
  damping: 0.06,
  rotateSpeed: 0.55,
  /** OrbitControls treats 2 as one turn per 30s, so 0.8 is a slow ~75s idle turn */
  autoRotateSpeed: 0.8,
} as const;

/**
 * Heart blessing popups that play once the particle text has been still for a second.
 * Twenty cards at 0.3s each, then a 2.5s hold and a shared fade out.
 */
export const CAKE_HEARTS = {
  /** the text must sit still this long before the sequence starts */
  settleMs: 1000,
  /** dashed chalk heart draws over this long */
  drawMs: 800,
  /** one popup appears every this many ms, clockwise from the top */
  popEveryMs: 300,
  count: 20,
  /** all popups stay on screen this long before fading together */
  holdMs: 2500,
  fadeMs: 600,
} as const;

/** Blow-out sequence, in ms from the button tap. */
export const CAKE_TIMELINE = {
  /** flame particles dim to nothing over this long; smoke rises meanwhile */
  flameFadeMs: 800,
  /** cake.explode() — after the flame is out and the smoke has risen */
  explodeAt: 1500,
  /** particle-cake turns the firework into text this long after explode() */
  textFormsAfter: 2000,
  /** blessing note waits for the heart sequence to finish (and give the stage a beat) */
  messageAt: 14800,
  /** "重新播放": cake re-forms, then blows out again after this long */
  replayBlowAt: 2200,
} as const;
