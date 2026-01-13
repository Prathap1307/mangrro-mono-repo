"use client";

import AdminOrderRow from "./AdminOrderRow";
import type { AdminOrder } from "@/lib/admin/orders";

interface Props {
  orders: AdminOrder[];
  mode: "dashboard" | "orders";
  onView: (order: AdminOrder) => void;
  onEditOrder: (order: AdminOrder) => void;
  onEditStatus: (order: AdminOrder) => void;
  onHistory: (order: AdminOrder) => void;
  onPrint: (order: AdminOrder) => void;
}

const headers = [
  "Order ID",
  "Customer Name",
  "Customer Email",
  "Customer Phone",
  "Restaurant Name",
  "In-Store Pickup",
  "Pickup Place",
  "Items",
  "Delivery",
  "Tax",
  "Surcharge",
  "Actions",
];

export default function OrderTable({ orders, mode, onView, onEditOrder, onEditStatus, onHistory, onPrint }: Props) {
  return (
    <div className="hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
      <table className="min-w-full border-collapse text-sm text-slate-800">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            {headers.map((heading) => (
              <th key={heading} className="px-4 py-3">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="whitespace-normal">
          {orders.map((order) => (
            <AdminOrderRow
              key={order.id}
              mode={mode}
              order={order}
              onView={onView}
              onEditOrder={onEditOrder}
              onEditStatus={onEditStatus}
              onHistory={onHistory}
              onPrint={onPrint}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
