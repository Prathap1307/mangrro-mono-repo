import { NextResponse } from "next/server";

function normalizeQuery(q: string) {
  return q
    .toLowerCase()
    .replace(/\band\b/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawQ = searchParams.get("q");
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const session = searchParams.get("session") || crypto.randomUUID();

    if (!rawQ || rawQ.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const q = normalizeQuery(rawQ);
    const token = process.env.MAPBOX_TOKEN;
    if (!token) {
      return NextResponse.json({ suggestions: [] }, { status: 500 });
    }

    const url = new URL(
      "https://api.mapbox.com/search/searchbox/v1/suggest"
    );

    url.searchParams.set("q", q);
    url.searchParams.set("access_token", token);
    url.searchParams.set("session_token", session);

    // 🇬🇧 UK only
    url.searchParams.set("country", "GB");
    url.searchParams.set("language", "en-GB");
    url.searchParams.set("limit", "8");

    // 🔥 STORES ONLY — NO PARKING
    url.searchParams.set("types", "poi");
    url.searchParams.set(
      "poi_category",
      "supermarket,groceries,discount_store,home_improvement"
    );

    // 📍 Bias nearby results (optional)
    if (lat && lng) {
      url.searchParams.set("proximity", `${lng},${lat}`);
    }

    const res = await fetch(url.toString());
    const data = await res.json();

    const suggestions =
      data.suggestions?.map((s: any) => ({
        id: s.mapbox_id,
        label: s.name, // "Lidl"
        session,
      })) ?? [];

    return NextResponse.json({ suggestions });
  } catch (err) {
    console.error("Mapbox search error:", err);
    return NextResponse.json({ suggestions: [] }, { status: 500 });
  }
}
