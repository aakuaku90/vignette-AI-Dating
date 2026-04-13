"use client";

import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import type { Participant } from "@/lib/api";
import { PHASE1_CARDS, STAGES } from "@/lib/instrument";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  AreaChart,
  Area,
  ReferenceLine,
} from "recharts";

interface ExportRow {
  session_code: string;
  age: number | null;
  gender: string | null;
  university: string | null;
  state: string | null;
  phase: number;
  stage: number;
  card_number: number;
  swiped_right: boolean;
  response_time_ms: number | null;
  created_at: string | null;
}

const COLORS = ["#7c3aed", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe", "#f5f3ff"];
const ACCEPT_COLOR = "#22c55e";
const REJECT_COLOR = "#ef4444";

export default function ChartsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [exportData, setExportData] = useState<ExportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.listParticipants(), api.exportData()])
      .then(([p, e]) => {
        setParticipants(p);
        setExportData(e as unknown as ExportRow[]);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not connect to backend.");
        setLoading(false);
      });
  }, []);

  // =============================================
  // DEMOGRAPHICS
  // =============================================

  const genderData = useMemo(() => {
    const counts: Record<string, number> = {};
    participants.forEach((p) => {
      const g = p.gender || "Not specified";
      counts[g] = (counts[g] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [participants]);

  const universityData = useMemo(() => {
    const counts: Record<string, number> = {};
    participants.forEach((p) => {
      const u = p.university || "Not specified";
      counts[u] = (counts[u] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [participants]);

  const stateData = useMemo(() => {
    const counts: Record<string, number> = {};
    participants.forEach((p) => {
      const s = p.state || "Not specified";
      counts[s] = (counts[s] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [participants]);

  const phaseDistribution = useMemo(() => {
    const phases = ["Phase 0", "Phase 1", "Phase 2", "Phase 3", "Phase 4", "Complete"];
    const counts = new Array(6).fill(0);
    participants.forEach((p) => {
      const idx = Math.min(p.current_phase, 5);
      counts[idx]++;
    });
    return phases.map((name, i) => ({ name, count: counts[i] }));
  }, [participants]);

  const dailySignups = useMemo(() => {
    const counts: Record<string, number> = {};
    participants.forEach((p) => {
      const day = new Date(p.started_at).toLocaleDateString();
      counts[day] = (counts[day] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [participants]);

  // =============================================
  // PHASE 1: DATING HISTORY BASELINE
  // =============================================

  const phase1Acceptance = useMemo(() => {
    return PHASE1_CARDS.map((card, i) => {
      const responses = exportData.filter((r) => r.phase === 1 && r.card_number === i + 1);
      const accepted = responses.filter((r) => r.swiped_right).length;
      const total = responses.length;
      return {
        name: `C${i + 1}`,
        fullText: card.text,
        accepted,
        rejected: total - accepted,
        rate: total > 0 ? Math.round((accepted / total) * 100) : 0,
      };
    });
  }, [exportData]);

  // =============================================
  // PHASE 3: AI COMFORT TRAJECTORY
  // =============================================

  // Overall acceptance rate per stage (the key research metric)
  const aiComfortTrajectory = useMemo(() => {
    return STAGES.map((stage) => {
      const responses = exportData.filter((r) => r.phase === 3 && r.stage === stage.number);
      const accepted = responses.filter((r) => r.swiped_right).length;
      const total = responses.length;
      return {
        name: `S${stage.number}`,
        title: stage.title,
        subtitle: stage.subtitle,
        rate: total > 0 ? Math.round((accepted / total) * 100) : 0,
        accepted,
        rejected: total - accepted,
        total,
      };
    });
  }, [exportData]);

  // Per-stage card breakdowns
  const stageCardBreakdowns = useMemo(() => {
    return STAGES.map((stage) => {
      const cards = stage.cards.map((card, i) => {
        const responses = exportData.filter(
          (r) => r.phase === 3 && r.stage === stage.number && r.card_number === i + 1
        );
        const accepted = responses.filter((r) => r.swiped_right).length;
        const total = responses.length;
        return {
          name: `C${i + 1}`,
          fullText: card.text,
          accepted,
          rejected: total - accepted,
          rate: total > 0 ? Math.round((accepted / total) * 100) : 0,
        };
      });
      return { stage, cards };
    });
  }, [exportData]);

  // =============================================
  // RESEARCH INSIGHTS: COMFORT vs TRUST vs WILLINGNESS
  // =============================================

  // Card 8 in each stage is always the "willingness" question
  // Cards about trust, comfort, and discomfort are tracked separately
  const willingnessTrajectory = useMemo(() => {
    return STAGES.map((stage) => {
      // Card 8 = willingness to use/participate
      const card8 = exportData.filter(
        (r) => r.phase === 3 && r.stage === stage.number && r.card_number === 8
      );
      const accepted8 = card8.filter((r) => r.swiped_right).length;
      const total8 = card8.length;

      // Cards that express discomfort/concern (typically odd-numbered negative cards)
      // Varies per stage, but generally cards with "uncomfortable", "intrusive", etc.
      const allCards = exportData.filter(
        (r) => r.phase === 3 && r.stage === stage.number
      );
      const allAccepted = allCards.filter((r) => r.swiped_right).length;
      const allTotal = allCards.length;

      return {
        name: `S${stage.number}`,
        title: stage.title,
        willingness: total8 > 0 ? Math.round((accepted8 / total8) * 100) : 0,
        overall: allTotal > 0 ? Math.round((allAccepted / allTotal) * 100) : 0,
      };
    });
  }, [exportData]);

  // =============================================
  // RESPONSE TIME ANALYSIS (Hesitation = Uncertainty)
  // =============================================

  const responseTimeByStage = useMemo(() => {
    return STAGES.map((stage) => {
      const times = exportData
        .filter((r) => r.phase === 3 && r.stage === stage.number && r.response_time_ms)
        .map((r) => r.response_time_ms!);
      const avg = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length / 1000 : 0;

      // Split by accept vs reject
      const acceptTimes = exportData
        .filter((r) => r.phase === 3 && r.stage === stage.number && r.response_time_ms && r.swiped_right)
        .map((r) => r.response_time_ms!);
      const rejectTimes = exportData
        .filter((r) => r.phase === 3 && r.stage === stage.number && r.response_time_ms && !r.swiped_right)
        .map((r) => r.response_time_ms!);

      const avgAccept = acceptTimes.length > 0 ? acceptTimes.reduce((a, b) => a + b, 0) / acceptTimes.length / 1000 : 0;
      const avgReject = rejectTimes.length > 0 ? rejectTimes.reduce((a, b) => a + b, 0) / rejectTimes.length / 1000 : 0;

      return {
        name: `S${stage.number}`,
        title: stage.title,
        avg: parseFloat(avg.toFixed(1)),
        acceptTime: parseFloat(avgAccept.toFixed(1)),
        rejectTime: parseFloat(avgReject.toFixed(1)),
      };
    });
  }, [exportData]);

  // =============================================
  // GENDER COMPARISON
  // =============================================

  const genderByStage = useMemo(() => {
    const genders = ["Male", "Female"];
    const sessionGender: Record<string, string> = {};
    participants.forEach((p) => {
      if (p.gender && genders.includes(p.gender)) {
        sessionGender[p.session_code] = p.gender;
      }
    });

    return STAGES.map((stage) => {
      const result: Record<string, number> = { name: 0 };
      genders.forEach((g) => {
        const responses = exportData.filter(
          (r) => r.phase === 3 && r.stage === stage.number && sessionGender[r.session_code] === g
        );
        const accepted = responses.filter((r) => r.swiped_right).length;
        const total = responses.length;
        result[g] = total > 0 ? Math.round((accepted / total) * 100) : 0;
      });
      return {
        name: `S${stage.number}`,
        title: stage.title,
        Male: result["Male"] || 0,
        Female: result["Female"] || 0,
      };
    });
  }, [exportData, participants]);

  // =============================================
  // DROPOUT ANALYSIS
  // =============================================

  const dropoffData = useMemo(() => {
    const stages = STAGES.map((stage) => {
      const uniqueParticipants = new Set(
        exportData.filter((r) => r.phase === 3 && r.stage === stage.number).map((r) => r.session_code)
      );
      return {
        name: `S${stage.number}`,
        title: stage.title,
        participants: uniqueParticipants.size,
      };
    });
    return stages;
  }, [exportData]);

  // =============================================
  // RADAR: STAGE COMFORT DIMENSIONS
  // =============================================

  const radarData = useMemo(() => {
    return STAGES.map((stage) => {
      const responses = exportData.filter((r) => r.phase === 3 && r.stage === stage.number);
      const accepted = responses.filter((r) => r.swiped_right).length;
      const total = responses.length;
      return {
        subject: stage.title.length > 20 ? stage.title.slice(0, 18) + "..." : stage.title,
        acceptance: total > 0 ? Math.round((accepted / total) * 100) : 0,
      };
    });
  }, [exportData]);

  // =============================================
  // PHASE 1 → PHASE 3 CORRELATION
  // =============================================

  const baselineCorrelation = useMemo(() => {
    // For each participant, compute Phase 1 acceptance rate and Phase 3 acceptance rate
    const sessionCodes = new Set(exportData.map((r) => r.session_code));
    const points: { p1Rate: number; p3Rate: number; code: string }[] = [];

    sessionCodes.forEach((code) => {
      const p1 = exportData.filter((r) => r.session_code === code && r.phase === 1);
      const p3 = exportData.filter((r) => r.session_code === code && r.phase === 3);
      if (p1.length === 0 || p3.length === 0) return;

      const p1Accept = p1.filter((r) => r.swiped_right).length;
      const p3Accept = p3.filter((r) => r.swiped_right).length;

      points.push({
        code,
        p1Rate: Math.round((p1Accept / p1.length) * 100),
        p3Rate: Math.round((p3Accept / p3.length) * 100),
      });
    });

    // Bucket by Phase 1 rate for visualization
    const buckets: Record<string, { total: number; sum: number }> = {
      "0-20%": { total: 0, sum: 0 },
      "21-40%": { total: 0, sum: 0 },
      "41-60%": { total: 0, sum: 0 },
      "61-80%": { total: 0, sum: 0 },
      "81-100%": { total: 0, sum: 0 },
    };
    points.forEach(({ p1Rate, p3Rate }) => {
      const bucket =
        p1Rate <= 20 ? "0-20%" :
        p1Rate <= 40 ? "21-40%" :
        p1Rate <= 60 ? "41-60%" :
        p1Rate <= 80 ? "61-80%" : "81-100%";
      buckets[bucket].total++;
      buckets[bucket].sum += p3Rate;
    });

    return Object.entries(buckets).map(([name, { total, sum }]) => ({
      name,
      avgP3Rate: total > 0 ? Math.round(sum / total) : 0,
      count: total,
    }));
  }, [exportData]);

  // =============================================
  // KEY THRESHOLD CARDS
  // =============================================

  const thresholdCards = useMemo(() => {
    // Cards that represent key ethical/comfort boundaries
    const keyCards = [
      { stage: 1, card: 3, label: "Comfort with unseen AI profile" },
      { stage: 2, card: 3, label: "Safety without seeing photo" },
      { stage: 4, card: 3, label: "Comfort with AI clone of self" },
      { stage: 6, card: 4, label: "OK with secret AI coaching" },
      { stage: 7, card: 2, label: "OK with AI impersonation" },
      { stage: 7, card: 4, label: "AI acting = autonomy violation" },
      { stage: 8, card: 6, label: "Discomfort: data as training" },
      { stage: 10, card: 5, label: "Platforms must disclose AI" },
    ];

    return keyCards.map(({ stage, card, label }) => {
      const responses = exportData.filter(
        (r) => r.phase === 3 && r.stage === stage && r.card_number === card
      );
      const accepted = responses.filter((r) => r.swiped_right).length;
      const total = responses.length;
      return {
        label,
        stage: `S${stage}`,
        rate: total > 0 ? Math.round((accepted / total) * 100) : 0,
        total,
      };
    });
  }, [exportData]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <p className="text-zinc-400">Loading charts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] p-8">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Charts & Analytics</h1>
            <p className="text-zinc-400 text-sm">The Chase · Research Analysis</p>
          </div>
          <a href="/admin" className="btn-secondary inline-block">
            Back to Dashboard
          </a>
        </div>

        {/* ============================================ */}
        {/* SECTION 1: PARTICIPANT DEMOGRAPHICS */}
        {/* ============================================ */}
        <SectionHeader
          title="Participant Demographics"
          description="Who participated in the study."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ChartCard title="Gender Distribution">
            {genderData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name} (${value})`}
                  >
                    {genderData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState />
            )}
          </ChartCard>

          <ChartCard title="Current Phase Distribution">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={phaseDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#7c3aed" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ChartCard title="Top Universities">
            {universityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={universityData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#a78bfa" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState />
            )}
          </ChartCard>

          <ChartCard title="Top States">
            {stateData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stateData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#7c3aed" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState />
            )}
          </ChartCard>
        </div>

        <ChartCard title="Daily Signups">
          {dailySignups.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={dailySignups}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#7c3aed" fill="#ede9fe" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState />
          )}
        </ChartCard>

        {/* ============================================ */}
        {/* SECTION 2: DATING HISTORY BASELINE (PHASE 1) */}
        {/* ============================================ */}
        <SectionHeader
          title="Phase 1: Dating History Baseline"
          description="Participants' existing relationship with dating apps before AI exposure. This establishes the baseline frustration, openness, and prior experience."
        />

        <ChartCard title="Phase 1 Card Responses: Accept vs Reject">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={phase1Acceptance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-white border border-zinc-200 rounded-lg p-3 shadow-lg text-sm max-w-sm">
                      <p className="font-medium text-zinc-700 mb-1">{d.fullText}</p>
                      <p className="text-green-600">Agreed: {d.accepted}</p>
                      <p className="text-red-500">Disagreed: {d.rejected}</p>
                      <p className="text-zinc-400">Agreement: {d.rate}%</p>
                    </div>
                  );
                }}
              />
              <Legend />
              <Bar dataKey="accepted" name="Agreed" fill={ACCEPT_COLOR} stackId="a" />
              <Bar dataKey="rejected" name="Disagreed" fill={REJECT_COLOR} stackId="a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* ============================================ */}
        {/* SECTION 3: AI COMFORT TRAJECTORY (PHASE 3) */}
        {/* ============================================ */}
        <SectionHeader
          title="Phase 3: AI Comfort Trajectory"
          description="How acceptance changes as AI involvement escalates from voice profiling (S1) to AI impersonation detection (S10). The central research question."
        />

        <ChartCard title="Acceptance Rate Across Escalating AI Involvement">
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={aiComfortTrajectory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-white border border-zinc-200 rounded-lg p-3 shadow-lg text-sm">
                      <p className="font-semibold text-zinc-700">{d.title}</p>
                      <p className="text-zinc-400 text-xs mb-1">{d.subtitle}</p>
                      <p className="text-purple-600 font-medium">{d.rate}% acceptance</p>
                      <p className="text-zinc-400">{d.accepted} / {d.total} responses</p>
                    </div>
                  );
                }}
              />
              <ReferenceLine y={50} stroke="#a1a1aa" strokeDasharray="4 4" label={{ value: "50%", position: "right", fontSize: 11, fill: "#a1a1aa" }} />
              <Area type="monotone" dataKey="rate" stroke="#7c3aed" fill="#ede9fe" strokeWidth={2.5} dot={{ fill: "#7c3aed", r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Willingness to Use (Card 8) vs Overall Acceptance Per Stage">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={willingnessTrajectory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-white border border-zinc-200 rounded-lg p-3 shadow-lg text-sm">
                      <p className="font-semibold text-zinc-700">{d.title}</p>
                      <p className="text-purple-600">Willingness (C8): {d.willingness}%</p>
                      <p className="text-blue-500">Overall acceptance: {d.overall}%</p>
                    </div>
                  );
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="willingness" name="Willingness (Card 8)" stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 5 }} />
              <Line type="monotone" dataKey="overall" name="Overall Acceptance" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ChartCard title="Stage Acceptance: Accept vs Reject Volume">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={aiComfortTrajectory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-white border border-zinc-200 rounded-lg p-3 shadow-lg text-sm">
                        <p className="font-semibold text-zinc-700">{d.title}</p>
                        <p className="text-green-600">Accepted: {d.accepted}</p>
                        <p className="text-red-500">Rejected: {d.rejected}</p>
                      </div>
                    );
                  }}
                />
                <Legend />
                <Bar dataKey="accepted" name="Accepted" fill={ACCEPT_COLOR} stackId="a" />
                <Bar dataKey="rejected" name="Rejected" fill={REJECT_COLOR} stackId="a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="AI Comfort Radar">
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e4e4e7" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar name="Acceptance %" dataKey="acceptance" stroke="#7c3aed" fill="#ede9fe" fillOpacity={0.5} />
              </RadarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* ============================================ */}
        {/* SECTION 4: KEY ETHICAL THRESHOLD CARDS */}
        {/* ============================================ */}
        <SectionHeader
          title="Ethical Threshold Analysis"
          description="Specific cards that probe key ethical boundaries: consent, transparency, autonomy, and comfort with AI deception."
        />

        <ChartCard title="Key Boundary Cards: Agreement Rate">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={thresholdCards} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
              <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={200} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-white border border-zinc-200 rounded-lg p-3 shadow-lg text-sm">
                      <p className="font-medium text-zinc-700">{d.label}</p>
                      <p className="text-zinc-400">{d.stage}</p>
                      <p className="text-purple-600 font-medium">{d.rate}% agreed</p>
                      <p className="text-zinc-400">{d.total} responses</p>
                    </div>
                  );
                }}
              />
              <ReferenceLine x={50} stroke="#a1a1aa" strokeDasharray="4 4" />
              <Bar dataKey="rate" fill="#7c3aed" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* ============================================ */}
        {/* SECTION 5: HESITATION ANALYSIS */}
        {/* ============================================ */}
        <SectionHeader
          title="Hesitation Analysis"
          description="Response time as a proxy for uncertainty. Longer response times suggest greater internal conflict. Compared between accept and reject decisions."
        />

        <ChartCard title="Avg Response Time: Accept vs Reject (seconds)">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={responseTimeByStage}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} unit="s" />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-white border border-zinc-200 rounded-lg p-3 shadow-lg text-sm">
                      <p className="font-semibold text-zinc-700">{d.title}</p>
                      <p className="text-green-600">Accept avg: {d.acceptTime}s</p>
                      <p className="text-red-500">Reject avg: {d.rejectTime}s</p>
                      <p className="text-zinc-400">Overall avg: {d.avg}s</p>
                    </div>
                  );
                }}
              />
              <Legend />
              <Bar dataKey="acceptTime" name="Accept Avg" fill={ACCEPT_COLOR} radius={[6, 6, 0, 0]} />
              <Bar dataKey="rejectTime" name="Reject Avg" fill={REJECT_COLOR} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* ============================================ */}
        {/* SECTION 6: GENDER COMPARISON */}
        {/* ============================================ */}
        <SectionHeader
          title="Gender Comparison"
          description="How acceptance rates differ between male and female participants across escalating AI involvement."
        />

        <ChartCard title="Acceptance Rate by Gender Across Stages">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={genderByStage}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-white border border-zinc-200 rounded-lg p-3 shadow-lg text-sm">
                      <p className="font-semibold text-zinc-700">{d.title}</p>
                      <p className="text-purple-600">Male: {d.Male}%</p>
                      <p className="text-pink-500">Female: {d.Female}%</p>
                    </div>
                  );
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="Male" stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="Female" stroke="#ec4899" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* ============================================ */}
        {/* SECTION 7: BASELINE CORRELATION */}
        {/* ============================================ */}
        <SectionHeader
          title="Baseline → AI Acceptance Correlation"
          description="Does a participant's existing dating frustration (Phase 1) predict their openness to AI involvement (Phase 3)?"
        />

        <ChartCard title="Phase 1 Agreement Rate vs Phase 3 Avg Acceptance">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={baselineCorrelation}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} label={{ value: "Phase 1 Agreement Rate", position: "bottom", offset: -5, fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" label={{ value: "Avg Phase 3 Acceptance", angle: -90, position: "insideLeft", fontSize: 11 }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-white border border-zinc-200 rounded-lg p-3 shadow-lg text-sm">
                      <p className="font-medium text-zinc-700">P1 Rate: {d.name}</p>
                      <p className="text-purple-600">Avg P3 Acceptance: {d.avgP3Rate}%</p>
                      <p className="text-zinc-400">{d.count} participants</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="avgP3Rate" fill="#7c3aed" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* ============================================ */}
        {/* SECTION 8: PARTICIPANT RETENTION */}
        {/* ============================================ */}
        <SectionHeader
          title="Participant Retention"
          description="Dropoff across stages. Where participants stop engaging may indicate where AI involvement becomes unacceptable."
        />

        <ChartCard title="Unique Participants Per Stage">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dropoffData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-white border border-zinc-200 rounded-lg p-3 shadow-lg text-sm">
                      <p className="font-semibold text-zinc-700">{d.title}</p>
                      <p className="text-purple-600">{d.participants} participants</p>
                    </div>
                  );
                }}
              />
              <Area type="monotone" dataKey="participants" stroke="#ef4444" fill="#fde2e2" strokeWidth={2} dot={{ fill: "#ef4444", r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* ============================================ */}
        {/* SECTION 9: PER-STAGE CARD BREAKDOWN */}
        {/* ============================================ */}
        <SectionHeader
          title="Per-Stage Card Breakdown"
          description="Detailed accept/reject for every card in each stage. Hover for the full card text."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stageCardBreakdowns.map(({ stage, cards }) => (
            <ChartCard key={stage.number} title={`Stage ${stage.number} · ${stage.title}`}>
              <p className="text-xs text-zinc-400 -mt-2 mb-3">{stage.subtitle}</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={cards}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-white border border-zinc-200 rounded-lg p-3 shadow-lg text-sm max-w-sm">
                          <p className="font-medium text-zinc-700 mb-1">{d.fullText}</p>
                          <p className="text-green-600">Accepted: {d.accepted}</p>
                          <p className="text-red-500">Rejected: {d.rejected}</p>
                          <p className="text-zinc-400">Rate: {d.rate}%</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="accepted" name="Accepted" fill={ACCEPT_COLOR} stackId="a" />
                  <Bar dataKey="rejected" name="Rejected" fill={REJECT_COLOR} stackId="a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-1 pt-4 border-t border-zinc-200">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="text-zinc-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-6">
      <h2 className="text-base font-semibold mb-4">{title}</h2>
      {children}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="h-[250px] flex items-center justify-center text-zinc-400 text-sm">
      No data yet.
    </div>
  );
}
