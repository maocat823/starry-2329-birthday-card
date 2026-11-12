import { describe, expect, it } from "vitest";
import { BACKGROUND_HEART_OPACITY, heartCount } from "@/lib/hearts";
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
});
