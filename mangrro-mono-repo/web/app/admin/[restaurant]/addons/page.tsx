import RestaurantAddonItemsClient from "@/components/admin/RestaurantAddonItemsClient";

export default async function RestaurantAddonPage({
  params,
}: {
  params: Promise<{ restaurant: string }>;
}) {
  const { restaurant } = await params;
  const restaurantName = decodeURIComponent(restaurant);
  return <RestaurantAddonItemsClient restaurantName={restaurantName} />;
}
