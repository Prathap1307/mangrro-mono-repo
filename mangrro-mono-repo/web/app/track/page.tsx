"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const WHATSAPP_NUMBER = "447400123456"; // Replace later

// The default delivery lifecycle
const STATUS_FLOW = [
  "pending",
  "accepted",
  "restaurant-preparing",
  "prepared",
  "picked-up",
  "on-the-way",
  "delivered",
];

function TrackContent() {
  const params = useSearchParams();
  const orderId = params.get("id");

  const [order, setOrder] = useState<any>(null);

  // Auto-refresh order data every 10 seconds
  useEffect(() => {
    if (!orderId) return;

    const load = async () => {
      const res = await fetch(`/api/orders/${orderId}`);
      const json = await res.json();
      setOrder(json?.order ?? null);
    };

    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [orderId]);

  if (!order)
    return <div className="p-6 text-gray-700">Loading order…</div>;

  const statusIndex = STATUS_FLOW.indexOf(order.status);

  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-34">
      <div className="max-w-2xl mx-auto">

        {/* PAGE HEADER */}
        <h1 className="text-3xl font-bold text-gray-900">
          Track Order {order.id}
        </h1>
        <p className="text-gray-600 mt-1">Live updates & delivery status</p>

        {/* MAIN CARD */}
        <div className="mt-6 bg-white shadow-md p-6 rounded-2xl space-y-8">

          {/* CUSTOMER DETAILS */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900">Customer</h2>
            <p className="mt-1 text-gray-700">{order.customerName}</p>
            <p className="text-gray-600 text-sm">📞 {order.customerPhone}</p>
            <p className="text-gray-600 text-sm mt-1">
              ✉️ {order.customerEmail}
            </p>
          </section>

          {/* ADDRESS */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              Delivery Address
            </h2>
            <p className="mt-1 text-gray-700">{order.deliveryLocation}</p>
          </section>

          {/* ORDER ITEMS */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900">Items</h2>
            <div className="mt-3 space-y-3">
              {order.items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between">
                  <span className="text-gray-700">
                    {item.name} × {item.qty}
                  </span>
                  <span className="text-gray-900 font-semibold">
                    £{(item.qty * item.price).toFixed(2)}
                  </span>
                </div>
              ))}

              <div className="border-t pt-3 mt-3 flex justify-between font-semibold text-gray-900">
                <span>Total</span>
                <span>
                  £{Number(order.orderTotal ?? 0).toFixed(2)}
                </span>
              </div>
            </div>
          </section>

          {/* STATUS TIMELINE */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900">
              Order Status
            </h2>

            <div className="mt-4 space-y-4">
              {STATUS_FLOW.map((step, idx) => {
                const active = idx <= statusIndex;
                return (
                  <div key={step} className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded-full ${
                        active ? "bg-green-600" : "bg-gray-300"
                      }`}
                    ></div>
                    <span
                      className={`${
                        active
                          ? "font-semibold text-gray-900"
                          : "text-gray-500"
                      }`}
                    >
                      {step.replace(/-/g, " ").toUpperCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* HELP BUTTON */}
          <section>
            <Link
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hello,%20I%20need%20help%20with%20order%20${order.id}`}
              target="_blank"
              className="block w-full text-center bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700"
            >
              💬 Contact Support on WhatsApp
            </Link>
          </section>
        </div>

        {/* FOOTNOTE */}
        <p className="text-center text-sm text-gray-500 mt-6">
          This page refreshes automatically every 10 seconds.
        </p>
      </div>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-700">Loading order…</div>}>
      <TrackContent />
    </Suspense>
  );
}
