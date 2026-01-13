import { PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { dynamo } from "@/lib/db/client";
import { TABLES } from "@/lib/db/tables";
import { SurchargeRule } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { Items } = await dynamo.send(
      new ScanCommand({ TableName: TABLES.SURCHARGE })
    );
    return NextResponse.json(Items ?? []);
  } catch (error) {
    console.error("Failed to fetch surcharges", error);
    return NextResponse.json(
      { error: "Failed to fetch surcharges" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const surcharge: SurchargeRule = {
      id: body.id ?? body.surchargeId ?? randomUUID(),
      reason: body.reason,
      price: Number(body.price ?? 0),
      location: body.location,
      active: Boolean(body.active ?? true),
    };

    await dynamo.send(
      new PutCommand({
        TableName: TABLES.SURCHARGE,
        Item: surcharge,
      })
    );

    return NextResponse.json(surcharge, { status: 201 });
  } catch (error) {
    console.error("Failed to create surcharge", error);
    return NextResponse.json(
      { error: "Failed to create surcharge" },
      { status: 500 }
    );
  }
}
