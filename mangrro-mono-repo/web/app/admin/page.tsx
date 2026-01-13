import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Delivery Star Admin – Redirecting",
  description: "Redirecting to Delivery Star admin login.",
};

export default function AdminIndexPage() {
  redirect("/admin/login");
}
