import RestaurantAddonCategoriesClient from "@/components/admin/RestaurantAddonCategoriesClient";

export default async function RestaurantAddonCategoriesPage({
  params,
}: {
  params: Promise<{ restaurant: string }>;
}) {
  const { restaurant } = await params;
  const restaurantName = decodeURIComponent(restaurant);
  return <RestaurantAddonCategoriesClient restaurantName={restaurantName} />;
}
