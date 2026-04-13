import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SessionState {
  sessionCode: string | null;
  phase: number;
  stage: number;
  cardIndex: number;
  setSession: (code: string) => void;
  setPhase: (phase: number) => void;
  setStage: (stage: number) => void;
  setCardIndex: (idx: number) => void;
  reset: () => void;
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      sessionCode: null,
      phase: 0,
      stage: 0,
      cardIndex: 0,
      setSession: (code) => set({ sessionCode: code }),
      setPhase: (phase) => set({ phase, stage: 0, cardIndex: 0 }),
      setStage: (stage) => set({ stage, cardIndex: 0 }),
      setCardIndex: (cardIndex) => set({ cardIndex }),
      reset: () => set({ sessionCode: null, phase: 0, stage: 0, cardIndex: 0 }),
    }),
    { name: "chase-session" }
  )
);
