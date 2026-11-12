// Loads Three.js r128 + particle-cake from CDN (browser only, call from useEffect) and
// extends the library with a flame fade, rising smoke and text that fits its container.

const SCRIPTS = [
  {
    global: "THREE",
    src: "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js",
    integrity: "sha384-CI3ELBVUz9XQO+97x6nwMDPosPR5XvsxW2ua7N1Xeygeh1IxtgqtCkGfQY9WWdHu",
  },
  {
    global: "ParticleCake",
    src: "https://unpkg.com/particle-cake@1.0.0/dist/particle-cake.min.js",
    integrity: "sha384-BuMuM3aofu75roCCE4Ej9kkMImXjKvcTXlVrjOtTj7ep1kn4DU8Uq7yebG0GWzjK",
  },
] as const;

export type CakeOptions = {
  text: string;
  particleCount: number;
  textSize: number;
  candleColor: string;
  fontFamily?: string;
};

type Attr = { array: Float32Array; needsUpdate: boolean };
type Geometry = {
  attributes: Record<string, Attr>;
  setAttribute(name: string, attr: unknown): void;
  dispose(): void;
};
type Disposable = { dispose(): void };

type ThreeNS = {
  BufferGeometry: new () => Geometry;
  BufferAttribute: new (array: Float32Array, size: number) => Attr;
  PointsMaterial: new (opts: Record<string, unknown>) => Disposable;
  Points: new (geometry: Geometry, material: Disposable) => object;
  AdditiveBlending: number;
};

/** The parts of particle-cake@1.0.0 this card touches. */
type ParticleCakeBase = {
  config: CakeOptions & { textScale: number; fontFamily: string };
  isMobile: boolean;
  currentState: "CAKE" | "FIREWORK" | "TEXT";
  colors: Float32Array;
  types: Float32Array;
  targetPositions: Float32Array;
  geometry: Geometry;
  scene: { add(o: object): void; remove(o: object): void };
  camera: { fov: number; aspect: number; position: { y: number; z: number } };
  renderer: { render(scene: unknown, camera: unknown): void; domElement: HTMLCanvasElement };
  explode(): void;
  generateCake(): void;
  generateText(): void;
  destroy(): void;
};
type ParticleCakeCtor = new (el: HTMLElement, opts: CakeOptions) => ParticleCakeBase;

export type ChalkParticleCake = ParticleCakeBase & {
  snuff(): void;
  reset(): void;
};

type Win = Window & { THREE?: ThreeNS; ParticleCake?: ParticleCakeCtor };

function loadScript(src: string, integrity: string) {
  return new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.integrity = integrity;
    s.crossOrigin = "anonymous";
    s.async = false;
    s.onload = () => resolve();
    s.onerror = () => {
      s.remove();
      reject(new Error(`Failed to load ${src}`));
    };
    document.head.appendChild(s);
  });
}

let loading: Promise<{ THREE: ThreeNS; Base: ParticleCakeCtor }> | null = null;

function loadLibs() {
  loading ??= (async () => {
    const w = window as Win;
    for (const s of SCRIPTS) {
      if (!w[s.global]) await loadScript(s.src, s.integrity);
    }
    if (!w.THREE || !w.ParticleCake) throw new Error("particle-cake did not register");
    return { THREE: w.THREE, Base: w.ParticleCake };
  })().catch((e: unknown) => {
    loading = null;
    throw e;
  });
  return loading;
}

const FLAME = 2; // particle-cake's particle type for flame points
const FLAME_TOP_Y = 125; // candle 50–110, flame 110–125 in the library's cake
const SMOKE_DELAY = [150, 900] as const;
const SMOKE_LIFE = [1400, 2100] as const;

function makeClass(THREE: ThreeNS, Base: ParticleCakeCtor, flameFadeMs: number) {
  return class Cake extends Base {
    private flameOutAt: number | null = null;
    private smokeAt: number | null = null;
    private smokeGeo: Geometry;
    private smokeMat: Disposable;
    private smoke: object;
    private smokeSeed: Float32Array;

    constructor(el: HTMLElement, opts: CakeOptions) {
      super(el, opts);
      const n = this.isMobile ? 36 : 70;
      this.smokeSeed = new Float32Array(n * 3).map(() => Math.random());
      this.smokeGeo = new THREE.BufferGeometry();
      this.smokeGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
      this.smokeGeo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
      this.smokeMat = new THREE.PointsMaterial({
        size: this.isMobile ? 3.5 : 7,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      this.smoke = new THREE.Points(this.smokeGeo, this.smokeMat);
      this.scene.add(this.smoke);

      // Hook in right before each frame is drawn, after the library updated its particles.
      const render = this.renderer.render.bind(this.renderer);
      this.renderer.render = (scene, camera) => {
        this.beforeRender(performance.now());
        render(scene, camera);
      };
    }

    /** Fade the candle flame out and let smoke rise. */
    snuff() {
      const now = performance.now();
      this.flameOutAt = now;
      this.smokeAt = now;
    }

    /** Back to a lit, rotating cake. */
    reset() {
      this.flameOutAt = null;
      this.smokeAt = null;
      this.generateCake();
      this.drawSmoke(0);
    }

    private beforeRender(now: number) {
      if (this.flameOutAt !== null && this.currentState === "CAKE") {
        const k = Math.max(0, 1 - (now - this.flameOutAt) / flameFadeMs);
        const colors = this.geometry.attributes.color;
        if (colors) {
          for (let i = 0; i < this.types.length; i++) {
            if (this.types[i] !== FLAME) continue;
            const i3 = i * 3;
            colors.array[i3] = (colors.array[i3] ?? 0) * k;
            colors.array[i3 + 1] = (colors.array[i3 + 1] ?? 0) * k;
            colors.array[i3 + 2] = (colors.array[i3 + 2] ?? 0) * k;
          }
          colors.needsUpdate = true;
        }
      }
      if (this.smokeAt !== null) this.drawSmoke(now - this.smokeAt);
    }

    /** Smoke is a pure function of elapsed time, so there is no per-frame state to drift. */
    private drawSmoke(elapsed: number) {
      const pos = this.smokeGeo.attributes.position;
      const col = this.smokeGeo.attributes.color;
      if (!pos || !col) return;
      const s = this.smokeSeed;
      const n = s.length / 3;
      let alive = false;
      for (let i = 0; i < n; i++) {
        const a = s[i * 3] ?? 0;
        const b = s[i * 3 + 1] ?? 0;
        const c = s[i * 3 + 2] ?? 0;
        const delay = SMOKE_DELAY[0] + a * (SMOKE_DELAY[1] - SMOKE_DELAY[0]);
        const life = SMOKE_LIFE[0] + b * (SMOKE_LIFE[1] - SMOKE_LIFE[0]);
        const t = this.smokeAt === null ? -1 : (elapsed - delay) / life;
        const i3 = i * 3;
        if (t < 0 || t > 1) {
          col.array[i3] = col.array[i3 + 1] = col.array[i3 + 2] = 0;
          if (t < 0 && this.smokeAt !== null) alive = true;
          continue;
        }
        alive = true;
        const spread = 3 + t * 26;
        pos.array[i3] = Math.sin(c * 9 + t * 4.5) * spread;
        pos.array[i3 + 1] = FLAME_TOP_Y + t * 120 + c * 6;
        pos.array[i3 + 2] = Math.cos(a * 7 + t * 3.2) * spread * 0.6;
        const g = 0.5 * (1 - t) * Math.min(1, t * 5);
        col.array[i3] = g;
        col.array[i3 + 1] = g * 0.97;
        col.array[i3 + 2] = g * 0.9;
      }
      pos.needsUpdate = true;
      col.needsUpdate = true;
      if (!alive) this.smokeAt = null;
    }

    /**
     * The library draws text on a fixed 800px canvas, which clips six characters at 150px,
     * and sizes it for a full-screen container. Draw on a canvas sized to the text instead
     * and scale it to fit the container width.
     */
    generateText() {
      const { text, textSize, fontFamily, particleCount, textScale } = this.config;
      const font = `bold ${textSize}px ${fontFamily}`;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.font = font;
      canvas.width = Math.ceil(ctx.measureText(text).width + textSize * 0.4);
      canvas.height = Math.ceil(textSize * 1.5);
      ctx.font = font;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(text, canvas.width / 2, canvas.height / 2);

      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const step = this.isMobile ? 2 : 3;
      const pixels: [number, number][] = [];
      for (let y = 0; y < canvas.height; y += step) {
        for (let x = 0; x < canvas.width; x += step) {
          if ((data[(y * canvas.width + x) * 4 + 3] ?? 0) > 128) {
            pixels.push([x - canvas.width / 2, -(y - canvas.height / 2)]);
          }
        }
      }
      if (!pixels.length) return;

      const cam = this.camera;
      const dist = Math.hypot(cam.position.y, cam.position.z);
      const visibleW = 2 * dist * Math.tan(((cam.fov / 2) * Math.PI) / 180) * cam.aspect;
      const scale = Math.min(textScale, (visibleW * 0.86) / canvas.width);
      const jitter = this.isMobile ? 10 : 20;

      for (let i = 0; i < particleCount; i++) {
        // More samples than particles: spread evenly over the whole text, not just its top rows.
        const idx =
          pixels.length > particleCount
            ? Math.floor((i * pixels.length) / particleCount)
            : i % pixels.length;
        const p = pixels[idx] ?? pixels[0] ?? [0, 0];
        const i3 = i * 3;
        this.targetPositions[i3] = p[0] * scale;
        this.targetPositions[i3 + 1] = p[1] * scale;
        this.targetPositions[i3 + 2] = (Math.random() - 0.5) * jitter;
      }
    }

    destroy() {
      this.scene.remove(this.smoke);
      this.smokeGeo.dispose();
      this.smokeMat.dispose();
      super.destroy();
    }
  };
}

export async function createParticleCake(
  el: HTMLElement,
  opts: CakeOptions,
  flameFadeMs: number,
): Promise<ChalkParticleCake> {
  const [{ THREE, Base }] = await Promise.all([
    loadLibs(),
    // the text is drawn on a 2D canvas, which only uses fonts that are already loaded
    opts.fontFamily
      ? Promise.race([
          document.fonts.load(`bold ${opts.textSize}px ${opts.fontFamily}`, opts.text),
          new Promise((r) => setTimeout(r, 2500)),
        ]).catch(() => undefined)
      : Promise.resolve(),
  ]);
  const Cake = makeClass(THREE, Base, flameFadeMs);
  return new Cake(el, opts);
}
