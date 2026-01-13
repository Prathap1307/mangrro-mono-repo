import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { NextResponse } from "next/server";
import { dynamo } from "@/lib/db/client";
import { TABLES } from "@/lib/db/tables";
import { Order } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { Items } = await dynamo.send(
      new ScanCommand({ TableName: TABLES.ORDERS })
    );

    const todayOrders = (Items as Order[] | undefined)?.filter((order) => {
      const createdAt = new Date(order.createdAt);
      return createdAt >= startOfDay;
    });

    return NextResponse.json(todayOrders ?? []);
  } catch (error) {
    console.error("Failed to fetch today's orders", error);
    return NextResponse.json(
      { error: "Failed to fetch today's orders" },
      { status: 500 }
    );
  }
}
