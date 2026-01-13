// components/admin/DashboardClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

import AdminCard from "./AdminCard";
import AdminPageTitle from "./AdminPageTitle";
import AdminShell from "./AdminShell";
import AdminOrderHistoryModal from "./AdminOrderHistoryModal";
import AdminOrderStatusModal from "./AdminOrderStatusModal";
import AdminOrderViewModal from "./AdminOrderViewModal";
import MobileOrderCard from "./MobileOrderCard";
import OrderTable from "./OrderTable";
import { getStatusLabel, type AdminOrder } from "@/lib/admin/orders";

type RangeFilter = "today" | "yesterday" | "week" | "all";

export default function DashboardClient({ orders }: { orders: AdminOrder[] }) {
  const [data, setData] = useState<AdminOrder[]>(orders);
  const [viewOrder, setViewOrder] = useState<AdminOrder | null>(null);
  const [statusOrder, setStatusOrder] = useState<AdminOrder | null>(null);
  const [historyOrder, setHistoryOrder] = useState<AdminOrder | null>(null);

  const [range, setRange] = useState<RangeFilter>("today");
  const [search, setSearch] = useState("");

  /* --------------------------------------------------------
     Fetch + auto refresh every 10s
  -------------------------------------------------------- */
  useEffect(() => {
    const loadOrders = async () => {
      try {
        const res = await fetch("/api/admin/orders?scope=all", {
          cache: "no-store",
        });
        const json = await res.json();
        console.log("Dashboard fetched orders:", json);
        setData(json.data ?? []);
      } catch (err) {
        console.error("Failed to load dashboard orders", err);
      }
    };

    loadOrders();
    const id = setInterval(loadOrders, 10_000);
    return () => clearInterval(id);
  }, []);

  /* --------------------------------------------------------
     Date range filter
  -------------------------------------------------------- */
  const filteredByRange = useMemo(() => {
    if (range === "all") return data;

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(todayStart.getDate() + 1);

    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(todayStart.getDate() - 1);

    const weekAgoStart = new Date(todayStart);
    weekAgoStart.setDate(todayStart.getDate() - 7);

    return data.filter((order) => {
      if (!order.createdAt) return false;
      const created = new Date(order.createdAt);

      if (range === "today") {
        return created >= todayStart && created < tomorrowStart;
      }

      if (range === "yesterday") {
        return created >= yesterdayStart && created < todayStart;
      }

      if (range === "week") {
        return created >= weekAgoStart && created < tomorrowStart;
      }

      return true;
    });
  }, [data, range]);

  /* --------------------------------------------------------
     Search (name or order ID)
  -------------------------------------------------------- */
  const filteredData = useMemo(() => {
    const base = filteredByRange;
    const q = search.trim().toLowerCase();
    if (!q) return base;

    return base.filter((order) => {
      return (
        order.customerName.toLowerCase().includes(q) ||
        order.id.toLowerCase().includes(q)
      );
    });
  }, [filteredByRange, search]);

  /* --------------------------------------------------------
     Status updates bubble back into state
  -------------------------------------------------------- */
  const handleStatusUpdated = (updated: AdminOrder) => {
    setData((prev) =>
      prev.map((order) => (order.id === updated.id ? updated : order)),
    );
    setStatusOrder(updated);
  };

  /* --------------------------------------------------------
     Totals for header cards (based on filteredData)
  -------------------------------------------------------- */
  const totals = useMemo(
    () =>
      filteredData.reduce(
        (acc, order) => {
          const itemsTotal = order.items.reduce(
            (sum, item) => sum + item.price * item.qty,
            0,
          );
          acc.revenue +=
            itemsTotal + order.deliveryCharge + order.tax + order.surcharge;
          const deliveredLabel = getStatusLabel(order.status).toLowerCase();
          const statusValue = String(order.status).toLowerCase();
          const isDelivered =
            statusValue === "delivered" ||
            deliveredLabel === "delivered" ||
            deliveredLabel === "order delivered";
          acc.active += isDelivered ? 0 : 1;
          acc.pickups += order.instorePickup ? 1 : 0;
          return acc;
        },
        { revenue: 0, active: 0, pickups: 0 },
      ),
    [filteredData],
  );

  /* --------------------------------------------------------
     UI
  -------------------------------------------------------- */
  return (
    <AdminShell>
      <AdminPageTitle
        title="Today’s Orders"
        description="Mobile-first run sheet showing pickups, surcharges, and quick actions."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {/* Range filters */}
            <div className="flex items-center gap-1 rounded-full bg-slate-100 px-1 py-1 text-xs">
              {(["today", "yesterday", "week", "all"] as RangeFilter[]).map(
                (r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`rounded-full px-3 py-1 font-semibold capitalize ${
                      r === range
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-700 hover:bg-white"
                    }`}
                  >
                    {r === "week" ? "This week" : r}
                  </button>
                ),
              )}
            </div>

            {/* Search */}
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or order ID"
              className="h-8 rounded-full border border-slate-200 bg-white px-3 text-xs shadow-inner focus:border-slate-400 focus:outline-none"
            />

            <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-md">
              Print Summary
            </button>
          </div>
        }
      />

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminCard title="Live Orders" description="Currently active tickets">
          <div className="text-3xl font-bold text-slate-900">
            {totals.active}
          </div>
          <p className="text-sm text-slate-600">
            Preparing, rider en route, or awaiting pickup.
          </p>
        </AdminCard>
        <AdminCard
          title="Revenue (filtered)"
          description="Including delivery + surcharge"
        >
          <div className="text-3xl font-bold text-slate-900">
            £{totals.revenue.toFixed(2)}
          </div>
          <p className="text-sm text-slate-600">Gross before fees.</p>
        </AdminCard>
        <AdminCard
          title="In-Store Pickup"
          description="Orders flagged for pickup"
        >
          <div className="text-3xl font-bold text-slate-900">
            {totals.pickups}
          </div>
          <p className="text-sm text-slate-600">
            Coordinate with store staff.
          </p>
        </AdminCard>
      </div>

      {/* Table + mobile cards */}
      <AdminCard
        title="Today’s tickets"
        description="Desktop table + mobile cards with zero horizontal scroll"
      >
        <OrderTable
          mode="dashboard"
          orders={filteredData}
          onView={setViewOrder}
          onEditOrder={() => {}}
          onEditStatus={setStatusOrder}
          onHistory={setHistoryOrder}
          onPrint={setViewOrder}
        />

        <div className="mt-4 grid gap-3">
          {filteredData.map((order) => (
            <MobileOrderCard
              key={order.id}
              mode="dashboard"
              order={order}
              onView={setViewOrder}
              onEditOrder={() => {}}
              onEditStatus={setStatusOrder}
              onHistory={setHistoryOrder}
              onPrint={setViewOrder}
            />
          ))}
        </div>
      </AdminCard>

      {/* Modals */}
      <AdminOrderViewModal
        order={viewOrder}
        open={Boolean(viewOrder)}
        onClose={() => setViewOrder(null)}
      />
      <AdminOrderStatusModal
        order={statusOrder}
        open={Boolean(statusOrder)}
        onClose={() => setStatusOrder(null)}
        onStatusUpdated={handleStatusUpdated}
      />
      <AdminOrderHistoryModal
        order={historyOrder}
        open={Boolean(historyOrder)}
        onClose={() => setHistoryOrder(null)}
      />
    </AdminShell>
  );
}
