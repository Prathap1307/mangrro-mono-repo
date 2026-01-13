"use client";

import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isLoginPage = useMemo(
    () => pathname?.startsWith("/admin/login"),
    [pathname]
  );

  if (isLoginPage) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-slate-50">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900">
      <div className="flex">
        
        {/* SIDEBAR */}
        <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* MAIN WRAPPER */}
        <div className="flex min-h-screen flex-1 flex-col md:pl-0">

          <AdminTopbar onMenuClick={() => setSidebarOpen(true)} />

          {/* FIXED CONTENT */}
          <main className="mx-auto flex w-full max-w-screen-2xl flex-1 px-4 pb-10 mt-10 pt-20 md:px-8 md:pt-14">
            <div className="w-full space-y-6">{children}</div>
          </main>

        </div>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
