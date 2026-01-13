import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { NextRequest, NextResponse } from "next/server";
import { dynamo } from "@/lib/db/client";
import { TABLES } from "@/lib/db/tables";
import { OrderStatus } from "@/types";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { status } = (await request.json()) as { status: OrderStatus };
    const updatedAt = new Date().toISOString();

    await dynamo.send(
      new UpdateCommand({
        TableName: TABLES.ORDERS,
        Key: { orderId: id },
        UpdateExpression: "SET #status = :status, #updatedAt = :updatedAt",
        ExpressionAttributeNames: {
          "#status": "status",
          "#updatedAt": "updatedAt",
        },
        ExpressionAttributeValues: {
          ":status": status,
          ":updatedAt": updatedAt,
        },
      })
    );

    return NextResponse.json({ orderId: id, status, updatedAt });
  } catch (error) {
    console.error("Failed to update order status", error);
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    );
  }
}
