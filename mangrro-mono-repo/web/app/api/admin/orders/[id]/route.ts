import { NextResponse } from "next/server";
import { dynamo } from "@/lib/db/client";
import { TABLES } from "@/lib/db/tables";
import {
  ScanCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

/* Convert Dynamo → AdminOrder (same as listAllOrders) */
function toAdminOrder(item: any) {
  if (!item) return null;

  return {
    id: item.id,

    customerName: item.customerName,
    customerEmail: item.customerEmail,
    customerPhone: item.customerPhone,

    restaurantName: item.restaurantName,
    instorePickup: !!item.instorePickup,
    pickupLocation: item.pickupLocation,

    deliveryLocation: item.dropLocation ?? "",

    items: (item.items ?? []).map((i: any) => ({
      name: i.name,
      qty: Number(i.quantity ?? 1),
      price: Number(i.price ?? 0),
    })),

    deliveryCharge: Number(item.deliveryCharge ?? 0),
    tax: Number(item.tax ?? 0),
    surcharge: Number(item.surcharge ?? 0),

    orderTotal: Number(item.orderTotal ?? 0),

    notes: item.notes ?? "",
    history: item.history ?? [],

    status: item.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

/* Helper: find order by id using Scan (because PK is id+createdAt) */
async function findOrderById(id: string) {
  const scan = await dynamo.send(
    new ScanCommand({
      TableName: TABLES.ORDERS,
      FilterExpression: "id = :id",
      ExpressionAttributeValues: {
        ":id": id,
      },
    })
  );

  const items = scan.Items ?? [];
  if (!items.length) return null;
  return items[0];
}

/* ============================================================
   GET ORDER BY ID (Admin)
============================================================ */
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const existing = await findOrderById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order: toAdminOrder(existing),
    });
  } catch (err) {
    console.error("GET order error:", err);
    return NextResponse.json(
      { error: "Failed to load order" },
      { status: 500 }
    );
  }
}

/* ============================================================
   UPDATE ORDER (Edit Order Modal)
============================================================ */
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const now = new Date().toISOString();

    // 1. Load existing item by id (to get its full key, incl. createdAt)
    const existing = await findOrderById(id);

    if (!existing) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // 2. Convert items back to Dynamo format (qty → quantity)
    const mappedItems = (body.items ?? []).map((i: any) => ({
      name: i.name,
      quantity: Number(i.qty ?? 1),
      price: Number(i.price ?? 0),
    }));

    // 3. Use full key: id + createdAt (composite key)
    const response = await dynamo.send(
      new UpdateCommand({
        TableName: TABLES.ORDERS,
        Key: {
          id: existing.id,
          createdAt: existing.createdAt,
        },

        UpdateExpression: `
          SET 
            customerPhone = :phone,
            dropLocation = :address,
            items = :items,
            deliveryCharge = :deliveryCharge,
            tax = :tax,
            surcharge = :surcharge,
            updatedAt = :updatedAt
        `,

        ExpressionAttributeValues: {
          ":phone": body.customerPhone ?? existing.customerPhone,
          ":address": body.deliveryLocation ?? existing.dropLocation,
          ":items": mappedItems,
          ":deliveryCharge": Number(
            body.deliveryCharge ?? existing.deliveryCharge
          ),
          ":tax": Number(body.tax ?? existing.tax),
          ":surcharge": Number(
            body.surcharge ?? existing.surcharge
          ),
          ":updatedAt": now,
        },

        ReturnValues: "ALL_NEW",
      })
    );

    const updated = toAdminOrder(response.Attributes);

    return NextResponse.json({
      success: true,
      data: updated, // keep old shape
      order: updated, // new shape for AdminOrderEditModal
    });
  } catch (err) {
    console.error("Order Update Error:", err);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}

/* ============================================================
   DELETE ORDER
============================================================ */
export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const existing = await findOrderById(id);
    if (!existing) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    await dynamo.send(
      new DeleteCommand({
        TableName: TABLES.ORDERS,
        Key: {
          id: existing.id,
          createdAt: existing.createdAt,
        },
      })
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Order Delete Error:", err);
    return NextResponse.json(
      { error: "Failed to delete order" },
      { status: 500 }
    );
  }
}
