"use client";

import Navbar from "@/components/Navbar";
import CartItem from "@/components/CartItem";
import EmptyState from "@/components/EmptyState";
import { useFoodCart } from "@/components/context/FoodCartContext";
import { useDelivery } from "@/components/context/DeliveryContext";

const formatCurrency = (value: number) => `₹${value.toFixed(0)}`;

export default function FoodCartPageClient() {
  const { items, increase, decrease, remove, subtotal, itemCount } = useFoodCart();
  const { address } = useDelivery();
  const addressLabel = address?.line1 || "Select delivery location";
  const addressSubLabel = address
    ? [address.line2, address.town, address.postcode].filter(Boolean).join(", ")
    : "Add address to see delivery details";

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 pb-24 pt-6">
        <div className="rounded-3xl border border-emerald-100 bg-white px-5 py-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500">
                Delivery address
              </p>
              <h2 className="text-base font-semibold text-slate-900">
                {addressLabel}
              </h2>
              <p className="text-xs text-slate-500">{addressSubLabel}</p>
            </div>
            <button className="rounded-full border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-600">
              Change
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          ✨ ₹870 saved on this order
        </div>

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
          <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500">
                      Restaurant
                    </p>
                    <p className="text-lg font-semibold text-slate-900">
                      Domino&apos;s Pizza
                    </p>
                  </div>
                  <button className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                    Add items
                  </button>
                </div>
                <div className="mt-4 space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-slate-100 p-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {item.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            New Hand Tossed, Regular
                          </p>
                        </div>
                        <div className="text-sm font-semibold text-slate-900">
                          {formatCurrency(item.price)}
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <button className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                          Customize
                        </button>
                        <div className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-sm font-semibold text-emerald-600 shadow-sm">
                          <button onClick={() => decrease(item.id)} className="px-2">
                            −
                          </button>
                          <span className="px-2">{item.quantity}</span>
                          <button onClick={() => increase(item.id)} className="px-2">
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600">
                    + Add items
                  </button>
                  <button className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600">
                    Cooking requests
                  </button>
                  <button className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600">
                    Cutlery
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Savings corner
                </p>
                <div className="mt-3 space-y-3">
                  <div className="flex items-center justify-between rounded-2xl border border-slate-100 px-3 py-3 text-sm font-semibold text-slate-700">
                    <span>Apply Coupon</span>
                    <span>→</span>
                  </div>
                  <div className="rounded-2xl border border-slate-100 px-3 py-3 text-sm text-slate-600">
                    ₹870 saved with &quot;Items at ₹799&quot; · Applied
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">Delivery type</p>
                  <span className="text-sm font-semibold text-orange-500">20-25 mins</span>
                </div>
                <div className="mt-3 space-y-2 text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-orange-500" />
                    Standard · Minimal order grouping
                  </div>
                  <div className="flex items-center gap-2 opacity-50">
                    <span className="h-2 w-2 rounded-full border border-slate-300" />
                    Other delivery types unavailable
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500">
                      To Pay
                    </p>
                    <p className="text-2xl font-bold text-slate-900">
                      {formatCurrency(subtotal)}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    ₹870 saved
                  </span>
                </div>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Item total</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Delivery fee | 1.3 kms</span>
                    <span className="text-emerald-600">FREE</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>GST & other charges</span>
                    <span>{formatCurrency(subtotal * 0.09)}</span>
                  </div>
                </div>
              </div>

              <button className="w-full rounded-3xl bg-emerald-500 px-6 py-4 text-lg font-semibold text-white shadow-lg">
                Proceed to Pay
              </button>

              <div className="rounded-3xl border border-slate-100 bg-white p-4 text-xs text-slate-500">
                Cancellation policy: Please double-check your order and address
                details. Orders are non-refundable once placed.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
