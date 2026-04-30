"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useSession } from "@/lib/store";
import { getCompletion, clearCompletion, type CompletionRecord } from "@/lib/completion";

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] flex items-center justify-center"><div className="animate-pulse text-zinc-400">Loading...</div></div>}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { sessionCode, reset } = useSession();
  const [creating, setCreating] = useState(false);
  const [checking, setChecking] = useState(true);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [completion, setCompletion] = useState<CompletionRecord | null>(null);

  useEffect(() => {
    if (searchParams?.get("reset") === "1") {
      clearCompletion();
      reset();
    }
    setCompletion(getCompletion());
    if (!sessionCode) {
      setChecking(false);
      return;
    }
    api
      .getParticipant(sessionCode)
      .then((p) => {
        if (!p.completed_at) {
          setActiveSession(sessionCode);
        } else {
          reset();
        }
        setChecking(false);
      })
      .catch(() => {
        reset();
        setChecking(false);
      });
  }, [sessionCode, router, reset, searchParams]);

  const startNew = async () => {
    setCreating(true);
    try {
      const p = await api.createParticipant({});
      reset();
      router.push(`/session/${p.session_code}`);
    } catch {
      alert("Could not connect to server. Please try again.");
      setCreating(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <div className="animate-pulse text-zinc-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-10 px-6 py-12">
      <div className="text-center space-y-4 max-w-2xl">
        <h1 className="text-5xl font-bold tracking-tight">Dating in AI Dominated World</h1>
        <p className="text-zinc-500 text-base sm:text-lg leading-relaxed">
          AI is reshaping how people meet, match, and connect. From AI-written
          opening lines to fully arranged dates, the rules of dating are
          changing fast. This experience walks you through real scenarios from
          the new world of AI-powered dating and asks one simple question at
          each step: how does this make you feel? There are no right or wrong
          answers, just your honest reaction.
        </p>
        <p className="text-zinc-400 text-sm">
          Takes about 10 minutes. Your responses are anonymous.
        </p>
      </div>

      {activeSession ? (
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={() => router.push(`/session/${activeSession}`)}
            className="btn-primary"
          >
            Continue Where You Left Off
          </button>
          <button
            onClick={() => {
              reset();
              setActiveSession(null);
            }}
            className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            Start over instead
          </button>
        </div>
      ) : completion ? (
        <div className="flex flex-col items-center gap-3 max-w-md text-center">
          <button
            disabled
            className="btn-primary opacity-50 cursor-not-allowed"
          >
            Already Completed
          </button>
          <p className="text-zinc-500 text-sm leading-relaxed">
            Thanks! Our records show this device already participated on{" "}
            {new Date(completion.completedAt).toLocaleDateString()}. Each person
            should only take the study once.
          </p>
        </div>
      ) : (
        <button onClick={startNew} disabled={creating} className="btn-primary">
          {creating ? "Starting..." : "Get Started"}
        </button>
      )}

      <a
        href="/consent"
        className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors underline underline-offset-4"
      >
        Research Consent & Legal Information
      </a>

      <a
        href={`/admin/${process.env.NEXT_PUBLIC_ADMIN_SLUG || "r9k4x7m2b8f1n5p3q6w0t4v8"}`}
        className="fixed bottom-6 right-6 text-sm text-zinc-400 hover:text-zinc-700 border border-zinc-300 hover:border-zinc-500 rounded-full px-4 py-2 transition-colors bg-white/80 backdrop-blur-sm"
      >
        Dashboard
      </a>
    </div>
  );
}
