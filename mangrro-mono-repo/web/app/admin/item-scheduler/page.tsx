  import type { Metadata } from "next";

  import ItemSchedulerClient from "@/components/admin/ItemSchedulerClient";
  import { getItemSchedulerSelection, listAdminItems } from "@/lib/admin/catalog";

  export const metadata: Metadata = {
    title: "Delivery Star Admin – Item Scheduler",
    description: "Assign weekly schedules to specific items with easy slot toggles.",
  };

  export default async function ItemSchedulerPage() {
    const [items, selection] = await Promise.all([
      listAdminItems(),
      getItemSchedulerSelection(),
    ]);

    return (
      <ItemSchedulerClient
        initialItems={items}
        initialSelection={selection}
      />
    );

}
