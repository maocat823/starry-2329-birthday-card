// "Happy Birthday to You" (public domain), played as a soft music box via Web Audio.
// No audio file needed; nothing plays until the user taps the music button.

const N = {
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
} as const;

type Step = [freq: number | null, beats: number];

// prettier-ignore
const SONG: [Step, ...Step[]] = [
  [N.G4, 0.75], [N.G4, 0.25], [N.A4, 1], [N.G4, 1], [N.C5, 1], [N.B4, 2],
  [N.G4, 0.75], [N.G4, 0.25], [N.A4, 1], [N.G4, 1], [N.D5, 1], [N.C5, 2],
  [N.G4, 0.75], [N.G4, 0.25], [N.G5, 1], [N.E5, 1], [N.C5, 1], [N.B4, 1], [N.A4, 2],
  [N.F5, 0.75], [N.F5, 0.25], [N.E5, 1], [N.C5, 1], [N.D5, 1], [N.C5, 3],
  [null, 3],
];

const BEAT = 0.5; // seconds per beat

export function createSongPlayer() {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let timer: ReturnType<typeof setInterval> | null = null;
  let index = 0;
  let nextTime = 0;

  const note = (freq: number, at: number, dur: number) => {
    if (!ctx || !master) return;
    const tones: [OscillatorType, number, number][] = [
      ["triangle", freq, 0.22],
      ["sine", freq * 2, 0.06],
      ["sine", freq / 2, 0.05],
    ];
    for (const [type, f, peak] of tones) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(peak, at + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + Math.max(0.35, dur * 1.1));
      osc.connect(gain).connect(master);
      osc.start(at);
      osc.stop(at + Math.max(0.4, dur * 1.2));
    }
  };

  const schedule = () => {
    if (!ctx || ctx.state !== "running") return;
    while (nextTime < ctx.currentTime + 0.5) {
      const [freq, beats] = SONG[index] ?? SONG[0];
      const dur = beats * BEAT;
      if (freq) note(freq, nextTime, dur);
      nextTime += dur;
      index = (index + 1) % SONG.length;
    }
  };

  return {
    async play() {
      if (!ctx) {
        const AC =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = 0.5;
        master.connect(ctx.destination);
        nextTime = ctx.currentTime + 0.1;
        timer = setInterval(schedule, 120);
      }
      await ctx.resume();
      if (nextTime < ctx.currentTime) nextTime = ctx.currentTime + 0.05;
      schedule();
    },
    async pause() {
      await ctx?.suspend();
    },
    dispose() {
      if (timer) clearInterval(timer);
      void ctx?.close();
      ctx = null;
      master = null;
    },
  };
}
