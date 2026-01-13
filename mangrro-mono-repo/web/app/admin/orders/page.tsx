import type { Metadata } from "next";

import AdminOrdersClient from "@/components/admin/AdminOrdersClient";
import { listAllOrders } from "@/lib/aws/dynamo";

export const metadata: Metadata = {
  title: "Delivery Star Admin – All Orders",
  description: "Review, edit, and manage every Delivery Star order with pricing controls.",
};

export default async function AdminOrdersPage() {
  const orders = await listAllOrders();
  return <AdminOrdersClient orders={orders} />;
}
