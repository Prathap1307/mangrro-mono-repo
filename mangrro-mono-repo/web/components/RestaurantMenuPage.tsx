"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  FiChevronDown,
  FiMic,
  FiSearch,
  FiStar,
  FiX,
} from "react-icons/fi";

const filters = ["Ratings 4.0+", "Bestseller", "Veg", "Spicy"];

const categoryList = [
  { label: "Millet Murukku", count: 11 },
  { label: "Millet Gluten Free Murukku Combos", count: 6 },
  { label: "Millet Gluten Free Cookies", count: 8 },
  { label: "Millet Gluten Free Premium Cookies", count: 9 },
  { label: "Millet Gluten Free Cookie Combos", count: 5 },
];

const menuSections = [
  {
    title: "Top Picks",
    items: [
      {
        name: "Chilli Paneer Dry",
        price: "₹215",
        rating: "3.9 (11)",
        image:
          "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80",
        tag: "Bestseller",
      },
      {
        name: "High On Fiber Bowl",
        price: "₹215",
        rating: "4.4 (11)",
        image:
          "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
      },
    ],
  },
  {
    title: "Recommended (20)",
    items: [
      {
        name: "Millet & Nuts Premium Cookies Combo",
        price: "₹270",
        rating: "5 (3)",
        description: "Contains millet almond fingers (120 g) & more",
        image:
          "https://images.unsplash.com/photo-1542843137-8791a6904d2b?auto=format&fit=crop&w=900&q=80",
      },
      {
        name: "Millet & Seeds Premium Cookies",
        price: "₹260",
        rating: "4.6 (8)",
        description: "Premium cookies with seeds and millet blend.",
        image:
          "https://images.unsplash.com/photo-1607082349566-1870c643b535?auto=format&fit=crop&w=900&q=80",
      },
    ],
  },
];

interface RestaurantMenuPageProps {
  restaurantName: string;
}

export default function RestaurantMenuPage({
  restaurantName,
}: RestaurantMenuPageProps) {
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);

  const filteredSections = useMemo(() => {
    if (!search.trim()) return menuSections;
    const query = search.toLowerCase();
    return menuSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) =>
          item.name.toLowerCase().includes(query),
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [search]);

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <div className="mx-auto max-w-3xl px-4 pb-8 pt-6">
        <div className="rounded-[32px] bg-white p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
                Swiggy Seal
              </p>
              <h1 className="text-2xl font-bold text-slate-900">
                {restaurantName}
              </h1>
              <p className="text-sm text-slate-500">
                25-30 mins · Guindy <FiChevronDown className="inline" />
              </p>
            </div>
            <div className="rounded-full bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-700">
              4.7 <FiStar className="inline" />
            </div>
          </div>
          <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            10% off upto ₹40 · Use TRYNEW · Above ₹159
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <FiSearch className="text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Search in ${restaurantName}`}
              className="flex-1 bg-transparent text-sm text-slate-700 outline-none"
            />
            <FiMic className="text-orange-500" />
          </div>
          <button className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
            <FiStar />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          {filters.map((filter) => (
            <button
              key={filter}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600"
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-6">
          {filteredSections.map((section) => (
            <div key={section.title}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">
                  {section.title}
                </h2>
                <FiChevronDown className="text-slate-400" />
              </div>
              <div className="mt-4 grid gap-4">
                {section.items.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-sm"
                  >
                    <div className="flex-1 space-y-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {item.name}
                      </p>
                      <p className="text-sm font-semibold text-slate-700">
                        {item.price}
                      </p>
                      {item.rating && (
                        <p className="text-xs text-emerald-600">
                          ⭐ {item.rating}
                        </p>
                      )}
                      {item.description && (
                        <p className="text-xs text-slate-500">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <div className="relative h-24 w-28 overflow-hidden rounded-2xl">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 112px, 160px"
                      />
                      <button className="absolute bottom-2 right-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-600 shadow">
                        ADD
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => setSheetOpen(true)}
        className="fixed bottom-28 right-6 flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white shadow-2xl"
      >
        MENU
      </button>

      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
          <div className="w-full max-w-md rounded-t-3xl bg-slate-900 px-6 py-6 text-white shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Menu</h3>
              <button onClick={() => setSheetOpen(false)}>
                <FiX />
              </button>
            </div>
            <div className="mt-4 space-y-4">
              {categoryList.map((category) => (
                <div
                  key={category.label}
                  className="flex items-center justify-between text-sm"
                >
                  <span>{category.label}</span>
                  <span className="text-slate-400">{category.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-4 left-1/2 w-[92%] max-w-md -translate-x-1/2 rounded-2xl bg-emerald-500 px-5 py-3 text-white shadow-lg">
        <div className="flex items-center justify-between text-sm font-semibold">
          <span>1 Item added</span>
          <span>View Cart →</span>
        </div>
      </div>
    </div>
  );
}
