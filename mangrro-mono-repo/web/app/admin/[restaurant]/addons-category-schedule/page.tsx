import RestaurantAddonCategoryScheduleClient from "@/components/admin/RestaurantAddonCategoryScheduleClient";

export default async function RestaurantAddonCategorySchedulePage({
  params,
}: {
  params: Promise<{ restaurant: string }>;
}) {
  const { restaurant } = await params;
  const restaurantName = decodeURIComponent(restaurant);
  return <RestaurantAddonCategoryScheduleClient restaurantName={restaurantName} />;
}
