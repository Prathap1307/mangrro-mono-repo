import RestaurantDeliveryChargesClient from "@/components/admin/RestaurantDeliveryChargesClient";

export default async function RestaurantDeliveryChargesPage({
  params,
}: {
  params: Promise<{ restaurant: string }>;
}) {
  const { restaurant } = await params;
  const restaurantName = decodeURIComponent(restaurant);
  return <RestaurantDeliveryChargesClient restaurantName={restaurantName} />;
}
