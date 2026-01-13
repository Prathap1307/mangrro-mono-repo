import { NextRequest, NextResponse } from "next/server";

import { updateOrderItems } from "@/lib/aws/dynamo";
import type { AdminOrderItem } from "@/lib/admin/orders";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json()) as {
    items?: AdminOrderItem[];
    customerPhone?: string;
    deliveryLocation?: string;
  };

  if (!body.items) {
    return NextResponse.json({ message: "Missing items" }, { status: 400 });
  }

  const updated = await updateOrderItems(id, body.items, body.customerPhone, body.deliveryLocation);
  if (!updated) {
    return NextResponse.json({ message: "Order not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
