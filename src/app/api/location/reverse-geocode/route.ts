import { NextRequest, NextResponse } from "next/server";

type NominatimReverseResponse = {
  display_name?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    hamlet?: string;
    municipality?: string;
    county?: string;
    state?: string;
    country?: string;
    country_code?: string;
    postcode?: string;
  };
};

function clean(value?: string | null): string {
  return (value ?? "").trim();
}

function joinParts(parts: Array<string | undefined | null>): string {
  return [...new Set(parts.map((part) => clean(part)).filter(Boolean))].join(", ");
}

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const lat = Number(params.get("lat"));
    const lon = Number(params.get("lon"));

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return NextResponse.json({ error: "Latitude and longitude are required." }, { status: 400 });
    }

    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lon));
    url.searchParams.set("addressdetails", "1");

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "CareerReadiness/1.0 (location autofill)",
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json({ error: text || "Reverse geocoding failed." }, { status: 502 });
    }

    const payload = (await response.json()) as NominatimReverseResponse;
    const address = payload.address ?? {};
    const city = address.city || address.town || address.village || address.hamlet || address.municipality || address.county;
    const region = address.state || address.county;
    const country = address.country;
    const location = joinParts([city, region, country]) || clean(payload.display_name);

    return NextResponse.json({
      location,
      displayName: clean(payload.display_name),
      city: clean(city),
      region: clean(region),
      country: clean(country),
      countryCode: clean(address.country_code).toUpperCase(),
      source: "nominatim",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Reverse geocoding failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
