import { notFound } from "next/navigation";

import AdminOrderModalPage from "@/components/admin/AdminOrderModalPage";
import { getOrderById } from "@/lib/aws/dynamo";

export default async function AdminOrderViewPage({ params }: { params: { id: string } }) {
  const order = await getOrderById(params.id);
  if (!order) {
    return notFound();
  }

  return <AdminOrderModalPage order={order} mode="view" />;
}
