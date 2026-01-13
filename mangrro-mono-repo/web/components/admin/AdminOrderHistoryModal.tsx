"use client";

import AdminModal from "./AdminModal";
import AdminStatusBadge from "./AdminStatusBadge";
import type { AdminOrder, AdminOrderStatus } from "@/lib/admin/orders";

const defaultHistory: { status: AdminOrderStatus | string; note: string; time: string }[] = [
  { status: "Pending", note: "Order created by customer", time: "09:12" },
  { status: "Accepted by Restaurant", note: "Kitchen confirmed ticket", time: "09:14" },
  { status: "Restaurant Prepared", note: "Chef marked ready", time: "09:32" },
  { status: "Delivery Boy Picked Up", note: "Rider collected at store", time: "09:41" },
  { status: "On The Way", note: "Rider heading to customer", time: "09:44" },
];

type Props = {
  order?: AdminOrder | null;
  open: boolean;
  onClose: () => void;
};

export default function AdminOrderHistoryModal({ order, open, onClose }: Props) {
  if (!order) return null;

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title={`History – ${order.id}`}
      footer={
        <div className="flex flex-wrap justify-end gap-3">
          <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800" onClick={onClose}>
            Close
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="text-sm text-slate-700">Track every admin + restaurant action.</div>
        <div className="space-y-3">
          {defaultHistory.map((item, idx) => (
            <div key={`${item.status}-${idx}`} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <div className="mt-0.5 h-2 w-2 rounded-full bg-blue-500" aria-hidden />
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.time}</span>
                  <AdminStatusBadge status={item.status as AdminOrderStatus} />
                </div>
                <p className="text-sm font-semibold text-slate-900">{item.status}</p>
                <p className="text-sm text-slate-600">{item.note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminModal>
  );
}
