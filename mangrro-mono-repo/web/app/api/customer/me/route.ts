import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCustomer } from "@/lib/db/customers";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const customer = await getCustomer(userId);

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  return NextResponse.json(customer);
}
