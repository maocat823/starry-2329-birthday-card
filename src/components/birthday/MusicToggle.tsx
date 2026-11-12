import { Music2, Pause } from "lucide-react";
import { music } from "@/content/birthday";

type Props = {
  playing: boolean;
  onToggle: () => void;
};

/** Small circular music control; the label lives in aria/title so the page stays clean. */
export function MusicToggle({ playing, onToggle }: Props) {
  const label = playing ? music.pause : music.play;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={playing}
      aria-label={label}
      title={label}
      data-page-chrome=""
      className="chalk-icon-btn fixed right-3 top-3 z-50"
    >
      {playing ? (
        <Pause className="size-5" aria-hidden="true" />
      ) : (
        <Music2 className="size-5" aria-hidden="true" />
      )}
    </button>
  );
}
