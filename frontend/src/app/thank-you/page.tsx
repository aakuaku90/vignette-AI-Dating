"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";

function getAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  return new Ctor();
}

function playPop(ctx: AudioContext, frequency: number, when: number, volume = 0.12) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(frequency * 1.4, when);
  osc.frequency.exponentialRampToValueAtTime(frequency, when + 0.18);
  gain.gain.setValueAtTime(0, when);
  gain.gain.linearRampToValueAtTime(volume, when + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.35);
  osc.connect(gain).connect(ctx.destination);
  osc.start(when);
  osc.stop(when + 0.4);
}

function playChord(ctx: AudioContext, freqs: number[], when: number, volume = 0.06) {
  freqs.forEach((f) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = f;
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(volume, when + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + 1.2);
    osc.connect(gain).connect(ctx.destination);
    osc.start(when);
    osc.stop(when + 1.3);
  });
}

export default function ThankYouPage() {
  const router = useRouter();

  useEffect(() => {
    const colors = ["#7c3aed", "#ec4899", "#f97316", "#3b82f6", "#a78bfa"];
    const ctx = getAudioCtx();
    const t0 = ctx?.currentTime ?? 0;
    if (ctx) {
      playPop(ctx, 660, t0 + 0.0);
      playPop(ctx, 880, t0 + 0.25);
      playPop(ctx, 990, t0 + 0.45);
      playChord(ctx, [523.25, 659.25, 783.99, 1046.5], t0 + 0.7);
    }

    const burst = (originX: number) => {
      confetti({
        particleCount: 120,
        spread: 80,
        startVelocity: 55,
        origin: { x: originX, y: 0.7 },
        colors,
        scalar: 1.1,
      });
    };

    burst(0.5);
    const t1 = setTimeout(() => burst(0.2), 250);
    const t2 = setTimeout(() => burst(0.8), 450);
    const t3 = setTimeout(
      () =>
        confetti({
          particleCount: 200,
          spread: 160,
          startVelocity: 45,
          origin: { x: 0.5, y: 0.6 },
          colors,
          scalar: 1.2,
        }),
      700
    );

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      if (ctx && ctx.state !== "closed") {
        setTimeout(() => ctx.close().catch(() => {}), 2500);
      }
    };
  }, []);

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-6 px-6 py-12 text-center">
      <div className="space-y-3 max-w-xl">
        <h1 className="text-5xl font-bold tracking-tight">Thank you!</h1>
        <p className="text-zinc-500 text-base sm:text-lg leading-relaxed">
          Your responses have been recorded. We really appreciate you taking the
          time to think through these scenarios with us.
        </p>
      </div>
      <button onClick={() => router.push("/")} className="btn-secondary">
        Back to home
      </button>
    </div>
  );
}
