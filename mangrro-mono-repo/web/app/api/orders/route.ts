import { NextResponse } from "next/server";
import { dynamo } from "@/lib/db/client";
import { TABLES } from "@/lib/db/tables";
import { PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

export const dynamic = "force-dynamic";

/* Shared mapper: Dynamo → AdminOrder */
function toAdminOrder(item: any) {
  if (!item) return null;

  return {
    id: item.id,

    customerName: item.customerName,
    customerEmail: item.customerEmail,
    customerPhone: item.customerPhone,

    restaurantName: item.restaurantName,
    instorePickup: !!item.instorePickup,
    pickupLocation: item.pickupLocation,

    deliveryLocation: item.dropLocation ?? "",

    items: (item.items ?? []).map((i: any) => ({
      name: i.name,
      qty: Number(i.quantity ?? 1),
      price: Number(i.price ?? 0),
    })),

    deliveryCharge: Number(item.deliveryCharge ?? 0),
    tax: Number(item.tax ?? 0),
    surcharge: Number(item.surcharge ?? 0),

    notes: item.notes ?? "",
    history: item.history ?? [],

    status: item.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

/* ============================================================
   GET ALL ORDERS (Admin)
============================================================ */
export async function GET() {
  try {
    const result = await dynamo.send(
      new ScanCommand({ TableName: TABLES.ORDERS })
    );

    const orders = (result.Items ?? [])
      .map(toAdminOrder)
      .filter(Boolean);

    return NextResponse.json({
      success: true,
      data: orders,
    });
  } catch (err) {
    console.error("GET all orders error:", err);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

/* ============================================================
   CREATE ORDER (customer / admin)
============================================================ */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const now = new Date().toISOString();

    /** GET MAX DS NUMBER */
    const scan = await dynamo.send(
      new ScanCommand({
        TableName: TABLES.ORDERS,
        ProjectionExpression: "id",
      })
    );

    let maxNum = 0;

    for (const o of scan.Items ?? []) {
      if (typeof o.id === "string" && o.id.startsWith("DS")) {
        const n = parseInt(o.id.replace("DS", ""), 10);
        if (!isNaN(n)) maxNum = Math.max(maxNum, n);
      }
    }

    const nextId = `DS${String(maxNum + 1).padStart(2, "0")}`;

    const cleanedItems = (body.items ?? []).map((i: any) => ({
      name: i.name,
      price: i.price,
      quantity: i.quantity,
    }));

    const order = {
      id: nextId,

      customerName: body.customerName,
      customerPhone: body.customerPhone,
      customerEmail: body.customerEmail,

      restaurantName: body.restaurantName,
      instorePickup: Boolean(body.instorePickup),
      pickupLocation: body.pickupLocation,
      dropLocation: body.dropLocation,

      items: cleanedItems,
      notes: body.notes ?? "",

      orderTotal: Number(body.orderTotal ?? 0),
      deliveryCharge: Number(body.deliveryCharge ?? 0),
      surcharge: Number(body.surcharge ?? 0),
      tax: Number(body.tax ?? 0),

      status: body.status ?? "pending",
      history: [],

      createdAt: now,
      updatedAt: now,
    };

    await dynamo.send(
      new PutCommand({
        TableName: TABLES.ORDERS,
        Item: order,
      })
    );

    // keep original shape to avoid breaking existing clients
    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    console.error("Order Create Error:", err);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
