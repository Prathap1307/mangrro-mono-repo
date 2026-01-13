import type { Metadata } from "next";

import DashboardClient from "@/components/admin/DashboardClient";
import { listTodayOrders } from "@/lib/aws/dynamo";

export const metadata: Metadata = {
  title: "Delivery Star Admin – Dashboard",
  description: "Monitor today’s Delivery Star orders with status, surcharges, and pickup flags.",
};

export default async function DashboardPage() {
  const orders = await listTodayOrders();
  return <DashboardClient orders={orders} />;
}
