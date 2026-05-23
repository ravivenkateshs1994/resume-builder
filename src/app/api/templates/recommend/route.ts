import { NextResponse } from "next/server";
import { getRecommendedTemplateIds } from "@/lib/templateCatalog";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const jdId = new URL(request.url).searchParams.get("jdId") ?? "default";
  const templateIds = getRecommendedTemplateIds(jdId);
  return NextResponse.json({ templateIds });
}
