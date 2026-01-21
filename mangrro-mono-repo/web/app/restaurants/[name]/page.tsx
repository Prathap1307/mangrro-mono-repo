import RestaurantMenuPage from "@/components/RestaurantMenuPage";

export default async function RestaurantMenu({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const restaurantName = decodeURIComponent(name);

  return <RestaurantMenuPage restaurantName={restaurantName} />;
}
