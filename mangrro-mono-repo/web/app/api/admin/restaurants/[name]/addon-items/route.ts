import { NextResponse } from "next/server";
import {
  getAdminRestaurantByName,
  saveAdminAddonItems,
} from "@/lib/admin/restaurants";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const restaurantName = decodeURIComponent(name);
  const restaurant = await getAdminRestaurantByName(restaurantName);
  return NextResponse.json(restaurant?.addonItems ?? []);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const restaurantName = decodeURIComponent(name);
  const payload = await request.json();
  const addonItems = Array.isArray(payload.addonItems) ? payload.addonItems : [];
  const saved = await saveAdminAddonItems(restaurantName, addonItems);
  return NextResponse.json(saved);
}
