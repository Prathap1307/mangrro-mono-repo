import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";

  if (q.length < 3) {
    return NextResponse.json({ suggestions: [] });
  }

  const apiKey = process.env.IDEALPOSTCODES_KEY;

  const res = await fetch(
    `https://api.ideal-postcodes.co.uk/v1/autocomplete/addresses?q=${encodeURIComponent(
      q
    )}&api_key=${apiKey}`
  );

  const data = await res.json();

  console.log("IDEAL RESPONSE:", JSON.stringify(data, null, 2));

  // no result at all
  if (!data.result) {
    return NextResponse.json({ suggestions: [] });
  }

  let results = [];

  // Case 1: data.result = []  (correct format)
  if (Array.isArray(data.result)) {
    results = data.result;
  }

  // Case 2: data.result.hits exists
  if (data.result.hits && Array.isArray(data.result.hits)) {
    results = data.result.hits;
  }

  const suggestions = results.map((item: any) => ({
    id: item.id,
    label: item.text || item.suggestion || item.label,
  }));

  return NextResponse.json({ suggestions });
}
