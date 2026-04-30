"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

const ADMIN_SLUG = process.env.NEXT_PUBLIC_ADMIN_SLUG || "r9k4x7m2b8f1n5p3q6w0t4v8";

export default function AdminSlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (slug !== ADMIN_SLUG) {
      router.replace("/");
      return;
    }

    const stored = sessionStorage.getItem("admin_key");
    if (!stored) {
      setChecking(false);
      return;
    }
    api
      .verifyAdminKey(stored)
      .then(() => setAuthed(true))
      .catch(() => {
        sessionStorage.removeItem("admin_key");
      })
      .finally(() => setChecking(false));
  }, [slug, router]);

  if (slug !== ADMIN_SLUG) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <p className="text-zinc-400">Redirecting...</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.verifyAdminKey(password);
      sessionStorage.setItem("admin_key", password);
      setAuthed(true);
    } catch {
      setError("Invalid password. Access denied.");
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <p className="text-zinc-400">Verifying access...</p>
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="admin-scope min-h-[100dvh] flex items-center justify-center px-6">
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
          <div className="text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold">Researcher Access</h1>
            <p className="text-zinc-400 text-sm mt-1">Enter the admin password to continue</p>
          </div>

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            className="input-field"
          />

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={!password || submitting}
            className="btn-primary w-full"
          >
            {submitting ? "Verifying..." : "Unlock"}
          </button>

          <a
            href="/"
            className="block text-center text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            Back to home
          </a>
        </form>
      </div>
    );
  }

  return <div className="admin-scope">{children}</div>;
}
