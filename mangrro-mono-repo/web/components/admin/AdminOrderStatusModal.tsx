"use client";

import { useEffect, useState } from "react";
import AdminModal from "./AdminModal";
import type { AdminOrder } from "@/lib/admin/orders";
import { STATUS_OPTIONS } from "@/lib/admin/orders";

type Props = {
  order: AdminOrder | null;
  open: boolean;
  onClose: () => void;
  onStatusUpdated: (order: AdminOrder) => void;
};

export default function AdminOrderStatusModal({
  order,
  open,
  onClose,
  onStatusUpdated,
}: Props) {
  const [status, setStatus] = useState<string>("pending");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (order) {
      setStatus(order.status);
      setNote("");
    }
  }, [order, open]);

  if (!order) return null;

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note }),
      });

      const json = await res.json();

      if (json.order) {
        onStatusUpdated(json.order);
        onClose();
      } else {
        console.error("Status update failed:", json);
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title={`Update Status – ${order.id}`}
      footer={
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-200 px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white"
          >
            Save
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-semibold">
            New Status
          </label>
          {(() => {
            const hasCurrent = STATUS_OPTIONS.some((option) => option.value === status);
            const options = hasCurrent
              ? STATUS_OPTIONS
              : [...STATUS_OPTIONS, { value: status, label: status }];

            return (
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
              >
                {options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            );
          })()}
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold">
            Status Note (optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-lg border px-3 py-2"
            placeholder="Driver arrived, food packed, etc."
          />
        </div>

        <div className="mt-4 border-t pt-3">
          <p className="mb-2 text-sm font-semibold">History</p>
          <div className="max-h-40 space-y-2 overflow-y-auto">
            {(order.history ?? []).map((h, i) => (
              <div key={i} className="border-b pb-1 text-xs">
                <div className="font-bold">{h.status}</div>
                <div>
                  {h.timestamp
                    ? new Date(h.timestamp).toLocaleString()
                    : ""}
                </div>
                {h.note && (
                  <div className="text-slate-600">{h.note}</div>
                )}
              </div>
            ))}
            {(!order.history || order.history.length === 0) && (
              <p className="text-xs text-slate-500">No history yet.</p>
            )}
          </div>
        </div>
      </div>
    </AdminModal>
  );
}
