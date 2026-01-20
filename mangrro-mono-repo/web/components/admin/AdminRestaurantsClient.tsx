"use client";

import { useEffect, useMemo, useState } from "react";
import { FiPlus, FiToggleLeft, FiToggleRight } from "react-icons/fi";

import AdminBadge from "./AdminBadge";
import AdminCard from "./AdminCard";
import AdminFormField from "./AdminFormField";
import AdminModal from "./AdminModal";
import AdminPageTitle from "./AdminPageTitle";
import AdminShell from "./AdminShell";
import AdminTable from "./AdminTable";
import type { AdminRestaurant } from "@/lib/admin/restaurants";

interface Props {
  initialRestaurants: AdminRestaurant[];
}

const columns = [
  { key: "name", label: "Restaurant" },
  { key: "cuisine", label: "Cuisine" },
  { key: "address", label: "Address" },
  { key: "averagePrepTime", label: "Prep Time" },
  { key: "active", label: "Status" },
  { key: "username", label: "Username" },
  { key: "actions", label: "Actions" },
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

export default function AdminRestaurantsClient({ initialRestaurants }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRestaurantId, setEditingRestaurantId] = useState<string | null>(
    null,
  );
  const [restaurants, setRestaurants] = useState<AdminRestaurant[]>(
    initialRestaurants,
  );

  const [formState, setFormState] = useState({
    name: "",
    keywords: "",
    cuisine: "",
    address: "",
    lat: "",
    lng: "",
    description: "",
    imageKey: "",
    imageUrl: "",
    averagePrepTime: "",
    active: true,
    nextActivationTime: "",
    username: "",
    password: "",
  });

  const loadRestaurants = async () => {
    const res = await fetch("/api/admin/restaurants");
    const json = await res.json();
    setRestaurants(json.data ?? json ?? []);
  };

  useEffect(() => {
    void loadRestaurants();
  }, []);

  const cuisinePreview = useMemo(
    () =>
      formState.cuisine
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
        .slice(0, 5),
    [formState.cuisine],
  );

  const handleSave = async () => {
    if (!formState.name.trim()) {
      alert("Please fill in at least the restaurant name before saving.");
      return;
    }

    const id = editingRestaurantId ?? crypto.randomUUID();
    const keywordsArray = formState.keywords
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    const cuisineArray = formState.cuisine
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, 5);

    const nextRestaurant = {
      id,
      name: formState.name,
      keywords: keywordsArray,
      cuisine: cuisineArray,
      address: formState.address,
      lat: formState.lat,
      lng: formState.lng,
      description: formState.description,
      imageKey: formState.imageKey || undefined,
      averagePrepTime: formState.averagePrepTime,
      active: formState.active,
      nextActivationTime: formState.nextActivationTime
        ? toIsoTimestamp(formState.nextActivationTime)
        : "",
      username: formState.username,
      password: formState.password,
    };

    await fetch("/api/admin/restaurants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextRestaurant),
    });

    await loadRestaurants();
    setModalOpen(false);
    setEditingRestaurantId(null);
  };

  const handleDelete = async (id: string) => {
    await fetch("/api/admin/restaurants", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await loadRestaurants();
  };

  const handleEdit = (restaurant: AdminRestaurant) => {
    setEditingRestaurantId(restaurant.id);
    setFormState({
      name: restaurant.name,
      keywords: restaurant.keywords.join(", "),
      cuisine: restaurant.cuisine.join(", "),
      address: restaurant.address,
      lat: restaurant.lat,
      lng: restaurant.lng,
      description: restaurant.description,
      imageKey: restaurant.imageKey ?? "",
      imageUrl: restaurant.imageUrl ?? "",
      averagePrepTime: restaurant.averagePrepTime,
      active: restaurant.active,
      nextActivationTime: formatDatetimeLocalValue(
        restaurant.nextActivationTime,
      ),
      username: restaurant.username,
      password: restaurant.password,
    });
    setModalOpen(true);
  };

  const resetForm = () => {
    setEditingRestaurantId(null);
    setFormState({
      name: "",
      keywords: "",
      cuisine: "",
      address: "",
      lat: "",
      lng: "",
      description: "",
      imageKey: "",
      imageUrl: "",
      averagePrepTime: "",
      active: true,
      nextActivationTime: "",
      username: "",
      password: "",
    });
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
          title="Order Food"
          description="Add and manage restaurant profiles for the food marketplace."
          actions={
            <button
              onClick={() => {
                resetForm();
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5"
            >
              <FiPlus /> Add Restaurant
            </button>
          }
        />

        <AdminCard>
          {restaurants.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
              <p>No restaurants yet. Add your first restaurant to get started.</p>
              <button
                onClick={() => {
                  resetForm();
                  setModalOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5"
              >
                <FiPlus /> Add Restaurant
              </button>
            </div>
          ) : (
            <AdminTable
              columns={columns}
              data={restaurants}
              renderCell={(restaurant, key) => {
                const record = restaurant as AdminRestaurant;
                if (key === "active") {
                  return (
                    <AdminBadge
                      label={record.active ? "Active" : "Inactive"}
                      tone={record.active ? "success" : "warning"}
                    />
                  );
                }
                if (key === "cuisine") {
                  return (
                    <span className="text-xs text-slate-600">
                      {record.cuisine.join(", ")}
                    </span>
                  );
                }
                if (key === "actions") {
                  return (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(record)}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-blue-200 hover:text-blue-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        Delete
                      </button>
                    </div>
                  );
                }
                return record[key as keyof AdminRestaurant] as React.ReactNode;
              }}
            />
          )}
        </AdminCard>
      </div>

      <AdminModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingRestaurantId ? "Edit Restaurant" : "Add Restaurant"}
        size="xl"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <AdminFormField
            label="Restaurant Name"
            value={formState.name}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, name: event.target.value }))
            }
          />
          <AdminFormField
            label="Average Preparation Time"
            value={formState.averagePrepTime}
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                averagePrepTime: event.target.value,
              }))
            }
            placeholder="25-30 mins"
          />
          <AdminFormField
            label="Keywords"
            value={formState.keywords}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, keywords: event.target.value }))
            }
            hint="Comma separated (e.g. burger, fried chicken, spicy)"
          />
          <AdminFormField
            label="Cuisine (up to 5)"
            value={formState.cuisine}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, cuisine: event.target.value }))
            }
            hint={`Saved: ${cuisinePreview.join(", ") || "None"}`}
          />
          <AdminFormField
            label="Address"
            value={formState.address}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, address: event.target.value }))
            }
            className="md:col-span-2"
          />
          <AdminFormField
            label="Latitude"
            value={formState.lat}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, lat: event.target.value }))
            }
          />
          <AdminFormField
            label="Longitude"
            value={formState.lng}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, lng: event.target.value }))
            }
          />
          <AdminFormField label="Description" className="md:col-span-2">
            <textarea
              value={formState.description}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </AdminFormField>
          <AdminFormField label="Profile Image" className="md:col-span-2">
            <div className="flex flex-col gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={(event) => handleImageUpload(event.target.files?.[0])}
              />
              {formState.imageUrl && (
                <img
                  src={formState.imageUrl}
                  alt="Restaurant"
                  className="h-32 w-32 rounded-2xl object-cover"
                />
              )}
            </div>
          </AdminFormField>
          <AdminFormField
            label="Next Activation Time"
            type="datetime-local"
            value={formState.nextActivationTime}
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                nextActivationTime: event.target.value,
              }))
            }
          />
          <AdminFormField label="Active">
            <button
              type="button"
              onClick={() =>
                setFormState((prev) => ({ ...prev, active: !prev.active }))
              }
              className="flex items-center gap-3 text-sm font-semibold text-slate-700"
            >
              {formState.active ? (
                <FiToggleRight className="text-3xl text-emerald-500" />
              ) : (
                <FiToggleLeft className="text-3xl text-slate-400" />
              )}
              {formState.active ? "Active" : "Inactive"}
            </button>
          </AdminFormField>
          <AdminFormField
            label="Username"
            value={formState.username}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, username: event.target.value }))
            }
          />
          <AdminFormField
            label="Password"
            type="text"
            value={formState.password}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, password: event.target.value }))
            }
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => setModalOpen(false)}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-200"
          >
            Save Restaurant
          </button>
        </div>
      </AdminModal>
    </AdminShell>
  );
}
