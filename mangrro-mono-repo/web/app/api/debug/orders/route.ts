import { dynamo } from "@/lib/db/client";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { NextResponse } from "next/server";
import { TABLES } from "@/lib/db/tables";

export async function GET() {
  try {
    const res = await dynamo.send(
      new ScanCommand({
        TableName: TABLES.ORDERS,
      })
    );

    console.log("DEBUG: RAW ORDERS FROM DYNAMODB →", res.Items);

    return NextResponse.json({
      success: true,
      count: res.Items?.length ?? 0,
      items: res.Items ?? [],
    });
  } catch (err) {
    console.error("DEBUG ERROR /api/debug/orders:", err);
    return NextResponse.json(
      { error: "Failed to fetch orders", details: String(err) },
      { status: 500 }
    );
  }
}
