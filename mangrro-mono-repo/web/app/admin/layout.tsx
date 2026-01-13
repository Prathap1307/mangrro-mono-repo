import type { Metadata } from "next";

import AdminLayout from "@/components/admin/AdminLayout";

export const metadata: Metadata = {
  title: "Delivery Star Admin",
  description: "Back-office tools for Delivery Star operators to manage orders and catalogue.",
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
