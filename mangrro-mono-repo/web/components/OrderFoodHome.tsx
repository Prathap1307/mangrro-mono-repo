"use client";

import { useState } from "react";
import Image from "next/image";
import {
  FiChevronDown,
  FiMic,
  FiSearch,
  FiSliders,
} from "react-icons/fi";

const categoryChips = [
  { label: "Biryani", emoji: "🍛" },
  { label: "Sandwich", emoji: "🥪" },
  { label: "Cakes", emoji: "🎂" },
  { label: "Pizzas", emoji: "🍕" },
  { label: "Samosa", emoji: "🥟" },
];

const restaurantCards = [
  {
    name: "Popeyes",
    rating: "4.4 (235)",
    time: "25-30 mins",
    cuisine: "Burgers, Fast Food, Rolls",
    location: "Uptown • 3.0 km",
    image:
      "https://images.unsplash.com/photo-1606756790138-261d2b21cd75?auto=format&fit=crop&w=900&q=80",
    badge: "Food in 15 mins",
    priceNote: "ITEMS AT ₹59",
  },
  {
    name: "Domino's Pizza",
    rating: "4.2 (18K+)",
    time: "20-25 mins",
    cuisine: "Pizzas, Italian, Pastas, Desserts",
    location: "Saidapet • 1.3 km",
    image:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=80",
    badge: "Food in 10-15 min",
    priceNote: "FLAT DEAL 50% OFF",
  },
];

interface OrderFoodHomeProps {
  addressLabel: string;
  addressSubLabel: string;
  onLocationClick: () => void;
}

export default function OrderFoodHome({
  addressLabel,
  addressSubLabel,
  onLocationClick,
}: OrderFoodHomeProps) {
  const [query, setQuery] = useState("");
  const [vegOnly, setVegOnly] = useState(false);

  return (
    <section className="mx-auto max-w-7xl px-4 pb-10 pt-6 lg:px-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <button
          onClick={onLocationClick}
          className="flex items-center justify-between rounded-2xl border border-purple-100 bg-white px-4 py-3 text-left shadow-sm transition hover:shadow-md"
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Deliver to
            </p>
            <p className="text-sm font-semibold text-gray-900">{addressLabel}</p>
            <p className="text-xs text-gray-500">{addressSubLabel}</p>
          </div>
          <span className="text-xs font-semibold text-purple-600">Change</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
            <FiSearch className="text-gray-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search for 'Sweets'"
              className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
            />
            <FiMic className="text-orange-500" />
          </div>
          <button
            onClick={() => setVegOnly((prev) => !prev)}
            className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-[11px] font-semibold text-gray-600 shadow-sm"
          >
            VEG
            <span
              className={`relative h-5 w-10 rounded-full border ${
                vegOnly ? "border-emerald-400 bg-emerald-100" : "border-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${
                  vegOnly ? "left-5" : "left-1"
                }`}
              />
            </span>
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 overflow-x-auto pb-2">
          {categoryChips.map((chip) => (
            <div
              key={chip.label}
              className="flex flex-col items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-sm"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-2xl">
                {chip.emoji}
              </div>
              <span className="text-xs font-semibold text-gray-700">
                {chip.label}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm">
            Filter <FiSliders />
          </button>
          <button className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm">
            Sort by <FiChevronDown />
          </button>
          <span className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm">
            Bolt⚡ Food in 15 mins
          </span>
        </div>
      </div>

      <div className="mx-auto mt-6 grid max-w-3xl gap-6">
        {restaurantCards.map((card) => (
          <div
            key={card.name}
            className="overflow-hidden rounded-3xl bg-white shadow-lg"
          >
            <div className="relative h-48 w-full">
              <Image
                src={card.image}
                alt={card.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 480px"
              />
              <div className="absolute left-4 top-4 rounded-full bg-black/80 px-3 py-1 text-xs font-semibold text-white">
                ✨ You can now discover similar restaurants easily
              </div>
              <div className="absolute bottom-4 left-4 rounded-xl bg-black/70 px-3 py-2 text-xs font-semibold text-white">
                {card.priceNote}
              </div>
            </div>
            <div className="space-y-2 px-4 py-4">
              <div className="flex items-center justify-between text-xs font-semibold text-orange-500">
                <span>Bolt⚡ {card.badge}</span>
                <span className="text-gray-400">•••</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">{card.name}</h3>
              <p className="text-sm font-semibold text-gray-700">
                ⭐ {card.rating} • {card.time}
              </p>
              <p className="text-xs text-gray-500">{card.cuisine}</p>
              <p className="text-xs text-gray-400">{card.location}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
