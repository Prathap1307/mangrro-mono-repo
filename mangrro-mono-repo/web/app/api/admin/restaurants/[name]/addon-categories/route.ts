import { NextResponse } from "next/server";
import {
  getAdminRestaurantByName,
  saveAdminAddonCategories,
} from "@/lib/admin/restaurants";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const restaurantName = decodeURIComponent(name);
  const restaurant = await getAdminRestaurantByName(restaurantName);
  return NextResponse.json(restaurant?.addonCategories ?? []);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const restaurantName = decodeURIComponent(name);
  const payload = await request.json();
  const addonCategories = Array.isArray(payload.addonCategories)
    ? payload.addonCategories
    : [];
  const saved = await saveAdminAddonCategories(restaurantName, addonCategories);
  return NextResponse.json(saved);
}
