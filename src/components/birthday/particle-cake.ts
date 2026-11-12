// Loads Three.js r128 + particle-cake + OrbitControls + three's postprocessing passes from
// pinned CDN URLs (browser only, call from useEffect). On top of the library it builds a
// three-tier candle cake with live particle flames, UnrealBloom glow, drag orbit and the
// blow-out text scene.

import {
  CAKE_BLOOM,
  CAKE_BOB,
  CAKE_ORBIT,
  CAKE_PARTICLE_OPACITY,
  CAKE_STRUCTURE,
} from "@/lib/cake-config";
import { CAKE_PALETTE, clamp01, hexToHsl, mixHsl, type Hsl } from "@/lib/cake-palette";

const SCRIPTS = [
  {
    src: "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js",
    integrity: "sha384-CI3ELBVUz9XQO+97x6nwMDPosPR5XvsxW2ua7N1Xeygeh1IxtgqtCkGfQY9WWdHu",
    ready: (w: Win) => Boolean(w.THREE),
  },
  {
    src: "https://unpkg.com/particle-cake@1.0.0/dist/particle-cake.min.js",
    integrity: "sha384-BuMuM3aofu75roCCE4Ej9kkMImXjKvcTXlVrjOtTj7ep1kn4DU8Uq7yebG0GWzjK",
    ready: (w: Win) => Boolean(w.ParticleCake),
  },
  {
    // three r128's OrbitControls lives outside three.min.js; pinned to the same version.
    src: "https://unpkg.com/three@0.128.0/examples/js/controls/OrbitControls.js",
    integrity: "sha384-wagZhIFgY4hD+7awjQjR4e2E294y6J2HSnd8eTNc15ZubTeQeVRZwhQJ+W6hnBsf",
    ready: (w: Win) => Boolean(w.THREE?.OrbitControls),
  },
  // EffectComposer + UnrealBloomPass, in dependency order.
  {
    src: "https://unpkg.com/three@0.128.0/examples/js/postprocessing/Pass.js",
    integrity: "sha384-HUR8WVDx2FD1OlSm1nohJJ2a3aIfeClGjv/oVFdTHd3skt+4i7/z0dl/ux4nd2ti",
    ready: (w: Win) => Boolean(w.THREE?.Pass),
  },
  {
    src: "https://unpkg.com/three@0.128.0/examples/js/shaders/CopyShader.js",
    integrity: "sha384-nhO9toQuMo5osCuA0l+YFpSqscZWxDu251Bnho2gD3kSPv1neEwHg0LyEmrA+mPj",
    ready: (w: Win) => Boolean(w.THREE?.CopyShader),
  },
  {
    src: "https://unpkg.com/three@0.128.0/examples/js/postprocessing/ShaderPass.js",
    integrity: "sha384-I3lsvPeDJYFrEAzn/TA0yhc/SCYKwpyfyq8lKzHYKohu43H9f7xc/Q9ZWgSVUDl3",
    ready: (w: Win) => Boolean(w.THREE?.ShaderPass),
  },
  {
    src: "https://unpkg.com/three@0.128.0/examples/js/postprocessing/MaskPass.js",
    integrity: "sha384-pG/SGpuNNuluvSd84K35qyRFdMxn8P8MyqIQuxjUb0wPPRgJ7yDLRQT64nLuT8CR",
    ready: (w: Win) => Boolean(w.THREE?.MaskPass),
  },
  {
    src: "https://unpkg.com/three@0.128.0/examples/js/postprocessing/EffectComposer.js",
    integrity: "sha384-GkidzTYmQg24v13sa3xhBBbvOLbVLO1QxfyKLdOWweQqNqS/iWwUst2T1fER2Xrg",
    ready: (w: Win) => Boolean(w.THREE?.EffectComposer),
  },
  {
    src: "https://unpkg.com/three@0.128.0/examples/js/shaders/LuminosityHighPassShader.js",
    integrity: "sha384-mY+ii969jnDCI2HjRHftH2NZVkIO5ZGUkcnGCg3oVJ3kVstWQXwerYWBg+nbUG4R",
    ready: (w: Win) => Boolean(w.THREE?.LuminosityHighPassShader),
  },
  {
    src: "https://unpkg.com/three@0.128.0/examples/js/postprocessing/UnrealBloomPass.js",
    integrity: "sha384-aVQ2QnWkoxhOefDB0YZB64OPVzujvccydpcC7UqMDJUK0ChwA382zOHmrWHGDRRa",
    ready: (w: Win) => Boolean(w.THREE?.UnrealBloomPass),
  },
  {
    src: "https://unpkg.com/three@0.128.0/examples/js/postprocessing/RenderPass.js",
    integrity: "sha384-2EpLreWSFuZsk4hcSplXLhlHd/wzvDNF907bTGIXSXM0SlhJNzy4YK0DhBFvkFEs",
    ready: (w: Win) => Boolean(w.THREE?.RenderPass),
  },
] as const;

export type CakeOptions = {
  text: string;
  particleCount: number;
  particleSize: number;
  textSize: number;
  candleColor: string;
  fontFamily?: string;
};

type Attr = { array: Float32Array; needsUpdate: boolean };
type Geometry = {
  attributes: { position?: Attr; color?: Attr; type?: Attr };
  setAttribute(name: string, attr: unknown): void;
  dispose(): void;
};
type Disposable = { dispose(): void };

type Color = {
  r: number;
  g: number;
  b: number;
  setHSL(h: number, s: number, l: number): Color;
};

type Camera = {
  fov: number;
  aspect: number;
  position: { x: number; y: number; z: number };
  updateProjectionMatrix(): void;
};

/** The parts of three r128's OrbitControls this card configures. */
type OrbitControls = {
  target: { set(x: number, y: number, z: number): void };
  enableDamping: boolean;
  dampingFactor: number;
  enablePan: boolean;
  enableZoom: boolean;
  rotateSpeed: number;
  minPolarAngle: number;
  maxPolarAngle: number;
  autoRotate: boolean;
  autoRotateSpeed: number;
  update(): void;
  dispose(): void;
};

type Renderer = {
  render(scene: unknown, camera: unknown): void;
  domElement: HTMLCanvasElement;
  setPixelRatio(ratio: number): void;
  setClearColor(color: number, alpha: number): void;
  dispose(): void;
};

type Composer = {
  addPass(pass: unknown): void;
  render(): void;
  setSize(width: number, height: number): void;
  dispose?(): void;
};

type BloomPass = {
  strength: number;
  radius: number;
  threshold: number;
  dispose?(): void;
};

type PointsObject = {
  rotation: { y: number };
  position: { y: number };
  material: {
    depthWrite: boolean;
    transparent: boolean;
    blending: number;
    size: number;
    opacity: number;
  };
};

type ThreeNS = {
  BufferGeometry: new () => Geometry;
  BufferAttribute: new (array: Float32Array, size: number) => Attr;
  PointsMaterial: new (opts: Record<string, unknown>) => Disposable;
  Points: new (geometry: Geometry, material: Disposable) => PointsObject;
  AdditiveBlending: number;
  OrbitControls: new (camera: Camera, domElement: HTMLElement) => OrbitControls;
  EffectComposer: new (renderer: Renderer) => Composer;
  RenderPass: new (scene: unknown, camera: unknown) => unknown;
  UnrealBloomPass: new (
    resolution: { x: number; y: number },
    strength: number,
    radius: number,
    threshold: number,
  ) => BloomPass;
  ShaderPass: new (shader: unknown) => {
    material: { depthTest: boolean; depthWrite: boolean };
  };
  Vector2: new (x: number, y: number) => { x: number; y: number };
  // Globals the postprocessing scripts define; only their presence matters here.
  Pass?: unknown;
  CopyShader?: unknown;
  MaskPass?: unknown;
  LuminosityHighPassShader?: unknown;
};

/** The parts of particle-cake@1.0.0 this card touches. */
type ParticleCakeBase = {
  config: CakeOptions & { textScale: number; fontFamily: string };
  isMobile: boolean;
  currentState: "CAKE" | "FIREWORK" | "TEXT";
  colors: Float32Array;
  types: Float32Array;
  targetPositions: Float32Array;
  velocities: Float32Array;
  colorObj: Color;
  particles: PointsObject;
  geometry: Geometry;
  scene: { add(o: object): void; remove(o: object): void };
  camera: Camera;
  renderer: Renderer;
  container: HTMLElement;
  explode(): void;
  generateCake(): void;
  generateText(): void;
  onWindowResize(): void;
  destroy(): void;
};
type ParticleCakeCtor = new (el: HTMLElement, opts: CakeOptions) => ParticleCakeBase;

export type ChalkParticleCake = ParticleCakeBase & {
  snuff(): void;
  reset(): void;
  /** Re-measure the container (fullscreen, rotation) and re-fit the gathered text. */
  resize(): void;
};

type Win = Window & {
  THREE?: ThreeNS;
  ParticleCake?: ParticleCakeCtor;
};
type Tier = (typeof CAKE_STRUCTURE.tiers)[number];
type FlameSeed = {
  candle: number;
  phase: number;
  speed: number;
  spread: number;
  offsetX: number;
  offsetZ: number;
};

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
      if (!s.ready(w)) await loadScript(s.src, s.integrity);
    }
    if (!w.THREE || !w.ParticleCake) throw new Error("particle-cake did not register");
    if (!w.THREE.OrbitControls) throw new Error("three OrbitControls did not register");
    if (!w.THREE.EffectComposer || !w.THREE.UnrealBloomPass || !w.THREE.RenderPass) {
      throw new Error("three postprocessing did not register");
    }
    return { THREE: w.THREE, Base: w.ParticleCake };
  })().catch((e: unknown) => {
    loading = null;
    throw e;
  });
  return loading;
}

const SMOKE_DELAY = [150, 900] as const;
const SMOKE_LIFE = [1400, 2100] as const;
const FLAME_HEIGHT = 22;

const GOLD = hexToHsl(CAKE_PALETTE.gold);
const AMBER = hexToHsl(CAKE_PALETTE.amber);
const DEEP_RED = hexToHsl(CAKE_PALETTE.deepRed);
/** A brighter gold reserved for the top tier: still gold, never white. */
const BRIGHT_GOLD: Hsl = { h: GOLD.h, s: GOLD.s, l: Math.min(0.68, GOLD.l + 0.09) };
const FLAME_YELLOW: Hsl = { h: 0.11, s: 1, l: 0.6 };
const FLAME_RED: Hsl = { h: -0.005, s: 1, l: 0.32 };

/** Explosion hue by distance from the cake: warm gold core → red → magenta → blue edge. */
const FIREWORK_HUES = [
  [0, 0.115],
  [0.2, 0.075],
  [0.42, 0.015],
  [0.62, -0.05],
  [0.82, -0.18],
  [1, -0.32],
] as const;

/** Gathered text stays warm gold/rose: bright enough to read, never white-hot. */
const TEXT_HUES = [
  [0, 0.127],
  [0.45, 0.08],
  [0.78, 0],
  [1, -0.05],
] as const;

/** Piecewise-linear hue ramp. Negative hues are intentional: three wraps them into 0–1. */
function hueRamp(stops: readonly (readonly [number, number])[], t: number) {
  let [from, fromHue] = stops[0] ?? [0, 0];
  for (const [at, hue] of stops) {
    if (t <= at) return at === from ? hue : fromHue + ((hue - fromHue) * (t - from)) / (at - from);
    from = at;
    fromHue = hue;
  }
  return fromHue;
}

function makeClass(
  THREE: ThreeNS,
  Base: ParticleCakeCtor,
  flameFadeMs: number,
  autoRotate: boolean,
) {
  return class Cake extends Base {
    private controls: OrbitControls;
    private composer: Composer | null = null;
    private bloom: BloomPass | null = null;
    private composing = false;
    private autoRotate: boolean;
    private pressing = false;
    private recenter = false;
    private previousState: ParticleCakeBase["currentState"] = "CAKE";
    private fireworkAt = 0;
    private hueJitter: Float32Array;
    private lightJitter: Float32Array;
    private flameOutAt: number | null = null;
    private smokeAt: number | null = null;
    private smokeGeo: Geometry;
    private smokeMat: Disposable;
    private smoke: object;
    private smokeSeed: Float32Array;
    private wicks: { x: number; y: number; z: number }[] = [];
    private flames: FlameSeed[] = [];
    private flameStart = 0;

    private onPointerDown = () => {
      this.pressing = true;
      this.recenter = false; // a deliberate drag wins over the auto re-centre
    };

    private onPointerUp = () => {
      this.pressing = false;
    };

    constructor(el: HTMLElement, opts: CakeOptions) {
      super(el, opts);
      const n = this.isMobile ? 60 : 100;
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

      this.autoRotate = autoRotate;
      this.hueJitter = new Float32Array(this.types.length);
      this.lightJitter = new Float32Array(this.types.length);

      // Glowing points never write depth, so the bloom pass sees every layer of the tiers.
      this.particles.material.depthWrite = false;
      this.particles.material.transparent = true;
      this.particles.material.blending = THREE.AdditiveBlending;
      this.particles.material.opacity = CAKE_PARTICLE_OPACITY;

      // Transparent canvas: three otherwise clears every frame to opaque black.
      this.renderer.setClearColor(0x000000, 0);

      // Bloom is fill-rate heavy on phones: keep the drawing buffer a little smaller there.
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.isMobile ? 1.5 : 2));

      this.buildCake();

      // Drag to look around: orbiting the camera reads exactly like spinning the cake, but
      // it lets the text stop square to the viewer when the explosion gathers.
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      const orbit = this.controls;
      orbit.target.set(0, 0, 0);
      orbit.enableDamping = true;
      orbit.dampingFactor = CAKE_ORBIT.damping;
      orbit.enablePan = false;
      orbit.enableZoom = false;
      orbit.rotateSpeed = CAKE_ORBIT.rotateSpeed;
      orbit.minPolarAngle = (CAKE_ORBIT.minPolarDeg * Math.PI) / 180;
      orbit.maxPolarAngle = (CAKE_ORBIT.maxPolarDeg * Math.PI) / 180;
      orbit.autoRotate = false;
      orbit.autoRotateSpeed = CAKE_ORBIT.autoRotateSpeed;
      orbit.update();

      this.setupBloom(THREE);

      this.renderer.domElement.addEventListener("pointerdown", this.onPointerDown);
      window.addEventListener("pointerup", this.onPointerUp);
      window.addEventListener("pointercancel", this.onPointerUp);

      // Hook in right before each frame is drawn, after the library updated its particles.
      const render = this.renderer.render.bind(this.renderer);
      this.renderer.render = (scene, camera) => {
        if (this.composing) {
          render(scene, camera);
          return;
        }
        this.beforeRender(performance.now());
        if (this.composer) {
          this.composing = true;
          try {
            this.composer.render();
          } finally {
            this.composing = false;
          }
        } else {
          render(scene, camera);
        }
      };
    }

    /** Replace the library's single cylinder with the tiered cake, candles and flames. */
    private buildCake() {
      this.currentState = "CAKE";
      this.wicks = [];
      this.flames = [];
      const total = this.types.length;

      const [bottom, middle, top] = CAKE_STRUCTURE.tiers;
      const flamePerCandle = this.isMobile
        ? CAKE_STRUCTURE.flamesPerCandle.mobile
        : CAKE_STRUCTURE.flamesPerCandle.desktop;
      const reservedFlames = flamePerCandle * CAKE_STRUCTURE.candleCount;

      let cursor = 0;
      cursor = this.fillTier(cursor, Math.round(total * bottom.share), bottom, 0);
      cursor = this.fillTier(cursor, Math.round(total * middle.share), middle, 1);
      cursor = this.fillTier(cursor, Math.round(total * top.share), top, 2);

      const candleBudget = Math.max(0, total - cursor - reservedFlames);
      cursor = this.fillCandles(cursor, candleBudget);
      this.flameStart = cursor;
      cursor = this.fillFlames(cursor, Math.min(reservedFlames, total - cursor), flamePerCandle);

      // Rounding leftovers become extra bottom-tier dust, never an unset particle.
      if (cursor < total) this.fillTier(cursor, total - cursor, bottom, 0);

      this.particles.rotation.y = 0;
      this.particles.position.y = 0;
      const colors = this.geometry.attributes.color;
      if (colors) colors.needsUpdate = true;
      const types = this.geometry.attributes.type;
      if (types) types.needsUpdate = true;
    }

    private fillTier(start: number, count: number, tier: Tier, tierIndex: number) {
      const { radius, height, baseY } = tier;
      const topY = baseY + height;
      for (let k = 0; k < count; k++) {
        const theta = Math.random() * Math.PI * 2;
        let x: number;
        let y: number;
        let z: number;
        if (tierIndex === 2) {
          // The top tier gets a solid wall, a wavy cream lip that overhangs the edge,
          // and a few drips: piping, not a plain cylinder cap.
          const roll = Math.random();
          if (roll < 0.45) {
            const r = radius * (0.97 + Math.random() * 0.04);
            y = baseY + Math.random() * height;
            x = Math.cos(theta) * r;
            z = Math.sin(theta) * r;
          } else if (roll < 0.8) {
            const r = radius * (0.94 + Math.random() * 0.13);
            const drip = Math.random() < 0.24 ? Math.random() * 6 : 0;
            y = topY + Math.sin(theta * 7) * 1.6 - drip + (Math.random() - 0.5) * 0.8;
            x = Math.cos(theta) * r;
            z = Math.sin(theta) * r;
          } else {
            const r = radius * Math.sqrt(Math.random()) * 0.9;
            y = topY + (Math.random() - 0.5) * 1.1;
            x = Math.cos(theta) * r;
            z = Math.sin(theta) * r;
          }
        } else if (Math.random() < 0.74) {
          // Most particles live on the visible shell, which keeps the silhouette crisp.
          const r = radius * (0.97 + Math.random() * 0.04);
          y = baseY + Math.random() * height;
          x = Math.cos(theta) * r;
          z = Math.sin(theta) * r;
        } else {
          const r = radius * Math.sqrt(Math.random()) * 0.97;
          y = topY - Math.random() * 1.2;
          x = Math.cos(theta) * r;
          z = Math.sin(theta) * r;
        }
        this.writeParticle(start + k, x, y, z, this.tierColor(tierIndex, (y - baseY) / height), 0);
      }
      return start + count;
    }

    private fillCandles(start: number, count: number) {
      const { ringRadius, radius, height } = CAKE_STRUCTURE.candle;
      const top = CAKE_STRUCTURE.tiers[2];
      const topY = top.baseY + top.height;
      const perCandle = Math.floor(count / CAKE_STRUCTURE.candleCount);
      const extra = count % CAKE_STRUCTURE.candleCount;
      let cursor = start;
      for (let c = 0; c < CAKE_STRUCTURE.candleCount; c++) {
        const angle = (c / CAKE_STRUCTURE.candleCount) * Math.PI * 2 + Math.PI / 6;
        const cx = Math.cos(angle) * ringRadius;
        const cz = Math.sin(angle) * ringRadius;
        this.wicks[c] = { x: cx, y: topY + height + 0.6, z: cz };
        const n = perCandle + (c < extra ? 1 : 0);
        for (let k = 0; k < n; k++) {
          const theta = Math.random() * Math.PI * 2;
          const onCap = Math.random() > 0.82;
          const r = onCap
            ? radius * Math.sqrt(Math.random())
            : radius * (0.9 + Math.random() * 0.18);
          const y = topY + (onCap ? height : Math.random() * height);
          const color = Math.random() < 0.68 ? BRIGHT_GOLD : GOLD;
          this.writeParticle(
            cursor++,
            cx + Math.cos(theta) * r,
            y,
            cz + Math.sin(theta) * r,
            color,
            0,
          );
        }
      }
      return cursor;
    }

    private fillFlames(start: number, totalFlames: number, perCandle: number) {
      let cursor = start;
      for (let c = 0; c < CAKE_STRUCTURE.candleCount; c++) {
        const wick = this.wicks[c] ?? { x: 0, y: 100, z: 0 };
        for (let k = 0; k < perCandle && cursor < start + totalFlames; k++) {
          this.flames.push({
            candle: c,
            phase: Math.random(),
            speed: 0.55 + Math.random() * 0.85,
            spread: 0.7 + Math.random() * 0.6,
            offsetX: (Math.random() - 0.5) * 1.8,
            offsetZ: (Math.random() - 0.5) * 1.8,
          });
          this.writeParticle(cursor++, wick.x, wick.y, wick.z, FLAME_YELLOW, 3);
        }
      }
      return cursor;
    }

    private tierColor(tierIndex: number, yNorm: number): Hsl {
      if (tierIndex === 0) {
        // Bottom: dark red with dark-gold highlights.
        const gold = Math.random() < 0.35;
        const t = gold ? 0.55 + Math.random() * 0.35 : 0.1 + clamp01(yNorm) * 0.4;
        return mixHsl(DEEP_RED, GOLD, t);
      }
      if (tierIndex === 1) {
        // Middle: amber to gold, so it separates from the red base without going pale.
        return mixHsl(AMBER, GOLD, 0.25 + Math.random() * 0.65);
      }
      // Top: the brightest gold of the three, plus a little amber for depth.
      return Math.random() < 0.7 ? BRIGHT_GOLD : mixHsl(GOLD, AMBER, Math.random() * 0.35);
    }

    private writeParticle(i: number, x: number, y: number, z: number, hsl: Hsl, type: number) {
      const i3 = i * 3;
      this.targetPositions[i3] = x;
      this.targetPositions[i3 + 1] = y;
      this.targetPositions[i3 + 2] = z;
      this.types[i] = type;
      // A slight shift around each anchor keeps the cake from looking spray-painted.
      const h = hsl.h + (Math.random() - 0.5) * 0.016;
      const s = clamp01(hsl.s + (Math.random() - 0.5) * 0.12);
      const l = clamp01(hsl.l + (Math.random() - 0.5) * 0.09);
      this.colorObj.setHSL(h, s, l);
      this.colors[i3] = this.colorObj.r;
      this.colors[i3 + 1] = this.colorObj.g;
      this.colors[i3 + 2] = this.colorObj.b;
    }

    private setupBloom(three: ThreeNS) {
      try {
        const composer = new three.EffectComposer(this.renderer);
        composer.addPass(new three.RenderPass(this.scene, this.camera));
        const bloom = new three.UnrealBloomPass(
          new three.Vector2(this.container.clientWidth, this.container.clientHeight),
          this.isMobile ? CAKE_BLOOM.mobileStrength : CAKE_BLOOM.strength,
          CAKE_BLOOM.radius,
          CAKE_BLOOM.threshold,
        );
        composer.addPass(bloom);
        // UnrealBloomPass composites with an opaque alpha, which paints a black rectangle
        // over the chalkboard. Rebuild alpha from the final luminance so empty pixels stay
        // transparent and only the cake/glow is visible.
        const alphaPass = new three.ShaderPass({
          uniforms: { tDiffuse: { value: null } },
          vertexShader:
            "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
          fragmentShader:
            "uniform sampler2D tDiffuse; varying vec2 vUv; void main() { vec4 texel = texture2D(tDiffuse, vUv); float peak = max(texel.r, max(texel.g, texel.b)); float alpha = smoothstep(0.03, 0.12, peak); gl_FragColor = vec4(texel.rgb * alpha, alpha); }",
        });
        alphaPass.material.depthTest = false;
        alphaPass.material.depthWrite = false;
        composer.addPass(alphaPass);
        this.composer = composer;
        this.bloom = bloom;
      } catch (error) {
        console.error("Bloom unavailable; rendering the cake without post-processing", error);
        this.composer = null;
        this.bloom = null;
      }
    }

    /** Fade the five candle flames out and let smoke rise. */
    snuff() {
      const now = performance.now();
      this.flameOutAt = now;
      this.smokeAt = now;
    }

    /** Back to a lit, rotating cake. */
    reset() {
      this.flameOutAt = null;
      this.smokeAt = null;
      this.recenter = false;
      this.previousState = "CAKE";
      this.buildCake();
      this.drawSmoke(0);
    }

    resize() {
      this.onWindowResize();
      this.composer?.setSize(this.container.clientWidth, this.container.clientHeight);
      this.controls.update();
      if (this.currentState === "TEXT") {
        // The camera aspect changed (fullscreen / phone rotation): re-fit the blessing.
        this.generateText();
        this.paintTextColors();
      }
    }

    override explode() {
      super.explode();
      this.previousState = "FIREWORK";
      this.fireworkAt = performance.now();
      this.recenter = true;
      this.seedExplosionJitter();
      this.paintFirework(0);
    }

    private seedExplosionJitter() {
      for (let i = 0; i < this.hueJitter.length; i++) {
        this.hueJitter[i] = (Math.random() - 0.5) * 0.05;
        this.lightJitter[i] = (Math.random() - 0.5) * 0.12;
      }
    }

    private beforeRender(now: number) {
      const state = this.currentState;

      if (state !== this.previousState) {
        if (state === "FIREWORK") {
          this.fireworkAt = now;
          this.recenter = true;
          this.seedExplosionJitter();
        } else if (state === "TEXT") {
          this.paintTextColors();
        }
        this.previousState = state;
      }

      if (this.smokeAt !== null) this.drawSmoke(now - this.smokeAt);
      if (state === "FIREWORK") this.paintFirework(now - this.fireworkAt);
      if (state === "CAKE") this.paintFlames(now);

      // The library spins the points; the orbit replaces that spin so the camera can glide
      // around the cake and pause wherever the viewer left it.
      this.particles.rotation.y = 0;
      // Slow breathing keeps even a paused screenshot alive; text and fireworks hold still.
      this.particles.position.y =
        state === "CAKE"
          ? CAKE_BOB.amplitude * Math.sin((now / CAKE_BOB.periodMs) * Math.PI * 2)
          : 0;

      if (this.recenter && !this.pressing) this.recenterCamera();
      this.controls.autoRotate = this.autoRotate && state === "CAKE";
      this.controls.update();
    }

    /** Flames are live particle plumes: rise, sway, and colour from yellow to deep red. */
    private paintFlames(now: number) {
      const positions = this.geometry.attributes.position;
      const colors = this.geometry.attributes.color;
      if (!positions || !colors) return;
      const fade =
        this.flameOutAt === null ? 1 : Math.max(0, 1 - (now - this.flameOutAt) / flameFadeMs);
      const seconds = now / 1000;
      for (let k = 0; k < this.flames.length; k++) {
        const seed = this.flames[k];
        const wick = seed ? this.wicks[seed.candle] : undefined;
        if (!seed || !wick) continue;
        const i3 = (this.flameStart + k) * 3;
        const cycle = (((seconds * seed.speed + seed.phase) % 1) + 1) % 1;
        const width = 0.4 + Math.sin(Math.PI * cycle) * 3.1 * seed.spread;
        const sway = Math.sin(seconds * 2.6 + seed.phase * 12) * width;
        positions.array[i3] = wick.x + seed.offsetX + sway;
        positions.array[i3 + 1] = wick.y + cycle * FLAME_HEIGHT;
        positions.array[i3 + 2] =
          wick.z + seed.offsetZ + Math.cos(seconds * 2.1 + seed.phase * 9) * width * 0.7;

        const hsl = mixHsl(FLAME_YELLOW, FLAME_RED, cycle);
        this.colorObj.setHSL(hsl.h, 1, hsl.l * fade);
        colors.array[i3] = this.colorObj.r;
        colors.array[i3 + 1] = this.colorObj.g;
        colors.array[i3 + 2] = this.colorObj.b;
      }
      positions.needsUpdate = true;
      colors.needsUpdate = true;
    }

    /** Bring the camera back to the front, so gathered text never sits edge-on. */
    private recenterCamera() {
      const { x, z } = this.camera.position;
      const theta = Math.atan2(x, z);
      if (Math.abs(theta) < 0.01) {
        this.recenter = false;
        return;
      }
      const angle = -theta * 0.07;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      this.camera.position.x = x * cos + z * sin;
      this.camera.position.z = -x * sin + z * cos;
    }

    /** Firework colors follow the expanding radius, so the layers travel outward. */
    private paintFirework(elapsed: number) {
      const colors = this.geometry.attributes.color;
      const positions = this.geometry.attributes.position;
      if (!colors || !positions) return;
      const t = Math.min(1, Math.max(0, elapsed) / 1400);
      const reach = 130 + 300 * t;
      const count = this.types.length;
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const distance = Math.hypot(
          positions.array[i3] ?? 0,
          positions.array[i3 + 1] ?? 0,
          positions.array[i3 + 2] ?? 0,
        );
        const u = Math.min(1, distance / reach);
        const hue = hueRamp(FIREWORK_HUES, u) + (this.hueJitter[i] ?? 0);
        this.colorObj.setHSL(hue, 0.95 - u * 0.12, 0.62 + (this.lightJitter[i] ?? 0) - u * 0.08);
        colors.array[i3] = this.colorObj.r;
        colors.array[i3 + 1] = this.colorObj.g;
        colors.array[i3 + 2] = this.colorObj.b;
      }
      colors.needsUpdate = true;
    }

    /** Readable on a near-black recording stage: bright, warm on the left, violet on the right. */
    private paintTextColors() {
      const colors = this.geometry.attributes.color;
      if (!colors) return;
      const targets = this.targetPositions;
      const count = this.types.length;
      let minX = Infinity;
      let maxX = -Infinity;
      for (let i = 0; i < count; i++) {
        const x = targets[i * 3] ?? 0;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
      const span = Math.max(1, maxX - minX);
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const u = Math.min(1, Math.max(0, ((targets[i3] ?? 0) - minX) / span));
        this.colorObj.setHSL(hueRamp(TEXT_HUES, u), 0.85 - u * 0.2, 0.74 - u * 0.04);
        colors.array[i3] = this.colorObj.r;
        colors.array[i3 + 1] = this.colorObj.g;
        colors.array[i3 + 2] = this.colorObj.b;
      }
      colors.needsUpdate = true;
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
        const wick = this.wicks[Math.floor(a * this.wicks.length)];
        const wx = wick?.x ?? 0;
        const wy = wick?.y ?? 110;
        const wz = wick?.z ?? 0;
        const spread = 3 + t * 26;
        pos.array[i3] = wx + Math.sin(c * 9 + t * 4.5) * spread;
        pos.array[i3 + 1] = wy + t * 120 + c * 6;
        pos.array[i3 + 2] = wz + Math.cos(a * 7 + t * 3.2) * spread * 0.6;
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
    override generateText() {
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
      // Full 3D distance: the orbit can park the camera to the side of the z axis.
      const dist = Math.hypot(cam.position.x, cam.position.y, cam.position.z);
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

    override destroy() {
      this.renderer.domElement.removeEventListener("pointerdown", this.onPointerDown);
      window.removeEventListener("pointerup", this.onPointerUp);
      window.removeEventListener("pointercancel", this.onPointerUp);
      this.controls.dispose();
      this.composer?.dispose?.();
      this.bloom?.dispose?.();
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
  autoRotate = true,
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
  const Cake = makeClass(THREE, Base, flameFadeMs, autoRotate);
  return new Cake(el, opts);
}
