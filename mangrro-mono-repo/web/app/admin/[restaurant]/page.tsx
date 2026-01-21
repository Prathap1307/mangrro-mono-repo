import AdminCard from "@/components/admin/AdminCard";
import AdminPageTitle from "@/components/admin/AdminPageTitle";
import { listAdminRestaurants } from "@/lib/admin/restaurants";

export default async function RestaurantAdminPage({
  params,
}: {
  params: Promise<{ restaurant: string }>;
}) {
  const { restaurant } = await params;
  const restaurantName = decodeURIComponent(restaurant);
  const restaurants = await listAdminRestaurants();
  const restaurantRecord = restaurants.find(
    (item) => item.name.toLowerCase() === restaurantName.toLowerCase(),
  );

  if (!restaurantRecord) {
    return (
      <AdminCard>
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-slate-900">
            Restaurant not found
          </h2>
          <p className="text-sm text-slate-500">
            We could not find details for "{restaurantName}" yet.
          </p>
        </div>
      </AdminCard>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageTitle
        title={restaurantRecord.name}
        description="Restaurant admin overview."
      />

      <AdminCard title="Restaurant info" description="">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Address
            </p>
            <p className="text-sm text-slate-700">
              {restaurantRecord.address}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Coordinates
            </p>
            <p className="text-sm text-slate-700">
              {restaurantRecord.lat}, {restaurantRecord.lng}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Cuisine
            </p>
            <p className="text-sm text-slate-700">
              {restaurantRecord.cuisine.join(", ") || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Keywords
            </p>
            <p className="text-sm text-slate-700">
              {restaurantRecord.keywords.join(", ") || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Average prep time
            </p>
            <p className="text-sm text-slate-700">
              {restaurantRecord.averagePrepTime || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Status
            </p>
            <p className="text-sm text-slate-700">
              {restaurantRecord.active ? "Active" : "Inactive"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Next activation
            </p>
            <p className="text-sm text-slate-700">
              {restaurantRecord.nextActivationTime || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Username
            </p>
            <p className="text-sm text-slate-700">
              {restaurantRecord.username || "—"}
            </p>
          </div>
          <div className="md:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Description
            </p>
            <p className="text-sm text-slate-700">
              {restaurantRecord.description || "—"}
            </p>
          </div>
        </div>
      </AdminCard>
    </div>
  );
}
