import { useState } from "react";
import { RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = { no: number; front: string; back: string; className?: string };

export function FlipCard({ no, front, back, className }: Props) {
  const [flipped, setFlipped] = useState(false);
  const num = String(no).padStart(2, "0");

  return (
    <button
      type="button"
      onClick={() => setFlipped((f) => !f)}
      aria-pressed={flipped}
      aria-label={flipped ? `${front}：${back}（点击翻回）` : `${front}（点击翻面）`}
      className={cn(
        "flip-card group block w-full text-left transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-dashed focus-visible:outline-offset-4 focus-visible:outline-chalk-gold",
        className,
      )}
    >
      <div className={cn("flip-inner", flipped && "is-flipped")}>
        <div
          className="flip-face paper-note flex min-h-40 flex-col justify-between p-5 pt-7"
          aria-hidden={flipped}
        >
          <span className="font-chalk text-sm text-stamp">档案 No.{num}</span>
          <span className="font-chalk text-3xl leading-tight text-paper-ink">{front}</span>
          <span className="flex items-center gap-1 self-end text-xs text-paper-ink/60">
            <RotateCw className="size-3.5" aria-hidden="true" /> 点我翻面
          </span>
        </div>
        <div
          className="flip-face flip-back paper-note paper-alt flex min-h-40 flex-col justify-between gap-3 p-5 pt-7"
          aria-hidden={!flipped}
        >
          <span className="font-chalk text-sm text-stamp">
            No.{num} · {front}
          </span>
          <p className="text-base leading-relaxed text-paper-ink">{back}</p>
          <span className="flex items-center gap-1 self-end text-xs text-paper-ink/60">
            <RotateCw className="size-3.5" aria-hidden="true" /> 再点翻回
          </span>
        </div>
      </div>
    </button>
  );
}
