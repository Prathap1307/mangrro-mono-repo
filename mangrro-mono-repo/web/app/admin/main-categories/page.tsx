import type { Metadata } from "next";

import AdminCategoriesClient from "@/components/admin/AdminCategoriesClient";
import { listAdminMainCategories } from "@/lib/admin/catalog";

export const metadata: Metadata = {
  title: "Delivery Star Admin – Main Categories",
  description: "Activate, deactivate, and schedule reactivation for main categories.",
};

export default async function AdminMainCategoriesPage() {
  const categories = await listAdminMainCategories();
  return (
    <AdminCategoriesClient
      initialCategories={categories}
      categoryType="main"
      categoryEndpoint="/api/admin/main-categories"
      hideImageUpload
    />
  );
}
