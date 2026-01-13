import { PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { dynamo } from "@/lib/db/client";
import { TABLES } from "@/lib/db/tables";
import { RadiusRule } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { Items } = await dynamo.send(
      new ScanCommand({ TableName: TABLES.RADIUS })
    );
    return NextResponse.json(Items ?? []);
  } catch (error) {
    console.error("Failed to fetch radius rules", error);
    return NextResponse.json(
      { error: "Failed to fetch radius rules" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rule: RadiusRule = {
      id: body.id ?? body.radiusId ?? randomUUID(),
      centerLatitude: Number(body.centerLatitude ?? 0),
      centerLongitude: Number(body.centerLongitude ?? 0),
      radiusMiles: Number(body.radiusMiles ?? 0),
      name: body.name,
      active: Boolean(body.active ?? true),
    };

    await dynamo.send(
      new PutCommand({
        TableName: TABLES.RADIUS,
        Item: rule,
      })
    );

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error("Failed to create radius rule", error);
    return NextResponse.json(
      { error: "Failed to create radius rule" },
      { status: 500 }
    );
  }
}
