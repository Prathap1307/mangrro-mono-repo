"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminLoginScreen() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    // VALID ADMIN CREDENTIALS
    if (loginId === "Dango" && password === "Dango") {
      document.cookie = "adminSession=true; path=/; max-age=86400";
      router.push("/admin/dashboard");
    } else {
      setError("Invalid admin credentials");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-blue-50 px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-2xl shadow-blue-100">
        
        <div className="mb-6 space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-blue-500">
            Admin Portal
          </p>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
          <p className="text-sm text-slate-600">
            Enter your admin login credentials.
          </p>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-semibold text-slate-800">
            Login ID
          </label>
          <input
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            placeholder="Admin ID"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
          />

          <label className="block text-sm font-semibold text-slate-800">
            Password
          </label>
          <input
            type="password"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* Error Message */}
          {error && (
            <p className="text-red-600 text-sm font-medium">{error}</p>
          )}

          <button
            onClick={handleLogin}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:shadow-blue-300"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminLoginScreen;
