import { dynamo } from "@/lib/db/client";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { TABLES } from "@/lib/db/tables";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const result = await dynamo.send(
      new ScanCommand({
        TableName: TABLES.ORDERS,
      })
    );

    console.log("DEBUG RAW ORDERS:", result.Items);

    const filtered = (result.Items ?? []).filter((o) => {
      if (!o.createdAt) return false;
      return new Date(o.createdAt) >= start;
    });

    console.log("DEBUG TODAY ORDERS:", filtered);

    return NextResponse.json({
      success: true,
      total: filtered.length,
      orders: filtered,
    });
  } catch (err) {
    console.error("DEBUG ERROR /api/debug/orders/today:", err);
    return NextResponse.json(
      { error: "Failed", detail: String(err) },
      { status: 500 }
    );
  }
}
