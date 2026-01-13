import {
  DeleteCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

import { docClient, tables } from "@/lib/aws/client";
import { RadiusRule } from "@/types/radius";

// Number sanitizer (DynamoDB does not allow NaN)
function safeNumber(value: any): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

// GET ALL
export async function getAllRadiusZones() {
  const result = await docClient.send(
    new ScanCommand({
      TableName: tables.radius,
    })
  );

  return (result.Items as RadiusRule[]) || [];
}

// CREATE
export async function createRadiusZone(data: any) {
  const rule: RadiusRule = {
    id: data.id, // correct PK
    name: data.name,
    centerLatitude: safeNumber(data.centerLatitude),     // FIXED
    centerLongitude: safeNumber(data.centerLongitude),   // FIXED
    radiusMiles: safeNumber(data.radiusMiles),           // FIXED
    active: true,
  };

  await docClient.send(
    new PutCommand({
      TableName: tables.radius,
      Item: rule,
    })
  );

  return rule;
}

// UPDATE
export async function updateRadiusZone(data: any) {
  await docClient.send(
    new UpdateCommand({
      TableName: tables.radius,
      Key: { id: data.id },
      UpdateExpression:
        "SET name = :name, centerLatitude = :lat, centerLongitude = :lng, radiusMiles = :radius, active = :active",
      ExpressionAttributeValues: {
        ":name": data.name,
        ":lat": safeNumber(data.centerLatitude),          // FIXED
        ":lng": safeNumber(data.centerLongitude),         // FIXED
        ":radius": safeNumber(data.radiusMiles),          // FIXED
        ":active": true,
      },
    })
  );
}

// DELETE
export async function deleteRadiusZone(id: string) {
  await docClient.send(
    new DeleteCommand({
      TableName: tables.radius,
      Key: { id },
    })
  );
}
