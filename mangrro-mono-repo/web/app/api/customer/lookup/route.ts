import { NextResponse } from "next/server";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo } from "@/lib/db/client";
import { TABLES } from "@/lib/db/tables";

/**
 * Fetch a customer record by email
 * Example:
 * GET /api/customer/lookup?email=test@gmail.com
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Missing email query param" },
        { status: 400 }
      );
    }

    // Scan customers table searching by email
    const result = await dynamo.send(
      new ScanCommand({
        TableName: TABLES.CUSTOMERS,
        FilterExpression: "#email = :email",
        ExpressionAttributeNames: {
          "#email": "email",
        },
        ExpressionAttributeValues: {
          ":email": email,
        },
      })
    );

    const customer = result.Items?.[0];

    if (!customer) {
      return NextResponse.json({
        found: false,
        phone: null,
        name: null,
      });
    }

    return NextResponse.json({
      found: true,
      phone: customer.phone ?? null,
      name: customer.name ?? null,
    });
  } catch (err) {
    console.error("Customer lookup error:", err);
    return NextResponse.json(
      { error: "Failed to lookup customer" },
      { status: 500 }
    );
  }
}
