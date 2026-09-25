"use client";

let ctx: AudioContext | null = null;

/** Browsers only allow audio after a user gesture; call this from any click to unlock it. */
export function unlockAudio() {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
  } catch {
    // Web Audio unavailable – the popup still shows.
  }
}

/** A short two-tone chime. */
export function playChime() {
  if (!ctx || ctx.state !== "running") return;
  const start = ctx.currentTime;
  [880, 660, 880].forEach((freq, i) => {
    const osc = ctx!.createOscillator();
    const gain = ctx!.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const t = start + i * 0.22;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.25, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(gain).connect(ctx!.destination);
    osc.start(t);
    osc.stop(t + 0.21);
  });
}
