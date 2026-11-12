import { useCallback, useEffect, useRef, useState } from "react";
import { createSongPlayer } from "@/lib/birthday-song";

/**
 * Owns the single Web Audio song player. Kept in the card root so both the music chip and
 * the cake arrival can start the same song.
 */
export function useMusicPlayer() {
  const player = useRef<ReturnType<typeof createSongPlayer> | null>(null);
  const playingRef = useRef(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => () => player.current?.dispose(), []);

  const play = useCallback(async () => {
    if (playingRef.current) return;
    if (!player.current) player.current = createSongPlayer();
    playingRef.current = true;
    setPlaying(true);
    try {
      await player.current.play();
    } catch {
      playingRef.current = false;
      setPlaying(false);
    }
  }, []);

  const toggle = useCallback(async () => {
    if (playingRef.current) {
      playingRef.current = false;
      setPlaying(false);
      await player.current?.pause();
      return;
    }
    await play();
  }, [play]);

  return { playing, play, toggle };
}
