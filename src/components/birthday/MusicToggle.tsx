import { useEffect, useRef, useState } from "react";
import { Music2, Pause } from "lucide-react";
import { createSongPlayer } from "@/lib/birthday-song";
import { music } from "@/content/birthday";

export function MusicToggle() {
  const player = useRef<ReturnType<typeof createSongPlayer> | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => () => player.current?.dispose(), []);

  const toggle = async () => {
    if (!player.current) player.current = createSongPlayer();
    if (playing) {
      setPlaying(false);
      await player.current.pause();
    } else {
      setPlaying(true);
      try {
        await player.current.play();
      } catch {
        setPlaying(false);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={playing}
      data-page-chrome=""
      className="chalk-chip fixed right-3 top-3 z-50 max-w-[62vw] text-left"
    >
      {playing ? (
        <Pause className="size-4 shrink-0" aria-hidden="true" />
      ) : (
        <Music2 className="size-4 shrink-0" aria-hidden="true" />
      )}
      <span>{playing ? music.on : music.off}</span>
    </button>
  );
}
