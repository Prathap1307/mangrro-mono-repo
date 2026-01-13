"use client";

import { useMemo } from "react";
import { FiCheck, FiClock } from "react-icons/fi";

import AdminModal from "./AdminModal";
import type { AdminOrder } from "@/lib/admin/orders";

type Props = {
  order?: AdminOrder | null;
  open: boolean;
  onClose: () => void;
};

export default function AdminOrderViewModal({
  order,
  open,
  onClose,
}: Props) {
  if (!order) return null;

  // Normalize items
  const fixedItems = order.items.map((item) => ({
    name: item.name,
    price: Number(item.price ?? 0),
    qty: Number(item.qty ?? 1),
  }));

  const itemsTotal = fixedItems.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  const total =
    itemsTotal +
    Number(order.deliveryCharge ?? 0) +
    Number(order.tax ?? 0) +
    Number(order.surcharge ?? 0);

  const deliveryAddress = order.deliveryLocation || "—";

  const [instructionChoice, locationChoice] = (order.notes ?? "")
    .split(" · ")
    .map((value) => value.trim());

  const timestamp = useMemo(
    () =>
      order.createdAt
        ? new Date(order.createdAt).toLocaleString()
        : new Date().toLocaleString(),
    [order.createdAt]
  );

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-lg"
      title={`View order – ${order.id}`}
      footer={
        <div className="flex flex-wrap justify-end gap-3">
          <button
            className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-200"
            onClick={onClose}
          >
            Close
          </button>
          <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
            Print
          </button>
        </div>
      }
    >
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-inner">
        <div className="mb-4 space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            Receipt
          </p>
          <h3 className="text-xl font-bold text-slate-900">
            {order.restaurantName}
          </h3>

          {order.instorePickup ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
              In-store pickup
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
              Delivery
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <FiClock />
            {timestamp}
          </div>
        </div>

        {/* Customer Details */}
        <div className="space-y-3 text-sm text-slate-800">
          <div className="flex items-start justify-between">
            <span className="font-semibold">Customer</span>
            <span className="text-right text-slate-900">
              {order.customerName}
            </span>
          </div>

          <div className="flex items-start justify-between">
            <span className="font-semibold">Phone</span>
            <span className="text-right text-slate-900">
              {order.customerPhone}
            </span>
          </div>

          <div className="flex items-start justify-between">
            <span className="font-semibold">Address</span>
            <span className="max-w-[220px] text-right text-slate-900">
              {deliveryAddress}
            </span>
          </div>

          {order.instorePickup && (
            <div className="flex items-start justify-between">
              <span className="font-semibold">Pickup place</span>
              <span className="text-right text-slate-900">
                {order.pickupLocation}
              </span>
            </div>
          )}
        </div>

        <div className="my-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-800">
          <p className="mb-2 text-sm font-semibold text-slate-900">
            Delivery instructions
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              {["Leave at the door", "Hand it to me", "I'll meet the driver outside"].map(
                (option) => (
                  <div
                    key={option}
                    className={`flex items-start gap-2 rounded-lg px-2 py-1 ${
                      option === instructionChoice
                        ? "bg-white font-semibold text-slate-900 shadow-sm"
                        : "text-slate-700"
                    }`}
                  >
                    {option === instructionChoice && (
                      <FiCheck className="mt-0.5 text-emerald-600" />
                    )}
                    <span>{option}</span>
                  </div>
                )
              )}
              {!instructionChoice && (
                <p className="text-xs text-slate-500">
                  No delivery instruction recorded.
                </p>
              )}
            </div>

            <div className="space-y-1">
              {["Home", "Office", "Other"].map((option) => (
                <div
                  key={option}
                  className={`flex items-start gap-2 rounded-lg px-2 py-1 ${
                    option === locationChoice
                      ? "bg-white font-semibold text-slate-900 shadow-sm"
                      : "text-slate-700"
                  }`}
                >
                  {option === locationChoice && (
                    <FiCheck className="mt-0.5 text-emerald-600" />
                  )}
                  <span>{option}</span>
                </div>
              ))}
              {!locationChoice && (
                <p className="text-xs text-slate-500">No delivery location selected.</p>
              )}
            </div>
          </div>

          {order.notes && (
            <p className="mt-3 text-xs text-slate-600">
              Notes recorded: {order.notes}
            </p>
          )}
        </div>

        <div className="my-4 border-t border-dashed border-slate-300" />

        {/* Items */}
        <div className="space-y-2">
          {fixedItems.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between text-slate-900"
            >
              <span>
                {item.name}
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                  x{item.qty}
                </span>
              </span>
              <span className="tabular-nums">
                £{(item.price * item.qty).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div className="my-4 border-t border-dashed border-slate-300" />

        {/* Totals */}
        <div className="space-y-2 text-slate-900">
          <div className="flex justify-between text-sm">
            <span>Delivery Charge</span>
            <span className="tabular-nums">
              £{Number(order.deliveryCharge ?? 0).toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span>Tax</span>
            <span className="tabular-nums">
              £{Number(order.tax ?? 0).toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span>Surcharge</span>
            <span className="tabular-nums">
              {order.surcharge
                ? `£${Number(order.surcharge).toFixed(2)}`
                : "—"}
            </span>
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
