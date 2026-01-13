"use client";

import Image from "next/image";

interface CategoryTileProps {
  name: string;
  subcategory?: string;
  imageUrl?: string;
  imageKey?: string;
}

export default function CategoryTile({
  name,
  subcategory,
  imageUrl,
  imageKey,
}: CategoryTileProps) {
  const imageSrc = imageKey
    ? `/api/image-proxy?key=${encodeURIComponent(imageKey)}`
    : imageUrl || "/placeholder.webp";

  return (
    <div className="group overflow-hidden rounded-3xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <Image
          src={imageSrc}
          alt={name}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-transparent" />
      </div>
      <div className="flex items-start justify-between gap-3 px-5 py-4">
        <div>
          <p className="text-lg font-semibold text-gray-900">{name}</p>
          <p className="text-sm text-gray-500">
            {subcategory || "Explore the range"}
          </p>
        </div>
        <span className="mt-1 inline-flex items-center rounded-full bg-purple-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-purple-700">
          Shop
        </span>
      </div>
    </div>
  );
}
