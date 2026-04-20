"use client";

import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import type { Participant } from "@/lib/api";
import { SCENARIOS } from "@/lib/instrument";
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
  AreaChart,
  Area,
  ReferenceLine,
} from "recharts";

const ADMIN_SLUG = process.env.NEXT_PUBLIC_ADMIN_SLUG || "r9k4x7m2b8f1n5p3q6w0t4v8";

interface ExportRow {
  session_code: string;
  age: number | null;
  gender: string | null;
  university: string | null;
  state: string | null;
  warmup_w1: string | null;
  warmup_w2: string | null;
  warmup_w3: string | null;
  warmup_w4: string | null;
  scenario_order: string | null;
  phase: number;
  stage: number;
  card_number: number;
  swiped_right: boolean;
  response_time_ms: number | null;
  variant_code: string | null;
  created_at: string | null;
}

const COLORS = ["#7c3aed", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe", "#f5f3ff"];
const ACCEPT_COLOR = "#22c55e";
const REJECT_COLOR = "#ef4444";
const SCENARIO_CODES = ["A", "B", "C"] as const;

interface ParsedVariant {
  scenario: "A" | "B" | "C";
  pass: 1 | 2;
  branch: "R" | "L" | null;
  variant: 0 | 1 | 2 | 3;
}

function parseVariantCode(vc: string | null): ParsedVariant | null {
  if (!vc) return null;
  const [scen, kind] = vc.split("-");
  if (!scen || !kind) return null;
  if (!SCENARIO_CODES.includes(scen as "A" | "B" | "C")) return null;
  const scenario = scen as "A" | "B" | "C";
  if (kind === "base") return { scenario, pass: 1, branch: null, variant: 0 };
  const branch = kind[0];
  const variant = parseInt(kind.slice(1), 10);
  if ((branch !== "R" && branch !== "L") || !(variant >= 1 && variant <= 3)) return null;
  return { scenario, pass: 2, branch, variant: variant as 1 | 2 | 3 };
}

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

  const scenarioByCode = useMemo(() => {
    const m: Record<string, (typeof SCENARIOS)[number]> = {};
    SCENARIOS.forEach((s) => {
      m[s.code] = s;
    });
    return m;
  }, []);

  // ============================================
  // DEMOGRAPHICS
  // ============================================

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
    const phases = ["Start", "Phase 1", "Phase 2", "Phase 3", "Phase 4"];
    const counts = new Array(5).fill(0);
    const bucket = (internal: number) => {
      if (internal <= 0) return 0;
      if (internal <= 2) return 1;
      if (internal === 3) return 2;
      if (internal === 4) return 3;
      return 4;
    };
    participants.forEach((p) => {
      counts[bucket(p.current_phase)]++;
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

  // ============================================
  // PASS 1 BASELINE ACCEPTANCE (one swipe per scenario)
  // ============================================

  const pass1Acceptance = useMemo(() => {
    return SCENARIO_CODES.map((code) => {
      const responses = exportData.filter((r) => r.variant_code === `${code}-base`);
      const accepted = responses.filter((r) => r.swiped_right).length;
      const total = responses.length;
      const s = scenarioByCode[code];
      return {
        code,
        name: `${code} · ${s?.title ?? ""}`,
        title: s?.title ?? code,
        subtitle: s?.subtitle ?? "",
        exitFactor: s?.exitFactor ?? "",
        accepted,
        rejected: total - accepted,
        total,
        rate: total > 0 ? Math.round((accepted / total) * 100) : 0,
      };
    });
  }, [exportData, scenarioByCode]);

  // ============================================
  // PASS 2 COUNTER-PRESSURE (per scenario × branch × variant)
  // ============================================

  const pass2ByScenario = useMemo(() => {
    return SCENARIO_CODES.map((code) => {
      const s = scenarioByCode[code];
      const rightPath = [1, 2, 3].map((v) => {
        const vc = `${code}-R${v}`;
        const responses = exportData.filter((r) => r.variant_code === vc);
        const accepted = responses.filter((r) => r.swiped_right).length;
        const total = responses.length;
        return {
          variant: `R${v}`,
          label: s?.right?.[v - 1]?.text ?? vc,
          accepted,
          rejected: total - accepted,
          total,
          rate: total > 0 ? Math.round((accepted / total) * 100) : 0,
        };
      });
      const leftPath = [1, 2, 3].map((v) => {
        const vc = `${code}-L${v}`;
        const responses = exportData.filter((r) => r.variant_code === vc);
        const accepted = responses.filter((r) => r.swiped_right).length;
        const total = responses.length;
        return {
          variant: `L${v}`,
          label: s?.left?.[v - 1]?.text ?? vc,
          accepted,
          rejected: total - accepted,
          total,
          rate: total > 0 ? Math.round((accepted / total) * 100) : 0,
        };
      });
      return {
        code,
        title: s?.title ?? code,
        subtitle: s?.subtitle ?? "",
        rightPath,
        leftPath,
      };
    });
  }, [exportData, scenarioByCode]);

  // ============================================
  // FLIP POINTS — where stance changes within a scenario
  // ============================================

  const flipPoints = useMemo(() => {
    // For each (session, scenario): base direction, then 3 variant directions.
    // A "flip" is the first variant where direction differs from base.
    const sessions = new Map<string, Record<string, { base?: boolean; variants: (boolean | null)[] }>>();
    exportData.forEach((r) => {
      const parsed = parseVariantCode(r.variant_code);
      if (!parsed) return;
      const per = sessions.get(r.session_code) ?? {};
      const rec = per[parsed.scenario] ?? { variants: [null, null, null] };
      if (parsed.pass === 1) rec.base = r.swiped_right;
      else rec.variants[parsed.variant - 1] = r.swiped_right;
      per[parsed.scenario] = rec;
      sessions.set(r.session_code, per);
    });

    return SCENARIO_CODES.map((code) => {
      const s = scenarioByCode[code];
      let baseRightCount = 0;
      let baseLeftCount = 0;
      const rightFlipAt = [0, 0, 0]; // base-right participants who flipped to left at R1/R2/R3
      const leftFlipAt = [0, 0, 0]; // base-left participants who flipped to right at L1/L2/L3

      sessions.forEach((perScenario) => {
        const rec = perScenario[code];
        if (!rec || rec.base === undefined) return;
        if (rec.base) {
          baseRightCount++;
          for (let i = 0; i < 3; i++) {
            if (rec.variants[i] === false) {
              rightFlipAt[i]++;
              break;
            }
          }
        } else {
          baseLeftCount++;
          for (let i = 0; i < 3; i++) {
            if (rec.variants[i] === true) {
              leftFlipAt[i]++;
              break;
            }
          }
        }
      });

      return {
        code,
        title: s?.title ?? code,
        baseRightCount,
        baseLeftCount,
        rightFlipData: [1, 2, 3].map((v, i) => ({
          variant: `R${v}`,
          flipped: rightFlipAt[i],
          rate: baseRightCount > 0 ? Math.round((rightFlipAt[i] / baseRightCount) * 100) : 0,
        })),
        leftFlipData: [1, 2, 3].map((v, i) => ({
          variant: `L${v}`,
          flipped: leftFlipAt[i],
          rate: baseLeftCount > 0 ? Math.round((leftFlipAt[i] / baseLeftCount) * 100) : 0,
        })),
      };
    });
  }, [exportData, scenarioByCode]);

  // ============================================
  // RESPONSE TIME — Pass 1 vs Pass 2, per scenario
  // ============================================

  const responseTimes = useMemo(() => {
    const bucket = (rows: ExportRow[]) => {
      const times = rows.filter((r) => r.response_time_ms).map((r) => r.response_time_ms!);
      if (times.length === 0) return 0;
      return parseFloat((times.reduce((a, b) => a + b, 0) / times.length / 1000).toFixed(1));
    };
    return SCENARIO_CODES.map((code) => {
      const allRows = exportData.filter((r) => {
        const p = parseVariantCode(r.variant_code);
        return p?.scenario === code;
      });
      const pass1 = allRows.filter((r) => parseVariantCode(r.variant_code)?.pass === 1);
      const pass2 = allRows.filter((r) => parseVariantCode(r.variant_code)?.pass === 2);
      return {
        name: code,
        title: scenarioByCode[code]?.title ?? code,
        "Pass 1": bucket(pass1),
        "Pass 2": bucket(pass2),
      };
    });
  }, [exportData, scenarioByCode]);

  // ============================================
  // GENDER COMPARISON — acceptance per scenario by gender
  // ============================================

  const genderByScenario = useMemo(() => {
    const genders = ["Male", "Female"];
    const sessionGender: Record<string, string> = {};
    participants.forEach((p) => {
      if (p.gender && genders.includes(p.gender)) {
        sessionGender[p.session_code] = p.gender;
      }
    });
    return SCENARIO_CODES.map((code) => {
      const row: { name: string; title: string; Male: number; Female: number } = {
        name: code,
        title: scenarioByCode[code]?.title ?? code,
        Male: 0,
        Female: 0,
      };
      genders.forEach((g) => {
        const responses = exportData.filter((r) => {
          const p = parseVariantCode(r.variant_code);
          return p?.scenario === code && sessionGender[r.session_code] === g;
        });
        const accepted = responses.filter((r) => r.swiped_right).length;
        const total = responses.length;
        (row as unknown as Record<string, number>)[g] =
          total > 0 ? Math.round((accepted / total) * 100) : 0;
      });
      return row;
    });
  }, [exportData, participants, scenarioByCode]);

  // ============================================
  // WARMUP INSIGHTS
  // ============================================

  const warmupTopCounts = (field: "warmup_w1" | "warmup_w2" | "warmup_w3" | "warmup_w4", limit = 12) => {
    const counts: Record<string, number> = {};
    const seen = new Set<string>();
    exportData.forEach((r) => {
      const raw = (r[field] || "").trim();
      if (!raw || seen.has(r.session_code + "|" + field)) return;
      seen.add(r.session_code + "|" + field);
      raw
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean)
        .forEach((tok) => {
          counts[tok] = (counts[tok] || 0) + 1;
        });
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);
  };

  const warmupApps = useMemo(() => warmupTopCounts("warmup_w1", 15), [exportData]);
  const warmupFrequency = useMemo(() => warmupTopCounts("warmup_w2", 10), [exportData]);
  const warmupExit = useMemo(() => warmupTopCounts("warmup_w3", 12), [exportData]);
  const warmupReflection = useMemo(() => warmupTopCounts("warmup_w4", 12), [exportData]);

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
            <p className="text-zinc-400 text-sm">
              Swipe to Decide · Pass 1 baseline and Pass 2 counter-pressure
            </p>
          </div>
          <a href={`/admin/${ADMIN_SLUG}`} className="btn-secondary inline-block">
            Back to Dashboard
          </a>
        </div>

        {/* SECTION 1: PARTICIPANT DEMOGRAPHICS */}
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

        {/* SECTION 2: WARMUP INSIGHTS */}
        <SectionHeader
          title="Warmup Responses"
          description="Self-reported dating-app history captured before the swipe experiment (W1–W4)."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ChartCard title="W1 · Apps used (most mentioned)">
            {warmupApps.length > 0 ? (
              <ResponsiveContainer width="100%" height={Math.max(220, warmupApps.length * 22)}>
                <BarChart data={warmupApps} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={130} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#7c3aed" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState />
            )}
          </ChartCard>

          <ChartCard title="W2 · Frequency of use">
            {warmupFrequency.length > 0 ? (
              <ResponsiveContainer width="100%" height={Math.max(220, warmupFrequency.length * 22)}>
                <BarChart data={warmupFrequency} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={130} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#a78bfa" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState />
            )}
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ChartCard title="W3 · What drove them to delete">
            {warmupExit.length > 0 ? (
              <ResponsiveContainer width="100%" height={Math.max(220, warmupExit.length * 22)}>
                <BarChart data={warmupExit} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={160} />
                  <Tooltip />
                  <Bar dataKey="value" fill={REJECT_COLOR} radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState />
            )}
          </ChartCard>

          <ChartCard title="W4 · What they wish worked differently">
            {warmupReflection.length > 0 ? (
              <ResponsiveContainer width="100%" height={Math.max(220, warmupReflection.length * 22)}>
                <BarChart data={warmupReflection} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={160} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#a78bfa" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState />
            )}
          </ChartCard>
        </div>

        {/* SECTION 3: PASS 1 BASELINE */}
        <SectionHeader
          title="Pass 1 · Baseline Acceptance"
          description="One swipe per scenario (A, B, C). The initial gut reaction before counter-pressure."
        />

        <ChartCard title="Base prompt acceptance by scenario">
          {pass1Acceptance.some((r) => r.total > 0) ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={pass1Acceptance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-white border border-zinc-200 rounded-lg p-3 shadow-lg text-sm max-w-sm">
                        <p className="font-semibold text-zinc-700">{d.title}</p>
                        <p className="text-zinc-400 text-xs mb-1">{d.subtitle}</p>
                        <p className="text-zinc-500 text-xs mb-2">Exit factor: {d.exitFactor}</p>
                        <p className="text-green-600">Accepted: {d.accepted}</p>
                        <p className="text-red-500">Rejected: {d.rejected}</p>
                        <p className="text-purple-600 font-medium">Rate: {d.rate}%</p>
                      </div>
                    );
                  }}
                />
                <Legend />
                <Bar dataKey="accepted" name="Right (would use)" fill={ACCEPT_COLOR} stackId="a" />
                <Bar dataKey="rejected" name="Left (would not)" fill={REJECT_COLOR} stackId="a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState />
          )}
        </ChartCard>

        {/* SECTION 4: PASS 2 COUNTER-PRESSURE */}
        <SectionHeader
          title="Pass 2 · Counter-Pressure"
          description="Right-swipe paths add escalating friction; left-swipe paths add softening. Shown per scenario."
        />

        {pass2ByScenario.map((sc) => (
          <ChartCard key={sc.code} title={`Scenario ${sc.code} · ${sc.title}`}>
            <p className="text-xs text-zinc-400 -mt-2 mb-4">{sc.subtitle}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-zinc-600 mb-2">
                  Right-path (escalating friction)
                </p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={sc.rightPath}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                    <XAxis dataKey="variant" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="bg-white border border-zinc-200 rounded-lg p-3 shadow-lg text-sm max-w-sm">
                            <p className="font-medium text-zinc-700 mb-1">{d.label}</p>
                            <p className="text-green-600">Accepted: {d.accepted}</p>
                            <p className="text-red-500">Rejected: {d.rejected}</p>
                            <p className="text-purple-600">Rate: {d.rate}%</p>
                          </div>
                        );
                      }}
                    />
                    <ReferenceLine y={50} stroke="#a1a1aa" strokeDasharray="4 4" />
                    <Bar dataKey="rate" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-600 mb-2">
                  Left-path (softening)
                </p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={sc.leftPath}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                    <XAxis dataKey="variant" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="bg-white border border-zinc-200 rounded-lg p-3 shadow-lg text-sm max-w-sm">
                            <p className="font-medium text-zinc-700 mb-1">{d.label}</p>
                            <p className="text-green-600">Accepted: {d.accepted}</p>
                            <p className="text-red-500">Rejected: {d.rejected}</p>
                            <p className="text-purple-600">Rate: {d.rate}%</p>
                          </div>
                        );
                      }}
                    />
                    <ReferenceLine y={50} stroke="#a1a1aa" strokeDasharray="4 4" />
                    <Bar dataKey="rate" fill="#a78bfa" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </ChartCard>
        ))}

        {/* SECTION 5: FLIP POINTS */}
        <SectionHeader
          title="Flip Points"
          description="The first Pass 2 variant where a participant switched stance. Right-path flips measure how fragile initial acceptance is; left-path flips measure how softenable initial rejection is."
        />

        {flipPoints.map((fp) => (
          <ChartCard key={fp.code} title={`Scenario ${fp.code} · ${fp.title}`}>
            <p className="text-xs text-zinc-400 -mt-2 mb-4">
              Base-right: {fp.baseRightCount} · Base-left: {fp.baseLeftCount}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-zinc-600 mb-2">
                  Right → Left flips (acceptance broke)
                </p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={fp.rightFlipData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                    <XAxis dataKey="variant" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="bg-white border border-zinc-200 rounded-lg p-3 shadow-lg text-sm">
                            <p className="font-medium text-zinc-700">{d.variant}</p>
                            <p className="text-red-500">Flipped: {d.flipped}</p>
                            <p className="text-purple-600">Rate: {d.rate}%</p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="rate" fill={REJECT_COLOR} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-600 mb-2">
                  Left → Right flips (rejection softened)
                </p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={fp.leftFlipData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                    <XAxis dataKey="variant" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="bg-white border border-zinc-200 rounded-lg p-3 shadow-lg text-sm">
                            <p className="font-medium text-zinc-700">{d.variant}</p>
                            <p className="text-green-600">Flipped: {d.flipped}</p>
                            <p className="text-purple-600">Rate: {d.rate}%</p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="rate" fill={ACCEPT_COLOR} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </ChartCard>
        ))}

        {/* SECTION 6: RESPONSE TIME */}
        <SectionHeader
          title="Response Time (Hesitation)"
          description="Average time-to-swipe per scenario, split by pass. Longer times suggest internal conflict; Pass 2 is typically slower than Pass 1."
        />

        <ChartCard title="Average seconds to swipe · Pass 1 vs Pass 2">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={responseTimes}>
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
                      <p className="text-purple-600">Pass 1 avg: {d["Pass 1"]}s</p>
                      <p className="text-blue-500">Pass 2 avg: {d["Pass 2"]}s</p>
                    </div>
                  );
                }}
              />
              <Legend />
              <Bar dataKey="Pass 1" fill="#7c3aed" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Pass 2" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* SECTION 7: GENDER COMPARISON */}
        <SectionHeader
          title="Gender Comparison"
          description="Overall acceptance rate per scenario, split by participant gender."
        />

        <ChartCard title="Acceptance by scenario (Male vs Female)">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={genderByScenario}>
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
