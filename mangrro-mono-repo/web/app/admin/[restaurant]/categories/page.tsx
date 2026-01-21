import RestaurantCategoriesClient from "@/components/admin/RestaurantCategoriesClient";

export default async function RestaurantCategoriesPage({
  params,
}: {
  params: Promise<{ restaurant: string }>;
}) {
  const { restaurant } = await params;
  const restaurantName = decodeURIComponent(restaurant);

  return <RestaurantCategoriesClient restaurantName={restaurantName} />;
}
