import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { Currency } from "square";

import { getSquareClient } from "@/lib/squareClient";
import { getCachedLocationId } from "@/lib/squareLocation";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      sourceId,
      amount,
      currency = "GBP",
      buyerEmail,
      locationId,
      method,
    } = body || {};

    if (!sourceId || typeof sourceId !== "string") {
      return NextResponse.json(
        { error: "Invalid payment payload." },
        { status: 400 }
      );
    }

    const amountNumber = Number(amount);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      return NextResponse.json(
        { error: "Invalid payment payload." },
        { status: 400 }
      );
    }

    const client = getSquareClient();
    const resolvedLocationId =
      (typeof locationId === "string" && locationId.trim()) ||
      process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID ||
      (await getCachedLocationId());

    const idempotencyKey = randomUUID();

    const response = await client.payments.create({
      sourceId,
      idempotencyKey,
      amountMoney: {
        amount: BigInt(Math.round(amountNumber * 100)),
        currency: currency as Currency,
      },
      autocomplete: true,
      locationId: resolvedLocationId,
      buyerEmailAddress: buyerEmail,
      note: method ? `Web payment (${method})` : undefined,
    });

    const payment = response.payment;

    return NextResponse.json(
      { success: true, payment },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Square payment error:", error);

    const detail =
      (error as { errors?: { detail?: string }[] })?.errors?.[0]?.detail ||
      (error as { response?: { body?: { errors?: { detail?: string }[] } } })?.
        response?.body?.errors?.[0]?.detail ||
      (error as Error)?.message ||
      "Payment processing failed.";

    const status =
      (error as { statusCode?: number })?.statusCode ||
      (error as { response?: { statusCode?: number } })?.response?.statusCode ||
      500;

    return NextResponse.json(
      { success: false, error: detail },
      { status: status >= 400 ? status : 500 }
    );
  }
}
