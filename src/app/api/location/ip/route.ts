import { NextResponse } from "next/server";

type IpApiResponse = {
  city?: string;
  region?: string;
  country_name?: string;
  latitude?: number;
  longitude?: number;
  postal?: string;
};

function clean(value?: string | null): string {
  return (value ?? "").trim();
}

export async function GET() {
  try {
    const response = await fetch("https://ipapi.co/json/", {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json({ error: text || "IP location lookup failed." }, { status: 502 });
    }

    const payload = (await response.json()) as IpApiResponse;
    const location = [payload.city, payload.region, payload.country_name].map(clean).filter(Boolean).join(", ");

    return NextResponse.json({
      location,
      city: clean(payload.city),
      region: clean(payload.region),
      country: clean(payload.country_name),
      latitude: typeof payload.latitude === "number" ? payload.latitude : null,
      longitude: typeof payload.longitude === "number" ? payload.longitude : null,
      source: "ipapi",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "IP location lookup failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
