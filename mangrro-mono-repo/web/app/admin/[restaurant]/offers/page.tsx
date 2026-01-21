import RestaurantOffersClient from "@/components/admin/RestaurantOffersClient";

export default async function RestaurantOffersPage({
  params,
}: {
  params: Promise<{ restaurant: string }>;
}) {
  const { restaurant } = await params;
  const restaurantName = decodeURIComponent(restaurant);
  return <RestaurantOffersClient restaurantName={restaurantName} />;
}
