"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

interface RestaurantOffer {
  id: string;
  name: string;
  code: string;
  type: "percentage" | "fixed";
  label: string;
  value: string;
}

const formatCurrency = (value: number) => `₹${value.toFixed(0)}`;

export default function FoodCartOffersPageClient() {
  const router = useRouter();
  const [offers, setOffers] = useState<RestaurantOffer[]>([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [couponCode, setCouponCode] = useState("");

  useEffect(() => {
    const storedTotal = localStorage.getItem("food-cart-total");
    if (storedTotal) {
      setCartTotal(Number(storedTotal));
    }
  }, []);

  useEffect(() => {
    const loadOffers = async () => {
      const restaurantName =
        localStorage.getItem("food-cart-restaurant") ?? "";
      if (!restaurantName) return;
      const res = await fetch("/api/admin/restaurants");
      const data = await res.json();
      const list = Array.isArray(data) ? data : data?.data ?? [];
      const restaurant = list.find(
        (item: { name?: string }) =>
          item.name?.toLowerCase?.() === restaurantName.toLowerCase(),
      );
      setOffers(Array.isArray(restaurant?.offers) ? restaurant.offers : []);
    };
    void loadOffers();
  }, []);

  const availableOffers = useMemo(
    () => offers.filter((offer) => offer.code && offer.label),
    [offers],
  );

  const applyOffer = (offer: RestaurantOffer) => {
    localStorage.setItem("food-cart-offer", JSON.stringify(offer));
    router.push("/food-cart");
  };

  const applyManualCode = () => {
    const match = availableOffers.find(
      (offer) => offer.code.toLowerCase() === couponCode.toLowerCase(),
    );
    if (match) {
      applyOffer(match);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-6">
        <div className="mb-4 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm"
          >
            ←
          </button>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Apply coupon</h1>
            <p className="text-xs text-slate-500">
              Your cart: {formatCurrency(cartTotal)}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <input
              value={couponCode}
              onChange={(event) => setCouponCode(event.target.value)}
              placeholder="Enter Coupon Code"
              className="flex-1 rounded-full border border-slate-200 px-4 py-3 text-sm"
            />
            <button
              onClick={applyManualCode}
              className="rounded-full border border-emerald-200 px-4 py-3 text-xs font-semibold text-emerald-600"
            >
              APPLY
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">
            Great deal you&apos;re missing out on!
          </h2>
          {availableOffers.map((offer) => (
            <div
              key={offer.id}
              className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold text-slate-900">
                    {offer.code}
                  </p>
                  <p className="text-sm text-emerald-600">{offer.label}</p>
                </div>
                <button
                  onClick={() => applyOffer(offer)}
                  className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700"
                >
                  APPLY
                </button>
              </div>
              <p className="mt-3 text-xs text-slate-500">{offer.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
