'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiHeart, FiShoppingBag } from 'react-icons/fi';
import SectionTitle from '@/components/SectionTitle';
import ProductCard from '@/components/ProductCard';
import QuickViewModal from '@/components/QuickViewModal';
import { useCart } from '@/components/context/CartContext';
import type { Product } from '@/data/products';

interface Props {
  product: Product;
  similar: Product[];
}

export default function ProductDetailsClient({ product, similar }: Props) {
  const { addItem } = useCart();
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const imageSrc = product.image ?? "/placeholder.webp";

  return (
    <div className="space-y-10 pb-24">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="relative h-[420px] overflow-hidden rounded-3xl bg-white shadow-xl">
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
        </div>
        <div className="space-y-5">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-purple-500">Featured</p>
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
          <p className="text-lg leading-relaxed text-gray-600">{product.description}</p>
          <p className="text-4xl font-extrabold text-gray-900">${product.price.toFixed(2)}</p>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => addItem(product)}
              className="flex items-center gap-2 rounded-full bg-purple-600 px-6 py-3 text-base font-semibold text-white shadow-lg hover:bg-purple-700"
            >
              <FiShoppingBag /> Add to cart
            </button>
            <button className="flex items-center gap-2 rounded-full border border-gray-200 px-6 py-3 text-base font-semibold text-gray-700 hover:border-purple-500 hover:text-purple-600">
              <FiHeart /> Add to favourites
            </button>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-inner">
            <p className="text-sm font-semibold text-gray-700">Delivery promise</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
              <li>Under 60 minutes in metro areas</li>
              <li>Eco-packaging and contactless handoff</li>
              <li>Live rider updates with every order</li>
            </ul>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <SectionTitle eyebrow="You might also like" title="Similar flavours" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {similar.map((item) => (
            <ProductCard
              key={item.id}
              product={item}
              onAddToCart={addItem}
              onQuickView={() => {
                setSelected(item);
                setQuickViewOpen(true);
              }}
              onToggleFavourite={() => {}}
              isFavourite={false}
            />
          ))}
        </div>
      </section>

      <QuickViewModal
        open={quickViewOpen}
        product={selected}
        onClose={() => setQuickViewOpen(false)}
        onAddToCart={(p: Product) => addItem(p)}
        onFavourite={() => setQuickViewOpen(false)}
      />

      <div className="text-center text-sm text-gray-500">
        <Link href="/">Back to home</Link>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-4 border-t border-gray-200 bg-white/95 px-4 py-3 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] backdrop-blur md:hidden">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-purple-600">{product.category}</p>
          <p className="text-lg font-bold text-gray-900">${product.price.toFixed(2)}</p>
        </div>
        <button
          onClick={() => addItem(product)}
          className="flex-1 rounded-full bg-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-md hover:bg-purple-700"
        >
          Add to cart
        </button>
      </div>
    </div>
  );
}
