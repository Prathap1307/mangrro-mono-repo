// app/api/delivery/check/route.ts
import { NextResponse } from "next/server";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo } from "@/lib/db/client";
import { TABLES } from "@/lib/db/tables";

function getDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 3958.8; // Miles
  const toRad = (x: number) => (x * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function POST(req: Request) {
  try {
    const { latitude, longitude } = await req.json();

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return NextResponse.json(
        { error: "Missing or invalid lat/lng" },
        { status: 400 }
      );
    }

    const data = await dynamo.send(
      new ScanCommand({ TableName: TABLES.RADIUS })
    );

    const zones = (data.Items || []).filter((z: any) => z.active);

    for (const zone of zones) {
      const dist = getDistanceMiles(
        latitude,
        longitude,
        Number(zone.centerLatitude),
        Number(zone.centerLongitude)
      );

      if (dist <= Number(zone.radiusMiles)) {
        return NextResponse.json({
          deliverable: true,
          zone,
          distanceMiles: dist,
        });
      }
    }

    return NextResponse.json({ deliverable: false });
  } catch (err) {
    console.error("Delivery radius check failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
