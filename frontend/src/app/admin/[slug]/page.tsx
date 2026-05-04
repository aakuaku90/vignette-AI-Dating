"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Participant, SwipeResponseData } from "@/lib/api";
import { SCENARIO_BY_CODE, SCENARIOS, WARMUP_QUESTIONS, DEBRIEF_QUESTIONS } from "@/lib/instrument";

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
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const toggleChecked = (code: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const toggleAll = () => {
    setChecked((prev) =>
      prev.size === participants.length ? new Set() : new Set(participants.map((p) => p.session_code))
    );
  };

  const deleteSelected = async () => {
    const codes = Array.from(checked);
    if (codes.length === 0) return;
    setDeleting(true);
    try {
      await api.deleteParticipants(codes);
      const [s, p] = await Promise.all([api.getStats(), api.listParticipants()]);
      setStats(s);
      setParticipants(p);
      setChecked(new Set());
      if (selected && codes.includes(selected)) setSelected(null);
      setConfirmOpen(false);
    } catch {
      alert("Delete failed. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

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
    const blob = await api.exportCSV();
    if (blob.size === 0) return alert("No data to export.");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `swipe-to-decide-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCodebook = async () => {
    const blob = await api.exportCodebook();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `swipe-to-decide-codebook-${new Date().toISOString().slice(0, 10)}.csv`;
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
            {checked.size > 0 && (
              <button
                onClick={() => setConfirmOpen(true)}
                disabled={deleting}
                className="btn-primary"
                style={{ background: "linear-gradient(135deg, #dc2626, #f87171)" }}
              >
                {deleting ? "Deleting..." : `Delete selected (${checked.size})`}
              </button>
            )}
            <button onClick={exportCSV} className="btn-primary">
              Export CSV
            </button>
            <button onClick={exportCodebook} className="btn-secondary">
              Codebook
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
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    checked={participants.length > 0 && checked.size === participants.length}
                    ref={(el) => {
                      if (el) el.indeterminate = checked.size > 0 && checked.size < participants.length;
                    }}
                    onChange={toggleAll}
                    className="w-4 h-4 cursor-pointer accent-violet-600"
                  />
                </th>
                <th className="p-4">Code</th>
                <th className="p-4">Age</th>
                <th className="p-4">Gender</th>
                <th className="p-4">University</th>
                <th className="p-4">State</th>
                <th className="p-4">Consent</th>
                <th className="p-4">Phase</th>
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
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={checked.has(p.session_code)}
                      onChange={() => toggleChecked(p.session_code)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 cursor-pointer accent-violet-600"
                    />
                  </td>
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
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {(() => {
                const selectedParticipant = participants.find((p) => p.session_code === selected);
                const warmupValues: Record<string, string | null> = {
                  w1: selectedParticipant?.warmup_w1 ?? null,
                  w2: selectedParticipant?.warmup_w2 ?? null,
                  w3: selectedParticipant?.warmup_w3 ?? null,
                  w4: selectedParticipant?.warmup_w4 ?? null,
                };
                const debriefValues: Record<string, string | null> = {
                  d1: selectedParticipant?.debrief_d1 ?? null,
                  d2: selectedParticipant?.debrief_d2 ?? null,
                  d3: selectedParticipant?.debrief_d3 ?? null,
                  d4: selectedParticipant?.debrief_d4 ?? null,
                  d5: selectedParticipant?.debrief_d5 ?? null,
                  d6: selectedParticipant?.debrief_d6 ?? null,
                };
                const hasWarmup = Object.values(warmupValues).some((v) => v && v.trim().length > 0);
                const hasDebrief = Object.values(debriefValues).some((v) => v && v.trim().length > 0);
                return (
                  <>
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-700 mb-3">A Few Quick Questions</h3>
                      {hasWarmup ? (
                        <div className="space-y-3">
                          {WARMUP_QUESTIONS.map((q) => {
                            const value = warmupValues[q.key];
                            return (
                              <div key={q.key} className="text-sm">
                                <p className="text-zinc-500 text-xs leading-snug mb-1">{q.prompt}</p>
                                <p className="text-zinc-800 leading-relaxed">
                                  {value && value.trim().length > 0 ? value : <span className="text-zinc-300">—</span>}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-zinc-400 text-sm">No warmup answers yet.</p>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-700 mb-3">Debrief</h3>
                      {hasDebrief ? (
                        <div className="space-y-3">
                          {DEBRIEF_QUESTIONS.map((q) => {
                            const value = debriefValues[q.key];
                            return (
                              <div key={q.key} className="text-sm">
                                <p className="text-zinc-500 text-xs leading-snug mb-1">{q.prompt}</p>
                                <p className="text-zinc-800 leading-relaxed">
                                  {value && value.trim().length > 0 ? value : <span className="text-zinc-300">—</span>}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-zinc-400 text-sm">No debrief answers yet.</p>
                      )}
                    </div>
                  </>
                );
              })()}
              <div>
                <h3 className="text-sm font-semibold text-zinc-700 mb-3">Swipe Responses</h3>
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
          </div>
        </>
      )}

      {/* Delete confirmation modal */}
      {confirmOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-50 animate-fade-in"
            onClick={() => !deleting && setConfirmOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 pointer-events-auto animate-pop-in"
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-zinc-900">
                    Delete {checked.size} participant{checked.size === 1 ? "" : "s"}?
                  </h2>
                  <p className="text-sm text-zinc-500 mt-1 leading-relaxed">
                    Their swipe responses will also be removed. This action cannot be undone.
                  </p>
                </div>
              </div>

              {checked.size <= 8 && (
                <div className="bg-zinc-50 border border-zinc-100 rounded-lg px-3 py-2 mb-4 max-h-32 overflow-y-auto">
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(checked).map((code) => (
                      <span
                        key={code}
                        className="font-mono text-xs bg-white border border-zinc-200 rounded px-1.5 py-0.5 text-zinc-700"
                      >
                        {code}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConfirmOpen(false)}
                  disabled={deleting}
                  className="px-4 py-2 rounded-full text-sm font-medium text-zinc-700 hover:bg-zinc-100 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteSelected}
                  disabled={deleting}
                  className="px-4 py-2 rounded-full text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
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
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fade-in 0.15s ease-out;
        }
        @keyframes pop-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-pop-in {
          animation: pop-in 0.18s ease-out;
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
