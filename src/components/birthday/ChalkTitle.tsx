import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ChalkTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h1
      className={cn(
        "chalk-text font-chalk text-4xl leading-tight tracking-wide sm:text-5xl",
        className,
      )}
    >
      {children}
    </h1>
  );
}
