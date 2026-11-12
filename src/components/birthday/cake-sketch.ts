import type P5 from "p5";
import { cycle, heartCount } from "@/lib/hearts";

// "Starry cake" style (user's reference): navy marbled tiers, gold stars, glowing top,
// orbiting light trails and twinkling confetti dots. Canvas colors are literal on purpose:
// the canvas can't read Tailwind classes.

export type CakeState = { blown: boolean; reduced: boolean };

const W = 400;
const H = 460;
const CX = 200;

const BOTTOM = { topY: 266, rx: 118, ry: 24, h: 112 };
const TOP = { topY: 182, rx: 82, ry: 17, h: 90 };
const PLATE = { cy: 398, rx: 172, ry: 38 };
const CANDLE_H = 44;
// draw order back → front so nearer candles overlap farther ones
const CANDLES = [
  { x: 176, y: TOP.topY - 4 },
  { x: 224, y: TOP.topY - 4 },
  { x: 152, y: TOP.topY + 4 },
  { x: 248, y: TOP.topY + 4 },
  { x: 200, y: TOP.topY + 8 },
];

type RGB = [number, number, number];
const DOT_COLORS: [RGB, ...RGB[]] = [
  [255, 206, 110],
  [255, 226, 160],
  [90, 160, 255],
  [120, 220, 230],
  [196, 160, 255],
  [255, 150, 190],
  [255, 255, 255],
  [70, 110, 230],
];

const RINGS = [
  { cy: 300, rx: 184, ry: 44, rot: -0.14, speed: 0.34, color: [255, 206, 120] },
  { cy: 214, rx: 150, ry: 32, rot: 0.16, speed: -0.26, color: [150, 190, 255] },
  { cy: 368, rx: 196, ry: 30, rot: 0.05, speed: 0.2, color: [214, 186, 255] },
] as const;

type Dot = {
  x: number;
  y: number;
  r: number;
  c: [number, number, number];
  seed: number;
  v: number;
};
type Smoke = { x: number; y: number; r: number; a: number; seed: number };

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function star(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rot: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = rot + (i * Math.PI) / 5 - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    const px = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * rr;
    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function cylinderPath(
  ctx: CanvasRenderingContext2D,
  topY: number,
  rx: number,
  ry: number,
  h: number,
) {
  ctx.beginPath();
  ctx.moveTo(CX - rx, topY);
  ctx.lineTo(CX - rx, topY + h);
  ctx.ellipse(CX, topY + h, rx, ry, 0, Math.PI, 0, true);
  ctx.lineTo(CX + rx, topY);
  ctx.ellipse(CX, topY, rx, ry, 0, 0, Math.PI, true);
  ctx.closePath();
}

function drawTier(ctx: CanvasRenderingContext2D, rand: () => number, tier: typeof BOTTOM) {
  const { topY, rx, ry, h } = tier;

  // body: deep navy with lighter left-center
  const body = ctx.createLinearGradient(CX - rx, 0, CX + rx, 0);
  body.addColorStop(0, "rgb(14, 20, 70)");
  body.addColorStop(0.28, "rgb(42, 62, 170)");
  body.addColorStop(0.55, "rgb(30, 42, 130)");
  body.addColorStop(1, "rgb(10, 14, 52)");
  cylinderPath(ctx, topY, rx, ry, h);
  ctx.fillStyle = body;
  ctx.fill();

  ctx.save();
  cylinderPath(ctx, topY, rx, ry, h);
  ctx.clip();

  // watercolor marble streaks
  const streaks: [string, ...string[]] = [
    "rgba(110, 150, 240, 0.28)",
    "rgba(190, 170, 255, 0.2)",
    "rgba(20, 26, 80, 0.45)",
  ];
  for (let i = 0; i < 16; i++) {
    const x = CX - rx + rand() * rx * 2;
    const y = topY + rand() * h;
    ctx.strokeStyle = cycle(streaks, i);
    ctx.lineWidth = 5 + rand() * 12;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x - 30, y + 26);
    ctx.bezierCurveTo(x - 8, y + 8, x + 6, y - 4, x + 34, y - 26);
    ctx.stroke();
  }

  // warm light spilling down from the top
  const spill = ctx.createLinearGradient(0, topY, 0, topY + h * 0.6);
  spill.addColorStop(0, "rgba(255, 214, 140, 0.55)");
  spill.addColorStop(1, "rgba(255, 214, 140, 0)");
  ctx.fillStyle = spill;
  ctx.fillRect(CX - rx, topY, rx * 2, h);

  // gold stars + confetti
  for (let i = 0; i < Math.round(rx / 7); i++) {
    const x = CX - rx + 8 + rand() * (rx * 2 - 16);
    const y = topY + ry * 0.6 + rand() * (h - ry * 0.4);
    if (rand() < 0.45) {
      ctx.fillStyle = rand() < 0.75 ? "rgb(255, 208, 100)" : "rgb(255, 240, 200)";
      star(ctx, x, y, 3 + rand() * 6, rand());
    } else {
      const c = cycle(DOT_COLORS, Math.floor(rand() * DOT_COLORS.length));
      ctx.fillStyle = `rgba(${c[0]}, ${c[1]}, ${c[2]}, 0.85)`;
      ctx.beginPath();
      ctx.arc(x, y, 1 + rand() * 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // bottom shadow
  const shade = ctx.createLinearGradient(0, topY + h - 20, 0, topY + h + ry);
  shade.addColorStop(0, "rgba(6, 8, 30, 0)");
  shade.addColorStop(1, "rgba(6, 8, 30, 0.55)");
  ctx.fillStyle = shade;
  ctx.fillRect(CX - rx, topY + h - 20, rx * 2, 20 + ry);
  ctx.restore();

  // glowing top surface
  const top = ctx.createRadialGradient(CX - rx * 0.15, topY, 4, CX, topY, rx);
  top.addColorStop(0, "rgb(255, 246, 220)");
  top.addColorStop(0.45, "rgb(250, 214, 150)");
  top.addColorStop(1, "rgb(150, 160, 235)");
  ctx.fillStyle = top;
  ctx.beginPath();
  ctx.ellipse(CX, topY, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  // pastel blobs on the frosting
  const pastel: [string, ...string[]] = [
    "rgba(255, 170, 200, 0.55)",
    "rgba(190, 170, 255, 0.5)",
    "rgba(130, 210, 240, 0.5)",
    "rgba(255, 200, 110, 0.6)",
  ];
  for (let i = 0; i < 14; i++) {
    const a = rand() * Math.PI * 2;
    const d = Math.sqrt(rand());
    ctx.fillStyle = cycle(pastel, i);
    ctx.beginPath();
    ctx.ellipse(
      CX + Math.cos(a) * rx * 0.85 * d,
      topY + Math.sin(a) * ry * 0.8 * d,
      4 + rand() * 7,
      2 + rand() * 3,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  // cream drips along the front rim
  ctx.fillStyle = "rgba(252, 240, 216, 0.95)";
  for (let a = 0.05; a < Math.PI; a += 0.13) {
    const x = CX + Math.cos(a) * rx;
    const y = topY + Math.sin(a) * ry;
    const len = 4 + Math.abs(Math.sin(a * 5.3)) * 10 * (0.6 + rand() * 0.6);
    ctx.beginPath();
    ctx.roundRect(x - 3.2, y - 3, 6.4, len + 3, 3.2);
    ctx.fill();
  }
  ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(CX, topY, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawSky(ctx: CanvasRenderingContext2D) {
  // night-sky window so the cake glows on the chalkboard
  const sky = ctx.createRadialGradient(CX, 250, 40, CX, 250, 236);
  sky.addColorStop(0, "rgba(10, 14, 40, 0.94)");
  sky.addColorStop(0.7, "rgba(10, 14, 40, 0.7)");
  sky.addColorStop(1, "rgba(10, 14, 40, 0)");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
}

function drawCake(ctx: CanvasRenderingContext2D, plateText: string) {
  const rand = rng(2329);

  // plate
  const plate = ctx.createLinearGradient(0, PLATE.cy - PLATE.ry, 0, PLATE.cy + PLATE.ry);
  plate.addColorStop(0, "rgb(196, 204, 238)");
  plate.addColorStop(1, "rgb(120, 130, 190)");
  ctx.fillStyle = plate;
  ctx.beginPath();
  ctx.ellipse(CX, PLATE.cy, PLATE.rx, PLATE.ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(90, 100, 160, 0.45)";
  ctx.beginPath();
  ctx.ellipse(CX, PLATE.cy - 4, PLATE.rx * 0.84, PLATE.ry * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 220, 150, 0.8)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(CX, PLATE.cy, PLATE.rx - 2, PLATE.ry - 2, 0, 0.15, Math.PI - 0.15);
  ctx.stroke();

  drawTier(ctx, rand, BOTTOM);
  drawTier(ctx, rand, TOP);

  // candles (lavender, like the reference)
  for (const c of CANDLES) {
    const g = ctx.createLinearGradient(c.x - 5, 0, c.x + 5, 0);
    g.addColorStop(0, "rgb(170, 140, 220)");
    g.addColorStop(0.4, "rgb(236, 220, 255)");
    g.addColorStop(1, "rgb(150, 120, 200)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(c.x - 4.5, c.y - CANDLE_H, 9, CANDLE_H, 3);
    ctx.fill();
    ctx.strokeStyle = "rgb(50, 40, 60)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(c.x, c.y - CANDLE_H);
    ctx.quadraticCurveTo(c.x + 1, c.y - CANDLE_H - 4, c.x, c.y - CANDLE_H - 7);
    ctx.stroke();
  }

  // plate text on the front rim
  ctx.save();
  ctx.font = '19px "ZCOOL KuaiLe", "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(255, 200, 110, 0.9)";
  ctx.shadowBlur = 8;
  ctx.fillStyle = "rgb(255, 236, 190)";
  ctx.fillText(plateText, CX, PLATE.cy + PLATE.ry - 15);
  ctx.restore();

  ctx.save();
  ctx.font = 'italic 15px "Long Cang", Georgia, serif';
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(244, 241, 230, 0.75)";
  ctx.fillText("happy birthday", W - 18, H - 8);
  ctx.restore();
}

export function createCakeSketch(
  host: HTMLElement,
  state: { current: CakeState },
  plateText: string,
) {
  return (p: P5) => {
    let scale = 1;
    let sky: ReturnType<P5["createGraphics"]> | null = null;
    let base: ReturnType<P5["createGraphics"]> | null = null;
    let wasBlown = false;
    let blownAt = -1;
    let litAt = 0;
    let smoke: Smoke[] = [];
    let dots: Dot[] = [];

    const targetWidth = () => Math.min(host.clientWidth || W, W);

    const layer = (paint: (ctx: CanvasRenderingContext2D) => void) => {
      const g = p.createGraphics(p.width, p.height);
      g.pixelDensity(p.pixelDensity());
      const ctx = g.drawingContext as CanvasRenderingContext2D;
      ctx.save();
      ctx.scale(scale, scale);
      paint(ctx);
      ctx.restore();
      return g;
    };

    const buildBase = () => {
      sky?.remove();
      base?.remove();
      sky = layer(drawSky);
      base = layer((ctx) => drawCake(ctx, plateText));
    };

    const makeDots = () => {
      const n = heartCount(64, window.innerWidth < 768);
      const rand = rng(17);
      dots = Array.from({ length: n }, (_, i) => {
        const big = i % 9 === 0;
        return {
          x: 10 + rand() * (W - 20),
          y: rand() * (H - 40),
          r: big ? 5 + rand() * 6 : 1.2 + rand() * 3.2,
          c: cycle(DOT_COLORS, i),
          seed: i * 13.7,
          v: 0.12 + rand() * 0.3,
        };
      });
    };

    p.setup = () => {
      const w = targetWidth();
      scale = w / W;
      p.pixelDensity(Math.min(2, window.devicePixelRatio || 1));
      p.createCanvas(w, H * scale);
      p.frameRate(30);
      p.noiseSeed(2329);
      makeDots();
      buildBase();
      document.fonts?.load('19px "ZCOOL KuaiLe"', plateText).then(() => buildBase());
    };

    p.windowResized = () => {
      const w = targetWidth();
      if (Math.abs(w - p.width) < 1) return;
      scale = w / W;
      p.resizeCanvas(w, H * scale);
      buildBase();
    };

    const drawRings = (
      ctx: CanvasRenderingContext2D,
      t: number,
      front: boolean,
      reduced: boolean,
    ) => {
      const SEG = 34;
      for (const ring of RINGS) {
        const head = reduced ? 1.2 : t * ring.speed * Math.PI * 2;
        const dir = Math.sign(ring.speed) || 1;
        const cos = Math.cos(ring.rot);
        const sin = Math.sin(ring.rot);
        const pt = (a: number): [number, number] => {
          const x = Math.cos(a) * ring.rx;
          const y = Math.sin(a) * ring.ry;
          return [CX + x * cos - y * sin, ring.cy + x * sin + y * cos];
        };
        const [r, g, b] = ring.color;
        for (let k = 0; k < SEG; k++) {
          const a0 = head - dir * ((Math.PI * 1.5 * k) / SEG);
          const a1 = head - dir * ((Math.PI * 1.5 * (k + 1)) / SEG);
          const mid = (a0 + a1) / 2;
          if (Math.sin(mid) >= 0 !== front) continue;
          const f = 1 - k / SEG;
          const [x0, y0] = pt(a0);
          const [x1, y1] = pt(a1);
          ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.85 * f * f})`;
          ctx.lineWidth = 0.6 + 2.6 * f;
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.stroke();
        }
        if (Math.sin(head) >= 0 === front) {
          const [hx, hy] = pt(head);
          const glow = ctx.createRadialGradient(hx, hy, 0, hx, hy, 10);
          glow.addColorStop(0, `rgba(255, 250, 235, 0.95)`);
          glow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(hx, hy, 10, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    p.draw = () => {
      const { blown, reduced } = state.current;
      const now = p.millis();
      if (blown && !wasBlown) blownAt = now;
      else if (!blown && wasBlown) {
        litAt = now;
        smoke = [];
      }
      wasBlown = blown;

      const t = now / 1000;
      const sinceBlow = now - blownAt;
      const alpha = blown ? Math.max(0, 1 - sinceBlow / 650) : Math.min(1, (now - litAt) / 450);

      p.clear();
      const ctx = p.drawingContext as CanvasRenderingContext2D;

      if (sky) p.image(sky, 0, 0, p.width, p.height);

      // back halves of the orbit trails sit behind the cake
      ctx.save();
      ctx.scale(scale, scale);
      ctx.lineCap = "round";
      ctx.globalCompositeOperation = "lighter";
      drawRings(ctx, t, false, reduced);
      ctx.restore();

      if (base) p.image(base, 0, 0, p.width, p.height);

      ctx.save();
      ctx.scale(scale, scale);
      ctx.lineCap = "round";

      // candle light glow over the top tier
      if (alpha > 0.01) {
        ctx.globalCompositeOperation = "lighter";
        const glow = ctx.createRadialGradient(CX, TOP.topY - 40, 6, CX, TOP.topY - 40, 130);
        glow.addColorStop(0, `rgba(255, 200, 110, ${0.42 * alpha})`);
        glow.addColorStop(1, "rgba(255, 200, 110, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(CX, TOP.topY - 40, 130, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
      }

      // front halves of the orbit trails wrap over the cake
      ctx.globalCompositeOperation = "lighter";
      drawRings(ctx, t, true, reduced);

      // twinkling confetti dots
      for (const d of dots) {
        if (!reduced) {
          d.y -= d.v;
          d.x += (p.noise(d.seed, t * 0.3) - 0.5) * 0.5;
          if (d.y < -12) {
            d.y = H + 10;
            d.x = 10 + p.random(W - 20);
          }
        }
        const tw = reduced ? 0.7 : 0.3 + 0.7 * p.noise(d.seed + 50, t * 0.9);
        const a = d.r > 5 ? tw * 0.35 : tw * 0.9;
        ctx.fillStyle = `rgba(${d.c[0]}, ${d.c[1]}, ${d.c[2]}, ${a})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";

      // flames: each candle samples its own Perlin noise region → independent flicker
      if (alpha > 0.01) {
        CANDLES.forEach((c, i) => {
          const n1 = reduced ? 0.5 : p.noise(i * 37.1, t * 1.7);
          const n2 = reduced ? 0.5 : p.noise(i * 19.7 + 300, t * 2.4);
          const fh = (17 + n1 * 11) * (blown ? 0.6 + alpha * 0.4 : 1);
          const fw = 8 + n1 * 3;
          const sway = (n2 - 0.5) * 6;
          const baseY = c.y - CANDLE_H - 6;
          const tipX = c.x + sway;

          ctx.globalCompositeOperation = "lighter";
          const g = ctx.createRadialGradient(
            c.x,
            baseY - fh * 0.45,
            1,
            c.x,
            baseY - fh * 0.45,
            26 + n1 * 8,
          );
          g.addColorStop(0, `rgba(255, 210, 120, ${0.5 * alpha})`);
          g.addColorStop(1, "rgba(255, 210, 120, 0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(c.x, baseY - fh * 0.45, 26 + n1 * 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalCompositeOperation = "source-over";

          const flame = (w: number, hMul: number, color: string) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(c.x, baseY + 2);
            ctx.bezierCurveTo(
              c.x - w,
              baseY,
              c.x - w * 0.7,
              baseY - fh * 0.6 * hMul,
              tipX,
              baseY - fh * hMul,
            );
            ctx.bezierCurveTo(
              c.x + w * 0.7,
              baseY - fh * 0.6 * hMul,
              c.x + w,
              baseY,
              c.x,
              baseY + 2,
            );
            ctx.fill();
          };
          flame(fw * 0.6, 1, `rgba(245, 160, 70, ${0.92 * alpha})`);
          flame(fw * 0.4, 0.74, `rgba(255, 220, 130, ${0.96 * alpha})`);
          flame(fw * 0.2, 0.42, `rgba(255, 250, 230, ${alpha})`);
        });
      }

      // smoke wisps after blowing
      if (blown && !reduced) {
        if (sinceBlow < 1400 && smoke.length < 70) {
          CANDLES.forEach((c, i) => {
            if (p.random() < 0.55)
              smoke.push({
                x: c.x + p.random(-1, 1),
                y: c.y - CANDLE_H - 8,
                r: 2,
                a: 0.5,
                seed: i * 10 + p.random(100),
              });
          });
        }
        smoke = smoke.filter((s) => s.a > 0.02);
        for (const s of smoke) {
          s.y -= 1.1;
          s.x += (p.noise(s.seed, t * 0.9) - 0.5) * 1.6;
          s.r += 0.18;
          s.a *= 0.968;
          ctx.fillStyle = `rgba(214, 220, 236, ${s.a})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    };
  };
}
