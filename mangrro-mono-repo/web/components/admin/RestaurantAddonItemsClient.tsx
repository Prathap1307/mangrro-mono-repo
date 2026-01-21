"use client";

import { useEffect, useMemo, useState } from "react";
import AdminCard from "./AdminCard";
import AdminFormField from "./AdminFormField";
import AdminModal from "./AdminModal";
import AdminPageTitle from "./AdminPageTitle";
import AdminShell from "./AdminShell";
import AdminTable from "./AdminTable";
import type { AddonCategory, AddonItem } from "@/lib/admin/restaurants";

interface RestaurantAddonItemsClientProps {
  restaurantName: string;
}

const columns = [
  { key: "name", label: "Addon item" },
  { key: "categoryId", label: "Category" },
  { key: "price", label: "Price" },
  { key: "actions", label: "Actions" },
];

export default function RestaurantAddonItemsClient({
  restaurantName,
}: RestaurantAddonItemsClientProps) {
  const [addonItems, setAddonItems] = useState<AddonItem[]>([]);
  const [addonCategories, setAddonCategories] = useState<AddonCategory[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    name: "",
    price: "",
    categoryId: "",
  });

  const itemsEndpoint = useMemo(
    () => `/api/admin/restaurants/${encodeURIComponent(restaurantName)}/addon-items`,
    [restaurantName],
  );
  const categoriesEndpoint = useMemo(
    () => `/api/admin/restaurants/${encodeURIComponent(restaurantName)}/addon-categories`,
    [restaurantName],
  );

  const loadData = async () => {
    const [itemsRes, categoriesRes] = await Promise.all([
      fetch(itemsEndpoint),
      fetch(categoriesEndpoint),
    ]);
    const [itemsData, categoriesData] = await Promise.all([
      itemsRes.json(),
      categoriesRes.json(),
    ]);
    setAddonItems(Array.isArray(itemsData) ? itemsData : []);
    setAddonCategories(Array.isArray(categoriesData) ? categoriesData : []);
  };

  useEffect(() => {
    void loadData();
  }, [itemsEndpoint, categoriesEndpoint]);

  const categoryNameLookup = useMemo(
    () =>
      new Map(
        addonCategories.map((category) => [category.id, category.name]),
      ),
    [addonCategories],
  );

  const handleSave = async () => {
    const id = editingId ?? crypto.randomUUID();
    const nextItem: AddonItem = {
      id,
      name: formState.name,
      price: formState.price,
      categoryId: formState.categoryId || undefined,
    };
    const nextItems = editingId
      ? addonItems.map((item) => (item.id === id ? nextItem : item))
      : [...addonItems, nextItem];

    await fetch(itemsEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addonItems: nextItems }),
    });
    await loadData();
    setModalOpen(false);
    setEditingId(null);
  };

  const handleEdit = (item: AddonItem) => {
    setEditingId(item.id);
    setFormState({
      name: item.name,
      price: item.price,
      categoryId: item.categoryId ?? "",
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const nextItems = addonItems.filter((item) => item.id !== id);
    await fetch(itemsEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addonItems: nextItems }),
    });
    await loadData();
  };

  return (
    <AdminShell>
      <div className="flex flex-col gap-6">
        <AdminPageTitle
          title="Addons"
          description={`Manage addon items for ${restaurantName}.`}
          action={
            <button
              onClick={() => {
                setEditingId(null);
                setFormState({ name: "", price: "", categoryId: "" });
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200"
            >
              + Add Addon Item
            </button>
          }
        />

        <AdminCard>
          <AdminTable
            columns={columns}
            data={addonItems}
            renderCell={(row, key) => {
              if (key === "categoryId") {
                return categoryNameLookup.get(row.categoryId ?? "") || "—";
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
              return row[key as keyof AddonItem] as React.ReactNode;
            }}
          />
        </AdminCard>
      </div>

      <AdminModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Addon Item" : "Add Addon Item"}
      >
        <div className="grid gap-4">
          <AdminFormField
            label="Addon item name"
            value={formState.name}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, name: event.target.value }))
            }
          />
          <AdminFormField
            label="Category"
            value={formState.categoryId}
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                categoryId: event.target.value,
              }))
            }
          >
            <select
              value={formState.categoryId}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  categoryId: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900"
            >
              <option value="">Select addon category</option>
              {addonCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </AdminFormField>
          <AdminFormField
            label="Price"
            value={formState.price}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, price: event.target.value }))
            }
          />
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
            Save Addon Item
          </button>
        </div>
      </AdminModal>
    </AdminShell>
  );
}
