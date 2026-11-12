import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion, type MotionStyle } from "framer-motion";
import { CAKE_HEARTS } from "@/lib/cake-config";
import { heartPathFromPoints, heartPointsFor } from "@/lib/heart-popups";
import { cake } from "@/content/birthday";
import { useReducedMotion } from "@/hooks/use-media";

type Props = { onDone: () => void };

const TILTS = [-1.2, 1.1, -0.8, 1.4, -1.4, 0.7, -0.6, 1.2] as const;

/**
 * Gold starlight draws a heart, then holographic system alerts pop along it at 0.25s
 * intervals. The alerts float as one scene, and can be dismissed with their 收到 button.
 */
export function HeartPopupSequence({ onDone }: Props) {
  const layer = useRef<HTMLDivElement>(null);
  const done = useRef(onDone);
  const reduced = useReducedMotion();
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [acked, setAcked] = useState<ReadonlySet<number>>(() => new Set());

  useEffect(() => {
    done.current = onDone;
  }, [onDone]);

  // Paths are in px, so the heart re-fits whenever the stage resizes.
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

  const windows = cake.holoWindows.slice(0, CAKE_HEARTS.count);
  const count = windows.length;
  const points = size ? heartPointsFor(size) : [];
  const path = points.length ? heartPathFromPoints(points) : null;
  const pathCss = path ? `path("${path}")` : undefined;
  const lastAt = CAKE_HEARTS.drawMs + Math.max(0, count - 1) * CAKE_HEARTS.popEveryMs;
  const holdAt = reduced ? CAKE_HEARTS.holdMs : lastAt + CAKE_HEARTS.holdMs;
  const floatDelay = lastAt / 1000 + 0.15;

  // One shared timer: hold after the last alert, then the page's AnimatePresence fades this layer.
  useEffect(() => {
    const id = window.setTimeout(() => done.current(), holdAt);
    return () => window.clearTimeout(id);
  }, [holdAt]);

  const acknowledge = (index: number) => {
    setAcked((previous) => {
      if (previous.has(index)) return previous;
      const next = new Set(previous);
      next.add(index);
      return next;
    });
  };

  return (
    <motion.div
      ref={layer}
      role="group"
      aria-label={cake.holoLabel}
      className="pointer-events-none absolute inset-0 z-10"
      exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97, filter: "blur(6px)" }}
      transition={{ duration: CAKE_HEARTS.fadeMs / 1000, ease: "easeOut" }}
    >
      <motion.div
        className="absolute inset-0"
        initial={{ y: 0 }}
        animate={reduced ? { y: 0 } : { y: [0, -6, 0] }}
        transition={
          reduced
            ? { duration: 0 }
            : { delay: floatDelay, duration: 3.4, repeat: Infinity, ease: "easeInOut" }
        }
      >
        {size && (
          <div className="absolute inset-0" aria-hidden="true">
            {points.map((point, index) => (
              <div
                key={index}
                className="holo-star"
                style={
                  {
                    left: `${point.x}px`,
                    top: `${point.y}px`,
                    "--size": `${2 + (index % 3)}px`,
                    "--twinkle": `${-(index % 9) * 0.27}s`,
                  } as CSSProperties
                }
              >
                <motion.span
                  className="holo-star-inner"
                  initial={reduced ? false : { opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: reduced
                      ? 0
                      : (index / Math.max(1, points.length - 1)) * (CAKE_HEARTS.drawMs / 1000),
                    duration: 0.16,
                    ease: "easeOut",
                  }}
                >
                  <span className="holo-star-core" />
                </motion.span>
              </div>
            ))}
          </div>
        )}

        {pathCss && (
          <AnimatePresence>
            {windows.map((item, index) => {
              if (acked.has(index)) return null;
              const delay = (CAKE_HEARTS.drawMs + index * CAKE_HEARTS.popEveryMs) / 1000;
              const tilt = TILTS[index % TILTS.length] ?? 0;
              return (
                <motion.div
                  key={index}
                  className="holo-window"
                  style={
                    {
                      offsetPath: pathCss,
                      offsetDistance: `${(index / count) * 100}%`,
                    } as MotionStyle
                  }
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                >
                  <motion.article
                    className="holo-window-card"
                    initial={reduced ? false : { opacity: 0, scale: 0.92, y: 8, rotate: tilt - 2 }}
                    animate={{ opacity: 1, scale: 1, y: 0, rotate: tilt }}
                    transition={
                      reduced
                        ? { duration: 0 }
                        : {
                            scale: {
                              type: "spring",
                              stiffness: 300,
                              damping: 20,
                              delay,
                            },
                            opacity: { duration: 0.18, delay },
                            y: { duration: 0.28, ease: "easeOut", delay },
                            rotate: { duration: 0.34, ease: "easeOut", delay },
                          }
                    }
                  >
                    <div className="holo-window-header">
                      <span className="holo-window-title">{item.header}</span>
                      <span className="holo-window-id">{String(index + 1).padStart(2, "0")}</span>
                    </div>
                    <p className="holo-window-message">{item.message}</p>
                    <div className="holo-window-footer">
                      <button type="button" className="holo-ack" onClick={() => acknowledge(index)}>
                        {cake.holoAck}
                      </button>
                    </div>
                  </motion.article>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </motion.div>
    </motion.div>
  );
}
