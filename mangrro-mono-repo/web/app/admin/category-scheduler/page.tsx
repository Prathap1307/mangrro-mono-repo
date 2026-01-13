import type { Metadata } from "next";

import CategorySchedulerClient from "@/components/admin/CategorySchedulerClient";
import { getCategorySchedulerSelection, listAdminCategories } from "@/lib/admin/catalog";

export const metadata: Metadata = {
  title: "Delivery Star Admin – Category Scheduler",
  description: "Control weekly availability windows for categories with selectable time slots.",
};

export default async function CategorySchedulerPage() {
  const [categories, selection] = await Promise.all([
    listAdminCategories(),
    getCategorySchedulerSelection(),
  ]);
  return (
    <CategorySchedulerClient
      initialCategories={categories}
      initialSelection={selection}
    />
  );
}
