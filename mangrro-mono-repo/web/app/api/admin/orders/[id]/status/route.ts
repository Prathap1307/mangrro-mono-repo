import { NextResponse } from "next/server";
import { appendOrderHistory, updateOrderStatus } from "@/lib/aws/dynamo";

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 🔥 FIX: correctly unwrap params
    const { id } = await context.params;

    const body = await req.json();
    const { status, note } = body;

    if (!status) {
      return NextResponse.json({ error: "Missing status" }, { status: 400 });
    }

    // 📌 1. Update status
    const updatedOrder = await updateOrderStatus(id, status);

    // 📌 2. Append history entry
    await appendOrderHistory(id, status, note);

    return NextResponse.json(
      {
        success: true,
        order: updatedOrder,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("STATUS UPDATE ERROR:", err);
    return NextResponse.json(
      { error: "Status update failed" },
      { status: 500 }
    );
  }
}
