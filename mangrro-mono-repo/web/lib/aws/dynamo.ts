import {
  DynamoDBClient,
  type DynamoDBClientConfig,
} from "@aws-sdk/client-dynamodb";

import {
  GetCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

import type { AdminOrder, AdminOrderItem, AdminOrderStatus } from "../admin/orders";
import { getTableName } from "@/lib/db/tables";

function ordersTable(optional = false) {
  return getTableName("ORDERS", { optional });
}


function getClient() {
  const config: DynamoDBClientConfig = {
    region: process.env.AWS_REGION,
  };

  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    config.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    };
  }

  return new DynamoDBClient(config);
}


/* ---------------------------------------------------------
   FIXED: Convert Dynamo → AdminOrder
--------------------------------------------------------- */
function fromDynamoOrder(item: any): AdminOrder {
  return {
    id: item.id,

    customerName: item.customerName,
    customerEmail: item.customerEmail,
    customerPhone: item.customerPhone,

    restaurantName: item.restaurantName,
    instorePickup: Boolean(item.instorePickup),
    pickupLocation: item.pickupLocation,

    deliveryLocation: item.dropLocation ?? "", // FIXED

    /* -------------------------
       FIXED: qty + price mapping
    -------------------------- */
    items: (item.items || []).map((entry: any) => ({
      id: entry.id ?? crypto.randomUUID(),
      name: entry.name,
      qty: Number(entry.quantity ?? 1), // FIXED
      price: Number(entry.price ?? 0),
    })),

    deliveryCharge: Number(item.deliveryCharge ?? 0),
    tax: Number(item.tax ?? 0),
    surcharge: Number(item.surcharge ?? 0),

    notes: item.notes ?? "",
    /* FIXED: status history */
    history: item.history ?? [],

    status: item.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

/* ---------------------------------------------------------
   GET ONE ORDER
--------------------------------------------------------- */
export async function getOrderById(orderId: string): Promise<AdminOrder | null> {
  const tableName = ordersTable(true);
  if (!tableName) return null;

  const client = getClient();
  const response = await client.send(
    new GetCommand({
      TableName: tableName,
      Key: { id: orderId },
    })
  );

  return response.Item ? fromDynamoOrder(response.Item) : null;
}

/* ---------------------------------------------------------
   GET ALL ORDERS
--------------------------------------------------------- */
export async function listAllOrders(): Promise<AdminOrder[]> {
  const tableName = ordersTable(true);
  if (!tableName) return [];

  const client = getClient();
  const result = await client.send(
    new ScanCommand({ TableName: tableName })
  );

  return (result.Items || []).map(fromDynamoOrder);
}

/* ---------------------------------------------------------
   GET TODAY ORDERS
--------------------------------------------------------- */
export async function listTodayOrders(): Promise<AdminOrder[]> {
  const tableName = ordersTable(true);
  if (!tableName) return [];

  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const client = getClient();

  const result = await client.send(
    new ScanCommand({
      TableName: tableName,
    })
  );

  return (result.Items || [])
    .map(fromDynamoOrder)
    .filter((order) => {
      if (!order.createdAt) return false;
      const created = new Date(order.createdAt);
      return created >= start && created <= end;
    });
}

/* ---------------------------------------------------------
   UPDATE ORDER STATUS + SAVE HISTORY
--------------------------------------------------------- */
export async function updateOrderStatus(orderId: string, status: string) {
  const tableName = ordersTable();

  const client = getClient();
  const response = await client.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { id: orderId },        // <-- MUST MATCH your table schema
      UpdateExpression: "SET #status = :status",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: { ":status": status },
      ReturnValues: "ALL_NEW",
    })
  );

  return response.Attributes ? fromDynamoOrder(response.Attributes) : null;
}


/* ---------------------------------------------------------
   UPDATE ORDER ITEMS (admin edit)
--------------------------------------------------------- */
export async function updateOrderItems(
  orderId: string,
  items: AdminOrderItem[],
  customerPhone?: string,
  deliveryLocation?: string
) {
  const tableName = ordersTable();

  const client = getClient();

  const response = await client.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { id: orderId },
      UpdateExpression:
        "SET items = :items, customerPhone = :phone, dropLocation = :deliveryLocation",
      ExpressionAttributeValues: {
        ":items": items,
        ":phone": customerPhone,
        ":deliveryLocation": deliveryLocation,
      },
      ReturnValues: "ALL_NEW",
    })
  );

  return response.Attributes ? fromDynamoOrder(response.Attributes) : null;
}

/* ---------------------------------------------------------
   UPDATE DELIVERY CHARGES
--------------------------------------------------------- */
export async function updateOrderCharges(
  orderId: string,
  deliveryCharge: number,
  tax: number,
  surcharge: number
) {
  const tableName = ordersTable();

  const client = getClient();
  const response = await client.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { id: orderId },
      UpdateExpression:
        "SET deliveryCharge = :deliveryCharge, tax = :tax, surcharge = :surcharge",
      ExpressionAttributeValues: {
        ":deliveryCharge": deliveryCharge,
        ":tax": tax,
        ":surcharge": surcharge,
      },
      ReturnValues: "ALL_NEW",
    })
  );

  return response.Attributes ? fromDynamoOrder(response.Attributes) : null;
}


/* ---------------------------------------------------------
   Order History
--------------------------------------------------------- */

export async function appendOrderHistory(
  orderId: string,
  status: AdminOrderStatus,
  note?: string
) {
  const tableName = ordersTable();

  const timestamp = new Date().toISOString();

  const entry = {
    status,
    timestamp,
    note: note || "",
  };

  const client = getClient();

  const response = await client.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { id: orderId },
      UpdateExpression:
        "SET #history = list_append(if_not_exists(#history, :emptyList), :entry), #status = :status",
      ExpressionAttributeNames: {
        "#history": "history",
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":entry": [entry],
        ":emptyList": [],
        ":status": status,
      },
      ReturnValues: "ALL_NEW",
    })
  );

  return response.Attributes ? fromDynamoOrder(response.Attributes) : null;
}
