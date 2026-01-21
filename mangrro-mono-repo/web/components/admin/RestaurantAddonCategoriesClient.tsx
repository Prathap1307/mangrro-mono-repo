"use client";

import { useEffect, useMemo, useState } from "react";
import AdminBadge from "./AdminBadge";
import AdminCard from "./AdminCard";
import AdminFormField from "./AdminFormField";
import AdminModal from "./AdminModal";
import AdminPageTitle from "./AdminPageTitle";
import AdminShell from "./AdminShell";
import AdminTable from "./AdminTable";
import type { AddonCategory, RestaurantCategoryScheduleDay } from "@/lib/admin/restaurants";

interface RestaurantAddonCategoriesClientProps {
  restaurantName: string;
}

const columns = [
  { key: "name", label: "Addon category" },
  { key: "nextActivationTime", label: "Next Activation" },
  { key: "multiSelect", label: "Multi select" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions" },
];

const buildDefaultSchedule = (): RestaurantCategoryScheduleDay[] => [
  { day: "Monday", slots: [{ start: "08:00", end: "12:00" }, { start: "16:00", end: "22:00" }] },
  { day: "Tuesday", slots: [{ start: "08:00", end: "12:00" }, { start: "16:00", end: "22:00" }] },
  { day: "Wednesday", slots: [{ start: "08:00", end: "12:00" }, { start: "16:00", end: "22:00" }] },
  { day: "Thursday", slots: [{ start: "08:00", end: "12:00" }, { start: "16:00", end: "22:00" }] },
  { day: "Friday", slots: [{ start: "08:00", end: "12:00" }, { start: "16:00", end: "22:00" }] },
  { day: "Saturday", slots: [{ start: "08:00", end: "12:00" }, { start: "16:00", end: "22:00" }] },
  { day: "Sunday", slots: [{ start: "08:00", end: "12:00" }, { start: "16:00", end: "22:00" }] },
];

const formatDatetimeLocalValue = (value?: string) => {
  if (!value) return "";
  if (!value.includes("T")) {
    return `${value}T00:00`;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (num: number) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const toIsoTimestamp = (value: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString();
};

export default function RestaurantAddonCategoriesClient({
  restaurantName,
}: RestaurantAddonCategoriesClientProps) {
  const [addonCategories, setAddonCategories] = useState<AddonCategory[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    name: "",
    active: true,
    nextActivationTime: "",
    multiSelect: false,
  });

  const endpoint = useMemo(
    () => `/api/admin/restaurants/${encodeURIComponent(restaurantName)}/addon-categories`,
    [restaurantName],
  );

  const loadAddonCategories = async () => {
    const res = await fetch(endpoint);
    const data = await res.json();
    setAddonCategories(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    void loadAddonCategories();
  }, [endpoint]);

  const handleSave = async () => {
    const id = editingId ?? crypto.randomUUID();
    const existingSchedule = editingId
      ? addonCategories.find((category) => category.id === id)?.schedule
      : undefined;
    const nextCategory: AddonCategory = {
      id,
      name: formState.name,
      active: formState.active,
      nextActivationTime: formState.nextActivationTime
        ? toIsoTimestamp(formState.nextActivationTime)
        : "",
      schedule: existingSchedule?.length ? existingSchedule : buildDefaultSchedule(),
      multiSelect: formState.multiSelect,
    };
    const nextCategories = editingId
      ? addonCategories.map((category) => (category.id === id ? nextCategory : category))
      : [...addonCategories, nextCategory];

    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addonCategories: nextCategories }),
    });
    await loadAddonCategories();
    setModalOpen(false);
    setEditingId(null);
  };

  const handleEdit = (category: AddonCategory) => {
    setEditingId(category.id);
    setFormState({
      name: category.name,
      active: category.active,
      nextActivationTime: formatDatetimeLocalValue(category.nextActivationTime),
      multiSelect: category.multiSelect,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const nextCategories = addonCategories.filter((category) => category.id !== id);
    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addonCategories: nextCategories }),
    });
    await loadAddonCategories();
  };

  return (
    <AdminShell>
      <div className="flex flex-col gap-6">
        <AdminPageTitle
          title="Addons category"
          description={`Manage addon categories for ${restaurantName}.`}
          action={
            <button
              onClick={() => {
                setEditingId(null);
                setFormState({
                  name: "",
                  active: true,
                  nextActivationTime: "",
                  multiSelect: false,
                });
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200"
            >
              + Add Addon Category
            </button>
          }
        />

        <AdminCard>
          <AdminTable
            columns={columns}
            data={addonCategories}
            renderCell={(category, key) => {
              if (key === "status") {
                return (
                  <AdminBadge
                    label={category.active ? "Active" : "Inactive"}
                    tone={category.active ? "success" : "warning"}
                  />
                );
              }
              if (key === "multiSelect") {
                return category.multiSelect ? "Yes" : "No";
              }
              if (key === "nextActivationTime") {
                return category.nextActivationTime || "—";
              }
              if (key === "actions") {
                return (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600"
                    >
                      Delete
                    </button>
                  </div>
                );
              }
              return category[key as keyof AddonCategory] as React.ReactNode;
            }}
          />
        </AdminCard>
      </div>

      <AdminModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Addon Category" : "Add Addon Category"}
      >
        <div className="grid gap-4">
          <AdminFormField
            label="Addon category name"
            value={formState.name}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, name: event.target.value }))
            }
          />
          <AdminFormField label="Active">
            <button
              type="button"
              onClick={() =>
                setFormState((prev) => ({ ...prev, active: !prev.active }))
              }
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              {formState.active ? "Active" : "Inactive"}
            </button>
          </AdminFormField>
          <AdminFormField
            label="Next activation time"
            type="datetime-local"
            value={formState.nextActivationTime}
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                nextActivationTime: event.target.value,
              }))
            }
          />
          <AdminFormField label="Allow multiple selection">
            <input
              type="checkbox"
              checked={formState.multiSelect}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  multiSelect: event.target.checked,
                }))
              }
            />
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
            Save Addon Category
          </button>
        </div>
      </AdminModal>
    </AdminShell>
  );
}
