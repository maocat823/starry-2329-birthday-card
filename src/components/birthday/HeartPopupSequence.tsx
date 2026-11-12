import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { motion } from "framer-motion";
import { CAKE_HEARTS } from "@/lib/cake-config";
import { heartPathFor } from "@/lib/heart-popups";
import { cake } from "@/content/birthday";
import { useReducedMotion } from "@/hooks/use-media";

type Props = { onDone: () => void };

/**
 * Dashed heart guide + blessing cards travelling the same CSS motion path.
 * The layer sits above the transparent canvas; the cards' scale animation happens
 * on an inner element so it never fights the offset-path positioning.
 */
export function HeartPopupSequence({ onDone }: Props) {
  const layer = useRef<HTMLDivElement>(null);
  const done = useRef(onDone);
  const reduced = useReducedMotion();
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    done.current = onDone;
  }, [onDone]);

  // The heart path is in px, so it is regenerated whenever the stage resizes.
  useLayoutEffect(() => {
    const el = layer.current;
    if (!el) return;
    const measure = () => {
      const { clientWidth, clientHeight } = el;
      if (clientWidth > 0 && clientHeight > 0) {
        setSize({ width: clientWidth, height: clientHeight });
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const count = Math.min(CAKE_HEARTS.count, cake.heartBlessings.length);
  const path = size ? heartPathFor(size) : null;
  const pathCss = path ? `path("${path}")` : undefined;
  const holdAt = reduced
    ? CAKE_HEARTS.holdMs
    : CAKE_HEARTS.drawMs + (count - 1) * CAKE_HEARTS.popEveryMs + CAKE_HEARTS.holdMs;

  // One shared timer: hold after the last card, then the page's AnimatePresence fades this layer.
  useEffect(() => {
    const id = window.setTimeout(() => done.current(), holdAt);
    return () => window.clearTimeout(id);
  }, [holdAt]);

  return (
    <motion.div
      ref={layer}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10"
      exit={{ opacity: 0 }}
      transition={{ duration: CAKE_HEARTS.fadeMs / 1000, ease: "easeOut" }}
    >
      {path && size && (
        <svg
          viewBox={`0 0 ${size.width} ${size.height}`}
          fill="none"
          className="pointer-events-none absolute inset-0 size-full"
        >
          <defs>
            <mask id="cake-heart-popup-mask">
              <motion.path
                d={path}
                stroke="white"
                strokeWidth={2.5}
                strokeLinecap="round"
                fill="none"
                initial={reduced ? false : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: CAKE_HEARTS.drawMs / 1000, ease: "easeInOut" }}
              />
            </mask>
          </defs>
          <path
            d={path}
            stroke="rgba(255, 255, 255, 0.55)"
            strokeWidth={1}
            strokeDasharray="3 4"
            strokeLinecap="round"
            fill="none"
            mask="url(#cake-heart-popup-mask)"
          />
        </svg>
      )}

      {pathCss &&
        cake.heartBlessings.slice(0, count).map((phrase, index) => (
          <div
            key={phrase}
            className="heart-popup"
            style={
              {
                offsetPath: pathCss,
                offsetDistance: `${(index / count) * 100}%`,
              } as CSSProperties
            }
          >
            <motion.div
              className="heart-popup-card"
              initial={reduced ? false : { opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={
                reduced
                  ? { duration: 0 }
                  : {
                      scale: {
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                        delay: (CAKE_HEARTS.drawMs + index * CAKE_HEARTS.popEveryMs) / 1000,
                      },
                      opacity: {
                        duration: 0.2,
                        delay: (CAKE_HEARTS.drawMs + index * CAKE_HEARTS.popEveryMs) / 1000,
                      },
                    }
              }
            >
              {phrase}
            </motion.div>
          </div>
        ))}
    </motion.div>
  );
}
