import { describe, expect, it } from "vitest";
import { getRecommendedTemplateIds, TEMPLATE_CATALOG } from "@/lib/templateCatalog";

describe("template catalog", () => {
  it("contains monetization fields on all templates", () => {
    for (const template of TEMPLATE_CATALOG) {
      expect(template.priceModel).toBeDefined();
      expect(Array.isArray(template.recommendedRoles)).toBe(true);
      expect(template.atsScore === null || typeof template.atsScore === "number").toBe(true);
    }
  });

  it("returns deterministic recommendations", () => {
    const first = getRecommendedTemplateIds("frontend-engineer");
    const second = getRecommendedTemplateIds("frontend-engineer");
    expect(first).toEqual(second);
    expect(first.length).toBe(3);
  });
});
