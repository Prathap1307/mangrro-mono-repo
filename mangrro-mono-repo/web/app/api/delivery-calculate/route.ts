import { NextResponse } from "next/server";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo } from "@/lib/db/client";
import { TABLES } from "@/lib/db/tables";

export const dynamic = "force-dynamic";

interface LocationInput {
  label: string;
  latitude: number;
  longitude: number;
}

type ParcelSize = "small" | "medium" | "large" | "bulky";

const PARCEL_MULTIPLIERS: Record<ParcelSize, number> = {
  small: 1,
  medium: 1.5,
  large: 2,
  bulky: 2,
};

function milesBetween(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const R = 3958.8;
  const toRad = (v: number) => (v * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function applyParcelMultiplier(
  basePrice: number,
  parcelSize?: string
) {
  switch (parcelSize) {
    case "medium":
      return basePrice * 1.5;
    case "large":
    case "bulky":
      return basePrice * 2;
    case "small":
    default:
      return basePrice;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const from: LocationInput = body.from;
    const to: LocationInput = body.to;
    const parcelSize: ParcelSize | undefined = body.parcelSize ?? "small";

    // 1️⃣ Validate coordinates
    if (
      typeof from?.latitude !== "number" ||
      typeof from?.longitude !== "number" ||
      typeof to?.latitude !== "number" ||
      typeof to?.longitude !== "number"
    ) {
      return NextResponse.json(
        { error: "Invalid coordinates" },
        { status: 400 }
      );
    }

    if (!parcelSize || !(parcelSize in PARCEL_MULTIPLIERS)) {
      return NextResponse.json(
        { error: "Parcel size is required to calculate pricing." },
        { status: 400 }
      );
    }

    // 2️⃣ Load radius rules
    const { Items: radiusItems } = await dynamo.send(
      new ScanCommand({ TableName: TABLES.RADIUS })
    );

    if (!radiusItems || radiusItems.length === 0) {
      return NextResponse.json(
        { error: "No service areas configured" },
        { status: 500 }
      );
    }

    const radiusMap = new Map<string, any>();
    for (const r of radiusItems) {
      if (r.active === true) {
        radiusMap.set(r.id, r);
      }
    }

    // 3️⃣ Load delivery charge rules
    const { Items: chargeRules } = await dynamo.send(
      new ScanCommand({ TableName: TABLES.DELIVERY_CHARGES })
    );

    if (!chargeRules || chargeRules.length === 0) {
      return NextResponse.json(
        { error: "No delivery pricing configured" },
        { status: 500 }
      );
    }

    // 4️⃣ Find matching rule
    let matchedRule: any = null;
    let matchedRadius: any = null;
    let distanceMiles = 0;

    for (const rule of chargeRules) {
      if (rule.active !== true) continue;

      const radius = radiusMap.get(rule.location);
      if (!radius) continue;

      // ONLY Pickup radius
      if (radius.name !== "Pickup") continue;

      const milesFromCenter = milesBetween(
        radius.centerLatitude,
        radius.centerLongitude,
        from.latitude,
        from.longitude
      );

      if (milesFromCenter > radius.radiusMiles) continue;

      const miles = milesBetween(
        from.latitude,
        from.longitude,
        to.latitude,
        to.longitude
      );

      if (
        miles >= Number(rule.milesStart) &&
        miles < Number(rule.milesEnd)
      ) {
        matchedRule = rule;
        matchedRadius = radius;
        distanceMiles = miles;
        break;
      }
    }

    // 5️⃣ No match
    if (!matchedRule || !matchedRadius) {
      return NextResponse.json({
        available: false,
        message: "Sorry, we don’t deliver to this location.",
      });
    }

    // 6️⃣ Apply parcel size multiplier
    const basePrice = Number(matchedRule.price);
    const finalPrice = applyParcelMultiplier(basePrice, parcelSize);

    return NextResponse.json({
      available: true,
      basePrice,
      finalPrice: Number(finalPrice.toFixed(2)),
      parcelSize,
      distanceMiles: Number(distanceMiles.toFixed(2)),
      radiusId: matchedRadius.id,
      radiusName: matchedRadius.name,
      ruleId: matchedRule.id,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to calculate delivery" },
      { status: 500 }
    );
  }
}
