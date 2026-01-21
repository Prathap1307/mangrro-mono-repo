import RestaurantAdminLayout from "@/components/admin/RestaurantAdminLayout";

export default async function RestaurantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ restaurant: string }>;
}) {
  const { restaurant } = await params;
  const restaurantName = decodeURIComponent(restaurant);
  return (
    <RestaurantAdminLayout restaurantName={restaurantName}>
      {children}
    </RestaurantAdminLayout>
  );
}
