// app/api/customer/address/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { randomUUID } from "crypto";
import { getCustomer, updateCustomer } from "@/lib/db/customers";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { address } = await req.json();

  if (!address || !address.postcode) {
    return NextResponse.json(
      { error: "Missing address" },
      { status: 400 }
    );
  }

  const customer = await getCustomer(userId);
  if (!customer) {
    return NextResponse.json(
      { error: "Customer not found" },
      { status: 404 }
    );
  }

  // Build new address object for DB
  const newAddress = {
    id: randomUUID(),
    primary: true,
    line1: address.line1 ?? "",
    line2: address.line2 ?? "",
    town: address.town ?? "",
    postcode: address.postcode,
    latitude: address.latitude,
    longitude: address.longitude,
  };

  // Keep other addresses but mark them as non-primary
  const existing = Array.isArray(customer.addresses) ? customer.addresses : [];

  const updatedAddresses = [
    newAddress,
    ...existing.map((a) => ({ ...a, primary: false })),
  ];

  await updateCustomer(userId, { addresses: updatedAddresses });

  return NextResponse.json({ success: true });
}
