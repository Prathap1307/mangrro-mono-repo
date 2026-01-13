import type { Metadata } from "next";

import AdminCategoriesClient from "@/components/admin/AdminCategoriesClient";
import { listAdminSubcategories } from "@/lib/admin/catalog";

export const metadata: Metadata = {
  title: "Delivery Star Admin – Subcategories",
  description: "Activate, deactivate, and schedule reactivation for subcategories.",
};

export default async function AdminSubcategoriesPage() {
  const categories = await listAdminSubcategories();
  return (
    <AdminCategoriesClient
      initialCategories={categories}
      categoryType="subcategory"
      categoryEndpoint="/api/admin/subcategories"
      parentEndpoint="/api/admin/categories"
    />
  );
}
