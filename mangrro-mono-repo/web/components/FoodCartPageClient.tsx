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
  const [finderOpen, setFinderOpen] = useState(false);
  const [finderInput, setFinderInput] = useState("");
  const [finderSuggestions, setFinderSuggestions] = useState<
    { id: string; label: string }[]
  >([]);
  const [finderLoading, setFinderLoading] = useState(false);
  const [finderError, setFinderError] = useState("");
  const [editLine1, setEditLine1] = useState("");
  const [editLine2, setEditLine2] = useState("");
  const [editTown, setEditTown] = useState("");
  const [editPostcode, setEditPostcode] = useState("");
  const [editLat, setEditLat] = useState<number | undefined>();
  const [editLng, setEditLng] = useState<number | undefined>();
  const [restaurantName, setRestaurantName] = useState("");
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [specialRequest, setSpecialRequest] = useState("");
  const [deliveryInstruction, setDeliveryInstruction] = useState("leave-at-door");
  const [deliveryLocation, setDeliveryLocation] = useState("home");
  const [deliveryLocationOther, setDeliveryLocationOther] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("food-cart-offer");
    if (stored) {
      setOffer(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    setRestaurantName(localStorage.getItem("food-cart-restaurant") ?? "");
    setSpecialRequest(localStorage.getItem("food-cart-special-request") ?? "");
    setDeliveryInstruction(
      localStorage.getItem("food-cart-delivery-instruction") ?? "leave-at-door",
    );
    const storedLocation =
      localStorage.getItem("food-cart-delivery-location") ?? "home";
    setDeliveryLocation(storedLocation);
    setDeliveryLocationOther(
      localStorage.getItem("food-cart-delivery-location-other") ?? "",
    );
  }, []);

  useEffect(() => {
    localStorage.setItem("food-cart-special-request", specialRequest);
  }, [specialRequest]);

  useEffect(() => {
    localStorage.setItem("food-cart-delivery-instruction", deliveryInstruction);
  }, [deliveryInstruction]);

  useEffect(() => {
    localStorage.setItem("food-cart-delivery-location", deliveryLocation);
    localStorage.setItem(
      "food-cart-delivery-location-other",
      deliveryLocationOther,
    );
  }, [deliveryLocation, deliveryLocationOther]);

  useEffect(() => {
    if (!finderOpen) return;
    setFinderError("");
    setFinderInput(address?.postcode ?? "");
    setEditLine1(address?.line1 ?? "");
    setEditLine2(address?.line2 ?? "");
    setEditTown(address?.town ?? "");
    setEditPostcode(address?.postcode ?? "");
    setEditLat(address?.latitude);
    setEditLng(address?.longitude);
  }, [address, finderOpen]);
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
  const restaurantRoute = restaurantName
    ? `/restaurants/${encodeURIComponent(restaurantName)}`
    : "/";

  useEffect(() => {
    if (!finderOpen) return;
    if (finderInput.trim().length < 3) {
      setFinderSuggestions([]);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;
    const timeout = setTimeout(async () => {
      try {
        setFinderLoading(true);
        const res = await fetch(
          `/api/address/search?q=${encodeURIComponent(finderInput)}`,
          { signal: controller.signal },
        );
        if (!res.ok) return;
        const data = await res.json();
        const suggestions = Array.isArray(data.suggestions)
          ? data.suggestions
          : [];
        if (!cancelled) setFinderSuggestions(suggestions);
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          setFinderError("Failed to load address suggestions.");
        }
      } finally {
        if (!cancelled) setFinderLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeout);
    };
  }, [finderInput, finderOpen]);

  const chooseSuggestion = async (suggestion: { id: string; label: string }) => {
    try {
      setFinderLoading(true);
      setFinderError("");
      const res = await fetch(`/api/address/details?id=${suggestion.id}`);
      const data = await res.json();
      if (!data.address) {
        setFinderError("Could not retrieve full address details.");
        return;
      }
      const found = data.address;
      setEditLine1(found.line1 ?? "");
      setEditLine2(found.line2 ?? "");
      setEditTown(found.town ?? "");
      setEditPostcode(found.postcode ?? "");
      setEditLat(found.latitude);
      setEditLng(found.longitude);
      setFinderSuggestions([]);
      setFinderInput(found.postcode ?? "");
    } catch (error) {
      setFinderError("Something went wrong selecting this address.");
    } finally {
      setFinderLoading(false);
    }
  };

  const resolveCoordsIfMissing = async () => {
    if (typeof editLat === "number" && typeof editLng === "number") return;
    const query = `${editLine1} ${editTown} ${editPostcode}`.trim();
    if (query.length < 5) return;
    try {
      const res = await fetch(
        `/api/address/search?q=${encodeURIComponent(query)}`,
      );
      if (!res.ok) return;
      const data = await res.json();
      const first = data.suggestions?.[0];
      if (!first) return;
      const detailsRes = await fetch(`/api/address/details?id=${first.id}`);
      const details = await detailsRes.json();
      if (!details.address) return;
      const found = details.address;
      if (typeof found.latitude === "number" && typeof found.longitude === "number") {
        setEditLat(found.latitude);
        setEditLng(found.longitude);
      }
    } catch {
      setFinderError("Could not resolve coordinates for this address.");
    }
  };

  const saveFinderAddress = async () => {
    setFinderError("");
    if (!editLine1.trim() || !editTown.trim() || !editPostcode.trim()) {
      setFinderError("Please complete address line 1, town and postcode.");
      return;
    }
    await resolveCoordsIfMissing();
    setAddress({
      line1: editLine1.trim(),
      line2: editLine2.trim() || undefined,
      town: editTown.trim(),
      postcode: editPostcode.trim().toUpperCase(),
      latitude: editLat,
      longitude: editLng,
    });
    setFinderOpen(false);
  };

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
              onClick={() => setFinderOpen(true)}
              className="rounded-full border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-600"
            >
              Change
            </button>
          </div>
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
                      {restaurantName || "Restaurant"}
                    </p>
                  </div>
                  <button
                    onClick={() => router.push(restaurantRoute)}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
                  >
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
                  <button
                    onClick={() => router.push(restaurantRoute)}
                    className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
                  >
                    + Add items
                  </button>
                  <button
                    onClick={() => setInstructionsOpen((prev) => !prev)}
                    className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
                  >
                    Instructions
                  </button>
                  <button className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600">
                    Cutlery
                  </button>
                </div>
                {instructionsOpen && (
                  <div className="mt-3">
                    <input
                      value={specialRequest}
                      onChange={(event) => setSpecialRequest(event.target.value)}
                      placeholder="Add any special request"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
                    />
                    <p className="mt-1 text-xs text-slate-400">
                      It will be displayed to the delivery driver.
                    </p>
                  </div>
                )}
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
                      <div className="mt-1 text-xs text-emerald-600">
                        You saved {formatCurrency(discount)}
                      </div>
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

      {finderOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
          <div className="w-full max-w-md rounded-t-3xl bg-white px-6 py-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Change address
              </h3>
              <button
                onClick={() => setFinderOpen(false)}
                className="rounded-full bg-slate-100 px-3 py-1 text-sm"
              >
                Close
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <input
                value={finderInput}
                onChange={(event) => setFinderInput(event.target.value)}
                placeholder="Search by postcode or address"
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              />
              {finderLoading && (
                <p className="text-xs text-slate-500">Searching...</p>
              )}
              {finderSuggestions.length > 0 && (
                <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                  {finderSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => chooseSuggestion(suggestion)}
                      className="w-full border-b border-slate-100 px-3 py-2 text-left text-xs text-slate-700 last:border-none"
                    >
                      {suggestion.label}
                    </button>
                  ))}
                </div>
              )}
              {finderError && (
                <p className="text-xs text-rose-500">{finderError}</p>
              )}
              <input
                value={editLine1}
                onChange={(event) => setEditLine1(event.target.value)}
                placeholder="Address line 1"
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              />
              <input
                value={editLine2}
                onChange={(event) => setEditLine2(event.target.value)}
                placeholder="Address line 2"
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              />
              <input
                value={editTown}
                onChange={(event) => setEditTown(event.target.value)}
                placeholder="Town/City"
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              />
              <input
                value={editPostcode}
                onChange={(event) => setEditPostcode(event.target.value)}
                placeholder="Postcode"
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              />
              <div className="rounded-xl border border-slate-200 px-3 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Delivery instruction
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                  {[
                    { value: "leave-at-door", label: "Leave at door" },
                    { value: "hand-it", label: "Hand it to me" },
                    { value: "meet-driver", label: "I'll meet driver at door" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setDeliveryInstruction(option.value)}
                      className={`rounded-full border px-3 py-1 ${
                        deliveryInstruction === option.value
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 px-3 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Delivery location
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                  {[
                    { value: "home", label: "Home" },
                    { value: "office", label: "Office" },
                    { value: "other", label: "Other" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setDeliveryLocation(option.value)}
                      className={`rounded-full border px-3 py-1 ${
                        deliveryLocation === option.value
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                {deliveryLocation === "other" && (
                  <input
                    value={deliveryLocationOther}
                    onChange={(event) => setDeliveryLocationOther(event.target.value)}
                    placeholder="Enter delivery location"
                    className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
                  />
                )}
              </div>
            </div>
            <button
              onClick={saveFinderAddress}
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
