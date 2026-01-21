"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  FiArrowLeft,
  FiChevronDown,
  FiMic,
  FiMoreVertical,
  FiSearch,
  FiStar,
  FiUserPlus,
  FiX,
} from "react-icons/fi";
import Navbar from "@/components/Navbar";
import { useFoodCart } from "@/components/context/FoodCartContext";

const filters = [
  { key: "rating", label: "Ratings 4.0+" },
  { key: "bestseller", label: "Bestseller" },
  { key: "veg", label: "Veg" },
  { key: "spicy", label: "Spicy" },
];

interface RestaurantCategory {
  id: string;
  name: string;
}

interface RestaurantItem {
  id: string;
  name: string;
  keywords: string[];
  categoryName?: string;
  price: string;
  strikePrice?: string;
  description?: string;
  imageUrl?: string;
  addonCategoryIds?: string[];
  vegType?: "veg" | "nonveg";
  bestSeller?: boolean;
}

interface AddonCategory {
  id: string;
  name: string;
  multiSelect: boolean;
}

interface AddonItem {
  id: string;
  name: string;
  price: string;
  categoryId?: string;
}

interface RestaurantMenuPageProps {
  restaurantName: string;
}

interface RestaurantDetails {
  name: string;
  address: string;
  averagePrepTime: string;
}

export default function RestaurantMenuPage({
  restaurantName,
}: RestaurantMenuPageProps) {
  const { addItem: addFoodItem, itemCount: foodItemCount } = useFoodCart();
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [addonOpen, setAddonOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RestaurantItem | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [categories, setCategories] = useState<RestaurantCategory[]>([]);
  const [items, setItems] = useState<RestaurantItem[]>([]);
  const [addonCategories, setAddonCategories] = useState<AddonCategory[]>([]);
  const [addonItems, setAddonItems] = useState<AddonItem[]>([]);
  const [restaurantDetails, setRestaurantDetails] = useState<RestaurantDetails | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        const [
          categoryRes,
          itemRes,
          addonCategoryRes,
          addonItemRes,
          restaurantRes,
        ] = await Promise.all([
          fetch(`/api/admin/restaurants/${encodeURIComponent(restaurantName)}/categories`),
          fetch(`/api/admin/restaurants/${encodeURIComponent(restaurantName)}/items`),
          fetch(`/api/admin/restaurants/${encodeURIComponent(restaurantName)}/addon-categories`),
          fetch(`/api/admin/restaurants/${encodeURIComponent(restaurantName)}/addon-items`),
          fetch("/api/admin/restaurants"),
        ]);
        const [categoryData, itemData] = await Promise.all([
          categoryRes.json(),
          itemRes.json(),
        ]);
        const [addonCategoryData, addonItemData] = await Promise.all([
          addonCategoryRes.json(),
          addonItemRes.json(),
        ]);
        const restaurantData = await restaurantRes.json();
        if (!mounted) return;
        setCategories(Array.isArray(categoryData) ? categoryData : []);
        setItems(Array.isArray(itemData) ? itemData : []);
        setAddonCategories(Array.isArray(addonCategoryData) ? addonCategoryData : []);
        setAddonItems(Array.isArray(addonItemData) ? addonItemData : []);
        const restaurantList = Array.isArray(restaurantData)
          ? restaurantData
          : restaurantData?.data ?? [];
        const matched = Array.isArray(restaurantList)
          ? restaurantList.find(
              (restaurant: RestaurantDetails) =>
                restaurant.name?.toLowerCase?.() === restaurantName.toLowerCase(),
            )
          : null;
        setRestaurantDetails(
          matched
            ? {
                name: matched.name ?? restaurantName,
                address: matched.address ?? "",
                averagePrepTime: matched.averagePrepTime ?? "",
              }
            : null,
        );
      } catch (error) {
        if (mounted) {
          setCategories([]);
          setItems([]);
          setAddonCategories([]);
          setAddonItems([]);
          setRestaurantDetails(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadData();
    return () => {
      mounted = false;
    };
  }, [restaurantName]);

  const filteredSections = useMemo(() => {
    const query = search.trim().toLowerCase();
    const baseFilteredItems = !query
      ? items
      : items.filter((item) => {
          const haystack = [
            item.name,
            item.description ?? "",
            item.categoryName ?? "",
            ...(item.keywords ?? []),
          ]
            .join(" ")
            .toLowerCase();
          return haystack.includes(query);
        });
    const activeFilterSet = new Set(activeFilters);
    const filteredItems = baseFilteredItems.filter((item) => {
      if (activeFilterSet.has("bestseller") && !item.bestSeller) {
        return false;
      }
      if (activeFilterSet.has("veg") && item.vegType !== "veg") {
        return false;
      }
      if (activeFilterSet.has("spicy")) {
        const keywordMatches = (item.keywords ?? []).some((keyword) =>
          keyword.toLowerCase().includes("spicy"),
        );
        if (!keywordMatches) {
          return false;
        }
      }
      return true;
    });

    const sections = categories.length
      ? categories.map((category) => ({
          title: category.name,
          items: filteredItems.filter(
            (item) => (item.categoryName ?? "Uncategorized") === category.name,
          ),
        }))
      : [
          {
            title: "Menu",
            items: filteredItems,
          },
        ];

    return sections.filter((section) => section.items.length > 0);
  }, [activeFilters, categories, items, search]);

  const categoryList = useMemo(
    () =>
      categories.map((category) => ({
        label: category.name,
        count: items.filter(
          (item) => (item.categoryName ?? "Uncategorized") === category.name,
        ).length,
      })),
    [categories, items],
  );

  const addonCategoryList = useMemo(
    () =>
      addonCategories.map((category) => ({
        ...category,
        items: addonItems.filter((item) => item.categoryId === category.id),
      })),
    [addonCategories, addonItems],
  );

  const visibleAddonCategories = useMemo(() => {
    if (!selectedItem?.addonCategoryIds?.length) {
      return addonCategoryList;
    }
    const allowed = new Set(selectedItem.addonCategoryIds);
    return addonCategoryList.filter((category) => allowed.has(category.id));
  }, [addonCategoryList, selectedItem]);

  const parsePrice = (value: string) => {
    const parsed = Number(String(value).replace(/[^0-9.]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const handleAddToFoodCart = () => {
    if (!selectedItem) return;
    addFoodItem({
      id: selectedItem.id,
      name: selectedItem.name,
      price: parsePrice(selectedItem.price),
      image: selectedItem.imageUrl,
      available: true,
      description: selectedItem.description,
      keywords: selectedItem.keywords,
      category: selectedItem.categoryName,
    });
    setAddonOpen(false);
  };

  const handleFilterToggle = (key: string) => {
    setActiveFilters((prev) =>
      prev.includes(key) ? prev.filter((filter) => filter !== key) : [...prev, key],
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 pb-8 pt-6">
        <div className="mb-4 flex items-center justify-between">
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-600 shadow">
            <FiArrowLeft />
          </button>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm">
              <FiUserPlus /> Group Order
            </button>
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-600 shadow">
              <FiMoreVertical />
            </button>
          </div>
        </div>

        <div className="rounded-[32px] bg-white p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
                Delivery Star
              </p>
              <h1 className="text-2xl font-bold text-slate-900">
                {restaurantDetails?.name ?? restaurantName}
              </h1>
              <p className="text-sm text-slate-500">
                {restaurantDetails?.averagePrepTime
                  ? `${restaurantDetails.averagePrepTime} · `
                  : ""}
                {restaurantDetails?.address || "Address unavailable"}{" "}
                <FiChevronDown className="inline" />
              </p>
            </div>
            <div className="rounded-full bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-700">
              Open <FiStar className="inline" />
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
              key={filter.key}
              onClick={() => handleFilterToggle(filter.key)}
              className={`rounded-full border px-4 py-2 text-xs font-semibold ${
                activeFilters.includes(filter.key)
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-600"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-6">
          {loading ? (
            <div className="rounded-3xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500 shadow-sm">
              Loading menu...
            </div>
          ) : filteredSections.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500 shadow-sm">
              No menu items available yet.
            </div>
          ) : (
            filteredSections.map((section) => (
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
                      key={item.id}
                      className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-sm"
                    >
                      <div className="flex-1 space-y-2">
                        <p className="text-sm font-semibold text-slate-900">
                          {item.name}
                        </p>
                        <p className="text-sm font-semibold text-slate-700">
                          {item.price}
                        </p>
                        {item.strikePrice && (
                          <p className="text-xs text-slate-400 line-through">
                            {item.strikePrice}
                          </p>
                        )}
                        {item.description && (
                          <p className="text-xs text-slate-500">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <div className="relative h-24 w-28 overflow-hidden rounded-2xl">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 112px, 160px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-slate-100 text-xs text-slate-400">
                            No image
                          </div>
                        )}
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setAddonOpen(true);
                        }}
                        className="absolute bottom-2 right-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-600 shadow"
                      >
                        ADD
                      </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
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
              {(categoryList.length ? categoryList : [{ label: "Menu", count: items.length }]).map(
                (category) => (
                  <div
                    key={category.label}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{category.label}</span>
                    <span className="text-slate-400">{category.count}</span>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      )}

      {addonOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
          <div className="w-full max-w-md rounded-t-3xl bg-white px-6 py-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Choose Addons
              </h3>
              <button onClick={() => setAddonOpen(false)} className="rounded-full bg-slate-100 p-2">
                <FiX />
              </button>
            </div>
            <div className="mt-4 space-y-5">
              {visibleAddonCategories.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  No addon categories available for this item.
                </div>
              ) : (
                visibleAddonCategories.map((category) => (
                  <div key={category.id}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {category.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {category.multiSelect ? "Select up to 2" : "Select any 1"}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-orange-500">
                        Select All
                      </span>
                    </div>
                    <div className="mt-3 space-y-2 rounded-2xl border border-slate-200 bg-white p-3">
                      {category.items.length === 0 ? (
                        <p className="text-xs text-slate-500">
                          No addon items in this category.
                        </p>
                      ) : (
                        category.items.map((item) => (
                          <label
                            key={item.id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2 text-sm text-slate-700"
                          >
                            <span>{item.name}</span>
                            <span className="text-slate-500">+ {item.price}</span>
                            <input type="checkbox" className="h-4 w-4" />
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-6 flex items-center justify-between rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white">
              <span>
                {selectedItem ? selectedItem.name : "Item"}
              </span>
              <button onClick={handleAddToFoodCart}>
                Add Item | ₹{parsePrice(selectedItem?.price ?? "0")}
              </button>
            </div>
          </div>
        </div>
      )}

      {foodItemCount > 0 && (
        <Link
          href="/food-cart"
          className="fixed bottom-4 left-1/2 w-[92%] max-w-md -translate-x-1/2 rounded-2xl bg-emerald-500 px-5 py-3 text-white shadow-lg"
        >
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>{foodItemCount} Item{foodItemCount > 1 ? "s" : ""} added</span>
            <span>View Cart →</span>
          </div>
        </Link>
      )}
    </div>
  );
}
