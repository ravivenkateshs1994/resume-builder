import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/templates/route";

describe("GET /api/templates", () => {
  it("returns template metadata array", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(Array.isArray(payload.templates)).toBe(true);
    expect(payload.templates.length).toBeGreaterThan(0);

    const first = payload.templates[0];
    expect(first).toHaveProperty("isPremium");
    expect(first).toHaveProperty("priceModel");
    expect(first).toHaveProperty("recommendedRoles");
    expect(first).toHaveProperty("atsScore");
    expect(first).toHaveProperty("premiumBadgeType");
  });
});
