// app/api/admin/items/route.ts
import { NextResponse } from "next/server";
import { deleteAdminItem, listAdminItems, saveAdminItem } from "@/lib/admin/catalog";

export async function GET() {
  const items = await listAdminItems();
  // Works with setItems(json.data ?? json ?? [])
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const payload = await request.json();

  const saved = await saveAdminItem({
    ...payload,
    categoryId: typeof payload.categoryId === "string" ? payload.categoryId.trim() : undefined,
    subcategoryId:
      typeof payload.subcategoryId === "string" ? payload.subcategoryId.trim() : undefined,
    imageKey: payload.imageKey || undefined, // 👈 ensure imageKey stored
  });

  return NextResponse.json(saved);
}


export async function DELETE(request: Request) {
  const { id } = await request.json();
  if (id) {
    await deleteAdminItem(id);
  }
  return NextResponse.json({ ok: true });
}
