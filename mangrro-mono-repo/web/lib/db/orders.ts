import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient, tables } from "@/lib/aws/client";
import { Order, OrderStatus } from "@/types/orders";

export async function getAllOrders() {
  const result = await docClient.send(new ScanCommand({ TableName: tables.orders }));
  return (result.Items as Order[]) || [];
}

export async function getTodayOrders() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const result = await docClient.send(
    new ScanCommand({
      TableName: tables.orders,
      FilterExpression: "createdAt >= :today",
      ExpressionAttributeValues: {
        ":today": today.toISOString(),
      },
    })
  );
  return (result.Items as Order[]) || [];
}

export async function getOrderById(id: string) {
  const result = await docClient.send(
    new GetCommand({ TableName: tables.orders, Key: { orderId: id } })
  );
  return result.Item as Order | undefined;
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  await docClient.send(
    new UpdateCommand({
      TableName: tables.orders,
      Key: { orderId: id },
      UpdateExpression: "set #status = :status, updatedAt = :updatedAt",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: {
        ":status": status,
        ":updatedAt": new Date().toISOString(),
      },
    })
  );
}

export async function updateOrderItems(id: string, items: Order["items"]) {
  await docClient.send(
    new UpdateCommand({
      TableName: tables.orders,
      Key: { orderId: id },
      UpdateExpression: "set items = :items, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":items": items,
        ":updatedAt": new Date().toISOString(),
      },
    })
  );
}

export async function updateOrderAddress(
  id: string,
  address: { pickupLocation?: string; dropLocation?: string }
) {
  const expressions = [] as string[];
  const names: Record<string, string> = {};
  const values: Record<string, string> = { ":updatedAt": new Date().toISOString() };
  if (address.pickupLocation) {
    expressions.push("pickupLocation = :pickupLocation");
    values[":pickupLocation"] = address.pickupLocation;
  }
  if (address.dropLocation) {
    expressions.push("dropLocation = :dropLocation");
    values[":dropLocation"] = address.dropLocation;
  }

  await docClient.send(
    new UpdateCommand({
      TableName: tables.orders,
      Key: { orderId: id },
      UpdateExpression: `set ${expressions.join(", ")}, updatedAt = :updatedAt`,
      ExpressionAttributeNames: Object.keys(names).length ? names : undefined,
      ExpressionAttributeValues: values,
    })
  );
}

export async function saveOrder(order: Order) {
  await docClient.send(
    new PutCommand({
      TableName: tables.orders,
      Item: order,
    })
  );
}

export async function deleteOrder(id: string) {
  await docClient.send(
    new DeleteCommand({ TableName: tables.orders, Key: { orderId: id } })
  );
}
