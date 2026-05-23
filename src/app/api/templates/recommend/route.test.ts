import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/templates/recommend/route";

describe("GET /api/templates/recommend", () => {
  it("returns recommended template IDs", async () => {
    const request = new Request("http://localhost:3000/api/templates/recommend?jdId=backend-engineer");
    const response = await GET(request);

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(Array.isArray(payload.templateIds)).toBe(true);
    expect(payload.templateIds.length).toBe(3);
  });
});
