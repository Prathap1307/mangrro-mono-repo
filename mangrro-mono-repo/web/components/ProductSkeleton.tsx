"use client";

export default function ProductSkeleton() {
  return (
    <div className="flex flex-col rounded-3xl bg-white shadow animate-pulse">
      <div className="h-64 bg-gray-200 rounded-t-3xl" />

      <div className="p-4 flex flex-col gap-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-5/6" />

        <div className="mt-4 flex items-center justify-between">
          <div className="h-4 bg-gray-200 rounded w-16" />
          <div className="flex gap-2">
            <div className="h-8 w-8 rounded-full bg-gray-200" />
            <div className="h-8 w-8 rounded-full bg-gray-200" />
          </div>
        </div>

        <div className="mt-4 h-10 bg-gray-200 rounded-full" />
      </div>
    </div>
  );
}
