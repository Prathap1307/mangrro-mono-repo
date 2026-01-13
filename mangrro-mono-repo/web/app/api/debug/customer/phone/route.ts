import { dynamo } from "@/lib/db/client";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { TABLES } from "@/lib/db/tables";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    const result = await dynamo.send(
      new ScanCommand({
        TableName: TABLES.CUSTOMERS,
        FilterExpression: "email = :email",
        ExpressionAttributeValues: { ":email": email },
      })
    );

    console.log("DEBUG CUSTOMER RESULT:", result.Items);

    const customer = (result.Items ?? [])[0];

    return NextResponse.json({
      success: true,
      customer,
      phone: customer?.phone ?? "NOT FOUND",
    });
  } catch (err) {
    console.error("/api/debug/customer/phone ERROR:", err);
    return NextResponse.json(
      { error: "Failed to fetch customer", details: String(err) },
      { status: 500 }
    );
  }
}
