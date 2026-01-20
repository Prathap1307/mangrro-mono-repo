import AdminCard from "@/components/admin/AdminCard";
import AdminPageTitle from "@/components/admin/AdminPageTitle";

export default async function RestaurantCategorySchedulePage({
  params,
}: {
  params: Promise<{ restaurant: string }>;
}) {
  const { restaurant } = await params;
  const restaurantName = decodeURIComponent(restaurant);

  return (
    <div className="space-y-6">
      <AdminPageTitle
        title="Categories schedule"
        description={`Schedule category visibility for ${restaurantName}.`}
        action={
          <button className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200">
            + Add Schedule
          </button>
        }
      />

      <AdminCard>
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
          No schedules yet. Add category schedules for this restaurant.
        </div>
      </AdminCard>
    </div>
  );
}
