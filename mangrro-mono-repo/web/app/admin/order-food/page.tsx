import type { Metadata } from "next";

import AdminRestaurantsClient from "@/components/admin/AdminRestaurantsClient";
import { listAdminRestaurants } from "@/lib/admin/restaurants";

export const metadata: Metadata = {
  title: "Delivery Star Admin – Order Food",
  description: "Manage restaurant profiles for the food marketplace.",
};

export default async function AdminOrderFoodPage() {
  const restaurants = await listAdminRestaurants();
  return <AdminRestaurantsClient initialRestaurants={restaurants} />;
}
