import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import type { ChalkParticleCake } from "./particle-cake";
import { CAKE_TIMELINE, isCakeMobile, particleCakeOptions } from "@/lib/cake-config";
import { cn } from "@/lib/utils";

export type CakeStageHandle = { snuff(): void; explode(): void; reset(): void };

type Props = {
  ref?: Ref<CakeStageHandle>;
  text: string;
  label: string;
  loadingText: string;
  errorText: string;
};

const FONT = '"ZCOOL KuaiLe", "Noto Sans SC", "PingFang SC", sans-serif';

/** 3D particle cake (Three.js + particle-cake from CDN), created after mount — never during SSR. */
export function ParticleCakeStage({ ref, text, label, loadingText, errorText }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const cake = useRef<ChalkParticleCake | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useImperativeHandle(ref, () => ({
    snuff: () => cake.current?.snuff(),
    explode: () => cake.current?.explode(),
    reset: () => cake.current?.reset(),
  }));

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let cancelled = false;
    let raf = 0;
    import("./particle-cake")
      .then(({ createParticleCake }) =>
        createParticleCake(
          el,
          { ...particleCakeOptions(text, isCakeMobile(window.innerWidth)), fontFamily: FONT },
          CAKE_TIMELINE.flameFadeMs,
        ),
      )
      .then((instance) => {
        if (cancelled) return instance.destroy();
        cake.current = instance;
        setStatus("ready");
        raf = requestAnimationFrame(() => el.setAttribute("data-scene-ready", "true"));
      })
      .catch((e: unknown) => {
        console.error("Particle cake failed to load", e);
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      cake.current?.destroy();
      cake.current = null;
      el.removeAttribute("data-scene-ready");
    };
  }, [text]);

  return (
    <div className="cake-stage relative h-[min(118vw,480px)] w-full sm:h-[460px]">
      <div
        ref={host}
        role="img"
        aria-label={label}
        className="absolute inset-0 [&>canvas]:block [&>canvas]:size-full"
      />
      {status !== "ready" && (
        <p
          className={cn(
            "chalk-text absolute inset-0 flex items-center justify-center px-6 text-center font-chalk text-lg",
            status === "loading" && "animate-pulse opacity-70",
          )}
        >
          {status === "loading" ? loadingText : errorText}
        </p>
      )}
    </div>
  );
}
