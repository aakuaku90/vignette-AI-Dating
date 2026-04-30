"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";

function vibrate(pattern: number | number[] = 30) {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

let audioCtx: AudioContext | null = null;
function getAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    audioCtx = new Ctor();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function playTone(frequency: number, durationMs: number, volume = 0.08) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = frequency;
  const now = ctx.currentTime;
  const dur = durationMs / 1000;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + dur);
}

interface SwipeCardProps {
  text: string;
  cardNumber: number;
  totalCards: number;
  onSwipe: (right: boolean, timeMs: number) => void;
  onBack?: () => void;
  phaseLabel?: string;
  scenarioTitle?: string;
  scenarioSubtitle?: string;
}

export default function SwipeCard({
  text,
  cardNumber,
  totalCards,
  onSwipe,
  onBack,
  phaseLabel,
  scenarioTitle,
  scenarioSubtitle,
}: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const leftOpacity = useTransform(x, [-150, -50], [1, 0]);
  const rightOpacity = useTransform(x, [50, 150], [0, 1]);
  const startTime = useRef(Date.now());
  const [exitDirection, setExitDirection] = useState<0 | 1 | -1>(0);
  const progress = cardNumber / totalCards;
  const thresholdCrossed = useRef(false);

  useEffect(() => {
    const threshold = 100;
    const unsubscribe = x.on("change", (value) => {
      const crossed = Math.abs(value) > threshold;
      if (crossed && !thresholdCrossed.current) {
        thresholdCrossed.current = true;
        vibrate(15);
        playTone(value > 0 ? 660 : 330, 60, 0.05);
      } else if (!crossed && thresholdCrossed.current) {
        thresholdCrossed.current = false;
      }
    });
    return unsubscribe;
  }, [x]);

  const commit = (right: boolean) => {
    setExitDirection(right ? 1 : -1);
    vibrate();
    playTone(right ? 880 : 220, 140, 0.09);
    const elapsed = Date.now() - startTime.current;
    setTimeout(() => onSwipe(right, elapsed), 200);
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const threshold = 100;
    if (Math.abs(info.offset.x) > threshold) {
      commit(info.offset.x > 0);
    }
  };

  const handleButton = (right: boolean) => {
    commit(right);
  };

  return (
    <div className="w-full flex-1 max-w-2xl mx-auto flex flex-col">
      <div className="relative w-full flex-1">
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
          style={{ x, rotate }}
          animate={exitDirection !== 0 ? { x: exitDirection * 600, opacity: 0 } : {}}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
        >
          <div
            className="relative w-full h-full rounded-2xl p-6 sm:p-10 flex flex-col items-center justify-center overflow-hidden"
            style={{
              background: "#f3f0ff",
            }}
          >
            {/* Multi-color border progress */}
            <svg
              className="absolute inset-[-2px] pointer-events-none z-10"
              style={{ width: "calc(100% + 4px)", height: "calc(100% + 4px)" }}
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Track */}
              <rect
                x="2"
                y="2"
                width="calc(100% - 4px)"
                height="calc(100% - 4px)"
                rx="16"
                ry="16"
                fill="none"
                stroke="#e4e4e7"
                strokeWidth="3"
              />
              {/* Progress: top = purple, right = pink, bottom = orange, left = blue */}
              <rect
                x="2"
                y="2"
                width="calc(100% - 4px)"
                height="calc(100% - 4px)"
                rx="16"
                ry="16"
                fill="none"
                stroke="url(#borderColors)"
                strokeWidth="5"
                strokeLinecap="round"
                pathLength="1"
                strokeDasharray="1"
                strokeDashoffset={1 - progress}
                className="transition-all duration-500 ease-out"
              />
              <defs>
                <linearGradient id="borderColors" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="25%" stopColor="#ec4899" />
                  <stop offset="50%" stopColor="#f97316" />
                  <stop offset="75%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
            </svg>

            {/* Noise texture overlay */}
            <svg className="absolute inset-0 w-full h-full opacity-[0.35] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              <filter id="noise">
                <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
                <feColorMatrix type="saturate" values="0" />
              </filter>
              <rect width="100%" height="100%" filter="url(#noise)" />
            </svg>

            {/* Swipe indicators */}
            <motion.div
              style={{ opacity: leftOpacity }}
              className="absolute top-12 right-4 text-red-500 font-bold text-xl border-2 border-red-500 rounded-lg px-3 py-1 -rotate-12 z-10"
            >
              NOPE
            </motion.div>
            <motion.div
              style={{ opacity: rightOpacity }}
              className="absolute top-12 left-4 text-green-500 font-bold text-xl border-2 border-green-500 rounded-lg px-3 py-1 rotate-12 z-10"
            >
              YES
            </motion.div>

            {/* Phase label (top of card) */}
            {phaseLabel && (
              <div className="absolute top-5 left-0 right-0 text-center text-xs tracking-widest text-zinc-400 uppercase z-10">
                {phaseLabel}
              </div>
            )}

            {/* Card text */}
            <p className="text-xl sm:text-2xl text-center leading-relaxed px-2 relative z-10 text-zinc-700">
              {text}
            </p>

            {/* Instruction */}
            <div className="absolute bottom-24 left-0 right-0 text-center text-xs sm:text-sm text-zinc-500 px-4 z-10">
              <span className="text-red-500 font-medium">Swipe left</span>
              {" / tap ✕ if you "}
              <span className="font-medium">would not</span>
              {" use this · "}
              <span className="text-green-600 font-medium">Swipe right</span>
              {" / tap ✓ if you "}
              <span className="font-medium">would</span>
            </div>

            {/* Buttons */}
            <div className="absolute bottom-5 left-0 right-0 flex items-center justify-center gap-8 z-10">
              <button
                onClick={() => handleButton(false)}
                className="w-14 h-14 rounded-full bg-red-50/80 border-2 border-red-400 text-red-500 text-xl font-bold hover:bg-red-100 transition-colors flex items-center justify-center backdrop-blur-sm"
              >
                ✕
              </button>
              <button
                onClick={() => handleButton(true)}
                className="w-14 h-14 rounded-full bg-green-50/80 border-2 border-green-400 text-green-600 text-xl font-bold hover:bg-green-100 transition-colors flex items-center justify-center backdrop-blur-sm"
              >
                ✓
              </button>
            </div>

            {/* Back button */}
            {onBack && (
              <button
                onClick={onBack}
                className="absolute bottom-6 right-4 flex items-center gap-1 text-base text-zinc-500 hover:text-zinc-700 transition-colors z-10"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
