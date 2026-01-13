import {
  DeleteCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient, tables } from "@/lib/aws/client";
import { SurchargeRule } from "@/types/surcharge";

export async function getSurcharges() {
  const result = await docClient.send(
    new ScanCommand({
      TableName: tables.surcharge,
    })
  );

  return (result.Items as SurchargeRule[]) || [];
}

export async function createSurcharge(data: any) {
  const item: SurchargeRule = {
    id: data.id,
    reason: data.reason,
    price: Number(data.price),
    location: data.location || null,   // NEW
    active: true,
  };

  await docClient.send(
    new PutCommand({
      TableName: tables.surcharge,
      Item: item,
    })
  );
}


export async function updateSurcharge(data: any) {
  await docClient.send(
    new UpdateCommand({
      TableName: tables.surcharge,
      Key: { id: data.id },       // ✔ correct PK
      UpdateExpression:
        "SET reason = :reason, price = :price, location = :location, active = :active",
      ExpressionAttributeValues: {
        ":reason": data.reason,
        ":price": Number(data.price),
        ":location": data.location || null,
        ":active": true,
      },
    })
  );
}

export async function deleteSurcharge(id: string) {
  await docClient.send(
    new DeleteCommand({
      TableName: tables.surcharge,
      Key: { id },
    })
  );
}
