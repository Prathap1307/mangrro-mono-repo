import { NextResponse } from "next/server";
import {
  getAdminRestaurantByName,
  saveAdminRestaurantOffers,
} from "@/lib/admin/restaurants";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const restaurantName = decodeURIComponent(name);
  const restaurant = await getAdminRestaurantByName(restaurantName);
  return NextResponse.json(restaurant?.offers ?? []);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const restaurantName = decodeURIComponent(name);
  const payload = await request.json();
  const offers = Array.isArray(payload.offers) ? payload.offers : [];
  const saved = await saveAdminRestaurantOffers(restaurantName, offers);
  return NextResponse.json(saved);
}
