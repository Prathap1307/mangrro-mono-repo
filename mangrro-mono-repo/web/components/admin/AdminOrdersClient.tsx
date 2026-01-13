"use client";

import { useEffect, useMemo, useState } from "react";

import AdminCard from "./AdminCard";
import AdminOrderEditModal from "./AdminOrderEditModal";
import AdminOrderHistoryModal from "./AdminOrderHistoryModal";
import AdminOrderViewModal from "./AdminOrderViewModal";
import AdminOrderStatusModal from "./AdminOrderStatusModal";
import AdminPageTitle from "./AdminPageTitle";
import AdminShell from "./AdminShell";
import AdminFormField from "./AdminFormField";
import MobileOrderCard from "./MobileOrderCard";
import OrderTable from "./OrderTable";
import type { AdminOrder } from "@/lib/admin/orders";

export default function AdminOrdersClient({ orders }: { orders: AdminOrder[] }) {
  const [data, setData] = useState<AdminOrder[]>(orders);
  const [viewOrder, setViewOrder] = useState<AdminOrder | null>(null);
  const [editOrder, setEditOrder] = useState<AdminOrder | null>(null);
  const [historyOrder, setHistoryOrder] = useState<AdminOrder | null>(null);
  const [statusOrder, setStatusOrder] = useState<AdminOrder | null>(null);

  const [filters, setFilters] = useState({
    orderId: "",
    email: "",
    startDate: "",
    endDate: "",
  });

  const hasActiveFilters = useMemo(
    () => Object.values(filters).some((value) => value !== ""),
    [filters],
  );

  useEffect(() => {
    let debounceId: ReturnType<typeof setTimeout> | null = null;
    const loadOrders = async () => {
      try {
        const res = await fetch("/api/admin/orders", { cache: "no-store" });
        const json = await res.json();
        const next = json.data ?? [];
        if (hasActiveFilters) {
          if (debounceId) clearTimeout(debounceId);
          debounceId = setTimeout(() => setData(next), 600);
        } else {
          setData(next);
        }
      } catch (err) {
        console.error("Failed to load orders", err);
      }
    };

    loadOrders();
    const intervalId = setInterval(loadOrders, 10_000);
    return () => {
      clearInterval(intervalId);
      if (debounceId) clearTimeout(debounceId);
    };
  }, [hasActiveFilters]);

  const handleOrderUpdated = (updated: AdminOrder) => {
    setData((prev) =>
      prev.map((order) => (order.id === updated.id ? updated : order)),
    );
    setEditOrder(updated);
  };

  const handleStatusUpdated = (updated: AdminOrder) => {
    setData((prev) =>
      prev.map((order) => (order.id === updated.id ? updated : order)),
    );
    setStatusOrder(updated);
  };

  const filteredOrders = useMemo(() => {
    const start = filters.startDate ? new Date(filters.startDate) : null;
    const end = filters.endDate ? new Date(filters.endDate) : null;
    if (end) end.setHours(23, 59, 59, 999);

    return data.filter((order) => {
      const matchesId = filters.orderId
        ? order.id.toLowerCase().includes(filters.orderId.toLowerCase())
        : true;

      const matchesEmail = filters.email
        ? (order.customerEmail ?? "")
            .toLowerCase()
            .includes(filters.email.toLowerCase())
        : true;

      const createdDate = order.createdAt ? new Date(order.createdAt) : null;

      const matchesStart = start
        ? Boolean(createdDate && createdDate >= start)
        : true;
      const matchesEnd = end ? Boolean(createdDate && createdDate <= end) : true;

      return matchesId && matchesEmail && matchesStart && matchesEnd;
    });
  }, [data, filters]);

  return (
    <AdminShell>
      <AdminPageTitle
        title="All Orders"
        description="Edit items, delivery fees, surcharge, and status with responsive layouts."
        action={<button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md">Export CSV</button>}
      />

      <AdminCard title="Search & filter" description="Filter by date, order ID, or customer email.">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <AdminFormField
            label="Order ID"
            placeholder="DS12"
            value={filters.orderId}
            onChange={(e) => setFilters((prev) => ({ ...prev, orderId: e.target.value }))}
          />
          <AdminFormField
            label="Customer email"
            placeholder="customer@email.com"
            value={filters.email}
            onChange={(e) => setFilters((prev) => ({ ...prev, email: e.target.value }))}
          />
          <AdminFormField
            label="From date"
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
          />
          <AdminFormField
            label="To date"
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
          <p>
            Showing <span className="font-semibold text-slate-900">{filteredOrders.length}</span> of
            {" "}
            {data.length} orders
          </p>
          <button
            className="text-sm font-semibold text-blue-700 hover:text-blue-800"
            onClick={() =>
              setFilters({
                orderId: "",
                email: "",
                startDate: "",
                endDate: "",
              })
            }
          >
            Clear filters
          </button>
        </div>
      </AdminCard>

      <AdminCard title="Orders backlog" description="Desktop grid with mobile cards.">
        <OrderTable
          mode="orders"
          orders={filteredOrders}
          onView={setViewOrder}
          onEditOrder={setEditOrder}
          onEditStatus={setStatusOrder}
          onHistory={setHistoryOrder}
          onPrint={setViewOrder}
        />
        <div className="mt-4 grid gap-3">
          {filteredOrders.map((order) => (
            <MobileOrderCard
              key={order.id}
              mode="orders"
              order={order}
              onView={setViewOrder}
              onEditOrder={setEditOrder}
              onEditStatus={setStatusOrder}
              onHistory={setHistoryOrder}
              onPrint={setViewOrder}
            />
          ))}
        </div>
      </AdminCard>

      <AdminOrderViewModal order={viewOrder} open={Boolean(viewOrder)} onClose={() => setViewOrder(null)} />
      <AdminOrderEditModal
        order={editOrder}
        open={Boolean(editOrder)}
        onClose={() => setEditOrder(null)}
        onOrderUpdated={handleOrderUpdated}
      />
      <AdminOrderStatusModal
        order={statusOrder}
        open={Boolean(statusOrder)}
        onClose={() => setStatusOrder(null)}
        onStatusUpdated={handleStatusUpdated}
      />
      <AdminOrderHistoryModal order={historyOrder} open={Boolean(historyOrder)} onClose={() => setHistoryOrder(null)} />
    </AdminShell>
  );
}
