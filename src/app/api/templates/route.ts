import { NextResponse } from "next/server";
import { isPremiumTemplatesEnabled } from "@/lib/featureFlags";
import { TEMPLATE_CATALOG } from "@/lib/templateCatalog";

export const dynamic = "force-dynamic";

export async function GET() {
  const premiumEnabled = isPremiumTemplatesEnabled();

  const templates = TEMPLATE_CATALOG
    .filter((item) => premiumEnabled || !item.isPremium)
    .map((item) => ({
      id: item.id,
      name: item.name,
      thumbnailUrl: item.thumbnailUrl,
      description: item.description,
      atsScore: item.atsScore,
      recommendedRoles: item.recommendedRoles,
      isPremium: item.isPremium,
      premiumBadgeType: item.premiumBadgeType,
      priceModel: item.priceModel ?? "free",
      category: item.category,
      tags: item.tags,
      roleCategory: item.roleCategory,
      levelCategory: item.levelCategory,
      recommendedFor: item.recommendedFor,
      recommendedIndustries: item.recommendedIndustries,
    }));

  return NextResponse.json({ templates, premiumEnabled });
}
