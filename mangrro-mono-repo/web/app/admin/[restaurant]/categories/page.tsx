import AdminCard from "@/components/admin/AdminCard";
import AdminPageTitle from "@/components/admin/AdminPageTitle";
import AdminTable from "@/components/admin/AdminTable";

const columns = [
  { key: "name", label: "Category" },
  { key: "items", label: "Items" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions" },
];

const sampleRows = [
  {
    name: "Top Picks",
    items: "12",
    status: "Active",
  },
  {
    name: "Recommended",
    items: "20",
    status: "Active",
  },
];

export default async function RestaurantCategoriesPage({
  params,
}: {
  params: Promise<{ restaurant: string }>;
}) {
  const { restaurant } = await params;
  const restaurantName = decodeURIComponent(restaurant);

  return (
    <div className="space-y-6">
      <AdminPageTitle
        title="Categories"
        description={`Manage categories for ${restaurantName}.`}
        action={
          <button className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200">
            + Add Category
          </button>
        }
      />

      <AdminCard>
        <AdminTable
          columns={columns}
          data={sampleRows}
          renderCell={(row, key) => {
            if (key === "actions") {
              return (
                <div className="flex items-center gap-2">
                  <button className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                    Edit
                  </button>
                  <button className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600">
                    Delete
                  </button>
                </div>
              );
            }
            return row[key as keyof typeof row];
          }}
        />
      </AdminCard>
    </div>
  );
}
