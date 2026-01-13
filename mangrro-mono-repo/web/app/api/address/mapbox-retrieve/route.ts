import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const session = searchParams.get("session");

    if (!id || !session) {
      return NextResponse.json({}, { status: 400 });
    }

    const token = process.env.MAPBOX_TOKEN;
    if (!token) {
      return NextResponse.json({}, { status: 500 });
    }

    const url = new URL(
      `https://api.mapbox.com/search/searchbox/v1/retrieve/${id}`
    );

    url.searchParams.set("access_token", token);
    url.searchParams.set("session_token", session);

    const res = await fetch(url.toString());
    const data = await res.json();

    const feature = data.features?.[0];
    if (!feature) {
      return NextResponse.json({});
    }

    return NextResponse.json({
      name: feature.properties.name, // Lidl
      address: feature.properties.full_address, // Retail Park
      postcode: feature.properties.postcode,
      latitude: feature.geometry.coordinates[1],
      longitude: feature.geometry.coordinates[0],
    });
  } catch (err) {
    console.error("Mapbox retrieve error:", err);
    return NextResponse.json({}, { status: 500 });
  }
}
