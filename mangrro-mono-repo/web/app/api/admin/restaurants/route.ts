import { NextResponse } from "next/server";
import {
  deleteAdminRestaurant,
  listAdminRestaurants,
  saveAdminRestaurant,
} from "@/lib/admin/restaurants";

export async function GET() {
  const restaurants = await listAdminRestaurants();
  return NextResponse.json(restaurants);
}

export async function POST(request: Request) {
  const payload = await request.json();
  const saved = await saveAdminRestaurant({
    ...payload,
    imageKey: payload.imageKey || undefined,
  });
  return NextResponse.json(saved);
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  if (id) {
    await deleteAdminRestaurant(id);
  }
  return NextResponse.json({ ok: true });
}
