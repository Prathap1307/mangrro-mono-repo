"use client";

import AdminModal from "./AdminModal";
import type { AdminOrder } from "@/lib/admin/orders";

interface Props {
  order?: AdminOrder | null;
  open: boolean;
  onClose: () => void;
}

export default function AdminViewModal({ order, open, onClose }: Props) {
  if (!order) return null;

  const itemsTotal = order.items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const total = itemsTotal + order.deliveryCharge + order.tax + order.surcharge;

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title={`Order ${order.id}`}
      footer={
        <div className="flex flex-wrap justify-end gap-3">
          <button className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-200" onClick={onClose}>
            Close
          </button>
          <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Print Bill</button>
        </div>
      }
    >
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-800 shadow-inner">
        <div className="mb-3 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Restaurant Bill</p>
          <h3 className="text-xl font-semibold text-slate-900">{order.restaurantName}</h3>
          <p className="text-xs text-slate-500">Order {order.id}</p>
        </div>
        <div className="grid gap-2 text-sm">
          <div className="flex justify-between">
            <span className="font-semibold text-slate-700">Customer</span>
            <span className="text-right text-slate-900">{order.customerName}</span>
          </div>
          <div className="flex justify-between text-slate-700">
            <span>Email</span>
            <span className="text-right text-slate-900">{order.customerEmail}</span>
          </div>
          <div className="flex justify-between text-slate-700">
            <span>Phone</span>
            <span className="text-right text-slate-900">{order.customerPhone}</span>
          </div>
          <div className="flex justify-between text-slate-700">
            <span>Pickup Location</span>
            <span className="text-right text-slate-900">{order.instorePickup ? order.pickupLocation : "—"}</span>
          </div>
          <div className="flex justify-between text-slate-700">
            <span>Delivery Location</span>
            <span className="text-right text-slate-900">{order.customerLocation}</span>
          </div>
        </div>

        <div className="my-4 border-t border-dashed border-slate-300" />

        <div className="space-y-2">
          {order.items.map((item) => (
            <div key={item.name} className="flex items-center justify-between text-slate-900">
              <span>{item.name}</span>
              <span className="tabular-nums">{item.qty} × £{item.price.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="my-4 border-t border-dashed border-slate-300" />

        <div className="space-y-2 text-slate-900">
          <div className="flex justify-between">
            <span>Items Total</span>
            <span className="tabular-nums">£{itemsTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery Charge</span>
            <span className="tabular-nums">£{order.deliveryCharge.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax</span>
            <span className="tabular-nums">£{order.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Surcharge</span>
            <span className="tabular-nums">{order.surcharge ? `£${order.surcharge.toFixed(2)}` : "—"}</span>
          </div>
          <div className="flex justify-between border-t border-dashed border-slate-300 pt-3 text-base font-semibold">
            <span>Total</span>
            <span className="tabular-nums">£{total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </AdminModal>
  );
}
