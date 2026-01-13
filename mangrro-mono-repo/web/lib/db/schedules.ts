import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

import { docClient, tables } from "@/lib/aws/client";
import { Schedule } from "@/types/schedule";

/* ============================================
   CATEGORY SCHEDULES  (existing behavior)
   ============================================ */

// GET all category schedules (old table)
export async function getCategorySchedules() {
  const result = await docClient.send(
    new ScanCommand({
      TableName: tables.categorySchedules,
    }),
  );

  return (result.Items as Schedule[]) ?? [];
}

// Get by ID (category table)
export async function getCategoryScheduleById(id: string) {
  const result = await docClient.send(
    new GetCommand({
      TableName: tables.categorySchedules,
      Key: { id },
    }),
  );

  return (result.Item as Schedule | undefined) ?? null;
}

// CREATE/UPDATE category schedule
export async function createCategorySchedule(schedule: Schedule) {
  const id = schedule.id ?? crypto.randomUUID();

  const item = {
    id,
    categoryId: schedule.categoryId,
    timeslots: schedule.timeslots,
  };

  await docClient.send(
    new PutCommand({
      TableName: tables.categorySchedules,
      Item: item,
    }),
  );

  return item;
}

// UPDATE category schedule
export async function updateCategorySchedule(schedule: Schedule) {
  await docClient.send(
    new UpdateCommand({
      TableName: tables.categorySchedules,
      Key: { id: schedule.id },
      UpdateExpression: "SET timeslots = :t",
      ExpressionAttributeValues: { ":t": schedule.timeslots },
    }),
  );
}

// DELETE category schedule
export async function deleteCategorySchedule(id: string) {
  await docClient.send(
    new DeleteCommand({
      TableName: tables.categorySchedules,
      Key: { id },
    }),
  );
}


/* ============================================
   ITEM SCHEDULES  (NEW SEPARATE TABLE)
   ============================================ */

/**
 * Ensures:
 * ✔ items go to tables.itemSchedules
 * ✔ 1 itemId → exactly 1 schedule row
 */

// GET all item schedules
export async function getItemSchedules() {
  const result = await docClient.send(
    new ScanCommand({
      TableName: tables.itemSchedules,
    }),
  );

  return (result.Items as Schedule[]) ?? [];
}

// GET by schedule ID (item table)
export async function getItemScheduleById(id: string) {
  const result = await docClient.send(
    new GetCommand({
      TableName: tables.itemSchedules,
      Key: { id },
    }),
  );

  return (result.Item as Schedule | undefined) ?? null;
}

// INTERNAL: find schedule for itemId
async function findItemScheduleByItemId(
  itemId: string,
): Promise<Schedule | null> {
  const result = await docClient.send(
    new ScanCommand({
      TableName: tables.itemSchedules,
      FilterExpression: "itemId = :i",
      ExpressionAttributeValues: {
        ":i": itemId,
      },
      Limit: 1,
    }),
  );

  return (result.Items?.[0] as Schedule) ?? null;
}

// CREATE or UPDATE item schedule
export async function createItemSchedule(schedule: Schedule) {
  // Check for existing schedule for this itemId
  const existing = await findItemScheduleByItemId(schedule.itemId!);

  const id = existing?.id ?? schedule.id ?? crypto.randomUUID();

  const item: Schedule = {
    id,
    itemId: schedule.itemId,
    timeslots: schedule.timeslots,
  };

  await docClient.send(
    new PutCommand({
      TableName: tables.itemSchedules,
      Item: item,
    }),
  );

  return item;
}

// UPDATE item schedule
export async function updateItemSchedule(schedule: Schedule) {
  await docClient.send(
    new UpdateCommand({
      TableName: tables.itemSchedules,
      Key: { id: schedule.id },
      UpdateExpression: "SET timeslots = :t",
      ExpressionAttributeValues: { ":t": schedule.timeslots },
    }),
  );
}

// DELETE item schedule
export async function deleteItemSchedule(id: string) {
  await docClient.send(
    new DeleteCommand({
      TableName: tables.itemSchedules,
      Key: { id },
    }),
  );
}
