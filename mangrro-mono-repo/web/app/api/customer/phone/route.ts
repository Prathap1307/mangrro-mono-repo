import { updateCustomer, getCustomer, createCustomer } from '@/lib/db/customers';
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, email, phone } = await req.json();

  let customer = await getCustomer(userId);

  if (!customer) {
    customer = {
      id: userId,
      name,
      email,
      phone,
      addresses: [],            // 👍 ALWAYS send an array
      orderHistory: [],
      premium: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await createCustomer(customer);
  } else {
    await updateCustomer(
      userId,
      {
        name,
        phone,
        // if existing customer HAS addresses, keep them
        addresses: customer.addresses ?? [],
      }
    );
  }

  return NextResponse.json({ success: true });
}
