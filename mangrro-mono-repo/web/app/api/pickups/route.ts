import { NextResponse } from "next/server";
import { createPickup } from "@/lib/db/pickup";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const pickup = await createPickup({
      pickupAddress: body.pickupAddress,
      dropoffAddress: body.dropoffAddress,
      parcelSize: body.parcelSize,
      pickupTime: body.pickupTime,
      dropTime: body.dropTime,
      image: body.image, // S3 metadata
    });

    return NextResponse.json({ pickup }, { status: 201 });
  } catch (err: any) {
    console.error("Pickup create error:", err);

    return NextResponse.json(
      { error: err.message ?? "Failed to save pickup" },
      { status: 500 }
    );
  }
}
