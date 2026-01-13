export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white text-slate-900">
      <div className="space-y-3 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
        <p className="text-lg font-semibold">Loading your experience...</p>
        <p className="text-sm text-slate-600">Just a moment while we prepare the next page.</p>
      </div>
    </div>
  );
}
