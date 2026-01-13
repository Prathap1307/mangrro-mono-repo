"use client";

import Image from "next/image";
import Link from "next/link";

interface CategoryIconTileProps {
  name: string;
  imageUrl?: string;
  imageKey?: string;
  href?: string;
}

export default function CategoryIconTile({
  name,
  imageUrl,
  imageKey,
  href,
}: CategoryIconTileProps) {
  const imageSrc = imageKey
    ? `/api/image-proxy?key=${encodeURIComponent(imageKey)}`
    : imageUrl;

  const initial = name.trim().charAt(0).toUpperCase();

  const content = (
    <>
      <div className="flex w-full items-center justify-center">
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition group-hover:shadow-md group-hover:ring-purple-200">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={name}
              sizes="96px"
              className="object-contain"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-2xl font-semibold text-purple-600">
              {initial}
            </span>
          )}
        </div>
      </div>
      <span className="text-[11px] font-semibold text-gray-700 transition group-hover:text-purple-600 sm:text-xs">
        {name}
      </span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group flex cursor-pointer flex-col items-center gap-2 text-center"
      >
        {content}
      </Link>
    );
  }

  return <div className="flex flex-col items-center gap-2 text-center">{content}</div>;
}
