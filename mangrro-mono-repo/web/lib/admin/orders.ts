import type { OrderStatus } from "@/types/orders";

export type AdminOrderStatus = OrderStatus;

export interface AdminOrderItem {
  id?: string;
  name: string;
  qty: number;
  price: number;
}

export interface AdminOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  restaurantName: string;
  instorePickup: boolean;
  pickupLocation?: string;
  deliveryLocation?: string;
  customerLocation?: string;
  items: AdminOrderItem[];
  deliveryCharge: number;
  tax: number;
  surcharge: number;
  notes?: string;
  status: AdminOrderStatus;
  createdAt?: string;
  updatedAt?: string;
  history?: { status: string; timestamp?: string; note?: string }[];
}

export const STATUS_OPTIONS: { value: AdminOrderStatus; label: string }[] = [
  { value: "pending", label: "PENDING" },
  { value: "accepted", label: "ACCEPTED" },
  { value: "restaurant-preparing", label: "RESTAURANT PREPARING" },
  { value: "prepared", label: "PREPARED" },
  { value: "picked-up", label: "PICKED UP" },
  { value: "on-the-way", label: "ON THE WAY" },
  { value: "delivered", label: "DELIVERED" },
  { value: "cancelled", label: "CANCELLED" },
];

const statusLabelMap = new Map(STATUS_OPTIONS.map((entry) => [entry.value, entry.label]));

export function getStatusLabel(status: AdminOrderStatus | string) {
  return (
    statusLabelMap.get(status as AdminOrderStatus) ??
    String(status).replace(/[-_]/g, " ").toUpperCase()
  );
}
