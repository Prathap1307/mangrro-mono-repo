import type { Metadata } from "next";

import AdminItemsClient from "@/components/admin/AdminItemsClient";
import { listAdminItems } from "@/lib/admin/catalog";

export const metadata: Metadata = {
  title: "Delivery Star Admin – Items",
  description: "Manage catalogue items, pricing, dietary flags, and activation schedules.",
};

export default async function AdminItemsPage() {
  const items = await listAdminItems();
  return <AdminItemsClient initialItems={items} />;
}
