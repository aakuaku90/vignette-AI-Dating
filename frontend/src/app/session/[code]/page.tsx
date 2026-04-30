"use client";

import { useEffect, useState, useCallback, use, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import SwipeCard from "@/components/SwipeCard";
import ComboBox from "@/components/ComboBox";
import { api } from "@/lib/api";
import { useSession } from "@/lib/store";
import { markCompleted } from "@/lib/completion";
import {
  ONBOARDING_TEXT,
  WARMUP_QUESTIONS,
  SCENARIOS,
  SCENARIO_BY_CODE,
  TOTAL_SWIPES,
  DEBRIEF_QUESTIONS,
  type Scenario,
} from "@/lib/instrument";

type Direction = "right" | "left";

function shuffle<T>(arr: readonly T[]): T[] {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function orderStorageKey(code: string) {
  return `scenario-order-${code}`;
}
function directionsStorageKey(code: string) {
  return `scenario-directions-${code}`;
}

function loadScenarioOrder(code: string, fromServer: string | null): string[] {
  if (fromServer) {
    const parts = fromServer.split(",").filter(Boolean);
    if (parts.length === SCENARIOS.length) return parts;
  }
  if (typeof window !== "undefined") {
    const local = window.localStorage.getItem(orderStorageKey(code));
    if (local) {
      const parts = local.split(",").filter(Boolean);
      if (parts.length === SCENARIOS.length) return parts;
    }
  }
  const fresh = shuffle(SCENARIOS.map((s) => s.code));
  if (typeof window !== "undefined") {
    window.localStorage.setItem(orderStorageKey(code), fresh.join(","));
  }
  return fresh;
}

function loadDirections(code: string): Record<string, Direction> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(directionsStorageKey(code));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveDirections(code: string, directions: Record<string, Direction>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(directionsStorageKey(code), JSON.stringify(directions));
}

export default function SessionPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const { phase, stage, cardIndex, setPhase, setStage, setCardIndex, setSession } =
    useSession();
  const [loading, setLoading] = useState(true);

  // Demographics state
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [university, setUniversity] = useState("");
  const [usState, setUsState] = useState("");
  const [consent, setConsent] = useState(false);

  // Warmup state
  const [warmup, setWarmup] = useState<Record<string, string>>({ w1: "", w2: "", w3: "", w4: "" });
  const [expandedOptions, setExpandedOptions] = useState<Record<string, boolean>>({});

  // Debrief state
  const [debrief, setDebrief] = useState<Record<string, string>>({
    d1: "",
    d2: "",
    d3: "",
    d4: "",
    d5: "",
    d6: "",
  });
  const [debriefSaved, setDebriefSaved] = useState(false);
  const [savingDebrief, setSavingDebrief] = useState(false);
  const debriefDirty = useRef(false);
  const debriefTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scenario order + base-prompt directions (for branching)
  const [scenarioOrder, setScenarioOrder] = useState<string[]>([]);
  const [directions, setDirections] = useState<Record<string, Direction>>({});

  // Debrief contact state
  const [wantsDiscussion, setWantsDiscussion] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [contactSubmitted, setContactSubmitted] = useState(false);

  // Swipe responses for tailoring the debrief chip suggestions
  const [swipeHistory, setSwipeHistory] = useState<
    { variant_code: string | null; swiped_right: boolean }[]
  >([]);
  const [swipeHistoryLoaded, setSwipeHistoryLoaded] = useState(false);

  const updateDebriefField = useCallback((key: string, value: string) => {
    debriefDirty.current = true;
    setDebrief((d) => ({ ...d, [key]: value }));
  }, []);

  useEffect(() => {
    if (!debriefDirty.current) return;
    if (debriefTimer.current) clearTimeout(debriefTimer.current);
    debriefTimer.current = setTimeout(async () => {
      setSavingDebrief(true);
      try {
        await api.updateDebrief(code, {
          debrief_d1: debrief.d1 || undefined,
          debrief_d2: debrief.d2 || undefined,
          debrief_d3: debrief.d3 || undefined,
          debrief_d4: debrief.d4 || undefined,
          debrief_d5: debrief.d5 || undefined,
          debrief_d6: debrief.d6 || undefined,
        });
        setDebriefSaved(true);
      } finally {
        setSavingDebrief(false);
      }
    }, 800);
    return () => {
      if (debriefTimer.current) clearTimeout(debriefTimer.current);
    };
  }, [code, debrief]);

  useEffect(() => {
    api
      .getParticipant(code)
      .then(async (p) => {
        setSession(code);
        setPhase(p.current_phase);
        setStage(p.current_stage);
        if (p.completed_at || p.current_phase >= 5) {
          markCompleted(code);
        }
        if (p.warmup_w1) setWarmup((w) => ({ ...w, w1: p.warmup_w1 || "" }));
        if (p.warmup_w2) setWarmup((w) => ({ ...w, w2: p.warmup_w2 || "" }));
        if (p.warmup_w3) setWarmup((w) => ({ ...w, w3: p.warmup_w3 || "" }));
        if (p.warmup_w4) setWarmup((w) => ({ ...w, w4: p.warmup_w4 || "" }));
        if (p.debrief_d1) setDebrief((d) => ({ ...d, d1: p.debrief_d1 || "" }));
        if (p.debrief_d2) setDebrief((d) => ({ ...d, d2: p.debrief_d2 || "" }));
        if (p.debrief_d3) setDebrief((d) => ({ ...d, d3: p.debrief_d3 || "" }));
        if (p.debrief_d4) setDebrief((d) => ({ ...d, d4: p.debrief_d4 || "" }));
        if (p.debrief_d5) setDebrief((d) => ({ ...d, d5: p.debrief_d5 || "" }));
        if (p.debrief_d6) setDebrief((d) => ({ ...d, d6: p.debrief_d6 || "" }));
        if (p.debrief_d1 || p.debrief_d2 || p.debrief_d3 || p.debrief_d4 || p.debrief_d5 || p.debrief_d6) {
          setDebriefSaved(true);
        }
        const order = loadScenarioOrder(code, p.scenario_order);
        setScenarioOrder(order);
        setDirections(loadDirections(code));
        if (!p.scenario_order) {
          try {
            await api.updateScenarioOrder(code, order.join(","));
          } catch {
            // non-fatal
          }
        }
        setLoading(false);
      })
      .catch(() => router.push("/"));
  }, [code, router, setSession, setPhase, setStage]);

  // Pull full swipe history once we hit the debrief so chip suggestions can be tailored.
  useEffect(() => {
    if (phase !== 5) return;
    api
      .getResponses(code)
      .then((rs) => {
        setSwipeHistory(
          rs.map((r) => ({ variant_code: r.variant_code, swiped_right: r.swiped_right }))
        );
        setSwipeHistoryLoaded(true);
      })
      .catch(() => {});
  }, [phase, code]);

  const debriefHints = useMemo(() => {
    const baseDir: Record<string, "right" | "left"> = {};
    const hasFlip: Record<string, boolean> = { A: false, B: false, C: false };
    const variants: Record<string, boolean[]> = { A: [], B: [], C: [] };
    const flippedVariantCodes: Record<string, string[]> = { A: [], B: [], C: [] };
    swipeHistory.forEach(({ variant_code, swiped_right }) => {
      if (!variant_code) return;
      const [scenario, kind] = variant_code.split("-");
      if (!scenario || !["A", "B", "C"].includes(scenario)) return;
      if (kind === "base") baseDir[scenario] = swiped_right ? "right" : "left";
      else variants[scenario]?.push(swiped_right);
    });
    swipeHistory.forEach(({ variant_code, swiped_right }) => {
      if (!variant_code) return;
      const [scenario, kind] = variant_code.split("-");
      if (!scenario || !kind || kind === "base") return;
      const base = baseDir[scenario];
      if (base === undefined) return;
      if (swiped_right !== (base === "right")) {
        flippedVariantCodes[scenario]?.push(variant_code);
      }
    });
    (["A", "B", "C"] as const).forEach((s) => {
      const base = baseDir[s];
      if (base === undefined) return;
      hasFlip[s] = variants[s].some((v) => v !== (base === "right"));
    });

    const flippedDetails = (["A", "B", "C"] as const)
      .filter((s) => hasFlip[s])
      .map((s) => {
        const scenario = SCENARIO_BY_CODE[s];
        const base = baseDir[s];
        const branch = base === "right" ? scenario.right : scenario.left;
        const flippedTexts = flippedVariantCodes[s]
          .map((code) => branch.find((v) => v.code === code)?.text)
          .filter((t): t is string => Boolean(t));
        return {
          scenarioCode: s,
          scenarioTitle: scenario.title,
          baseText: scenario.base,
          baseDir: base,
          flippedTexts,
        };
      });

    return { baseDir, hasFlip, flippedDetails };
  }, [swipeHistory]);

  const submitDemographics = async () => {
    await api.updateDemographics(code, {
      age: age ? parseInt(age) : undefined,
      gender: gender || undefined,
      university: university || undefined,
      state: usState || undefined,
      consented: consent,
    });
    setPhase(1);
    await api.updateProgress(code, 1, 0);
  };

  const submitWarmup = async () => {
    await api.updateWarmup(code, {
      warmup_w1: warmup.w1 || undefined,
      warmup_w2: warmup.w2 || undefined,
      warmup_w3: warmup.w3 || undefined,
      warmup_w4: warmup.w4 || undefined,
    });
    setPhase(3);
    setStage(0);
    setCardIndex(0);
    await api.updateProgress(code, 3, 0);
  };

  // --- Swipe engine (Phase 3 = Pass 1 baseline, Phase 4 = Pass 2 counter-pressure) ---
  const currentScenario: Scenario | null = useMemo(() => {
    if ((phase !== 3 && phase !== 4) || scenarioOrder.length === 0) return null;
    const scode = scenarioOrder[stage];
    return scode ? SCENARIO_BY_CODE[scode] : null;
  }, [phase, stage, scenarioOrder]);

  const currentVariantText = useMemo(() => {
    if (!currentScenario) return "";
    if (phase === 3) return currentScenario.base;
    const dir = directions[currentScenario.code];
    const branch = dir === "right" ? currentScenario.right : currentScenario.left;
    return branch[cardIndex]?.text ?? "";
  }, [currentScenario, phase, cardIndex, directions]);

  const currentVariantCode = useMemo(() => {
    if (!currentScenario) return "";
    if (phase === 3) return `${currentScenario.code}-base`;
    const dir = directions[currentScenario.code];
    const branch = dir === "right" ? currentScenario.right : currentScenario.left;
    return branch[cardIndex]?.code ?? `${currentScenario.code}-unknown`;
  }, [currentScenario, phase, cardIndex, directions]);

  const globalSwipeNumber = useMemo(() => {
    // 1-indexed across 12 swipes: Pass 1 = 1..3, Pass 2 = 4..12
    if (phase === 3) return stage + 1;
    return 3 + stage * 3 + cardIndex + 1;
  }, [phase, stage, cardIndex]);

  const handleSwipe = useCallback(
    async (right: boolean, timeMs: number) => {
      if (!currentScenario) return;

      if (phase === 3) {
        // Pass 1: one swipe per base scenario
        await api.recordSwipe(code, {
          phase: 3,
          stage,
          card_number: 0,
          swiped_right: right,
          response_time_ms: timeMs,
          variant_code: `${currentScenario.code}-base`,
        });
        const nextDirs = {
          ...directions,
          [currentScenario.code]: (right ? "right" : "left") as Direction,
        };
        setDirections(nextDirs);
        saveDirections(code, nextDirs);

        if (stage + 1 < scenarioOrder.length) {
          setStage(stage + 1);
          await api.updateProgress(code, 3, stage + 1);
        } else {
          setPhase(4);
          setStage(0);
          setCardIndex(0);
          await api.updateProgress(code, 4, 0);
        }
        return;
      }

      if (phase === 4) {
        // Pass 2: 3 variants per scenario, branch picked in Pass 1
        const dir = directions[currentScenario.code];
        const branch = dir === "right" ? currentScenario.right : currentScenario.left;
        const variantCode = branch[cardIndex]?.code ?? `${currentScenario.code}-unknown`;
        await api.recordSwipe(code, {
          phase: 3,
          stage,
          card_number: cardIndex + 1,
          swiped_right: right,
          response_time_ms: timeMs,
          variant_code: variantCode,
        });

        if (cardIndex + 1 < 3) {
          setCardIndex(cardIndex + 1);
          return;
        }
        if (stage + 1 < scenarioOrder.length) {
          setStage(stage + 1);
          setCardIndex(0);
          await api.updateProgress(code, 4, stage + 1);
          return;
        }
        setPhase(5);
        markCompleted(code);
        await api.updateProgress(code, 5, 0);
        return;
      }
    },
    [code, phase, stage, cardIndex, currentScenario, directions, scenarioOrder, setStage, setCardIndex, setPhase]
  );

  const goBack = useCallback(() => {
    if (phase === 1) {
      setPhase(0);
      return;
    }
    if (phase === 2) {
      setPhase(1);
      return;
    }
    if (phase === 3) {
      if (stage > 0) {
        setStage(stage - 1);
      } else {
        setPhase(2);
      }
      return;
    }
    if (phase === 4) {
      if (cardIndex > 0) {
        setCardIndex(cardIndex - 1);
      } else if (stage > 0) {
        setStage(stage - 1);
        setCardIndex(2);
      } else {
        setPhase(3);
        setStage(scenarioOrder.length - 1);
      }
      return;
    }
    if (phase === 5) {
      setPhase(4);
      setStage(scenarioOrder.length - 1);
      setCardIndex(2);
      return;
    }
  }, [phase, stage, cardIndex, scenarioOrder.length, setPhase, setStage, setCardIndex]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <div className="animate-pulse text-zinc-400 text-lg">Loading...</div>
      </div>
    );
  }

  // Phase 0: Demographics
  if (phase === 0) {
    return (
      <Screen>
        <div className="text-center">
          <h1 className="text-4xl font-bold">About You</h1>
          <p className="text-zinc-400 text-base mt-2">Quick info before we begin. All fields are optional.</p>
        </div>
        <div className="w-full max-w-md space-y-4">
          <input
            type="number"
            placeholder="Age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="input-field"
          />
          <ComboBox
            placeholder="Gender"
            value={gender}
            onChange={setGender}
            options={["Male", "Female"]}
          />
          <ComboBox
            placeholder="University"
            value={university}
            onChange={setUniversity}
            options={[
              "UC Berkeley", "UCLA", "UC San Diego", "UC Davis", "UC Irvine",
              "UC Santa Barbara", "UC Santa Cruz", "UC Riverside", "UC Merced",
              "USC", "Stanford University", "Harvard University", "MIT",
              "Yale University", "Princeton University", "Columbia University",
              "University of Chicago", "Duke University", "Northwestern University",
              "NYU", "University of Michigan", "University of Pennsylvania",
              "Cornell University", "Brown University", "Georgetown University",
              "University of Virginia", "University of Texas at Austin",
              "Georgia Tech", "University of Florida", "Ohio State University",
              "Penn State University", "University of Wisconsin",
            ]}
          />
          <ComboBox
            placeholder="State"
            value={usState}
            onChange={setUsState}
            options={[
              "Alabama", "Alaska", "Arizona", "Arkansas", "California",
              "Colorado", "Connecticut", "Delaware", "Florida", "Georgia",
              "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
              "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland",
              "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri",
              "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
              "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
              "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina",
              "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
              "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming",
            ]}
          />
          <label className="flex items-start gap-3 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-zinc-300 accent-purple-600 cursor-pointer shrink-0"
            />
            <span className="text-sm text-zinc-500 leading-relaxed">
              I have read and agree to the{" "}
              <a href="/consent" target="_blank" className="text-purple-600 hover:text-purple-700 underline underline-offset-2">
                Research Consent & Legal Terms
              </a>
              , and I am at least 18 years of age.
            </span>
          </label>
          <button onClick={submitDemographics} disabled={!consent} className="btn-primary w-full">
            Continue
          </button>
        </div>
      </Screen>
    );
  }

  // Phase 1: Onboarding
  if (phase === 1) {
    return (
      <Screen>
        <PhaseHeader phase={1} title="Onboarding" />
        <p className="text-zinc-500 leading-relaxed max-w-2xl text-center text-base sm:text-lg">
          {ONBOARDING_TEXT}
        </p>
        <button
          onClick={async () => {
            setPhase(2);
            await api.updateProgress(code, 2, 0);
          }}
          className="btn-primary"
        >
          Begin
        </button>
        <BackButton onClick={goBack} />
      </Screen>
    );
  }

  // Phase 2: Warmup
  if (phase === 2) {
    return (
      <Screen>
        <PhaseHeader phase={1} title="A Few Quick Questions" />
        <p className="text-zinc-400 text-base text-center max-w-2xl">
          Before we start, tell us a bit about your own experience with dating apps. All answers are optional.
        </p>
        <div className="w-full max-w-2xl space-y-6">
          {WARMUP_QUESTIONS.map((q) => {
            const value = warmup[q.key];
            const parts = value
              .split(",")
              .map((p) => p.trim())
              .filter(Boolean);
            const toggleOption = (opt: string) => {
              const has = parts.some((p) => p.toLowerCase() === opt.toLowerCase());
              const next = has
                ? parts.filter((p) => p.toLowerCase() !== opt.toLowerCase())
                : [...parts, opt];
              setWarmup({ ...warmup, [q.key]: next.join(", ") });
            };
            const PREVIEW_COUNT = 8;
            const expanded = !!expandedOptions[q.key];
            const allOptions = q.options ?? [];
            const needsCollapse = allOptions.length > PREVIEW_COUNT;
            const selectedBeyondPreview = allOptions
              .slice(PREVIEW_COUNT)
              .filter((opt) => parts.some((p) => p.toLowerCase() === opt.toLowerCase()));
            const visibleOptions = expanded || !needsCollapse
              ? allOptions
              : [...allOptions.slice(0, PREVIEW_COUNT), ...selectedBeyondPreview];
            return (
              <div key={q.key} className="space-y-2">
                <label className="block text-zinc-700 font-medium text-base">{q.prompt}</label>
                {q.options && (
                  <div className="flex flex-wrap gap-2 items-center">
                    {visibleOptions.map((opt) => {
                      const selected = parts.some(
                        (p) => p.toLowerCase() === opt.toLowerCase()
                      );
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleOption(opt)}
                          className={`px-3 py-1.5 rounded-full text-sm border transition ${
                            selected
                              ? "bg-violet-600 border-violet-600 text-white"
                              : "bg-white border-zinc-300 text-zinc-700 hover:border-zinc-400"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                    {needsCollapse && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedOptions((prev) => ({ ...prev, [q.key]: !expanded }))
                        }
                        className="px-3 py-1.5 rounded-full text-sm border border-dashed border-zinc-300 text-zinc-600 hover:border-zinc-400 hover:text-zinc-800"
                      >
                        {expanded
                          ? "Show less"
                          : `+${allOptions.length - visibleOptions.length} more`}
                      </button>
                    )}
                  </div>
                )}
                <textarea
                  value={value}
                  onChange={(e) => setWarmup({ ...warmup, [q.key]: e.target.value })}
                  placeholder={q.options ? "Tap options above or type your own" : q.placeholder}
                  rows={3}
                  className="input-field resize-y"
                />
              </div>
            );
          })}
        </div>
        <button onClick={submitWarmup} className="btn-primary">
          Start the swipes
        </button>
        <BackButton onClick={goBack} />
      </Screen>
    );
  }

  // Phase 3 (Pass 1 Baseline) and Phase 4 (Pass 2 Counter-pressure): swipe experiment
  if ((phase === 3 || phase === 4) && currentScenario) {
    const phaseLabel = phase === 3 ? "Phase 2" : "Phase 3";
    return (
      <Screen fixed>
        <SwipeCard
          key={currentVariantCode}
          text={currentVariantText}
          cardNumber={globalSwipeNumber}
          totalCards={TOTAL_SWIPES}
          onSwipe={handleSwipe}
          onBack={goBack}
          phaseLabel={phaseLabel}
          scenarioTitle={currentScenario.title}
          scenarioSubtitle={currentScenario.subtitle}
        />
      </Screen>
    );
  }

  // Phase 5: Debrief
  const flushDebrief = async () => {
    if (debriefTimer.current) {
      clearTimeout(debriefTimer.current);
      debriefTimer.current = null;
    }
    if (!debriefDirty.current) return;
    await api.updateDebrief(code, {
      debrief_d1: debrief.d1 || undefined,
      debrief_d2: debrief.d2 || undefined,
      debrief_d3: debrief.d3 || undefined,
      debrief_d4: debrief.d4 || undefined,
      debrief_d5: debrief.d5 || undefined,
      debrief_d6: debrief.d6 || undefined,
    });
    setDebriefSaved(true);
  };

  if (phase === 5) {
    const suggestedFor = (key: string): Set<string> => {
      const { baseDir, hasFlip } = debriefHints;
      const haveSwipes = Object.keys(baseDir).length > 0;
      if (!haveSwipes) return new Set();
      const extractCode = (opt: string) => opt.match(/\(([ABC])\)/)?.[1] ?? null;
      if (key === "d1") {
        const s = new Set<string>();
        (["A", "B", "C"] as const).forEach((code) => {
          const dir = baseDir[code];
          if (!dir) return;
          const needle = dir === "right" ? "Would use" : "Would never use";
          (DEBRIEF_QUESTIONS.find((q) => q.key === "d1")?.options ?? []).forEach((opt) => {
            if (extractCode(opt) === code && opt.startsWith(needle)) s.add(opt);
          });
        });
        return s;
      }
      if (key === "d2") {
        const s = new Set<string>();
        const flippedScenarios = (["A", "B", "C"] as const).filter((c) => hasFlip[c]);
        (DEBRIEF_QUESTIONS.find((q) => q.key === "d2")?.options ?? []).forEach((opt) => {
          const code = extractCode(opt);
          if (code && flippedScenarios.includes(code as "A" | "B" | "C")) s.add(opt);
        });
        return s;
      }
      return new Set();
    };

    return (
      <Screen>
        <PhaseHeader phase={4} title="Debrief" />
        <p className="text-zinc-500 text-base text-center max-w-2xl">
          Thanks for swiping through all twelve scenarios. Here are a few closing
          questions about what you just saw. All answers are optional. You can skip
          any question, pick from the chips, or type your own.
        </p>

        <div className="w-full max-w-2xl space-y-6">
          {DEBRIEF_QUESTIONS.filter(
            (q) =>
              !(q.key === "d2" && swipeHistoryLoaded && debriefHints.flippedDetails.length === 0)
          ).map((q) => {
            const value = debrief[q.key];
            const parts = value
              .split(",")
              .map((p) => p.trim())
              .filter(Boolean);
            const toggleOption = (opt: string) => {
              const has = parts.some((p) => p.toLowerCase() === opt.toLowerCase());
              const next = has
                ? parts.filter((p) => p.toLowerCase() !== opt.toLowerCase())
                : [...parts, opt];
              updateDebriefField(q.key, next.join(", "));
            };
            const PREVIEW_COUNT = 8;
            const debriefExpandedKey = `debrief-${q.key}`;
            const expanded = !!expandedOptions[debriefExpandedKey];
            const rawOptions = q.options ?? [];
            const suggested = suggestedFor(q.key);
            const allOptions =
              suggested.size > 0
                ? [...rawOptions.filter((o) => suggested.has(o)), ...rawOptions.filter((o) => !suggested.has(o))]
                : rawOptions;
            const needsCollapse = allOptions.length > PREVIEW_COUNT;
            const selectedBeyondPreview = allOptions
              .slice(PREVIEW_COUNT)
              .filter((opt) => parts.some((p) => p.toLowerCase() === opt.toLowerCase()));
            const visibleOptions =
              expanded || !needsCollapse
                ? allOptions
                : [...allOptions.slice(0, PREVIEW_COUNT), ...selectedBeyondPreview];
            return (
              <div key={q.key} className="space-y-2">
                <label className="block text-zinc-700 font-medium text-base">
                  {q.prompt}
                </label>
                {q.key === "d2" && debriefHints.flippedDetails.length > 0 && (
                  <div className="bg-white border border-zinc-200 rounded-xl p-4 text-sm space-y-3">
                    <p className="text-zinc-500 text-xs uppercase tracking-wide">
                      Here&apos;s what you flipped on:
                    </p>
                    {debriefHints.flippedDetails.map((d) => (
                      <div key={d.scenarioCode} className="space-y-1.5">
                        <p className="text-zinc-700 font-medium">
                          Scenario {d.scenarioCode}: {d.scenarioTitle}
                        </p>
                        <div className="text-zinc-600 leading-relaxed">
                          <span className="text-zinc-400 text-xs">
                            You swiped{" "}
                            <span className={d.baseDir === "right" ? "text-green-600" : "text-red-500"}>
                              {d.baseDir}
                            </span>{" "}
                            on:
                          </span>
                          <p className="italic text-zinc-700">&ldquo;{d.baseText}&rdquo;</p>
                        </div>
                        <div className="text-zinc-600 leading-relaxed">
                          <span className="text-zinc-400 text-xs">
                            Then flipped on:
                          </span>
                          {d.flippedTexts.map((t, i) => (
                            <p key={i} className="italic text-zinc-700">&ldquo;{t}&rdquo;</p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {q.options && (
                  <div className="flex flex-wrap gap-2 items-center">
                    {visibleOptions.map((opt) => {
                      const selected = parts.some(
                        (p) => p.toLowerCase() === opt.toLowerCase()
                      );
                      const isSuggested = suggested.has(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => toggleOption(opt)}
                          title={isSuggested ? "Matches your swipes" : undefined}
                          className={`px-3 py-1.5 rounded-full text-sm border transition ${
                            selected
                              ? "bg-violet-600 border-violet-600 text-white"
                              : isSuggested
                                ? "bg-violet-50 border-violet-300 text-violet-700 hover:border-violet-500"
                                : "bg-white border-zinc-300 text-zinc-700 hover:border-zinc-400"
                          }`}
                        >
                          {isSuggested && !selected && <span className="mr-1">★</span>}
                          {opt}
                        </button>
                      );
                    })}
                    {needsCollapse && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedOptions((prev) => ({
                            ...prev,
                            [debriefExpandedKey]: !expanded,
                          }))
                        }
                        className="px-3 py-1.5 rounded-full text-sm border border-dashed border-zinc-300 text-zinc-600 hover:border-zinc-400 hover:text-zinc-800"
                      >
                        {expanded
                          ? "Show less"
                          : `+${allOptions.length - visibleOptions.length} more`}
                      </button>
                    )}
                  </div>
                )}
                <textarea
                  value={value}
                  onChange={(e) => updateDebriefField(q.key, e.target.value)}
                  placeholder={q.placeholder}
                  rows={3}
                  className="input-field resize-y"
                />
              </div>
            );
          })}

          <div className="text-sm text-zinc-400 min-h-5">
            {savingDebrief
              ? "Saving..."
              : debriefSaved
                ? <span className="text-green-600">Saved.</span>
                : "Your answers save automatically."}
          </div>
        </div>

        {/* Optional researcher chat opt-in */}
        <div className="max-w-2xl w-full bg-white border border-zinc-200 rounded-2xl p-6 space-y-4">
          <div>
            <p className="text-zinc-700 text-base font-medium">
              Want to talk this over with us?
            </p>
            <p className="text-zinc-400 text-sm mt-1">
              Optional. If you&apos;d like to chat with a researcher about your
              answers, leave a contact below.
            </p>
          </div>
          {!wantsDiscussion && !contactSubmitted && (
            <div className="flex gap-3">
              <button
                onClick={() => setWantsDiscussion(true)}
                className="btn-primary"
              >
                Yes, I&apos;m interested
              </button>
              <button
                onClick={async () => {
                  await flushDebrief();
                  await api.updateProgress(code, 5, 0);
                  router.push("/thank-you");
                }}
                className="btn-secondary"
              >
                No thanks
              </button>
            </div>
          )}
          {wantsDiscussion && !contactSubmitted && (
            <div className="space-y-3">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
              />
              <input
                type="tel"
                placeholder="Phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input-field"
              />
              <button
                onClick={async () => {
                  if (!email && !phone) return;
                  await flushDebrief();
                  await api.updateContact(code, {
                    email: email || undefined,
                    phone: phone || undefined,
                  });
                  setContactSubmitted(true);
                }}
                disabled={!email && !phone}
                className="btn-primary w-full"
              >
                Submit
              </button>
            </div>
          )}
          {contactSubmitted && (
            <div className="space-y-3">
              <p className="text-green-600 text-base">
                Thank you! A researcher will be in touch soon.
              </p>
              <button
                onClick={async () => {
                  await flushDebrief();
                  await api.updateProgress(code, 5, 0);
                  router.push("/thank-you");
                }}
                className="btn-secondary w-full"
              >
                End Session
              </button>
            </div>
          )}
        </div>

        <button
          onClick={async () => {
            await flushDebrief();
            await api.updateProgress(code, 5, 0);
            router.push("/thank-you");
          }}
          className="text-sm text-zinc-400 hover:text-zinc-600 underline underline-offset-4"
        >
          End session
        </button>
      </Screen>
    );
  }

  return null;
}

function Screen({ children, fixed = false }: { children: React.ReactNode; fixed?: boolean }) {
  return (
    <div
      className={`relative flex flex-col items-center justify-center gap-6 sm:gap-8 px-4 sm:px-6 ${
        fixed
          ? "h-[100dvh] py-4 sm:py-6"
          : "min-h-[100dvh] py-12 sm:py-16"
      }`}
    >
      {children}
    </div>
  );
}

function PhaseHeader({ phase, title }: { phase: number; title: string }) {
  return (
    <div className="text-center">
      <div className="text-sm tracking-widest text-zinc-400 uppercase mb-1">Phase {phase}</div>
      <h1 className="text-4xl font-bold">{title}</h1>
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 flex items-center gap-1.5 text-base text-zinc-400 hover:text-zinc-600 transition-colors z-50"
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
  );
}
