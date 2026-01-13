import { getStatusLabel, type AdminOrderStatus } from "@/lib/admin/orders";

type ExtendedStatus =
  | AdminOrderStatus
  | "PENDING"
  | "ACCEPTED"
  | "RESTAURANT PREPARING"
  | "PREPARED"
  | "DELIVERY BOY REACHED"
  | "PICKED UP"
  | "ON THE WAY"
  | "DELIVERY BOY ARRIVED"
  | "DELIVERED"
  | "CANCELLED";

const toneMap: Record<ExtendedStatus, string> = {
  pending: "bg-slate-100 text-slate-800 border-slate-200",
  PENDING: "bg-slate-100 text-slate-800 border-slate-200",
  accepted: "bg-blue-50 text-blue-700 border-blue-200",
  ACCEPTED: "bg-blue-50 text-blue-700 border-blue-200",
  "restaurant-preparing": "bg-amber-50 text-amber-700 border-amber-200",
  "RESTAURANT PREPARING": "bg-amber-50 text-amber-700 border-amber-200",
  "delivery-boy-reached": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "DELIVERY BOY REACHED": "bg-indigo-50 text-indigo-700 border-indigo-200",
  prepared: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PREPARED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "picked-up": "bg-purple-50 text-purple-700 border-purple-200",
  "PICKED UP": "bg-purple-50 text-purple-700 border-purple-200",
  "on-the-way": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "ON THE WAY": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "delivery-boy-arrived": "bg-indigo-100 text-indigo-800 border-indigo-200",
  "DELIVERY BOY ARRIVED": "bg-indigo-100 text-indigo-800 border-indigo-200",
  delivered: "bg-emerald-100 text-emerald-800 border-emerald-200",
  DELIVERED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelled: "bg-slate-200 text-slate-700 border-slate-300",
  CANCELLED: "bg-slate-200 text-slate-700 border-slate-300",
};

export default function AdminStatusBadge({ status }: { status: ExtendedStatus }) {
  const displayStatus = getStatusLabel(status);
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${toneMap[displayStatus as ExtendedStatus] || "bg-slate-100 text-slate-800 border-slate-200"}`}>
      {displayStatus}
    </span>
  );
}
