import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const apiKey = process.env.IDEALPOSTCODES_KEY;

  // Extract UDPRN from paf_14175992 → 14175992
  let udprn = null;

  if (id.startsWith("paf_")) {
    udprn = id.replace("paf_", "");
  }

  const endpoint = udprn
    ? `https://api.ideal-postcodes.co.uk/v1/udprn/${udprn}?api_key=${apiKey}`
    : `https://api.ideal-postcodes.co.uk/v1/addresses/${id}?api_key=${apiKey}`;

  const res = await fetch(endpoint);
  const data = await res.json();

  if (!data.result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const addr = data.result;

  return NextResponse.json({
    address: {
      line1: addr.line_1,
      line2: addr.line_2,
      town: addr.post_town,
      postcode: addr.postcode,
      latitude: addr.latitude,
      longitude: addr.longitude,
    },
  });
}
