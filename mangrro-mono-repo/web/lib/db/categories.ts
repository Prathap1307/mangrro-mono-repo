import { DeleteCommand, PutCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, tables } from "@/lib/aws/client";
import { Category } from "@/types/categories";

export async function getCategories() {
  const result = await docClient.send(new ScanCommand({ TableName: tables.categories }));
  const items = (result.Items as Partial<Category>[] | undefined) ?? [];

  return items.map((category) => ({
    ...category,
    position: Number.isFinite(Number(category.position))
      ? Number(category.position)
      : Number.MAX_SAFE_INTEGER,
    highlightText:
      typeof category.highlightText === "string" && category.highlightText.trim().length > 0
        ? category.highlightText.trim()
        : undefined,
    subcategoryName:
      typeof category.subcategoryName === "string" && category.subcategoryName.trim().length > 0
        ? category.subcategoryName.trim()
        : undefined,
    parentCategoryId:
      typeof category.parentCategoryId === "string" && category.parentCategoryId.trim().length > 0
        ? category.parentCategoryId.trim()
        : undefined,
    imageUrl:
      typeof category.imageUrl === "string" && category.imageUrl.trim().length > 0
        ? category.imageUrl.trim()
        : undefined,
    imageKey:
      typeof category.imageKey === "string" && category.imageKey.trim().length > 0
        ? category.imageKey.trim()
        : undefined,
  })) as Category[];
}

export async function createCategory(category: Category) {
  const highlightText = category.highlightText?.trim();
  const subcategoryName = category.subcategoryName?.trim();
  const parentCategoryId = category.parentCategoryId?.trim();
  const imageUrl = category.imageUrl?.trim();
  const imageKey = category.imageKey?.trim();

  await docClient.send(
    new PutCommand({
      TableName: tables.categories,
      Item: {
        ...category,
        highlightText,
        subcategoryName,
        parentCategoryId,
        imageUrl,
        imageKey,
      },
    })
  );
}

export async function updateCategory(category: Category) {
  const highlightText = category.highlightText?.trim();
  const subcategoryName = category.subcategoryName?.trim();
  const parentCategoryId = category.parentCategoryId?.trim();
  const imageUrl = category.imageUrl?.trim();
  const imageKey = category.imageKey?.trim();

  await docClient.send(
    new UpdateCommand({
      TableName: tables.categories,
      Key: { categoryId: category.categoryId },
      UpdateExpression:
        "set #name = :name, active = :active, position = :position, highlightText = :highlightText, subcategoryName = :subcategoryName, parentCategoryId = :parentCategoryId, imageUrl = :imageUrl, imageKey = :imageKey",
      ExpressionAttributeNames: { "#name": "name" },
      ExpressionAttributeValues: {
        ":name": category.name,
        ":active": category.active,
        ":position": category.position,
        ":highlightText": highlightText ?? "",
        ":subcategoryName": subcategoryName ?? "",
        ":parentCategoryId": parentCategoryId ?? "",
        ":imageUrl": imageUrl ?? "",
        ":imageKey": imageKey ?? "",
      },
    })
  );
}

export async function toggleCategoryActive(categoryId: string, active: boolean) {
  await docClient.send(
    new UpdateCommand({
      TableName: tables.categories,
      Key: { categoryId },
      UpdateExpression: "set active = :active",
      ExpressionAttributeValues: { ":active": active },
    })
  );
}

export async function deleteCategory(categoryId: string) {
  await docClient.send(new DeleteCommand({ TableName: tables.categories, Key: { categoryId } }));
}
