import { DeleteCommand, PutCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, tables } from "@/lib/aws/client";
import { AdminItem } from "@/types/items";

export async function getAllItems() {
  const result = await docClient.send(new ScanCommand({ TableName: tables.items }));
  return (result.Items as AdminItem[]) || [];
}

export async function createItem(item: AdminItem) {
  await docClient.send(new PutCommand({ TableName: tables.items, Item: item }));
}

export async function updateItem(item: AdminItem) {
  await docClient.send(
    new UpdateCommand({
      TableName: tables.items,
      Key: { itemId: item.itemId },
      UpdateExpression:
        "set #name = :name, price = :price, categoryId = :categoryId, subcategoryId = :subcategoryId, subcategoryName = :subcategoryName, imageUrl = :imageUrl, imageKey = :imageKey, vegType = :vegType, ageRestricted = :ageRestricted, active = :active",
      ExpressionAttributeNames: { "#name": "name" },
      ExpressionAttributeValues: {
        ":name": item.name,
        ":price": item.price,
        ":categoryId": item.categoryId,
        ":subcategoryId": item.subcategoryId ?? "",
        ":subcategoryName": item.subcategoryName ?? "",
        ":imageUrl": item.imageUrl,
        ":imageKey": item.imageKey ?? "",
        ":vegType": item.vegType,
        ":ageRestricted": item.ageRestricted,
        ":active": item.active,
      },
    })
  );
}

export async function deleteItem(itemId: string) {
  await docClient.send(new DeleteCommand({ TableName: tables.items, Key: { itemId } }));
}
