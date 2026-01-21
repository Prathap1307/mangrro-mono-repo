import { NextResponse } from "next/server";
import {
  getAdminRestaurantByName,
  saveAdminRestaurantItems,
} from "@/lib/admin/restaurants";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const restaurantName = decodeURIComponent(name);
  const restaurant = await getAdminRestaurantByName(restaurantName);
  return NextResponse.json(restaurant?.items ?? []);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const restaurantName = decodeURIComponent(name);
  const payload = await request.json();
  const items = Array.isArray(payload.items) ? payload.items : [];
  const saved = await saveAdminRestaurantItems(restaurantName, items);
  return NextResponse.json(saved);
}
