import Image from 'next/image';
import Link from 'next/link';

interface Props {
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export default function EmptyState({ title, description, ctaLabel, ctaHref }: Props) {
  return (
    <div className="flex flex-col items-center justify-center text-center bg-white rounded-3xl shadow-md border border-gray-100 p-10 gap-4">
      <div className="relative h-32 w-32">
        <Image src="/brand.png" alt="Empty illustration" fill className="object-contain opacity-60" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
      <p className="text-gray-500 max-w-md">{description}</p>
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="px-5 py-3 bg-purple-600 text-white rounded-full font-semibold shadow-md hover:bg-purple-700 transition"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
