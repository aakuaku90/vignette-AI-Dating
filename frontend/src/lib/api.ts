const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getAdminKey(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("admin_key");
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function adminRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const key = getAdminKey();
  const res = await fetch(`${API}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(key ? { "X-Admin-Key": key } : {}),
    },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export interface Participant {
  id: string;
  session_code: string;
  age: number | null;
  gender: string | null;
  university: string | null;
  state: string | null;
  consented: boolean;
  consented_at: string | null;
  started_at: string;
  completed_at: string | null;
  current_phase: number;
  current_stage: number;
  email: string | null;
  phone: string | null;
}

export interface SwipeResponseData {
  id: string;
  phase: number;
  stage: number;
  card_number: number;
  swiped_right: boolean;
  response_time_ms: number | null;
  created_at: string;
}

export const api = {
  createParticipant: (data: { age?: number; gender?: string }) =>
    request<Participant>("/api/participants", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getParticipant: (code: string) =>
    request<Participant>(`/api/participants/${code}`),

  recordSwipe: (
    code: string,
    data: {
      phase: number;
      stage: number;
      card_number: number;
      swiped_right: boolean;
      response_time_ms?: number;
    }
  ) =>
    request<SwipeResponseData>(`/api/participants/${code}/swipe`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateDemographics: (code: string, data: { age?: number; gender?: string; university?: string; state?: string; consented?: boolean }) =>
    request<Participant>(`/api/participants/${code}/demographics`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  updateContact: (code: string, data: { email?: string; phone?: string }) =>
    request<Participant>(`/api/participants/${code}/contact`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  updateProgress: (code: string, phase: number, stage: number) =>
    request<Participant>(`/api/participants/${code}/progress`, {
      method: "PATCH",
      body: JSON.stringify({ current_phase: phase, current_stage: stage }),
    }),

  getResponses: (code: string) =>
    request<SwipeResponseData[]>(`/api/participants/${code}/responses`),

  // Admin
  verifyAdminKey: (key: string) =>
    fetch(`${API}/api/admin/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Key": key,
      },
    }).then((res) => {
      if (!res.ok) throw new Error("Invalid key");
      return res.json();
    }),

  listParticipants: () => adminRequest<Participant[]>("/api/admin/participants"),

  getStats: () =>
    adminRequest<{
      total_participants: number;
      completed_participants: number;
      phase_distribution: Record<number, number>;
      stage_completion: Record<number, number>;
    }>("/api/admin/stats"),

  exportData: () => adminRequest<Record<string, unknown>[]>("/api/admin/export"),
};
