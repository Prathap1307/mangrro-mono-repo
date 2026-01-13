import { PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { dynamo } from "@/lib/db/client";
import { TABLES } from "@/lib/db/tables";
import { DeliveryChargeRule } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { Items } = await dynamo.send(
      new ScanCommand({ TableName: TABLES.DELIVERY_CHARGES })
    );
    return NextResponse.json(Items ?? []);
  } catch (error) {
    console.error("Failed to fetch delivery charges", error);
    return NextResponse.json(
      { error: "Failed to fetch delivery charges" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rule: DeliveryChargeRule = {
      id: body.id ?? body.ruleId ?? randomUUID(),
      milesStart: Number(body.milesStart ?? 0),
      milesEnd: Number(body.milesEnd ?? 0),
      price: Number(body.price ?? 0),
      timeStart: body.timeStart,
      timeEnd: body.timeEnd,
      location: body.location,
      active: Boolean(body.active ?? true),
    };

    await dynamo.send(
      new PutCommand({
        TableName: TABLES.DELIVERY_CHARGES,
        Item: rule,
      })
    );

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error("Failed to create delivery charge rule", error);
    return NextResponse.json(
      { error: "Failed to create delivery charge rule" },
      { status: 500 }
    );
  }
}
