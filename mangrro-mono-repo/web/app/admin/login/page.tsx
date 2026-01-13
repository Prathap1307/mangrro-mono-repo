import type { Metadata } from "next";

import AdminLoginScreen from "@/components/admin/AdminLoginScreen";

export const metadata: Metadata = {
  title: "Delivery Star Admin Login",
  description: "Sign in to manage Delivery Star orders and catalogue.",
};

export default function AdminLoginPage() {
  return <AdminLoginScreen />;
}
