"use client";

import { useRouter } from "next/navigation";

import AdminOrderEditModal from "./AdminOrderEditModal";
import AdminOrderStatusModal from "./AdminOrderStatusModal";
import AdminOrderViewModal from "./AdminOrderViewModal";
import type { AdminOrder } from "@/lib/admin/orders";

type Props = {
  order: AdminOrder;
  mode: "view" | "edit" | "status";
};

export default function AdminOrderModalPage({ order, mode }: Props) {
  const router = useRouter();

  if (mode === "view") {
    return <AdminOrderViewModal order={order} open onClose={() => router.back()} />;
  }

  if (mode === "status") {
    return (
      <AdminOrderStatusModal
        order={order}
        open
        onClose={() => router.back()}
        onStatusUpdated={() => router.refresh()}
      />
    );
  }

  return (
    <AdminOrderEditModal
      order={order}
      open
      onClose={() => router.back()}
      onOrderUpdated={() => router.refresh()}
    />
  );
}
