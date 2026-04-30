const KEY = "vignette-completed";

export interface CompletionRecord {
  sessionCode: string;
  completedAt: string;
}

export function markCompleted(sessionCode: string) {
  if (typeof window === "undefined") return;
  const existing = getCompletion();
  if (existing) return;
  const record: CompletionRecord = {
    sessionCode,
    completedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(KEY, JSON.stringify(record));
}

export function getCompletion(): CompletionRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CompletionRecord) : null;
  } catch {
    return null;
  }
}

export function clearCompletion() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
