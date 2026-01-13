import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { Currency } from "square";

import { getSquareClient } from "@/lib/squareClient";
import { getCachedLocationId } from "@/lib/squareLocation";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sourceId, amount, currency = "GBP" } = body || {};

    if (!sourceId || typeof sourceId !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing payment source token." },
        { status: 400 }
      );
    }

    const amountNumber = Number(amount);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      return NextResponse.json(
        { ok: false, error: "Invalid payment amount." },
        { status: 400 }
      );
    }

    const client = getSquareClient();
    const locationId = await getCachedLocationId();

    const response = await client.payments.create({
      sourceId,
      idempotencyKey: randomUUID(),
      amountMoney: {
        amount: BigInt(Math.round(amountNumber * 100)),
        currency: currency as Currency,
      },
      locationId,
      autocomplete: true,
    });

    const payment = response.payment;

    return NextResponse.json(
      { ok: true, paymentId: payment?.id, status: payment?.status },
      { status: 200 }
    );
  } catch (error) {
    console.error("Square payment error:", error);

    const detail =
      (error as { errors?: { detail?: string }[] })?.errors?.[0]?.detail ||
      (error as { response?: { body?: { errors?: { detail?: string }[] } } })?.
        response?.body?.errors?.[0]?.detail ||
      (error as Error)?.message ||
      "Payment processing failed.";

    return NextResponse.json({ ok: false, error: detail }, { status: 400 });
  }
}
