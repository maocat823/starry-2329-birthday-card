import { useEffect, useRef } from "react";
import { useIsPhone, useReducedMotion } from "@/hooks/use-media";
import {
  PARTICLE_FIELD_ALPHA,
  PARTICLE_FIELD_COLORS,
  PARTICLE_FIELD_DRIFT,
  particleFieldCount,
} from "@/lib/particles";

type Dust = {
  x: number;
  y: number;
  size: number;
  alpha: number;
  color: number;
  rise: number;
  sway: number;
  phase: number;
};

/** One tiny soft dot, pre-rendered once per colour instead of per particle. */
function makeSprite(rgb: readonly [number, number, number]) {
  const size = 32;
  const sprite = document.createElement("canvas");
  sprite.width = size;
  sprite.height = size;
  const ctx = sprite.getContext("2d");
  if (!ctx) return null;
  const [r, g, b] = rgb;
  const mid = size / 2;
  const gradient = ctx.createRadialGradient(mid, mid, 0, mid, mid, mid);
  gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1)`);
  gradient.addColorStop(0.35, `rgba(${r}, ${g}, ${b}, 0.45)`);
  gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return sprite;
}

/**
 * Full-screen, barely-there warm dust behind the intro. A 2D canvas is enough for points:
 * it keeps the Three.js cake bundle off the first page and costs one transparent layer.
 */
export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phone = useIsPhone();
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const sprites = PARTICLE_FIELD_COLORS.map(makeSprite).filter(
      (sprite): sprite is HTMLCanvasElement => sprite !== null,
    );
    if (!sprites.length) return;

    let width = 0;
    let height = 0;
    let particles: Dust[] = [];
    let frame = 0;
    let last = 0;
    let clock = 0;

    const seed = () => {
      particles = Array.from({ length: particleFieldCount(phone) }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        // Glow diameter in CSS px: tiny points, each with its own soft falloff.
        size: 2.5 + Math.random() * 4.5,
        alpha:
          PARTICLE_FIELD_ALPHA.min +
          Math.random() * (PARTICLE_FIELD_ALPHA.max - PARTICLE_FIELD_ALPHA.min),
        color: Math.floor(Math.random() * sprites.length),
        rise:
          PARTICLE_FIELD_DRIFT.min +
          Math.random() * (PARTICLE_FIELD_DRIFT.max - PARTICLE_FIELD_DRIFT.min),
        sway: 1 + Math.random() * 3,
        phase: Math.random() * Math.PI * 2,
      }));
    };

    const paint = (dt: number) => {
      ctx.clearRect(0, 0, width, height);
      // Additive dots on a transparent canvas read as light dust on the chalkboard.
      ctx.globalCompositeOperation = "lighter";
      for (const p of particles) {
        p.y -= p.rise * dt;
        p.x += Math.sin(clock * 0.4 + p.phase) * p.sway * dt;
        if (p.y < -12) {
          p.y = height + 12;
          p.x = Math.random() * width;
        }
        if (p.x < -12) p.x = width + 12;
        else if (p.x > width + 12) p.x = -12;
        const half = p.size / 2;
        const sprite = sprites[p.color] ?? sprites[0];
        if (!sprite) continue;
        ctx.globalAlpha = p.alpha;
        ctx.drawImage(sprite, p.x - half, p.y - half, p.size, p.size);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
      paint(0);
    };

    const loop = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      clock += dt;
      paint(dt);
      frame = requestAnimationFrame(loop);
    };

    resize();
    if (!reduced) {
      last = 0;
      frame = requestAnimationFrame(loop);
    }

    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frame);
    };
  }, [phone, reduced]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  );
}
