import AdminCard from "@/components/admin/AdminCard";
import AdminPageTitle from "@/components/admin/AdminPageTitle";
import AdminTable from "@/components/admin/AdminTable";

const columns = [
  { key: "name", label: "Item" },
  { key: "price", label: "Price" },
  { key: "category", label: "Category" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions" },
];

const sampleRows = [
  {
    name: "Millet & Nuts Premium Cookies Combo",
    price: "₹270",
    category: "Recommended",
    status: "Active",
  },
  {
    name: "Chilli Paneer Dry",
    price: "₹215",
    category: "Top Picks",
    status: "Active",
  },
];

export default async function RestaurantItemsPage({
  params,
}: {
  params: Promise<{ restaurant: string }>;
}) {
  const { restaurant } = await params;
  const restaurantName = decodeURIComponent(restaurant);

  return (
    <div className="space-y-6">
      <AdminPageTitle
        title="Items"
        description={`Manage items for ${restaurantName}.`}
        action={
          <button className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200">
            + Add Item
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
