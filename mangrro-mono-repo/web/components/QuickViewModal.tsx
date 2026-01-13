'use client';

import { FiHeart, FiX, FiAlertTriangle } from "react-icons/fi";
import type { Product } from "@/data/products";

export default function QuickViewModal({
  open,
  product,
  onClose,
  onAddToCart,
  onFavourite,
}: any) {
  if (!open || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">

        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-white/80 p-2 shadow hover:bg-white"
        >
          <FiX size={22} />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">

          {/* IMAGE */}
          <div className="relative h-80 md:h-full overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover"
              onError={(e) => (e.currentTarget.src = "/placeholder.webp")}
            />
          </div>

          {/* CONTENT */}
          <div className="p-8 space-y-4 text-left">
            <p className="text-sm font-semibold text-purple-600">Quick view</p>

            <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>

            {product.description && (
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            )}

            <p className="text-3xl font-bold text-gray-900">£{product.price.toFixed(2)}</p>

            {/* AGE WARNING */}
            {product.ageRestricted && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-200">
                <FiAlertTriangle className="text-red-600 mt-1" size={22} />
                <span className="text-sm text-red-700">
                  This item requires age verification on delivery.
                </span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => onAddToCart(product)}
                className="flex-1 rounded-full bg-purple-600 px-5 py-3 text-white font-semibold hover:bg-purple-700"
              >
                Add to Cart
              </button>

              <button
                onClick={() => onFavourite(product)}
                className="rounded-full border p-3 hover:border-purple-500 hover:text-purple-600"
              >
                <FiHeart size={20} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
