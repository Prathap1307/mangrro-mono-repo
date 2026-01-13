import { NextResponse } from "next/server";

function normalizeQuery(q: string) {
  return q
    .toLowerCase()
    .replace(/\band\b/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawQ = searchParams.get("q");
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!rawQ || rawQ.length < 3) {
    return NextResponse.json({ suggestions: [] });
  }

  const q = normalizeQuery(rawQ);
  const token = process.env.MAPBOX_TOKEN;

  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json`
  );

  url.searchParams.set("access_token", token!);
  url.searchParams.set("country", "GB");
  url.searchParams.set("language", "en-GB");
  url.searchParams.set("types", "poi,address,postcode");
  url.searchParams.set("limit", "5");

  if (lat && lng) {
    url.searchParams.set("proximity", `${lng},${lat}`);
  }

  const res = await fetch(url.toString());
  const data = await res.json();

  const suggestions =
    data.features?.map((f: any) => ({
      label: f.text,
      fullLabel: f.place_name,
      latitude: f.center[1],
      longitude: f.center[0],
    })) ?? [];

  return NextResponse.json({ suggestions });
}
