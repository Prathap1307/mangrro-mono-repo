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

export default function AdminOrderRow({ mode, order, onView, onEditOrder, onEditStatus, onHistory, onPrint }: Props) {
  const itemSummary = order.items.map((item) => `${item.name} x${item.qty}`).join(", ");

  return (
    <tr className="border-t border-slate-100 align-top hover:bg-slate-50/80">
      <td className="px-4 py-3 font-semibold text-slate-900">{order.id}</td>
      <td className="px-4 py-3">{order.customerName}</td>
      <td className="px-4 py-3">{order.customerEmail}</td>
      <td className="px-4 py-3">{order.customerPhone}</td>
      <td className="px-4 py-3">{order.restaurantName}</td>
      <td className="px-4 py-3">
        {order.instorePickup ? (
          <span className="inline-flex rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white">YES</span>
        ) : (
          <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">NO</span>
        )}
      </td>
      <td className="px-4 py-3 text-slate-700">{order.instorePickup ? order.pickupLocation : "—"}</td>
      <td className="px-4 py-3 text-slate-700">{itemSummary}</td>
      <td className="px-4 py-3 font-semibold text-slate-900">£{order.deliveryCharge.toFixed(2)}</td>
      <td className="px-4 py-3">£{order.tax.toFixed(2)}</td>
      <td className="px-4 py-3">{order.surcharge ? `£${order.surcharge.toFixed(2)}` : "—"}</td>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-2 text-xs font-semibold text-slate-800">
          <AdminStatusBadge status={order.status} />
          <div className="flex flex-wrap gap-2">
            <button onClick={() => onView(order)} className="rounded-lg bg-blue-50 px-3 py-1 text-blue-700 transition hover:bg-blue-100">
              View
            </button>
            <button
              onClick={() => onEditOrder(order)}
              className="rounded-lg bg-amber-50 px-3 py-1 text-amber-700 transition hover:bg-amber-100"
            >
              Edit Order
            </button>
            <button
              onClick={() => onEditStatus(order)}
              className="rounded-lg bg-amber-50 px-3 py-1 text-amber-700 transition hover:bg-amber-100"
            >
              Edit Status
            </button>
            <button onClick={() => onPrint(order)} className="rounded-lg bg-slate-900 px-3 py-1 text-white transition hover:bg-slate-800">
              Print
            </button>
            <button onClick={() => onHistory(order)} className="rounded-lg bg-slate-100 px-3 py-1 text-slate-800 transition hover:bg-slate-200">
              History
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}
