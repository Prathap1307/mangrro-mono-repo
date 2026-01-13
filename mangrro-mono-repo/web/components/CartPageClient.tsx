'use client';

import Link from 'next/link';
import SectionTitle from '@/components/SectionTitle';
import CartItem from '@/components/CartItem';
import EmptyState from '@/components/EmptyState';
import { useCart } from '@/components/context/CartContext';

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-sm text-gray-700">
      <span>{label}</span>
      <span>${value.toFixed(2)}</span>
    </div>
  );
}

export default function CartPageClient() {
  const { items, increase, decrease, remove, subtotal } = useCart();
  const tax = subtotal * 0.08;
  const delivery = items.length > 0 ? 3.5 : 0;
  const surcharge = items.length > 0 ? 1.5 : 0;
  const total = subtotal + tax + delivery + surcharge;

  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="Your bag" title="Cart" />

      {items.length === 0 ? (
        <EmptyState
          title="Your cart is empty"
          description="Add chef specials, craft drinks, or daily essentials to start your order."
          ctaLabel="Browse products"
          ctaHref="/"
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[2fr,1fr] lg:items-start">
          <div className="space-y-4">
            {items.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onIncrease={increase}
                onDecrease={decrease}
                onRemove={remove}
              />
            ))}
          </div>

          <div className="sticky top-24 space-y-4 rounded-3xl bg-white p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900">Order summary</h3>
            <div className="space-y-2">
              <SummaryRow label="Subtotal" value={subtotal} />
              <SummaryRow label="Tax (8%)" value={tax} />
              <SummaryRow label="Delivery" value={delivery} />
              <SummaryRow label="Surcharge" value={surcharge} />
            </div>
            <div className="flex items-center justify-between text-lg font-bold text-gray-900">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <button className="w-full rounded-full bg-purple-600 px-5 py-3 text-base font-semibold text-white shadow-lg hover:bg-purple-700">
              Proceed to checkout
            </button>
            <p className="text-xs text-gray-500">No payment required. This is a demo checkout experience.</p>
            <Link href="/" className="block text-center text-sm font-semibold text-purple-600 hover:text-purple-700">
              Continue browsing
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
