import { cn } from "@/lib/utils";

/** Hand-drawn chalk heart: broken outline + a second loose stroke + hatching. */
export function ChalkHeart({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 90"
      className={cn("block h-auto w-full", className)}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path
        d="M50 80 C 22 60, 8 44, 14 27 C 20 12, 41 11, 50 29 C 59 11, 80 12, 86 27 C 92 44, 78 60, 50 80 Z"
        strokeWidth="5"
        strokeDasharray="38 3 24 4 30 2 18 3"
      />
      <path d="M47 75 C 25 58, 14 45, 19 30 C 24 18, 40 18, 49 33" strokeWidth="2" opacity="0.5" />
      <path
        d="M27 38 L 43 55 M 35 31 L 56 53 M 46 34 L 66 52 M 60 28 L 74 42"
        strokeWidth="1.6"
        opacity="0.35"
      />
    </svg>
  );
}
