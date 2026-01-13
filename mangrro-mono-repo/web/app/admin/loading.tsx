export default function AdminLoading() {
  return (
    <div className="w-full space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-slate-700">Loading admin data...</p>
        <div className="h-4 w-40 animate-pulse rounded-full bg-slate-200" />
        <div className="mt-4 h-3 w-64 animate-pulse rounded-full bg-slate-100" />
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-4 w-28 animate-pulse rounded-full bg-slate-200" />
        <div className="mt-4 grid gap-3">
          <div className="h-3 w-full animate-pulse rounded-full bg-slate-100" />
          <div className="h-3 w-5/6 animate-pulse rounded-full bg-slate-100" />
          <div className="h-3 w-2/3 animate-pulse rounded-full bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
