"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Participant, SwipeResponseData } from "@/lib/api";
import { SCENARIO_BY_CODE, SCENARIOS } from "@/lib/instrument";

interface Stats {
  total_participants: number;
  completed_participants: number;
  phase_distribution: Record<number, number>;
  stage_completion: Record<number, number>;
}

const ADMIN_SLUG = process.env.NEXT_PUBLIC_ADMIN_SLUG || "r9k4x7m2b8f1n5p3q6w0t4v8";

// Internal phase → user-facing label. "Start" is the pre-study demographics step;
// the 4 numbered phases are onboarding+warmup (1), Pass 1 (2), Pass 2 (3), Debrief (4).
const PHASE_DISPLAY: Record<number, string> = {
  0: "Start",
  1: "1",
  2: "1",
  3: "2",
  4: "3",
  5: "4",
};
const displayPhase = (p: number) => PHASE_DISPLAY[p] ?? String(p);

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [responses, setResponses] = useState<SwipeResponseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.getStats(), api.listParticipants()])
      .then(([s, p]) => {
        setStats(s);
        setParticipants(p);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not connect to backend.");
        setLoading(false);
      });
  }, []);

  const viewParticipant = async (code: string) => {
    setSelected(code);
    const r = await api.getResponses(code);
    setResponses(r);
  };

  const exportCSV = async () => {
    const data = await api.exportData();
    if (data.length === 0) return alert("No data to export.");
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(","),
      ...data.map((row) => headers.map((h) => JSON.stringify(row[h] ?? "")).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chase-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <p className="text-zinc-400">Loading dashboard...</p>
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

  const getCardText = (variantCode: string | null): string => {
    if (!variantCode) return "(no variant)";
    const [scenarioCode, variant] = variantCode.split("-");
    const scenario = SCENARIO_BY_CODE[scenarioCode];
    if (!scenario) return variantCode;
    if (variant === "base") return scenario.base;
    const pool = variant?.startsWith("R") ? scenario.right : scenario.left;
    return pool.find((v) => v.code === variantCode)?.text ?? variantCode;
  };

  return (
    <div className="min-h-[100dvh] p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Researcher Dashboard</h1>
            <p className="text-zinc-400 text-sm">Swipe to Decide · Data Overview</p>
          </div>
          <div className="flex gap-3">
            <button onClick={exportCSV} className="btn-primary">
              Export CSV
            </button>
            <a href={`/admin/${ADMIN_SLUG}/charts`} className="btn-primary inline-block">
              Charts
            </a>
            <a href="/" className="btn-secondary inline-block">
              Back
            </a>
          </div>
        </div>

        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Participants" value={stats.total_participants} />
            <StatCard label="Completed" value={stats.completed_participants} />
            <StatCard
              label="In Progress"
              value={stats.total_participants - stats.completed_participants}
            />
            <StatCard
              label="Completion Rate"
              value={
                stats.total_participants > 0
                  ? `${Math.round(
                      (stats.completed_participants / stats.total_participants) * 100
                    )}%`
                  : "-"
              }
            />
          </div>
        )}

        {/* Scenario reach (position in randomized order) */}
        {stats && Object.keys(stats.stage_completion).length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Reached Scenario (by position in order)</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {SCENARIOS.map((_, i) => (
                <StatCard
                  key={i}
                  label={`Position ${i + 1}`}
                  value={stats.stage_completion[i] || 0}
                />
              ))}
            </div>
          </div>
        )}

        {/* Participants table */}
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-zinc-200 text-zinc-400 text-left">
                <th className="p-4">Code</th>
                <th className="p-4">Age</th>
                <th className="p-4">Gender</th>
                <th className="p-4">University</th>
                <th className="p-4">State</th>
                <th className="p-4">Consent</th>
                <th className="p-4">Phase</th>
                <th className="p-4">Stage</th>
                <th className="p-4">Started</th>
                <th className="p-4">Completed</th>
                <th className="p-4">Status</th>
                <th className="p-4">Email</th>
                <th className="p-4">Phone</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {participants.map((p) => (
                <tr
                  key={p.session_code}
                  className={`border-b border-zinc-100 hover:bg-zinc-100/50 transition-colors ${
                    selected === p.session_code ? "bg-violet-50" : ""
                  }`}
                >
                  <td className="p-4 font-mono">{p.session_code}</td>
                  <td className="p-4">{p.age ?? "-"}</td>
                  <td className="p-4">{p.gender ?? "-"}</td>
                  <td className="p-4">{p.university ?? "-"}</td>
                  <td className="p-4">{p.state ?? "-"}</td>
                  <td className="p-4">
                    {p.consented ? (
                      <span className="text-green-600">Yes</span>
                    ) : (
                      <span className="text-zinc-400">No</span>
                    )}
                  </td>
                  <td className="p-4">{displayPhase(p.current_phase)}</td>
                  <td className="p-4">{p.current_stage}</td>
                  <td className="p-4" title={new Date(p.started_at).toLocaleString()}>
                    {new Date(p.started_at).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </td>
                  <td
                    className="p-4"
                    title={p.completed_at ? new Date(p.completed_at).toLocaleString() : undefined}
                  >
                    {p.completed_at
                      ? new Date(p.completed_at).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })
                      : "-"}
                  </td>
                  <td className="p-4">
                    {p.completed_at ? (
                      <span className="text-green-600">Complete</span>
                    ) : (
                      <span className="text-amber-600">In Progress</span>
                    )}
                  </td>
                  <td className="p-4">{p.email ?? "-"}</td>
                  <td className="p-4">{p.phone ?? "-"}</td>
                  <td className="p-4">
                    <button
                      onClick={() => viewParticipant(p.session_code)}
                      className="text-violet-600 hover:text-violet-500 text-xs font-medium"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {participants.length === 0 && (
                <tr>
                  <td colSpan={13} className="p-8 text-center text-zinc-400">
                    No participants yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sidebar overlay */}
      {selected && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setSelected(null)}
          />
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white border-l border-zinc-200 shadow-2xl z-50 flex flex-col animate-slide-in">
            <div className="flex items-center justify-between p-6 border-b border-zinc-100">
              <div>
                <h2 className="text-lg font-semibold">Responses</h2>
                <p className="text-sm font-mono text-violet-600">{selected}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {responses.length === 0 ? (
                <p className="text-zinc-400 text-sm">No responses recorded yet.</p>
              ) : (
                <div className="space-y-1">
                  {responses.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-start gap-3 text-sm py-2.5 border-b border-zinc-50"
                    >
                      <span
                        className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          r.swiped_right
                            ? "bg-green-50 text-green-600"
                            : "bg-red-50 text-red-500"
                        }`}
                      >
                        {r.swiped_right ? "R" : "L"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-zinc-700 text-xs leading-relaxed">
                          {getCardText(r.variant_code)}
                        </p>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-zinc-400">
                          <span>
                            {r.variant_code ?? `P${r.phase}/S${r.stage}/C${r.card_number}`}
                          </span>
                          {r.response_time_ms && (
                            <span>{(r.response_time_ms / 1000).toFixed(1)}s</span>
                          )}
                          {r.created_at && (
                            <span title={new Date(r.created_at).toLocaleString()}>
                              {new Date(r.created_at).toLocaleString(undefined, {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-zinc-400">{label}</div>
    </div>
  );
}
