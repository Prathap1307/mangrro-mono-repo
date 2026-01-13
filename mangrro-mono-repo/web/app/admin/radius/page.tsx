import type { Metadata } from "next";

import RadiusClient from "@/components/admin/RadiusClient";
import { getAllRadiusZones } from "@/lib/db/radius";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Delivery Star Admin – Radius Management",
  description: "Create delivery zones with center points and radius in miles.",
};

export default async function RadiusPage() {
  const rawZones = await getAllRadiusZones();

  // Convert DB format → UI format
  const initialZones = rawZones.map((z) => ({
    id: z.id,
    name: z.name,
    centerLatitude: String(z.centerLatitude ?? ""),
    centerLongitude: String(z.centerLongitude ?? ""),
    radiusMiles: String(z.radiusMiles ?? ""),
    active: true,                // default until DB supports this
  }));

  return <RadiusClient initialZones={initialZones} />;
}
