import type { Metadata } from "next";

import SurchargeClient from "@/components/admin/SurchargeClient";
import { getSurcharges } from "@/lib/db/surcharge";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Delivery Star Admin – Surcharge Settings",
  description: "Add surcharge conditions like rain, snow, or storm with additional price.",
};

export default async function SurchargePage() {
  const rules = await getSurcharges();

  const initialRules = rules.map((rule) => ({
    id: rule.id,
    reason: rule.reason,
    price: String(rule.price ?? ""),
    location: rule.location ?? "",
  }));

  return <SurchargeClient initialRules={initialRules} />;
}
