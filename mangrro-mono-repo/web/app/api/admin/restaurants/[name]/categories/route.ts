import { NextResponse } from "next/server";
import {
  getAdminRestaurantByName,
  saveAdminRestaurantCategories,
} from "@/lib/admin/restaurants";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const restaurantName = decodeURIComponent(name);
  const restaurant = await getAdminRestaurantByName(restaurantName);
  return NextResponse.json(restaurant?.categories ?? []);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const restaurantName = decodeURIComponent(name);
  const payload = await request.json();
  const categories = Array.isArray(payload.categories) ? payload.categories : [];
  const saved = await saveAdminRestaurantCategories(restaurantName, categories);
  return NextResponse.json(saved);
}
