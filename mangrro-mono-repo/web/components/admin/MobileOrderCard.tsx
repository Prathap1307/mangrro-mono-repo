"use client";

import AdminStatusBadge from "./AdminStatusBadge";
import type { AdminOrder } from "@/lib/admin/orders";

interface Props {
  mode: "dashboard" | "orders";
  order: AdminOrder;
  onView: (order: AdminOrder) => void;
  onEditOrder: (order: AdminOrder) => void;
  onEditStatus: (order: AdminOrder) => void;
  onHistory: (order: AdminOrder) => void;
  onPrint: (order: AdminOrder) => void;
}

export default function MobileOrderCard({ mode, order, onView, onEditOrder, onEditStatus, onHistory, onPrint }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{order.id}</p>
          <p className="text-lg font-semibold text-slate-900">{order.customerName}</p>
          <p className="text-sm text-slate-600">{order.restaurantName}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${order.instorePickup ? "bg-rose-600 text-white" : "bg-emerald-100 text-emerald-700"}`}>
          {order.instorePickup ? "In-Store" : "Delivery"}
        </span>
      </div>

      <div className="mt-3 space-y-2 text-sm text-slate-700">
        <p className="font-semibold text-slate-900">Items</p>
        <p className="leading-relaxed">{order.items.map((item) => `${item.name} x${item.qty}`).join(", ")}</p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <span>Delivery £{order.deliveryCharge.toFixed(2)}</span>
          <span>· Tax £{order.tax.toFixed(2)}</span>
          <span>· Surcharge {order.surcharge ? `£${order.surcharge.toFixed(2)}` : "—"}</span>
        </div>
        <AdminStatusBadge status={order.status} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 text-sm font-semibold sm:grid-cols-4">
        <button
          onClick={() => onEditOrder(order)}
          className="w-full rounded-lg bg-amber-50 px-3 py-2 text-amber-700 transition hover:bg-amber-100"
        >
          Edit Order
        </button>
        <button
          onClick={() => onEditStatus(order)}
          className="w-full rounded-lg bg-amber-50 px-3 py-2 text-amber-700 transition hover:bg-amber-100"
        >
          Edit Status
        </button>
        <button onClick={() => onView(order)} className="w-full rounded-lg bg-blue-50 px-3 py-2 text-blue-700 transition hover:bg-blue-100">
          View
        </button>
        <div className="grid grid-cols-2 gap-2 sm:col-span-2 sm:grid-cols-2">
          <button onClick={() => onPrint(order)} className="w-full rounded-lg bg-slate-900 px-3 py-2 text-white transition hover:bg-slate-800">
            Print
          </button>
          <button onClick={() => onHistory(order)} className="w-full rounded-lg bg-slate-100 px-3 py-2 text-slate-800 transition hover:bg-slate-200">
            History
          </button>
        </div>
      </div>
    </div>
  );
}
