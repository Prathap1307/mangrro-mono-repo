"use client";

import Navbar from "@/components/Navbar";
import SectionTitle from "@/components/SectionTitle";
import CartItem from "@/components/CartItem";
import EmptyState from "@/components/EmptyState";
import { useFoodCart } from "@/components/context/FoodCartContext";

export default function FoodCartPageClient() {
  const { items, increase, decrease, remove, subtotal, itemCount } = useFoodCart();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-8">
        <SectionTitle title="Food Cart" subtitle="Review your food order." />
        {items.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              title="Your food cart is empty"
              description="Browse restaurants and add your favorite dishes."
              ctaLabel="Explore restaurants"
              ctaHref="/"
            />
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-4">
              {items.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  isAvailable
                  onIncrease={increase}
                  onDecrease={decrease}
                  onRemove={remove}
                />
              ))}
            </div>
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">Order summary</h3>
              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Items</span>
                  <span>{itemCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
              </div>
              <button className="mt-6 w-full rounded-full bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg">
                Proceed to checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
