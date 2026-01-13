// components/admin/AdminItemsClient.tsx
"use client";

import { useEffect, useState } from "react";
import { FiPlus, FiToggleLeft, FiToggleRight } from "react-icons/fi";

import AdminBadge from "./AdminBadge";
import AdminCard from "./AdminCard";
import AdminFormField from "./AdminFormField";
import AdminModal from "./AdminModal";
import AdminPageTitle from "./AdminPageTitle";
import AdminShell from "./AdminShell";
import AdminTable from "./AdminTable";
import type { AdminItem, AdminCategory } from "@/lib/admin/catalog";

interface Props {
  initialItems: AdminItem[];
}

const columns = [
  { key: "name", label: "Title" },
  { key: "price", label: "Price" },
  { key: "category", label: "Category" },
  { key: "diet", label: "Diet" },
  { key: "ageRestricted", label: "Age Restricted" },
  { key: "active", label: "Status" },
  { key: "actions", label: "Actions" },
];

const DIET_OPTIONS = ["Veg", "Non-Veg", "Vegan"] as const;

const formatDatetimeLocalValue = (value?: string) => {
  if (!value) return "";
  if (!value.includes("T")) {
    return `${value}T00:00`;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (num: number) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const formatDatetimeDisplay = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (num: number) => String(num).padStart(2, "0");
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate()
  )} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(
    date.getUTCSeconds()
  )} UTC`;
};

const toIsoTimestamp = (value: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString();
};

export default function AdminItemsClient({ initialItems }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const [items, setItems] = useState<AdminItem[]>(initialItems);
  const [categories, setCategories] = useState<AdminCategory[]>([]);

  const [formState, setFormState] = useState({
    name: "",
    price: "",
    strikePrice: "",
    category: "",
    categoryId: "",
    subcategoryId: "",
    diet: "Veg" as (typeof DIET_OPTIONS)[number],
    ageRestricted: false,
    active: true,
    schedule: "",
    imageKey: "",
    imageUrl: "",

    // NEW FIELDS
    description: "",
    keywords: "", // comma-separated in UI, array in API
  });

  // Load items
  const loadItems = async () => {
    const res = await fetch("/api/admin/items");
    const json = await res.json();
    setItems(json.data ?? json ?? []);
  };

  // Load categories for dropdown
  const loadCategories = async () => {
    const [categoriesRes, subcategoriesRes] = await Promise.all([
      fetch("/api/admin/categories"),
      fetch("/api/admin/subcategories"),
    ]);
    const [categoriesJson, subcategoriesJson] = await Promise.all([
      categoriesRes.json(),
      subcategoriesRes.json(),
    ]);
    const categoryData: AdminCategory[] =
      categoriesJson.data ?? categoriesJson ?? [];
    const subcategoryData: AdminCategory[] =
      subcategoriesJson.data ?? subcategoriesJson ?? [];
    setCategories([...categoryData, ...subcategoryData]);
  };

  useEffect(() => {
    void (async () => {
      await Promise.all([loadItems(), loadCategories()]);
    })();
  }, []);

  const categoryOptions = categories.filter(
    (category) => category.categoryType === "category" && category.active,
  );

  const subcategoryOptions = categories.filter(
    (category) =>
      category.categoryType === "subcategory" &&
      category.active &&
      category.parentCategoryId === formState.categoryId,
  );

  useEffect(() => {
    if (!formState.subcategoryId) return;
    const stillValid = subcategoryOptions.some(
      (subcategory) => subcategory.id === formState.subcategoryId,
    );
    if (!stillValid) {
      setFormState((prev) => ({ ...prev, subcategoryId: "" }));
    }
  }, [formState.subcategoryId, subcategoryOptions]);

  const handleSave = async () => {
    if (!formState.name.trim() || !formState.price.trim()) {
      alert("Please fill in at least the Title and Price before saving.");
      return;
    }

    const id = editingItemId ?? crypto.randomUUID();

    const keywordsArray = formState.keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    const selectedCategory = categories.find(
      (category) => category.id === formState.categoryId,
    );

    const nextItem = {
      id,
      name: formState.name,
      price: Number(formState.price || 0),
      strikePrice: formState.strikePrice
        ? Number(formState.strikePrice)
        : undefined,
      categoryId: formState.categoryId || undefined,
      subcategoryId: formState.subcategoryId || undefined,
      category: selectedCategory?.name || formState.category || "Alcohol",
      diet: formState.diet,
      ageRestricted: formState.ageRestricted,
      active: formState.active,
      imageKey: formState.imageKey || undefined,
      schedule: formState.schedule
        ? toIsoTimestamp(formState.schedule)
        : undefined,

      // pass through to API
      description: formState.description || "",
      keywords: keywordsArray,
    };

    await fetch("/api/admin/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextItem),
    });

    await loadItems();
    setModalOpen(false);
    setEditingItemId(null);
  };

  const handleDelete = async (id: string) => {
    await fetch("/api/admin/items", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await loadItems();
  };

  const handleImageUpload = async (file?: File) => {
    if (!file) return;

    const res = await fetch(
      `/api/upload-url?file=${encodeURIComponent(file.name)}&type=${file.type}`
    );
    const { uploadUrl, key } = await res.json();

    await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (editingItemId && formState.imageKey && formState.imageKey !== key) {
      await fetch("/api/delete-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: formState.imageKey }),
      });
    }

    setFormState((prev) => ({
      ...prev,
      imageKey: key,
      imageUrl: URL.createObjectURL(file),
    }));
  };

  const columnsDef = columns;

  return (
    <AdminShell>
      <AdminPageTitle
        title="Items"
        description="Add new catalogue entries, toggle availability, and schedule reactivations."
        action={
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md"
            onClick={() => {
              setEditingItemId(null);
              setFormState({
                name: "",
                price: "",
                strikePrice: "",
                category: categoryOptions[0]?.name || "",
                categoryId: categoryOptions[0]?.id || "",
                subcategoryId: "",
                diet: "Veg",
                ageRestricted: false,
                active: true,
                schedule: "",
                imageKey: "",
                imageUrl: "",
                description: "",
                keywords: "",
              });
              setModalOpen(true);
            }}
          >
            <FiPlus /> Add Item
          </button>
        }
      />

      <AdminCard
        title="Catalogue"
        description="Manage veg/non-veg/vegan flags, age restriction, and active toggles"
      >
        <AdminTable
          columns={columnsDef}
          data={items}
          renderCell={(item, key) => {
            if (key === "price") return `£${item.price.toFixed(2)}`;
            if (key === "ageRestricted")
              return item.ageRestricted ? (
                <AdminBadge label="18+" tone="danger" />
              ) : (
                "—"
              );
            if (key === "active")
              return item.active ? (
                <AdminBadge label="Active" tone="success" />
              ) : (item as any).schedule ? (
                <div className="flex flex-col gap-1">
                  <AdminBadge label="Scheduled" tone="warning" />
                  <span className="text-xs text-slate-500">
                    {formatDatetimeDisplay((item as any).schedule)}
                  </span>
                </div>
              ) : (
                <AdminBadge label="Inactive" tone="warning" />
              );

            if (key === "actions")
              return (
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                  <button
                    className="rounded-lg bg-blue-50 px-3 py-1 text-blue-700 hover:bg-blue-100"
                    onClick={() => {
                      setEditingItemId(item.id);
                      setFormState({
                        name: item.name,
                        price: item.price?.toString?.() || "",
                        strikePrice:
                          (item as any).strikePrice?.toString?.() || "",
                        category: item.category,
                        categoryId:
                          item.categoryId ||
                          categories.find((cat) => cat.name === item.category)
                            ?.id ||
                          "",
                        subcategoryId: item.subcategoryId || "",
                        diet: (item.diet as any) || "Veg",
                        ageRestricted: item.ageRestricted,
                        active: item.active,
                        schedule: formatDatetimeLocalValue(
                          (item as any).schedule || ""
                        ),
                        imageKey: (item as any).imageKey || "",
                        imageUrl: (item as any).imageUrl || "",
                        description: (item as any).description || "",
                        keywords: Array.isArray((item as any).keywords)
                          ? (item as any).keywords.join(", ")
                          : "",
                      });
                      setModalOpen(true);
                    }}
                  >
                    Edit
                  </button>

                    <button
                      className="rounded-lg bg-rose-50 px-3 py-1 text-rose-700 hover:bg-rose-100"
                      onClick={() => handleDelete(item.id)}
                    >
                      Delete
                    </button>
                </div>
              );

            if (key === "category") {
              const name =
                categories.find((category) => category.id === item.categoryId)
                  ?.name ?? item.category;
              return name || "—";
            }

            const fallback = item[key as keyof typeof item];
            return (fallback as React.ReactNode) ?? "";
          }}
        />
      </AdminCard>

      <AdminModal
        title={editingItemId ? "Edit item" : "Add new item"}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button
              className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-200"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </button>
            <button
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              onClick={handleSave}
            >
              Save item
            </button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Title */}
          <AdminFormField
            label="Title"
            value={formState.name}
            onChange={(e) =>
              setFormState((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Whiskey"
          />

          {/* Price */}
          <AdminFormField
            label="Price"
            type="number"
            value={formState.price}
            onChange={(e) =>
              setFormState((prev) => ({ ...prev, price: e.target.value }))
            }
            placeholder="29.99"
          />

          {/* Strike price */}
          <AdminFormField
            label="Strike price"
            type="number"
            value={formState.strikePrice}
            onChange={(e) =>
              setFormState((prev) => ({
                ...prev,
                strikePrice: e.target.value,
              }))
            }
            placeholder="34.99"
          />

          {/* Description */}
          <AdminFormField
            label="Description"
            value={formState.description}
            onChange={(e) =>
              setFormState((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            placeholder="Short description of the item"
          />

          {/* Keywords */}
          <AdminFormField
            label="Keywords"
            value={formState.keywords}
            onChange={(e) =>
              setFormState((prev) => ({
                ...prev,
                keywords: e.target.value,
              }))
            }
            placeholder="e.g. whiskey, scotch, premium"
            hint="Comma-separated keywords"
          />

          {formState.imageKey && (
            <div className="col-span-2">
              <p className="text-sm font-semibold text-slate-900">Preview</p>
              <img
                src={
                  formState.imageUrl ||
                  `/api/image-proxy?key=${formState.imageKey}`
                }
                className="h-32 w-auto rounded-xl border object-cover"
              />
            </div>
          )}

          {/* Category dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-slate-900">
              Category
            </label>
            <select
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
              value={formState.categoryId}
              onChange={(e) =>
                setFormState((prev) => {
                  const selected = categoryOptions.find(
                    (category) => category.id === e.target.value,
                  );
                  return {
                    ...prev,
                    categoryId: e.target.value,
                    category: selected?.name || "",
                    subcategoryId: "",
                  };
                })
              }
            >
              <option value="">Select category</option>
              {categoryOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500">
              Loaded from /api/admin/categories
            </p>
          </div>

          {/* Subcategory dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-slate-900">
              Subcategory
            </label>
            <select
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
              value={formState.subcategoryId}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  subcategoryId: e.target.value,
                }))
              }
              disabled={!formState.categoryId}
            >
              <option value="">Select subcategory</option>
              {subcategoryOptions.map((subcategory) => (
                <option key={subcategory.id} value={subcategory.id}>
                  {subcategory.name}
                </option>
              ))}
            </select>
          </div>

          {/* Diet dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-slate-900">
              Diet
            </label>
            <select
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
              value={formState.diet}
              onChange={(e) =>
                setFormState((prev) => ({
                  ...prev,
                  diet: e.target.value as (typeof DIET_OPTIONS)[number],
                }))
              }
            >
              {DIET_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Age restricted toggle */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Age restricted
              </p>
              <p className="text-xs text-slate-500">Flag as 18+ item.</p>
            </div>
            <button
              onClick={() =>
                setFormState((prev) => ({
                  ...prev,
                  ageRestricted: !prev.ageRestricted,
                }))
              }
              className="text-blue-600"
            >
              {formState.ageRestricted ? (
                <FiToggleRight className="h-6 w-6" />
              ) : (
                <FiToggleLeft className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Active</p>
              <p className="text-xs text-slate-500">
                Toggle availability instantly.
              </p>
            </div>
            <button
              onClick={() =>
                setFormState((prev) => ({ ...prev, active: !prev.active }))
              }
              aria-pressed={formState.active}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold transition ${
                formState.active
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-600"
              }`}
            >
              {formState.active ? (
                <FiToggleRight className="h-5 w-5" />
              ) : (
                <FiToggleLeft className="h-5 w-5" />
              )}
              <span>{formState.active ? "Active" : "Inactive"}</span>
            </button>
          </div>

          {/* Schedule reactivation */}
          <AdminFormField
            label="Schedule reactivation"
            type="datetime-local"
            value={formState.schedule}
            onChange={(e) =>
              setFormState((prev) => ({ ...prev, schedule: e.target.value }))
            }
            hint="Optional date to auto-reactivate"
          />

          {/* Upload image */}
          <AdminFormField
            label="Upload image"
            type="file"
            onChange={(e) => handleImageUpload(e.target.files?.[0])}
          />
        </div>
      </AdminModal>
    </AdminShell>
  );
}
