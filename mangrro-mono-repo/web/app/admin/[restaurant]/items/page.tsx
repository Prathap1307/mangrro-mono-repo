import RestaurantItemsClient from "@/components/admin/RestaurantItemsClient";

export default async function RestaurantItemsPage({
  params,
}: {
  params: Promise<{ restaurant: string }>;
}) {
  const { restaurant } = await params;
  const restaurantName = decodeURIComponent(restaurant);

  return <RestaurantItemsClient restaurantName={restaurantName} />;
}
