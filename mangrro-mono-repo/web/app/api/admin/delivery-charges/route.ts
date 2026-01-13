import { NextResponse } from "next/server";
import { createRule, getDeliveryRules } from "@/lib/db/deliveryCharges";

export async function GET() {
  const rules = await getDeliveryRules();
  return NextResponse.json(rules);
}

export async function POST(request: Request) {
  const body = await request.json();
  const saved = await createRule(body);
  return NextResponse.json(saved);
}
