"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Participant, SwipeResponseData } from "@/lib/api";
import { PHASE1_CARDS, STAGES } from "@/lib/instrument";

interface Stats {
  total_participants: number;
  completed_participants: number;
  phase_distribution: Record<number, number>;
  stage_completion: Record<number, number>;
}

const ADMIN_SLUG = process.env.NEXT_PUBLIC_ADMIN_SLUG || "r9k4x7m2b8f1n5p3q6w0t4v8";

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

  const getCardText = (phase: number, stage: number, cardNumber: number): string => {
    if (phase === 1) return PHASE1_CARDS[cardNumber - 1]?.text ?? `Card ${cardNumber}`;
    if (phase === 3) {
      const s = STAGES.find((st) => st.number === stage);
      return s?.cards[cardNumber - 1]?.text ?? `Stage ${stage} Card ${cardNumber}`;
    }
    return `Card ${cardNumber}`;
  };

  return (
    <div className="min-h-[100dvh] p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Researcher Dashboard</h1>
            <p className="text-zinc-400 text-sm">The Chase · Data Overview</p>
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

        {/* Stage completion */}
        {stats && Object.keys(stats.stage_completion).length > 0 && (
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Stage Completion (Phase 3)</h2>
            <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
              {STAGES.map((s) => (
                <div key={s.number} className="text-center">
                  <div className="text-2xl font-bold">{stats.stage_completion[s.number] || 0}</div>
                  <div className="text-xs text-zinc-400">Stage {s.number}</div>
                </div>
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
                  <td className="p-4">{p.current_phase}</td>
                  <td className="p-4">{p.current_stage}</td>
                  <td className="p-4">{new Date(p.started_at).toLocaleDateString()}</td>
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
                          {getCardText(r.phase, r.stage, r.card_number)}
                        </p>
                        <div className="flex gap-3 mt-1 text-xs text-zinc-400">
                          <span>
                            P{r.phase}
                            {r.stage > 0 ? `/S${r.stage}` : ""}/C{r.card_number}
                          </span>
                          {r.response_time_ms && (
                            <span>{(r.response_time_ms / 1000).toFixed(1)}s</span>
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
