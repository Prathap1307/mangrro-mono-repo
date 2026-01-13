import DeliveryChargesClient from "@/components/admin/DeliveryChargesClient";
import { getDeliveryRules } from "@/lib/db/deliveryCharges";

export const dynamic = "force-dynamic";

export default async function DeliveryChargesPage() {
  const rules = await getDeliveryRules();

  const initialRules = rules.map((r) => ({
    id: r.id,
    milesStart: String(r.milesStart ?? ""),
    milesEnd: String(r.milesEnd ?? ""),
    price: String(r.price ?? ""),
    timeStart: r.timeStart ?? "",
    timeEnd: r.timeEnd ?? "",
    location: r.location ?? "",
  }));

  return <DeliveryChargesClient initialRules={initialRules} />;
}
