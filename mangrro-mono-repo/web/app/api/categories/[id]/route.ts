import { DeleteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { NextRequest, NextResponse } from "next/server";
import { dynamo } from "@/lib/db/client";
import { TABLES } from "@/lib/db/tables";
import { buildUpdateExpression } from "@/lib/db/updateExpression";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { UpdateExpression, ExpressionAttributeNames, ExpressionAttributeValues } =
      buildUpdateExpression(body);

    await dynamo.send(
      new UpdateCommand({
        TableName: TABLES.CATEGORIES,
        Key: { categoryId: id },
        UpdateExpression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
      })
    );

    return NextResponse.json({ categoryId: id });
  } catch (error) {
    console.error("Failed to update category", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

export async function DELETE(_: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await dynamo.send(
      new DeleteCommand({
        TableName: TABLES.CATEGORIES,
        Key: { categoryId: id },
      })
    );

    return NextResponse.json({ categoryId: id });
  } catch (error) {
    console.error("Failed to delete category", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
