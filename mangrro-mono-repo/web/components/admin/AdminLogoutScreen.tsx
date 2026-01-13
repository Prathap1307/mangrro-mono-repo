"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogoutScreen() {
  const router = useRouter();

  useEffect(() => {
    document.cookie = "adminSession=; path=/; max-age=0";
    const timeout = setTimeout(() => router.replace("/admin/login"), 1200);
    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-blue-50 px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/90 p-8 text-center shadow-2xl shadow-blue-100">
        <p className="text-xs uppercase tracking-[0.2em] text-blue-500">Admin Portal</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Signing out</h1>
        <p className="mt-2 text-sm text-slate-600">Clearing dummy session and redirecting you to login.</p>
        <div className="mt-6 animate-pulse rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">Redirecting…</div>
      </div>
    </div>
  );
}
