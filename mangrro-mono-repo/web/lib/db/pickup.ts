import { PutCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

import { dynamo } from "@/lib/db/client";
import { getTableName } from "@/lib/db/tables";
import { Pickup } from "@/types/pickup";

function pickupTable() {
  return getTableName("PICKUPS"); // maps to AWS_PICKUP_TABLE
}

/* ================= CREATE PICKUP ================= */

export async function createPickup(data: Partial<Pickup>) {
  if (!data.pickupAddress || !data.dropoffAddress) {
    throw new Error("Missing pickup or dropoff address");
  }

  const pickup: Pickup = {
    pickupId: data.pickupId ?? randomUUID(),
    pickupAddress: data.pickupAddress,
    dropoffAddress: data.dropoffAddress,
    parcelSize: data.parcelSize ?? "Medium",
    pickupTime: data.pickupTime ?? new Date().toISOString(),
    dropTime: data.dropTime,

    image: data.image, // S3 metadata { key, url, type }

    status: data.status ?? "pending",
    createdAt: data.createdAt ?? new Date().toISOString(),
  };

  await dynamo.send(
    new PutCommand({
      TableName: pickupTable(),
      Item: pickup,
    })
  );

  return pickup;
}

/* ================= GET ALL PICKUPS (OPTIONAL) ================= */

export async function getPickups(): Promise<Pickup[]> {
  const { Items } = await dynamo.send(
    new ScanCommand({
      TableName: pickupTable(),
    })
  );

  return (Items as Pickup[]) ?? [];
}

/* ================= UPDATE STATUS (OPTIONAL) ================= */

export async function updatePickupStatus(
  pickupId: string,
  status: Pickup["status"]
) {
  await dynamo.send(
    new UpdateCommand({
      TableName: pickupTable(),
      Key: { pickupId },
      UpdateExpression: "SET #status = :s",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":s": status,
      },
    })
  );
}
