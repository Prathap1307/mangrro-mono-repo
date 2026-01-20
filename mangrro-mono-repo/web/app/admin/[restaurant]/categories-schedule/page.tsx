import RestaurantCategoryScheduleClient from "@/components/admin/RestaurantCategoryScheduleClient";

export default async function RestaurantCategorySchedulePage({
  params,
}: {
  params: Promise<{ restaurant: string }>;
}) {
  const { restaurant } = await params;
  const restaurantName = decodeURIComponent(restaurant);

  return <RestaurantCategoryScheduleClient restaurantName={restaurantName} />;
}
