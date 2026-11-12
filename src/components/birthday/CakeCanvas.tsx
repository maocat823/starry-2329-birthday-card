import { useEffect, useRef } from "react";
import type { CakeState } from "./cake-sketch";

type Props = { blown: boolean; reducedMotion: boolean; plateText: string; label: string };

/** p5.js cake. p5 is imported after mount so it never runs during server render. */
export function CakeCanvas({ blown, reducedMotion, plateText, label }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const state = useRef<CakeState>({ blown, reduced: reducedMotion });

  useEffect(() => {
    state.current.blown = blown;
    state.current.reduced = reducedMotion;
  }, [blown, reducedMotion]);

  useEffect(() => {
    let cancelled = false;
    let instance: { remove: () => void } | null = null;
    Promise.all([import("p5"), import("./cake-sketch")]).then(
      ([{ default: P5 }, { createCakeSketch }]) => {
        if (cancelled || !host.current) return;
        instance = new P5(createCakeSketch(host.current, state, plateText), host.current);
      },
    );
    return () => {
      cancelled = true;
      instance?.remove();
    };
  }, [plateText]);

  return (
    <div
      ref={host}
      role="img"
      aria-label={label}
      className="relative mx-auto aspect-[400/460] w-full max-w-[400px] [&>canvas]:mx-auto [&>canvas]:block"
    />
  );
}
