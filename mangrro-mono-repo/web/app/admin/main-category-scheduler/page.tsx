import type { Metadata } from "next";

import MainCategorySchedulerClient from "@/components/admin/MainCategorySchedulerClient";
import {
  getMainCategorySchedulerSelection,
  listAdminMainCategories,
} from "@/lib/admin/catalog";

export const metadata: Metadata = {
  title: "Delivery Star Admin – Main Category Scheduler",
  description:
    "Control weekly availability windows for main categories with selectable time slots.",
};

export default async function MainCategorySchedulerPage() {
  const [categories, selection] = await Promise.all([
    listAdminMainCategories(),
    getMainCategorySchedulerSelection(),
  ]);

  return (
    <MainCategorySchedulerClient
      initialCategories={categories}
      initialSelection={selection}
    />
  );
}
