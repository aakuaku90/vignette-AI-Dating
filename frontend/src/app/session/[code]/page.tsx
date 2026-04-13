"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import SwipeCard from "@/components/SwipeCard";
import ComboBox from "@/components/ComboBox";
import { api } from "@/lib/api";
import { useSession } from "@/lib/store";
import {
  PHASE1_INTRO,
  PHASE1_CARDS,
  PHASE2_TEXT,
  STAGES,
  DEBRIEF_QUESTIONS,
} from "@/lib/instrument";

export default function SessionPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const { phase, stage, cardIndex, setPhase, setStage, setCardIndex, setSession } =
    useSession();
  const [showVignette, setShowVignette] = useState(true);
  const [loading, setLoading] = useState(true);

  // Demographics state
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [university, setUniversity] = useState("");
  const [usState, setUsState] = useState("");
  const [consent, setConsent] = useState(false);

  // Debrief contact state
  const [wantsDiscussion, setWantsDiscussion] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [contactSubmitted, setContactSubmitted] = useState(false);

  useEffect(() => {
    api
      .getParticipant(code)
      .then((p) => {
        setSession(code);
        setPhase(p.current_phase);
        setStage(p.current_stage);
        setLoading(false);
      })
      .catch(() => router.push("/"));
  }, [code, router, setSession, setPhase, setStage]);

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

  const handleSwipe = useCallback(
    async (right: boolean, timeMs: number) => {
      const currentStage = phase === 3 ? stage + 1 : 0;
      const currentCard = cardIndex + 1;

      await api.recordSwipe(code, {
        phase,
        stage: currentStage,
        card_number: currentCard,
        swiped_right: right,
        response_time_ms: timeMs,
      });

      const cards =
        phase === 1 ? PHASE1_CARDS : phase === 3 ? STAGES[stage].cards : [];
      if (cardIndex + 1 < cards.length) {
        setCardIndex(cardIndex + 1);
      } else {
        if (phase === 1) {
          setPhase(2);
          await api.updateProgress(code, 2, 0);
        } else if (phase === 3) {
          if (stage + 1 < STAGES.length) {
            setStage(stage + 1);
            setShowVignette(true);
            await api.updateProgress(code, 3, stage + 1);
          } else {
            setPhase(4);
            await api.updateProgress(code, 4, 0);
          }
        }
      }
    },
    [code, phase, stage, cardIndex, setPhase, setStage, setCardIndex]
  );

  const goBack = useCallback(() => {
    if (phase === 1) {
      if (!showVignette && cardIndex > 0) {
        setCardIndex(cardIndex - 1);
      } else if (!showVignette && cardIndex === 0) {
        setShowVignette(true);
      } else if (showVignette) {
        setPhase(0);
      }
      return;
    }

    if (phase === 2) {
      setPhase(1);
      setCardIndex(PHASE1_CARDS.length - 1);
      return;
    }

    if (phase === 3) {
      if (!showVignette && cardIndex > 0) {
        setCardIndex(cardIndex - 1);
      } else if (!showVignette && cardIndex === 0) {
        setShowVignette(true);
      } else if (showVignette && stage > 0) {
        setStage(stage - 1);
        setCardIndex(STAGES[stage - 1].cards.length - 1);
        setShowVignette(false);
      } else if (showVignette && stage === 0) {
        setPhase(2);
      }
      return;
    }

    if (phase === 4) {
      setPhase(3);
      setStage(STAGES.length - 1);
      setCardIndex(STAGES[STAGES.length - 1].cards.length - 1);
      setShowVignette(false);
      return;
    }
  }, [phase, stage, cardIndex, showVignette, setPhase, setStage, setCardIndex]);

  const canGoBack = phase >= 1;

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

  // Phase 1: Your Story
  if (phase === 1) {
    if (cardIndex === 0 && showVignette) {
      return (
        <Screen>
          <PhaseHeader phase={1} title="Your Story" />
          <p className="text-zinc-500 leading-relaxed max-w-2xl text-center text-base sm:text-lg">{PHASE1_INTRO}</p>
          <button onClick={() => setShowVignette(false)} className="btn-primary">
            Begin
          </button>
          <BackButton onClick={goBack} />
        </Screen>
      );
    }
    return (
      <Screen fixed>
        <SwipeCard
          key={`p1-${cardIndex}`}
          text={PHASE1_CARDS[cardIndex].text}
          cardNumber={cardIndex + 1}
          totalCards={PHASE1_CARDS.length}
          onSwipe={handleSwipe}
          onBack={canGoBack ? goBack : undefined}
        />
      </Screen>
    );
  }

  // Phase 2: The World Has Changed
  if (phase === 2) {
    return (
      <Screen>
        <PhaseHeader phase={2} title="The World Has Changed" />
        <div className="max-w-2xl text-zinc-500 leading-relaxed whitespace-pre-line text-base sm:text-lg">
          {PHASE2_TEXT}
        </div>
        <button
          onClick={async () => {
            setPhase(3);
            setStage(0);
            setShowVignette(true);
            await api.updateProgress(code, 3, 0);
          }}
          className="btn-primary"
        >
          The Chase Begins
        </button>
        <BackButton onClick={goBack} />
      </Screen>
    );
  }

  // Phase 3: The Chase (10 stages)
  if (phase === 3) {
    const currentStage = STAGES[stage];

    if (showVignette) {
      return (
        <Screen>
          <div className="text-center">
            <div className="text-sm tracking-widest text-zinc-400 uppercase mb-1">
              Stage {currentStage.number} of {STAGES.length}
            </div>
            <h2 className="text-3xl font-bold">{currentStage.title}</h2>
            <p className="text-base text-zinc-400 italic">{currentStage.subtitle}</p>
          </div>
          <p className="text-zinc-500 leading-relaxed max-w-2xl text-center text-base sm:text-lg">
            {currentStage.vignette}
          </p>
          <button onClick={() => setShowVignette(false)} className="btn-primary">
            Continue
          </button>
          <BackButton onClick={goBack} />
        </Screen>
      );
    }

    return (
      <Screen fixed>
        <SwipeCard
          key={`s${stage}-c${cardIndex}`}
          text={currentStage.cards[cardIndex].text}
          cardNumber={cardIndex + 1}
          totalCards={currentStage.cards.length}
          onSwipe={handleSwipe}
          onBack={goBack}
        />
      </Screen>
    );
  }

  // Phase 4: Debrief
  if (phase === 4) {
    return (
      <Screen>
        <PhaseHeader phase={4} title="Debrief" />
        <div className="max-w-2xl text-left space-y-5">
          <p className="text-zinc-400 text-base">
            The journey is complete. Here are some questions to reflect on.
          </p>
          <ol className="space-y-4">
            {DEBRIEF_QUESTIONS.map((q, i) => (
              <li key={i} className="text-zinc-600 text-base leading-relaxed">
                <span className="text-zinc-400 font-mono mr-2">{i + 1}.</span>
                {q}
              </li>
            ))}
          </ol>
        </div>

        {/* Discussion opt-in */}
        <div className="max-w-2xl w-full border border-zinc-200 rounded-2xl p-6 space-y-4">
          <p className="text-zinc-700 text-base font-medium">
            Would you like to discuss these questions with a researcher?
          </p>
          {!wantsDiscussion && !contactSubmitted && (
            <div className="flex gap-3">
              <button
                onClick={() => setWantsDiscussion(true)}
                className="btn-primary"
              >
                Yes, I'm interested
              </button>
              <button
                onClick={async () => {
                  await api.updateProgress(code, 5, 0);
                  router.push("/");
                }}
                className="btn-secondary"
              >
                No thanks
              </button>
            </div>
          )}
          {wantsDiscussion && !contactSubmitted && (
            <div className="space-y-3">
              <p className="text-zinc-400 text-sm">
                Leave your email and/or phone number and we will reach out to schedule a call.
              </p>
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
                  await api.updateProgress(code, 5, 0);
                  router.push("/");
                }}
                className="btn-secondary w-full"
              >
                End Session
              </button>
            </div>
          )}
        </div>
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
