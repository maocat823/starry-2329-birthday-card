import { describe, expect, it } from "vitest";
import { BACKGROUND_HEART_OPACITY, CAKE_PAGE_HEART_OPACITY, heartCount } from "@/lib/hearts";
import {
  CAKE_BLOOM,
  CAKE_BOB,
  CAKE_HEARTS,
  CAKE_ORBIT,
  CAKE_PARTICLE_OPACITY,
  CAKE_STRUCTURE,
  CAKE_TIMELINE,
  isCakeMobile,
  particleCakeOptions,
} from "@/lib/cake-config";
import { CAKE_PALETTE, hexToHsl, mixHsl } from "@/lib/cake-palette";
import { PARTICLE_FIELD_ALPHA, PARTICLE_FIELD_COUNT, particleFieldCount } from "@/lib/particles";
import { cake } from "@/content/birthday";
import { Route } from "@/routes/index";

describe("birthday card rules", () => {
  it("halves the heart count on phones", () => {
    expect(heartCount(36, true)).toBe(18);
    expect(heartCount(36, false)).toBe(36);
  });

  it("keeps background hearts between 0.3 and 0.5 opacity", () => {
    expect(BACKGROUND_HEART_OPACITY).toEqual({ min: 0.3, max: 0.5 });
  });

  it("marks the page noindex", () => {
    const head = Route.options.head?.({} as never) as { meta: Record<string, string>[] };
    expect(head.meta).toContainEqual({ name: "robots", content: "noindex, nofollow" });
  });

  it("dims cake-page hearts to 0.25", () => {
    expect(CAKE_PAGE_HEART_OPACITY).toBe(0.25);
  });

  it("uses 15000 particles on desktop and stays within 8000–10000 on phones", () => {
    expect(particleCakeOptions("大哥生日快乐", false)).toEqual({
      text: "大哥生日快乐",
      particleCount: 15000,
      particleSize: 2,
      textSize: 150,
      candleColor: "#FFD700",
    });
    const mobile = particleCakeOptions("大哥生日快乐", true);
    expect(mobile.particleCount).toBeGreaterThanOrEqual(8000);
    expect(mobile.particleCount).toBeLessThanOrEqual(10000);
    expect(mobile.particleSize).toBe(1.2);
    expect(isCakeMobile(375)).toBe(true);
    expect(isCakeMobile(1280)).toBe(false);
  });

  it("explodes after the flame fades and shows the note after the text forms", () => {
    expect(CAKE_TIMELINE.explodeAt).toBeGreaterThan(CAKE_TIMELINE.flameFadeMs);
    expect(CAKE_TIMELINE.messageAt).toBeGreaterThanOrEqual(
      CAKE_TIMELINE.explodeAt + CAKE_TIMELINE.textFormsAfter,
    );
  });

  it("orbits the cake between 60° and 100°, with damping and a slow idle turn", () => {
    expect(CAKE_ORBIT.minPolarDeg).toBe(60);
    expect(CAKE_ORBIT.maxPolarDeg).toBe(100);
    expect(CAKE_ORBIT.minPolarDeg).toBeLessThan(CAKE_ORBIT.maxPolarDeg);
    expect(CAKE_ORBIT.damping).toBeGreaterThan(0);
    expect(CAKE_ORBIT.damping).toBeLessThan(1);
    expect(CAKE_ORBIT.autoRotateSpeed).toBeGreaterThan(0);
  });

  it("draws 3000 intro dust points, halves them on phones, and keeps them faint", () => {
    expect(PARTICLE_FIELD_COUNT).toBe(3000);
    expect(particleFieldCount(false)).toBe(3000);
    expect(particleFieldCount(true)).toBe(1500);
    expect(PARTICLE_FIELD_ALPHA).toEqual({ min: 0.15, max: 0.25 });
  });

  it("stacks three tiers and seeds five candles with 20–30 flame particles each", () => {
    expect(CAKE_STRUCTURE.tiers.map((tier) => tier.share)).toEqual([0.5, 0.3, 0.15]);
    expect(CAKE_STRUCTURE.tiers[0].radius).toBeGreaterThan(CAKE_STRUCTURE.tiers[1].radius);
    expect(CAKE_STRUCTURE.tiers[1].radius).toBeGreaterThan(CAKE_STRUCTURE.tiers[2].radius);
    expect(CAKE_STRUCTURE.candleCount).toBe(5);
    expect(CAKE_STRUCTURE.flamesPerCandle.mobile).toBe(20);
    expect(CAKE_STRUCTURE.flamesPerCandle.desktop).toBe(30);
  });

  it("blooms softly at 1.0 on desktop and 0.8 on phones, with a tight radius", () => {
    expect(CAKE_BLOOM).toEqual({
      threshold: 0.05,
      strength: 1.0,
      mobileStrength: 0.8,
      radius: 0.5,
    });
    expect(CAKE_BOB.periodMs).toBe(4000);
    expect(CAKE_BOB.amplitude).toBeGreaterThanOrEqual(2);
    expect(CAKE_BOB.amplitude).toBeLessThanOrEqual(3);
    expect(CAKE_PARTICLE_OPACITY).toBeGreaterThanOrEqual(0.4);
    expect(CAKE_PARTICLE_OPACITY).toBeLessThanOrEqual(0.6);
  });

  it("keeps the cake on the three dark warm colour anchors", () => {
    expect(CAKE_PALETTE).toEqual({
      gold: "#D4AF37",
      amber: "#B87333",
      deepRed: "#8B0000",
    });
    const gold = hexToHsl(CAKE_PALETTE.gold);
    expect(gold.h).toBeCloseTo(0.1274, 3);
    expect(gold.s).toBeCloseTo(0.646, 2);
    expect(gold.l).toBeCloseTo(0.5235, 2);
    expect(mixHsl(gold, gold, 0.5)).toEqual(gold);
  });

  it("fills the heart with twenty blessing popups", () => {
    expect(cake.heartBlessings).toHaveLength(CAKE_HEARTS.count);
    expect(CAKE_HEARTS.count).toBeGreaterThanOrEqual(20);
    expect(CAKE_HEARTS.count).toBeLessThanOrEqual(30);
  });

  it("keeps the blessing note after the heart sequence fades", () => {
    const sequenceEnd =
      CAKE_TIMELINE.explodeAt +
      CAKE_TIMELINE.textFormsAfter +
      CAKE_HEARTS.settleMs +
      CAKE_HEARTS.drawMs +
      (CAKE_HEARTS.count - 1) * CAKE_HEARTS.popEveryMs +
      CAKE_HEARTS.holdMs +
      CAKE_HEARTS.fadeMs;
    expect(CAKE_TIMELINE.messageAt).toBeGreaterThan(sequenceEnd);
  });
});
