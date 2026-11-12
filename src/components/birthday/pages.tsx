import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Mail, RotateCcw } from "lucide-react";
import { ChalkTitle } from "./ChalkTitle";
import { ChalkHeart } from "./ChalkHeart";
import { FlipCard } from "./FlipCard";
import { RemarkCard } from "./RemarkCard";
import { HeartBurst } from "./HeartBurst";
import { ParticleCakeStage, type CakeStageHandle } from "./ParticleCakeStage";
import { CAKE_TIMELINE } from "@/lib/cake-config";
import { archive, cake, intro, route, wish } from "@/content/birthday";
import { useIsPhone, useReducedMotion } from "@/hooks/use-media";
import { cycle, heartCount } from "@/lib/hearts";
import { cn } from "@/lib/utils";

type PageProps = { onNext: () => void };

function NextButton({ onClick, children = "下一页" }: { onClick: () => void; children?: string }) {
  return (
    <button type="button" onClick={onClick} className="chalk-btn animate-page-in">
      {children}
      <ArrowRight className="size-5" aria-hidden="true" />
    </button>
  );
}

/* ---------------- 1. 入口 ---------------- */

export function IntroPage({ onNext }: PageProps) {
  const reduced = useReducedMotion();
  const [burst, setBurst] = useState<{ x: number; y: number; id: number } | null>(null);
  const [signed, setSigned] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const sign = (e: React.MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (!reduced) setBurst({ x: r.left + r.width / 2, y: r.top + r.height / 2, id: Date.now() });
    setSigned(true);
    timer.current = setTimeout(() => setShowNext(true), reduced ? 0 : 900);
  };
  const clearBurst = useCallback(() => setBurst(null), []);

  return (
    <section className="flex min-h-[calc(100dvh-7rem)] flex-col items-center justify-center gap-8 text-center">
      <p className="chalk-text font-chalk text-sm tracking-[0.3em] opacity-70">NOTICE · 内部文件</p>
      <ChalkTitle className="text-[2.1rem] sm:text-5xl md:text-6xl">
        <span className="block text-2xl text-chalk-dim sm:text-3xl">{intro.titleTop}</span>
        <span className="mt-2 block">
          <span className="chalk-underline">{intro.titleMain}</span>
        </span>
        <span className="mt-1 block text-chalk-gold">{intro.titleTail}</span>
      </ChalkTitle>

      <div className="paper-note w-full max-w-sm -rotate-1 px-5 pb-5 pt-7 text-left">
        <span className="absolute -right-2 -top-3 rotate-12 rounded-sm border-2 border-stamp px-2 py-0.5 font-chalk text-xs text-stamp">
          仅限大哥本人拆阅
        </span>
        <dl className="space-y-2 text-sm leading-relaxed">
          {intro.lines.map((l) => (
            <div key={l.label} className="flex gap-2">
              <dt className="shrink-0 font-chalk text-stamp">{l.label}：</dt>
              <dd>{l.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={sign}
          disabled={signed}
          className="chalk-btn chalk-btn-solid px-7 text-lg"
        >
          <ChalkHeart className="w-5 text-stamp" />
          {signed ? intro.signed : intro.cta}
        </button>
        {showNext && <NextButton onClick={onNext} />}
      </div>

      {burst && (
        <HeartBurst
          key={burst.id}
          x={burst.x}
          y={burst.y}
          count={14}
          spread={170}
          fall={80}
          duration={[1.3, 1.9]}
          size={[18, 30]}
          onDone={clearBurst}
        />
      )}
    </section>
  );
}

/* ---------------- 2. 档案 ---------------- */

const TILTS: [string, ...string[]] = [
  "-rotate-1",
  "rotate-1",
  "rotate-[-0.6deg]",
  "rotate-[0.8deg]",
  "-rotate-[0.4deg]",
];

export function ArchivePage({ onNext }: PageProps) {
  return (
    <section className="flex flex-col items-center gap-8">
      <header className="text-center">
        <ChalkTitle>{archive.title}</ChalkTitle>
        <p className="mt-3 text-sm text-chalk-dim">{archive.hint}</p>
      </header>
      <div className="grid w-full max-w-3xl grid-cols-1 gap-7 md:grid-cols-2">
        {archive.cards.map((c, i) => (
          <FlipCard
            key={c.front}
            no={i + 1}
            front={c.front}
            back={c.back}
            className={cn(
              cycle(TILTS, i),
              i === archive.cards.length - 1 && "md:col-span-2 md:mx-auto md:max-w-md",
            )}
          />
        ))}
      </div>
      <NextButton onClick={onNext} />
    </section>
  );
}

/* ---------------- 3. 祝福 ---------------- */

export function WishPage({ onNext }: PageProps) {
  const reduced = useReducedMotion();
  const full = wish.letter;
  const [count, setCount] = useState(0);
  const done = count >= full.length;

  useEffect(() => {
    if (reduced) {
      setCount(full.length);
      return;
    }
    const id = setInterval(() => {
      setCount((c) => {
        if (c >= full.length) {
          clearInterval(id);
          return c;
        }
        return c + 1;
      });
    }, 55);
    return () => clearInterval(id);
  }, [full, reduced]);

  return (
    <section className="flex flex-col items-center gap-8">
      <ChalkTitle className="text-center">{wish.title}</ChalkTitle>

      <article className="paper-note paper-lined w-full max-w-xl rotate-[-0.5deg] px-6 pb-6 pt-8 sm:px-8">
        <div className="grid">
          {/* invisible full text reserves the height so nothing jumps while typing */}
          <p
            className="invisible col-start-1 row-start-1 whitespace-pre-line text-base leading-8"
            aria-hidden="true"
          >
            {full}
          </p>
          <p
            className="col-start-1 row-start-1 whitespace-pre-line text-base leading-8"
            aria-live="polite"
          >
            {full.slice(0, count)}
            {!done && (
              <span className="ml-0.5 inline-block h-5 w-0.5 translate-y-1 animate-caret bg-paper-ink" />
            )}
          </p>
        </div>
        <p
          className={cn(
            "mt-2 text-right font-hand text-3xl text-stamp transition-opacity duration-700",
            done ? "opacity-100" : "opacity-0",
          )}
        >
          {wish.signature}
        </p>
      </article>

      {!done ? (
        <button
          type="button"
          onClick={() => setCount(full.length)}
          className="chalk-btn chalk-btn-quiet"
        >
          直接看全文
        </button>
      ) : (
        <div className="flex w-full max-w-xl animate-page-in flex-col items-center gap-7">
          <p className="chalk-text font-chalk text-xl">小弟评语卡 · 点开看看</p>
          <div className="grid w-full gap-6">
            {wish.remarks.map((r, i) => (
              <RemarkCard key={r.tag} {...r} className={cycle(TILTS, i + 1)} />
            ))}
          </div>
          <NextButton onClick={onNext} />
        </div>
      )}
    </section>
  );
}

/* ---------------- 4. 双校连线 ---------------- */

function Stop({ name, note }: { name: string; note: string }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center md:w-40">
      <span className="block size-5 rounded-full border-2 border-chalk bg-chalk/25 shadow-[0_0_10px] shadow-chalk/30" />
      <span className="chalk-text font-chalk text-xl leading-tight">{name}</span>
      <span className="text-xs text-chalk-dim">{note}</span>
    </div>
  );
}

export function RoutePage({ onNext }: PageProps) {
  const reduced = useReducedMotion();
  const [arrived, setArrived] = useState(false);

  useEffect(() => {
    if (reduced) setArrived(true);
  }, [reduced]);

  return (
    <section className="flex min-h-[calc(100dvh-7rem)] flex-col items-center justify-center gap-8">
      <header className="text-center">
        <ChalkTitle>{route.title}</ChalkTitle>
        <p className="mt-3 text-sm text-chalk-dim">跨校专线 · 生日排面配送中</p>
      </header>

      <div className="chalk-frame flex w-full max-w-3xl flex-col items-center px-6 py-8 md:flex-row md:px-8">
        <Stop {...route.from} />
        <div className="relative my-3 h-56 w-full md:mx-4 md:my-0 md:h-20 md:flex-1">
          <div className="absolute bottom-0 left-1/2 top-0 border-l-2 border-dashed border-chalk/70 md:bottom-auto md:left-0 md:right-0 md:top-1/2 md:border-l-0 md:border-t-2" />
          <div
            className={cn("envelope absolute", arrived ? "envelope-arrived" : "envelope-travel")}
            onAnimationEnd={() => setArrived(true)}
          >
            <span className="flex size-12 items-center justify-center rounded-md bg-paper text-stamp shadow-lg">
              <Mail className="size-7" aria-hidden="true" />
            </span>
          </div>
        </div>
        <Stop {...route.to} />
      </div>

      <div className="flex min-h-36 flex-col items-center gap-6">
        {arrived && (
          <>
            <div className="paper-note animate-page-in rotate-1 px-6 pb-4 pt-6 text-center">
              <p className="font-chalk text-xl text-paper-ink">{route.arrived}</p>
              <span className="mt-2 inline-block -rotate-6 rounded-sm border-2 border-stamp px-2 font-chalk text-sm text-stamp">
                已送达 ✓
              </span>
            </div>
            <NextButton onClick={onNext}>{route.cta}</NextButton>
          </>
        )}
      </div>
    </section>
  );
}

/* ---------------- 5. 蛋糕 ---------------- */

export function CakePage() {
  const reduced = useReducedMotion();
  const stage = useRef<CakeStageHandle>(null);
  const [blown, setBlown] = useState(false);
  const [showMsg, setShowMsg] = useState(false);
  const [busy, setBusy] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const msgRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));

  const blow = () => {
    setBlown(true);
    setBusy(false);
    stage.current?.snuff();
    later(() => stage.current?.explode(), CAKE_TIMELINE.explodeAt);
    later(() => {
      setShowMsg(true);
      later(
        () =>
          msgRef.current?.scrollIntoView({
            behavior: reduced ? "auto" : "smooth",
            block: "nearest",
          }),
        60,
      );
    }, CAKE_TIMELINE.messageAt);
  };

  const replay = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setShowMsg(false);
    setBlown(false);
    setBusy(true);
    stage.current?.reset();
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    later(blow, CAKE_TIMELINE.replayBlowAt);
  };

  return (
    <section className="flex flex-col items-center gap-6">
      <ChalkTitle className="text-center">{cake.title}</ChalkTitle>

      <ParticleCakeStage
        ref={stage}
        text={cake.particleText}
        label={cake.stageLabel}
        loadingText={cake.loading}
        errorText={cake.loadError}
      />

      {!blown && !busy && (
        <button type="button" onClick={blow} className="chalk-btn chalk-btn-solid px-7 text-lg">
          {cake.cta}
        </button>
      )}
      {busy && <p className="chalk-text font-chalk text-lg opacity-80">{cake.relit}</p>}

      {showMsg && (
        <div
          ref={msgRef}
          className="flex w-full max-w-md animate-page-in flex-col items-center gap-5"
        >
          <div className="paper-note w-full -rotate-1 px-6 pb-6 pt-8 text-center">
            <p className="font-chalk text-3xl text-stamp">{cake.message[0]}</p>
            <div className="mt-4 space-y-1.5 text-base leading-relaxed text-paper-ink">
              {cake.message.slice(1).map((l) => (
                <p key={l}>{l}</p>
              ))}
            </div>
          </div>
          <p className="chalk-text px-2 text-center font-chalk text-lg leading-relaxed opacity-85">
            {cake.footnote}
          </p>
        </div>
      )}

      {showMsg && (
        <button type="button" onClick={replay} className="chalk-btn chalk-btn-quiet mt-6">
          <RotateCcw className="size-4" aria-hidden="true" />
          {cake.replay}
        </button>
      )}
    </section>
  );
}
