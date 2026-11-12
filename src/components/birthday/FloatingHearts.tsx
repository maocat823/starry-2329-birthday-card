import { useEffect, useState, type CSSProperties } from "react";
import { ChalkHeart } from "./ChalkHeart";
import { useIsPhone, useReducedMotion } from "@/hooks/use-media";
import { BACKGROUND_HEART_OPACITY, cycle, heartCount, randomBetween } from "@/lib/hearts";

const COLORS: [string, ...string[]] = [
  "text-chalk",
  "text-chalk",
  "text-chalk",
  "text-chalk-red",
  "text-chalk-gold",
];

type Heart = {
  id: number;
  left: number;
  size: number;
  dur: number;
  delay: number;
  op: number;
  sway: number;
  color: string;
};

/** Slow, low-opacity chalk hearts drifting down behind the content. */
export function FloatingHearts({ base, opacity }: { base: number; opacity?: number }) {
  const reduced = useReducedMotion();
  const phone = useIsPhone();
  const [hearts, setHearts] = useState<Heart[]>([]);

  useEffect(() => {
    if (reduced) {
      setHearts([]);
      return;
    }
    const n = heartCount(base, phone);
    setHearts(
      Array.from({ length: n }, (_, i) => {
        const dur = randomBetween(18, 30);
        return {
          id: i,
          left: randomBetween(2, 94),
          size: randomBetween(18, 36),
          dur,
          delay: randomBetween(0, dur),
          op: opacity ?? randomBetween(BACKGROUND_HEART_OPACITY.min, BACKGROUND_HEART_OPACITY.max),
          sway: randomBetween(-40, 40),
          color: cycle(COLORS, i),
        };
      }),
    );
  }, [base, opacity, phone, reduced]);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {hearts.map((h) => (
        <span
          key={h.id}
          className={`heart-fall absolute ${h.color}`}
          style={
            {
              left: `${h.left}%`,
              width: h.size,
              "--dur": `${h.dur}s`,
              "--delay": `-${h.delay}s`,
              "--op": h.op,
              "--sway": `${h.sway}px`,
            } as CSSProperties
          }
        >
          <ChalkHeart />
        </span>
      ))}
    </div>
  );
}
