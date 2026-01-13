"use client";

import Image from "next/image";

interface CategorySidebarItem {
  id: string;
  name: string;
  imageUrl?: string;
  imageKey?: string;
  count?: number;
}

interface CategorySidebarProps {
  categories: CategorySidebarItem[];
  activeId: string;
  onSelect: (id: string) => void;
  title?: string;
}

export default function CategorySidebar({
  categories,
  activeId,
  onSelect,
  title = "Categories",
}: CategorySidebarProps) {
  return (
    <aside className="sticky top-4 flex h-[calc(100vh-2rem)] flex-col rounded-3xl bg-gray-50 p-2 shadow-sm">
      <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
        {title}
      </p>
      <ul className="mt-3 flex-1 space-y-2 overflow-y-auto pr-1">
        {categories.map((category) => {
          const isActive = category.id === activeId;
          const resolvedImage = category.imageKey
            ? `/api/image-proxy?key=${encodeURIComponent(category.imageKey)}`
            : category.imageUrl ?? "/placeholder.webp";
          return (
            <li key={category.id}>
              <button
                type="button"
                onClick={() => onSelect(category.id)}
                className={`flex w-full flex-col items-center gap-2 rounded-2xl px-2 py-2 text-center transition ${
                  isActive
                    ? "border border-gray-200 bg-white text-gray-900"
                    : "text-gray-600 hover:bg-white"
                }`}
              >
                <span className="relative h-10 w-10 overflow-hidden rounded-2xl bg-white">
                  <img
                    src={resolvedImage}
                    alt={category.name}
                    sizes="40px"
                    className="object-cover"
                  />
                </span>
                <span className="flex-1">
                  <span className="text-[11px] font-semibold leading-tight">
                    {category.name}
                  </span>
                  {typeof category.count === "number" && (
                    <span
                      className={`mt-0.5 block text-[10px] ${
                        isActive ? "text-gray-500" : "text-gray-400"
                      }`}
                    >
                      {category.count} items
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
