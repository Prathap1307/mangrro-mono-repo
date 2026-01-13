"use client";

import { FiBell, FiMenu, FiSearch, FiUser } from "react-icons/fi";

type Props = {
  onMenuClick?: () => void;
};

export function AdminTopbar({ onMenuClick }: Props) {
  return (
    <header className="fixed left-0 right-0 top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur md:left-72">
      <div className="mx-auto flex max-w-screen-2xl items-center gap-3 px-4 py-3 md:px-8">
        <button
          onClick={onMenuClick}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-sm transition hover:bg-slate-50 md:hidden"
          aria-label="Open menu"
        >
          <FiMenu className="h-5 w-5" />
        </button>
        <div className="flex flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 shadow-inner">
          <FiSearch className="h-5 w-5 text-slate-400" />
          <input
            className="w-full bg-transparent text-sm text-slate-900 outline-none"
            placeholder="Search orders, customers, items"
            aria-label="Search"
          />
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <button className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
            <FiBell className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
            <FiUser />
            Admin
          </div>
        </div>
      </div>
    </header>
  );
}

export default AdminTopbar;
