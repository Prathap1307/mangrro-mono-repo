import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { dynamo } from "@/lib/db/client";
import { TABLES } from "@/lib/db/tables";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";

function formatOrder(raw: any) {
  return {
    id: raw.id,
    status: raw.status,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    customerEmail: raw.customerEmail,
    dropLocation: raw.dropLocation ?? "",
    orderTotal: Number(raw.orderTotal ?? 0),

    items: (raw.items ?? []).map((i: any) => ({
      name: i.name,
      quantity: Number(i.quantity ?? 1),
      price: Number(i.price ?? 0),
    })),

    history: raw.history ?? [],
  };
}

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = user.emailAddresses[0].emailAddress;

    // 🔍 Get all orders placed by this user
    const result = await dynamo.send(
      new ScanCommand({
        TableName: TABLES.ORDERS,
        FilterExpression: "customerEmail = :email",
        ExpressionAttributeValues: {
          ":email": email,
        },
      })
    );

    const allOrders = (result.Items ?? []).map(formatOrder);

    // 🔥 SORT newest → oldest
    allOrders.sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1
    );

    // 🟢 ACTIVE ORDER (anything NOT delivered)
    const activeOrder =
      allOrders.find((o) => o.status !== "delivered") || null;

    // 🟣 PAST ORDERS (delivered)
    const pastOrders = allOrders.filter((o) => o.status === "delivered");

    return NextResponse.json({
      success: true,
      activeOrder,
      pastOrders,
    });
  } catch (err) {
    console.error("CUSTOMER ORDER ERROR:", err);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
