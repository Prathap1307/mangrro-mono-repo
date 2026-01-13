import type { Metadata } from "next";

import SubcategorySchedulerClient from "@/components/admin/SubcategorySchedulerClient";
import {
  getSubcategorySchedulerSelection,
  listAdminSubcategories,
} from "@/lib/admin/catalog";

export const metadata: Metadata = {
  title: "Delivery Star Admin – Subcategory Scheduler",
  description: "Control weekly availability windows for subcategories with selectable time slots.",
};

export default async function SubcategorySchedulerPage() {
  const [categories, selection] = await Promise.all([
    listAdminSubcategories(),
    getSubcategorySchedulerSelection(),
  ]);

  return (
    <SubcategorySchedulerClient
      initialCategories={categories}
      initialSelection={selection}
    />
  );
}
