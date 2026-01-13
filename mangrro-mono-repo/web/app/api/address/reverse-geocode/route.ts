import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json({ error: "Missing lat/lng" }, { status: 400 });
  }

  const token = process.env.MAPBOX_TOKEN;

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=address&limit=1&access_token=${token}`;

  const res = await fetch(url);
  const data = await res.json();

  if (!data.features?.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const place = data.features[0];

  const [postcode] = place.context.find((c: any) =>
    c.id.startsWith("postcode")
  )?.text ?? [""];

  return NextResponse.json({
    address: {
      line1: place.text,
      line2: place.address,
      town: place.context.find((c: any) => c.id.startsWith("place"))?.text || "",
      postcode,
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
    },
  });
}
