import { useEffect, useRef, useState } from "react";
import { CakePage, IntroPage, RoutePage, WishPage } from "./pages";
import { FloatingHearts } from "./FloatingHearts";
import { MusicToggle } from "./MusicToggle";
import { ParticleField } from "./ParticleField";
import { cn } from "@/lib/utils";
import { CAKE_PAGE_HEART_OPACITY } from "@/lib/hearts";

const TOTAL = 4;
const FADE_MS = 320;

export function BirthdayCard() {
  const [step, setStep] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const goTo = (n: number) => {
    setLeaving(true);
    timer.current = setTimeout(() => {
      setStep(n);
      window.scrollTo({ top: 0 });
      setLeaving(false);
    }, FADE_MS);
  };
  const next = () => goTo(Math.min(step + 1, TOTAL - 1));

  return (
    <div className="relative min-h-dvh">
      <div className="chalkboard fixed inset-0 -z-10" aria-hidden="true" />
      {step === 0 && <ParticleField />}
      <FloatingHearts
        base={step === TOTAL - 1 ? 18 : 8}
        opacity={step === TOTAL - 1 ? CAKE_PAGE_HEART_OPACITY : undefined}
      />
      <MusicToggle />

      <nav
        data-page-chrome=""
        className="fixed left-3 top-3 z-50 flex min-h-11 items-center gap-1.5"
        aria-label="页码"
      >
        {Array.from({ length: TOTAL }, (_, i) => (
          <span
            key={i}
            className={cn(
              "block h-1.5 rounded-full transition-all duration-300",
              i === step ? "w-5 bg-chalk" : "w-1.5 bg-chalk/35",
            )}
          />
        ))}
        <span className="sr-only">
          第 {step + 1} 页，共 {TOTAL} 页
        </span>
      </nav>

      <main
        className={cn(
          "relative z-10 mx-auto w-full max-w-[960px] px-5 pb-16 pt-20 transition-opacity duration-300 ease-out sm:px-8",
          leaving ? "opacity-0" : "opacity-100",
        )}
      >
        <div key={step} className="animate-page-in">
          {step === 0 && <IntroPage onNext={next} />}
          {step === 1 && <WishPage onNext={next} />}
          {step === 2 && <RoutePage onNext={next} />}
          {step === 3 && <CakePage />}
        </div>
      </main>
    </div>
  );
}
