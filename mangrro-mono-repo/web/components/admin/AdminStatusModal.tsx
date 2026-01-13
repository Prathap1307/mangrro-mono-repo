"use client";

import { useState } from "react";

import AdminModal from "./AdminModal";
import AdminStatusBadge from "./AdminStatusBadge";
import {
  STATUS_OPTIONS,
  type AdminOrder,
  type AdminOrderStatus,
  getStatusLabel,
} from "@/lib/admin/orders";

interface Props {
  order?: AdminOrder | null;
  open: boolean;
  onClose: () => void;
}

export default function AdminStatusModal({ order, open, onClose }: Props) {
  const [selected, setSelected] = useState<AdminOrderStatus>(order?.status ?? "pending");

  if (!order) return null;

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title={`Update status – ${order.id}`}
      footer={
        <div className="flex flex-wrap justify-end gap-3">
          <button className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-200" onClick={onClose}>
            Close
          </button>
          <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Save status</button>
        </div>
      }
    >
      <div className="space-y-3">
        {STATUS_OPTIONS.map(({ value, label }) => (
          <label
            key={value}
            className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
              selected === value ? "border-blue-500 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-800"
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="status"
                value={value}
                checked={selected === value}
                onChange={() => setSelected(value)}
                className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-200"
              />
              <span>{label}</span>
            </div>
            <AdminStatusBadge status={getStatusLabel(value) as AdminOrderStatus} />
          </label>
        ))}
      </div>
    </AdminModal>
  );
}
