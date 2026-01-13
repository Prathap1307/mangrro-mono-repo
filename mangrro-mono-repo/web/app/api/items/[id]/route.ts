import { DeleteCommand, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { NextRequest, NextResponse } from "next/server";
import { dynamo } from "@/lib/db/client";
import { TABLES } from "@/lib/db/tables";
import { buildUpdateExpression } from "@/lib/db/updateExpression";
import { uploadImage } from "@/lib/storage/s3";
import { isAdminSessionActive } from "@/lib/admin/session";
import { getItemAccessStatus, isItemDirectlyAccessible } from "@/lib/items/accessibility";
import type { Item } from "@/types";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const normalizeItem = (item: any): Item => ({
  ...item,
  price: Number(item?.price ?? 0),
  active:
    typeof item?.active === "boolean" ? item.active : item?.active?.BOOL ?? true,
  ageRestricted: Boolean(item?.ageRestricted ?? false),
  keywords: Array.isArray(item?.keywords)
    ? item.keywords.map((keyword: unknown) => String(keyword).trim()).filter(Boolean)
    : undefined,
});

const toCustomerSafeItem = (item: Item) => ({
  itemId: item.itemId,
  name: item.name,
  categoryId: item.categoryId,
  subcategoryId: item.subcategoryId,
  subcategoryName: item.subcategoryName,
  price: item.price,
  imageUrl: item.imageUrl,
  imageKey: item.imageKey,
  vegType: item.vegType,
  ageRestricted: item.ageRestricted,
  active: item.active,
  schedule: item.schedule,
  description: item.description,
  keywords: item.keywords,
});

async function maybeUploadImage(body: any): Promise<string | undefined> {
  if (!body.imageBase64) return body.imageUrl;
  if (!body.imageName || !body.imageMimeType) {
    throw new Error("Image name and mime type are required for uploads");
  }
  const buffer = Buffer.from(body.imageBase64, "base64");
  const key = `${Date.now()}-${body.imageName}`;
  return uploadImage(buffer, key, body.imageMimeType);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const imageUrl = await maybeUploadImage(body);
    const updateData = { ...body, imageUrl };
    const { UpdateExpression, ExpressionAttributeNames, ExpressionAttributeValues } =
      buildUpdateExpression(updateData);

    await dynamo.send(
      new UpdateCommand({
        TableName: TABLES.ITEMS,
        Key: { itemId: id },
        UpdateExpression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
      })
    );

    return NextResponse.json({ itemId: id, imageUrl });
  } catch (error) {
    console.error("Failed to update item", error);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

export async function GET(_: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const result = await dynamo.send(
      new GetCommand({
        TableName: TABLES.ITEMS,
        Key: { itemId: id },
      })
    );

    if (!result.Item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const normalized = normalizeItem(result.Item);
    const isAdmin = isAdminSessionActive();
    const available = isItemDirectlyAccessible(normalized);
    const status = getItemAccessStatus(normalized);
    const payload = isAdmin ? normalized : toCustomerSafeItem(normalized);

    return NextResponse.json({
      item: payload,
      available,
      status,
      isAdmin,
    });
  } catch (error) {
    console.error("Failed to fetch item", error);
    return NextResponse.json({ error: "Failed to fetch item" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await dynamo.send(
      new DeleteCommand({
        TableName: TABLES.ITEMS,
        Key: { itemId: id },
      })
    );

    return NextResponse.json({ itemId: id });
  } catch (error) {
    console.error("Failed to delete item", error);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
