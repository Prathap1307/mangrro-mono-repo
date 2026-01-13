import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { dynamo } from "@/lib/db/client";
import { TABLES } from "@/lib/db/tables";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";

/* Helper — because your PK = { id + createdAt } */
async function findOrderById(id: string) {
  const scan = await dynamo.send(
    new ScanCommand({
      TableName: TABLES.ORDERS,
      FilterExpression: "id = :id",
      ExpressionAttributeValues: {
        ":id": id,
      },
    })
  );

  const items = scan.Items ?? [];
  if (!items.length) return null;
  return items[0];
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = user.emailAddresses[0].emailAddress;

    // Load order by scanning for "id"
    const order = await findOrderById(id);

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // SECURITY CHECK — prevents other customers from seeing your order
    if (order.customerEmail !== email) {
      return NextResponse.json(
        { error: "Unauthorized — this is not your order" },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    console.error("Customer order GET error:", err);
    return NextResponse.json(
      { error: "Failed to load order", details: err.message },
      { status: 500 }
    );
  }
}
