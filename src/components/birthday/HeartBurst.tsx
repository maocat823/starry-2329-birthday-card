import { useEffect, useState, type CSSProperties } from "react";
import { ChalkHeart } from "./ChalkHeart";
import { cycle, randomBetween } from "@/lib/hearts";

const COLORS: [string, ...string[]] = [
  "text-chalk",
  "text-chalk",
  "text-chalk-red",
  "text-chalk-gold",
];

type Props = {
  x: number;
  y: number;
  count: number;
  /** max travel distance in px */
  spread: number;
  /** extra downward drift after the burst, px */
  fall: number;
  duration: [number, number];
  size: [number, number];
  onDone?: () => void;
};

/** One-shot burst of chalk hearts from a viewport point. Mount only after a user action. */
export function HeartBurst({ x, y, count, spread, fall, duration, size, onDone }: Props) {
  const [hearts] = useState(() =>
    Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + randomBetween(-0.3, 0.3);
      const dist = spread * randomBetween(0.45, 1);
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist * 0.85;
      return {
        id: i,
        dx,
        dy,
        dx2: dx * randomBetween(1, 1.15) + randomBetween(-20, 20),
        rot: randomBetween(-30, 30),
        dur: randomBetween(duration[0], duration[1]),
        delay: randomBetween(0, 0.12),
        size: randomBetween(size[0], size[1]),
        op: randomBetween(0.65, 0.95),
        color: cycle(COLORS, i),
      };
    }),
  );

  useEffect(() => {
    const longest = Math.max(...hearts.map((h) => h.dur + h.delay));
    const t = setTimeout(() => onDone?.(), longest * 1000 + 100);
    return () => clearTimeout(t);
  }, [hearts, onDone]);

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden="true">
      {hearts.map((h) => (
        <span
          key={h.id}
          className={`heart-burst absolute ${h.color}`}
          style={
            {
              left: x,
              top: y,
              width: h.size,
              "--dx": `${h.dx}px`,
              "--dy": `${h.dy}px`,
              "--dx2": `${h.dx2}px`,
              "--fall": `${fall}px`,
              "--rot": `${h.rot}deg`,
              "--dur": `${h.dur}s`,
              "--delay": `${h.delay}s`,
              "--op": h.op,
            } as CSSProperties
          }
        >
          <ChalkHeart />
        </span>
      ))}
    </div>
  );
}
