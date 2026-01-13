"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ActiveOrderBar() {
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/customer/orders");
        const json = await res.json();

        if (json?.activeOrder && json.activeOrder.status !== "delivered" && json.activeOrder.status !== "cancelled") {
          setOrder(json.activeOrder);
        } else {
          setOrder(null);
        }
      } catch (e) {
        console.error("Failed loading active order bar", e);
      }
    };

    // Load immediately
    load();

    // Poll every 10 seconds for live status updates
    const interval = setInterval(load, 10000);

    return () => clearInterval(interval);
  }, []);

  if (!order) return null;

  return (
    <div className="fixed bottom-16 left-0 right-0 mx-auto max-w-3xl z-50">
      <div className="mx-4 flex items-center justify-between rounded-2xl border bg-white px-4 py-3 shadow-lg">
        <div>
          <p className="text-sm font-semibold">
            🛵 Order {order.id} — {order.status}
          </p>
          <p className="text-xs text-gray-500">Tap to track your order</p>
        </div>

        <Link
          href={`/track?id=${order.id}`}
          className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
        >
          Track →
        </Link>
      </div>
    </div>
  );
}
