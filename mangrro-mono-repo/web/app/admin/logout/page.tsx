import type { Metadata } from "next";

import AdminLogoutScreen from "@/components/admin/AdminLogoutScreen";

export const metadata: Metadata = {
  title: "Delivery Star Admin – Logout",
  description: "Clearing your admin session and redirecting to login.",
};

export default function AdminLogoutPage() {
  return <AdminLogoutScreen />;
}
