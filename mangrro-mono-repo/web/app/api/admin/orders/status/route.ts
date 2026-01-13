import { NextResponse } from "next/server";
import { updateOrderStatus } from "@/lib/db/orders";

export async function PATCH(request: Request) {
  const { orderId, status } = await request.json();
  await updateOrderStatus(orderId, status);
  return NextResponse.json({ ok: true });
}
