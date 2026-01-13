import {
  DeleteCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

import { dynamo } from "@/lib/db/client";
import { getTableName } from "@/lib/db/tables";
import { DeliveryChargeRule } from "@/types";
import { randomUUID } from "crypto";

function deliveryChargesTable() {
  return getTableName("DELIVERY_CHARGES");
}

// GET all rules
export async function getDeliveryRules(): Promise<DeliveryChargeRule[]> {
  const tableName = deliveryChargesTable();

  const { Items } = await dynamo.send(
    new ScanCommand({
      TableName: tableName,
    })
  );

  return (Items as DeliveryChargeRule[]) ?? [];
}

// CREATE rule
export async function createRule(data: any) {
  const tableName = deliveryChargesTable();

  const rule: DeliveryChargeRule = {
    id: data.id ?? randomUUID(),
    milesStart: Number(data.milesStart),
    milesEnd: Number(data.milesEnd),
    price: Number(data.price),
    timeStart: data.timeStart || undefined,
    timeEnd: data.timeEnd || undefined,
    location: data.location || null,     // ✅ ADD THIS LINE
    active: Boolean(data.active ?? true),
  };

  await dynamo.send(
    new PutCommand({
      TableName: tableName,
      Item: rule,
    })
  );

  return rule;
}


// UPDATE rule
export async function updateRule(data: any) {
  const tableName = deliveryChargesTable();

  await dynamo.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { id: data.id },
      UpdateExpression:
        "SET milesStart = :ms, milesEnd = :me, price = :p, timeStart = :ts, timeEnd = :te, location = :loc, active = :a",
      ExpressionAttributeValues: {
        ":ms": Number(data.milesStart),
        ":me": Number(data.milesEnd),
        ":p": Number(data.price),
        ":ts": data.timeStart || undefined,
        ":te": data.timeEnd || undefined,
        ":loc": data.location || null,
        ":a": Boolean(data.active ?? true),
      },
    })
  );
}

// DELETE rule
export async function deleteRule(id: string) {
  const tableName = deliveryChargesTable();

  await dynamo.send(
    new DeleteCommand({
      TableName: tableName,
      Key: { id },
    })
  );
}
