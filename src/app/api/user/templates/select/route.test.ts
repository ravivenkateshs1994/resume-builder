import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/user/templates/select/route";

describe("POST /api/user/templates/select", () => {
  it("persists a selected template", async () => {
    const request = new Request("http://localhost:3000/api/user/templates/select", {
      method: "POST",
      headers: { "content-type": "application/json", "x-user-id": "test-user" },
      body: JSON.stringify({ templateId: "modern" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.ok).toBe(true);
    expect(payload.templateId).toBe("modern");
  });

  it("rejects invalid template IDs", async () => {
    const request = new Request("http://localhost:3000/api/user/templates/select", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ templateId: "invalid-template" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
