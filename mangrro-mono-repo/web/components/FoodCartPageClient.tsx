"use client";

import Navbar from "@/components/Navbar";
import CartItem from "@/components/CartItem";
import EmptyState from "@/components/EmptyState";
import { useFoodCart } from "@/components/context/FoodCartContext";
import { useDelivery } from "@/components/context/DeliveryContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const formatCurrency = (value: number) => `₹${value.toFixed(0)}`;

export default function FoodCartPageClient() {
  const { items, increase, decrease, subtotal } = useFoodCart();
  const router = useRouter();
  const { address, setAddress } = useDelivery();
  const [offer, setOffer] = useState<{
    code: string;
    name: string;
    label: string;
    type: "percentage" | "fixed";
    value: string;
  } | null>(null);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [formState, setFormState] = useState({
    line1: "",
    line2: "",
    town: "",
    postcode: "",
  });

  useEffect(() => {
    const stored = localStorage.getItem("food-cart-offer");
    if (stored) {
      setOffer(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    if (address) {
      setFormState({
        line1: address.line1 ?? "",
        line2: address.line2 ?? "",
        town: address.town ?? "",
        postcode: address.postcode ?? "",
      });
    }
  }, [address]);
  const addressLabel = address?.line1 || "Select delivery location";
  const addressSubLabel = address
    ? [address.line2, address.town, address.postcode].filter(Boolean).join(", ")
    : "Add address to see delivery details";

  const discount = offer
    ? offer.type === "percentage"
      ? subtotal * (Number(offer.value) / 100)
      : Number(offer.value)
    : 0;
  const totalToPay = Math.max(subtotal - discount, 0);

  useEffect(() => {
    localStorage.setItem("food-cart-total", String(subtotal));
  }, [subtotal]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 pb-24 pt-6">
        <div className="mb-4 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm"
          >
            ←
          </button>
          <h1 className="text-lg font-semibold text-slate-900">Food Cart</h1>
        </div>

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
            <button
              onClick={() => setAddressModalOpen(true)}
              className="rounded-full border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-600"
            >
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
                          {item.addons && item.addons.length > 0 && (
                            <div className="mt-2 space-y-1 text-xs text-slate-500">
                              {item.addons.map((addon) => (
                                <div key={addon.id} className="flex justify-between">
                                  <span>{addon.name}</span>
                                  <span>+ {formatCurrency(addon.price)}</span>
                                </div>
                              ))}
                            </div>
                          )}
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
                  <button
                    onClick={() => router.push("/food-cart/offers")}
                    className="flex w-full items-center justify-between rounded-2xl border border-slate-100 px-3 py-3 text-sm font-semibold text-slate-700"
                  >
                    <span>Apply Coupon</span>
                    <span>→</span>
                  </button>
                  {offer && (
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-3 text-sm text-emerald-700">
                      {offer.label} · Applied ({offer.code})
                    </div>
                  )}
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
                      {formatCurrency(totalToPay)}
                    </p>
                  </div>
                  {offer && (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {formatCurrency(discount)} saved
                    </span>
                  )}
                </div>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Item total</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {offer && (
                    <div className="flex items-center justify-between text-emerald-600">
                      <span>Offer discount</span>
                      <span>-{formatCurrency(discount)}</span>
                    </div>
                  )}
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

      {addressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
          <div className="w-full max-w-md rounded-t-3xl bg-white px-6 py-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Change address
              </h3>
              <button
                onClick={() => setAddressModalOpen(false)}
                className="rounded-full bg-slate-100 px-3 py-1 text-sm"
              >
                Close
              </button>
            </div>
            <div className="mt-4 grid gap-3 text-sm">
              <input
                value={formState.line1}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, line1: event.target.value }))
                }
                placeholder="Address line 1"
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              />
              <input
                value={formState.line2}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, line2: event.target.value }))
                }
                placeholder="Address line 2"
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              />
              <input
                value={formState.town}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, town: event.target.value }))
                }
                placeholder="Town/City"
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              />
              <input
                value={formState.postcode}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, postcode: event.target.value }))
                }
                placeholder="Postcode"
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </div>
            <button
              onClick={() => {
                setAddress({
                  line1: formState.line1,
                  line2: formState.line2 || undefined,
                  town: formState.town,
                  postcode: formState.postcode,
                });
                setAddressModalOpen(false);
              }}
              className="mt-4 w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white"
            >
              Save address
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
