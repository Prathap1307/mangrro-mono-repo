import { dynamo } from "@/lib/db/client";
import { TABLES } from "@/lib/db/tables";
import { DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await dynamo.send(
      new DescribeTableCommand({
        TableName: TABLES.ORDERS,
      })
    );

    return NextResponse.json(result.Table?.KeySchema);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: true });
  }
}
