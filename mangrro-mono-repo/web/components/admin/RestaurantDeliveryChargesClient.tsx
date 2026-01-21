"use client";

import { useEffect, useMemo, useState } from "react";
import AdminCard from "./AdminCard";
import AdminFormField from "./AdminFormField";
import AdminModal from "./AdminModal";
import AdminPageTitle from "./AdminPageTitle";
import AdminShell from "./AdminShell";
import AdminTable from "./AdminTable";
import type { RestaurantDeliveryCharge } from "@/lib/admin/restaurants";

interface RestaurantDeliveryChargesClientProps {
  restaurantName: string;
}

const columns = [
  { key: "milesStart", label: "Miles start" },
  { key: "milesEnd", label: "Miles end" },
  { key: "price", label: "Price" },
  { key: "timeStart", label: "Time start" },
  { key: "timeEnd", label: "Time end" },
  { key: "actions", label: "Actions" },
];

export default function RestaurantDeliveryChargesClient({
  restaurantName,
}: RestaurantDeliveryChargesClientProps) {
  const [deliveryCharges, setDeliveryCharges] = useState<
    RestaurantDeliveryCharge[]
  >([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    milesStart: "",
    milesEnd: "",
    price: "",
    timeStart: "",
    timeEnd: "",
  });

  const endpoint = useMemo(
    () =>
      `/api/admin/restaurants/${encodeURIComponent(restaurantName)}/delivery-charge`,
    [restaurantName],
  );

  const loadCharges = async () => {
    const res = await fetch(endpoint);
    const data = await res.json();
    setDeliveryCharges(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    void loadCharges();
  }, [endpoint]);

  const handleSave = async () => {
    const id = editingId ?? crypto.randomUUID();
    const nextCharge: RestaurantDeliveryCharge = {
      id,
      milesStart: formState.milesStart,
      milesEnd: formState.milesEnd,
      price: formState.price,
      timeStart: formState.timeStart,
      timeEnd: formState.timeEnd,
    };
    const nextCharges = editingId
      ? deliveryCharges.map((charge) =>
          charge.id === id ? nextCharge : charge,
        )
      : [...deliveryCharges, nextCharge];

    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deliveryCharges: nextCharges }),
    });
    await loadCharges();
    setModalOpen(false);
    setEditingId(null);
  };

  const handleEdit = (charge: RestaurantDeliveryCharge) => {
    setEditingId(charge.id);
    setFormState({
      milesStart: charge.milesStart,
      milesEnd: charge.milesEnd,
      price: charge.price,
      timeStart: charge.timeStart,
      timeEnd: charge.timeEnd,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const nextCharges = deliveryCharges.filter((charge) => charge.id !== id);
    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deliveryCharges: nextCharges }),
    });
    await loadCharges();
  };

  return (
    <AdminShell>
      <div className="flex flex-col gap-6">
        <AdminPageTitle
          title="Delivery charges"
          description={`Set delivery charges for ${restaurantName}.`}
          action={
            <button
              onClick={() => {
                setEditingId(null);
                setFormState({
                  milesStart: "",
                  milesEnd: "",
                  price: "",
                  timeStart: "",
                  timeEnd: "",
                });
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200"
            >
              + Add Delivery Charge
            </button>
          }
        />

        <AdminCard>
          <AdminTable
            columns={columns}
            data={deliveryCharges}
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
              return row[key as keyof RestaurantDeliveryCharge] as React.ReactNode;
            }}
          />
        </AdminCard>
      </div>

      <AdminModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Delivery Charge" : "Add Delivery Charge"}
      >
        <div className="grid gap-4">
          <AdminFormField
            label="Miles start"
            value={formState.milesStart}
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                milesStart: event.target.value,
              }))
            }
          />
          <AdminFormField
            label="Miles end"
            value={formState.milesEnd}
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                milesEnd: event.target.value,
              }))
            }
          />
          <AdminFormField
            label="Price"
            value={formState.price}
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                price: event.target.value,
              }))
            }
          />
          <AdminFormField
            label="Time start"
            type="time"
            value={formState.timeStart}
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                timeStart: event.target.value,
              }))
            }
          />
          <AdminFormField
            label="Time end"
            type="time"
            value={formState.timeEnd}
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                timeEnd: event.target.value,
              }))
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
            Save Delivery Charge
          </button>
        </div>
      </AdminModal>
    </AdminShell>
  );
}
