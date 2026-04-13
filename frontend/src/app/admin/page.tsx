"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center">
      <p className="text-zinc-400">Not found</p>
    </div>
  );
}
