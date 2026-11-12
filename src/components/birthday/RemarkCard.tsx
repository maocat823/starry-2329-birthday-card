import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = { tag: string; summary: string; detail: string; className?: string };

export function RemarkCard({ tag, summary, detail, className }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setOpen((o) => !o)}
      aria-expanded={open}
      className={cn(
        "paper-note block w-full p-5 pt-6 text-left transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-dashed focus-visible:outline-offset-4 focus-visible:outline-chalk-gold",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="font-chalk text-xl text-stamp">{tag}</span>
          <p className="mt-1 text-base leading-relaxed text-paper-ink">{summary}</p>
        </div>
        <ChevronDown
          className={cn(
            "mt-1 size-5 shrink-0 text-paper-ink/60 transition-transform duration-300",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </div>
      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <p className="mt-3 border-t border-dashed border-paper-ink/25 pt-3 text-base leading-relaxed text-paper-ink">
            {detail}
          </p>
        </div>
      </div>
      {!open && <span className="mt-2 block text-xs text-paper-ink/55">点开看小弟怎么说</span>}
    </button>
  );
}
