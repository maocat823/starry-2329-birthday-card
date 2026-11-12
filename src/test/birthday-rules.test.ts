import { describe, expect, it } from "vitest";
import { BACKGROUND_HEART_OPACITY, CAKE_PAGE_HEART_OPACITY, heartCount } from "@/lib/hearts";
import { CAKE_TIMELINE, isCakeMobile, particleCakeOptions } from "@/lib/cake-config";
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

  it("uses 15000 particles on desktop and 5000 on phones", () => {
    expect(particleCakeOptions("大哥生日快乐", false)).toEqual({
      text: "大哥生日快乐",
      particleCount: 15000,
      textSize: 150,
      candleColor: "#FFD700",
    });
    expect(particleCakeOptions("大哥生日快乐", true).particleCount).toBe(5000);
    expect(isCakeMobile(375)).toBe(true);
    expect(isCakeMobile(1280)).toBe(false);
  });

  it("explodes after the flame fades and shows the note after the text forms", () => {
    expect(CAKE_TIMELINE.explodeAt).toBeGreaterThan(CAKE_TIMELINE.flameFadeMs);
    expect(CAKE_TIMELINE.messageAt).toBeGreaterThanOrEqual(
      CAKE_TIMELINE.explodeAt + CAKE_TIMELINE.textFormsAfter,
    );
  });
});
