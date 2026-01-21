"use client";

import { useEffect, useMemo, useState } from "react";
import AdminCard from "./AdminCard";
import AdminFormField from "./AdminFormField";
import AdminModal from "./AdminModal";
import AdminPageTitle from "./AdminPageTitle";
import AdminShell from "./AdminShell";
import AdminTable from "./AdminTable";
import type { RestaurantOffer } from "@/lib/admin/restaurants";

interface RestaurantOffersClientProps {
  restaurantName: string;
}

const columns = [
  { key: "name", label: "Offer" },
  { key: "code", label: "Code" },
  { key: "type", label: "Type" },
  { key: "value", label: "Value" },
  { key: "actions", label: "Actions" },
];

export default function RestaurantOffersClient({
  restaurantName,
}: RestaurantOffersClientProps) {
  const [offers, setOffers] = useState<RestaurantOffer[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    name: "",
    code: "",
    type: "percentage",
    label: "",
    value: "",
  });

  const endpoint = useMemo(
    () => `/api/admin/restaurants/${encodeURIComponent(restaurantName)}/offers`,
    [restaurantName],
  );

  const loadOffers = async () => {
    const res = await fetch(endpoint);
    const data = await res.json();
    setOffers(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    void loadOffers();
  }, [endpoint]);

  const handleSave = async () => {
    const id = editingId ?? crypto.randomUUID();
    const nextOffer: RestaurantOffer = {
      id,
      name: formState.name,
      code: formState.code,
      type: formState.type === "fixed" ? "fixed" : "percentage",
      label: formState.label,
      value: formState.value,
    };
    const nextOffers = editingId
      ? offers.map((offer) => (offer.id === id ? nextOffer : offer))
      : [...offers, nextOffer];

    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offers: nextOffers }),
    });
    await loadOffers();
    setModalOpen(false);
    setEditingId(null);
  };

  const handleEdit = (offer: RestaurantOffer) => {
    setEditingId(offer.id);
    setFormState({
      name: offer.name,
      code: offer.code,
      type: offer.type,
      label: offer.label,
      value: offer.value,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const nextOffers = offers.filter((offer) => offer.id !== id);
    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offers: nextOffers }),
    });
    await loadOffers();
  };

  return (
    <AdminShell>
      <div className="flex flex-col gap-6">
        <AdminPageTitle
          title="Offers"
          description={`Manage offers for ${restaurantName}.`}
          action={
            <button
              onClick={() => {
                setEditingId(null);
                setFormState({
                  name: "",
                  code: "",
                  type: "percentage",
                  label: "",
                  value: "",
                });
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200"
            >
              + Add Offer
            </button>
          }
        />

        <AdminCard>
          <AdminTable
            columns={columns}
            data={offers}
            renderCell={(row, key) => {
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
              return row[key as keyof RestaurantOffer] as React.ReactNode;
            }}
          />
        </AdminCard>
      </div>

      <AdminModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Offer" : "Add Offer"}
      >
        <div className="grid gap-4">
          <AdminFormField
            label="Offer name"
            value={formState.name}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, name: event.target.value }))
            }
          />
          <AdminFormField
            label="Offer code"
            value={formState.code}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, code: event.target.value }))
            }
          />
          <AdminFormField label="Offer type">
            <select
              value={formState.type}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, type: event.target.value }))
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900"
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed</option>
            </select>
          </AdminFormField>
          <AdminFormField
            label="Offer label"
            value={formState.label}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, label: event.target.value }))
            }
          />
          <AdminFormField
            label="Offer value"
            value={formState.value}
            onChange={(event) =>
              setFormState((prev) => ({ ...prev, value: event.target.value }))
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
            Save Offer
          </button>
        </div>
      </AdminModal>
    </AdminShell>
  );
}
