"use client";

import { useEffect, useMemo, useState } from "react";
import AdminCard from "./AdminCard";
import AdminFormField from "./AdminFormField";
import AdminModal from "./AdminModal";
import AdminPageTitle from "./AdminPageTitle";
import AdminShell from "./AdminShell";
import AdminTable from "./AdminTable";
import Link from "next/link";
import type {
  AddonCategory,
  RestaurantCategory,
  RestaurantItem,
} from "@/lib/admin/restaurants";

interface RestaurantItemsClientProps {
  restaurantName: string;
}

const columns = [
  { key: "name", label: "Item" },
  { key: "price", label: "Price" },
  { key: "categoryName", label: "Category" },
  { key: "tax", label: "Tax" },
  { key: "actions", label: "Actions" },
];

export default function RestaurantItemsClient({
  restaurantName,
}: RestaurantItemsClientProps) {
  const [items, setItems] = useState<RestaurantItem[]>([]);
  const [categories, setCategories] = useState<RestaurantCategory[]>([]);
  const [addonCategories, setAddonCategories] = useState<AddonCategory[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    name: "",
    keywords: "",
    categoryName: "",
    price: "",
    strikePrice: "",
    description: "",
    imageKey: "",
    imageUrl: "",
    taxEnabled: false,
    taxType: "percentage",
    taxValue: "",
    taxLabel: "",
    packingChargeEnabled: false,
    packingChargeType: "percentage",
    packingChargeLabel: "",
    packingChargeValue: "",
    addonCategoryIds: [] as string[],
  });

  const endpoint = useMemo(
    () => `/api/admin/restaurants/${encodeURIComponent(restaurantName)}/items`,
    [restaurantName],
  );
  const categoriesEndpoint = useMemo(
    () => `/api/admin/restaurants/${encodeURIComponent(restaurantName)}/categories`,
    [restaurantName],
  );
  const addonCategoriesEndpoint = useMemo(
    () => `/api/admin/restaurants/${encodeURIComponent(restaurantName)}/addon-categories`,
    [restaurantName],
  );

  const loadData = async () => {
    const [itemsRes, categoriesRes, addonCategoriesRes] = await Promise.all([
      fetch(endpoint),
      fetch(categoriesEndpoint),
      fetch(addonCategoriesEndpoint),
    ]);
    const [itemsData, categoriesData, addonCategoriesData] = await Promise.all([
      itemsRes.json(),
      categoriesRes.json(),
      addonCategoriesRes.json(),
    ]);
    setItems(Array.isArray(itemsData) ? itemsData : []);
    setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    setAddonCategories(Array.isArray(addonCategoriesData) ? addonCategoriesData : []);
  };

  useEffect(() => {
    void loadData();
  }, [endpoint, categoriesEndpoint, addonCategoriesEndpoint]);

  const handleSave = async () => {
    const id = editingId ?? crypto.randomUUID();
    const keywordsArray = formState.keywords
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    const nextItem: RestaurantItem = {
      id,
      name: formState.name,
      keywords: keywordsArray,
      categoryName: formState.categoryName || undefined,
      price: formState.price,
      strikePrice: formState.strikePrice || undefined,
      description: formState.description || undefined,
      imageKey: formState.imageKey || undefined,
      tax: {
        enabled: formState.taxEnabled,
        type: formState.taxType === "fixed" ? "fixed" : "percentage",
        value: formState.taxValue,
        label: formState.taxLabel,
      },
      packingCharge: {
        enabled: formState.packingChargeEnabled,
        type: formState.packingChargeType === "fixed" ? "fixed" : "percentage",
        label: formState.packingChargeLabel,
        value: formState.packingChargeValue,
      },
      addonCategoryIds: formState.addonCategoryIds.length
        ? formState.addonCategoryIds
        : undefined,
    };

    const nextItems = editingId
      ? items.map((item) => (item.id === id ? nextItem : item))
      : [...items, nextItem];

    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: nextItems }),
    });
    await loadData();
    setModalOpen(false);
    setEditingId(null);
  };

  const handleEdit = (item: RestaurantItem) => {
    setEditingId(item.id);
    setFormState({
      name: item.name,
      keywords: item.keywords.join(", "),
      categoryName: item.categoryName ?? "",
      price: item.price,
      strikePrice: item.strikePrice ?? "",
      description: item.description ?? "",
      imageKey: item.imageKey ?? "",
      imageUrl: item.imageUrl ?? "",
      taxEnabled: item.tax.enabled,
      taxType: item.tax.type,
      taxValue: item.tax.value,
      taxLabel: item.tax.label,
      packingChargeEnabled: item.packingCharge.enabled,
      packingChargeType: item.packingCharge.type ?? "percentage",
      packingChargeLabel: item.packingCharge.label ?? "",
      packingChargeValue: item.packingCharge.value,
      addonCategoryIds: item.addonCategoryIds ?? [],
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const nextItems = items.filter((item) => item.id !== id);
    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: nextItems }),
    });
    await loadData();
  };

  const handleImageUpload = async (file?: File) => {
    if (!file) return;
    const res = await fetch(
      `/api/upload-url?file=${encodeURIComponent(file.name)}&type=${file.type}`,
    );
    const { uploadUrl, key } = await res.json();
    await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    setFormState((prev) => ({
      ...prev,
      imageKey: key,
      imageUrl: URL.createObjectURL(file),
    }));
  };

  return (
    <AdminShell>
      <div className="flex flex-col gap-6">
        <AdminPageTitle
          title="Items"
          description={`Manage items for ${restaurantName}.`}
          action={
            <button
              onClick={() => {
                setEditingId(null);
                setFormState({
                  name: "",
                  keywords: "",
                  categoryName: "",
                  price: "",
                  strikePrice: "",
                  description: "",
                  imageKey: "",
                  imageUrl: "",
                  taxEnabled: false,
                  taxType: "percentage",
                  taxValue: "",
                  taxLabel: "",
                  packingChargeEnabled: false,
                  packingChargeType: "percentage",
                  packingChargeLabel: "",
                  packingChargeValue: "",
                  addonCategoryIds: [],
                });
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200"
            >
              + Add Item
            </button>
          }
        />

        <AdminCard>
          <AdminTable
            columns={columns}
            data={items}
            renderCell={(row, key) => {
              if (key === "tax") {
                return row.tax.enabled
                  ? `${row.tax.label || "Tax"} · ${row.tax.type} ${row.tax.value}`
                  : "—";
              }
              if (key === "actions") {
                return (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(row)}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(row.id)}
                      className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600"
                    >
                      Delete
                    </button>
                  </div>
                );
              }
              return row[key as keyof RestaurantItem] as React.ReactNode;
            }}
          />
        </AdminCard>
      </div>

      <AdminModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Item" : "Add Item"}
        size="xl"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <AdminFormField
            label="Item name"
            value={formState.name}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, name: event.target.value }))
            }
          />
          <AdminFormField
            label="Category"
            value={formState.categoryName}
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                categoryName: event.target.value,
              }))
            }
            placeholder="Top Picks"
          >
            <select
              value={formState.categoryName}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  categoryName: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900"
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </AdminFormField>
          <AdminFormField
            label="Keywords"
            value={formState.keywords}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, keywords: event.target.value }))
            }
            hint="Comma separated keywords"
            className="md:col-span-2"
          />
          <AdminFormField
            label="Original price"
            value={formState.price}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, price: event.target.value }))
            }
          />
          <AdminFormField
            label="Strike price"
            value={formState.strikePrice}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, strikePrice: event.target.value }))
            }
          />
          <AdminFormField label="Description" className="md:col-span-2">
            <textarea
              value={formState.description}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, description: event.target.value }))
              }
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </AdminFormField>
          <AdminFormField label="Photo" className="md:col-span-2">
            <div className="flex flex-col gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={(event) => handleImageUpload(event.target.files?.[0])}
              />
              {formState.imageUrl && (
                <img
                  src={formState.imageUrl}
                  alt="Item"
                  className="h-32 w-32 rounded-2xl object-cover"
                />
              )}
            </div>
          </AdminFormField>
          <AdminFormField label="Tax enabled">
            <input
              type="checkbox"
              checked={formState.taxEnabled}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  taxEnabled: event.target.checked,
                }))
              }
            />
          </AdminFormField>
          {formState.taxEnabled && (
            <>
              <AdminFormField
                label="Tax type"
                value={formState.taxType}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    taxType: event.target.value,
                  }))
                }
              >
                <select
                  value={formState.taxType}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      taxType: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed</option>
                </select>
              </AdminFormField>
              <AdminFormField
                label="Tax label"
                value={formState.taxLabel}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    taxLabel: event.target.value,
                  }))
                }
                placeholder="Tax / Packing charge"
              />
              <AdminFormField
                label="Tax value"
                value={formState.taxValue}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    taxValue: event.target.value,
                  }))
                }
              />
            </>
          )}
          <AdminFormField label="Packing charge">
            <input
              type="checkbox"
              checked={formState.packingChargeEnabled}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  packingChargeEnabled: event.target.checked,
                }))
              }
            />
          </AdminFormField>
          {formState.packingChargeEnabled && (
            <>
              <AdminFormField
                label="Packing charge type"
                value={formState.packingChargeType}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    packingChargeType: event.target.value,
                  }))
                }
              >
                <select
                  value={formState.packingChargeType}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      packingChargeType: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed</option>
                </select>
              </AdminFormField>
              <AdminFormField
                label="Packing charge label"
                value={formState.packingChargeLabel}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    packingChargeLabel: event.target.value,
                  }))
                }
                placeholder="Packaging fee"
              />
              <AdminFormField
                label="Packing charge value"
                value={formState.packingChargeValue}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    packingChargeValue: event.target.value,
                  }))
                }
              />
            </>
          )}
          <AdminFormField
            label="Addon categories"
            hint="Select addon categories for this item."
            className="md:col-span-2"
          >
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">
                  Addon categories
                </p>
                <Link
                  href={`/admin/${encodeURIComponent(restaurantName)}/addons-category`}
                  className="text-xs font-semibold text-blue-600"
                >
                  + Add addon category
                </Link>
              </div>
              {addonCategories.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No addon categories yet.
                </p>
              ) : (
                <div className="grid gap-2 md:grid-cols-2">
                  {addonCategories.map((category) => (
                    <label
                      key={category.id}
                      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={formState.addonCategoryIds.includes(category.id)}
                        onChange={(event) =>
                          setFormState((prev) => {
                            const nextIds = event.target.checked
                              ? [...prev.addonCategoryIds, category.id]
                              : prev.addonCategoryIds.filter(
                                  (id) => id !== category.id,
                                );
                            return { ...prev, addonCategoryIds: nextIds };
                          })
                        }
                      />
                      {category.name}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </AdminFormField>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => setModalOpen(false)}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-200"
          >
            Save Item
          </button>
        </div>
      </AdminModal>
    </AdminShell>
  );
}
