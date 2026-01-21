import { NextResponse } from "next/server";
import {
  getAdminRestaurantByName,
  saveAdminRestaurantDeliveryCharges,
} from "@/lib/admin/restaurants";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const restaurantName = decodeURIComponent(name);
  const restaurant = await getAdminRestaurantByName(restaurantName);
  return NextResponse.json(restaurant?.deliveryCharges ?? []);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const restaurantName = decodeURIComponent(name);
  const payload = await request.json();
  const deliveryCharges = Array.isArray(payload.deliveryCharges)
    ? payload.deliveryCharges
    : [];
  const saved = await saveAdminRestaurantDeliveryCharges(
    restaurantName,
    deliveryCharges,
  );
  return NextResponse.json(saved);
}
