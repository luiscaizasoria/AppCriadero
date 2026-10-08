import { describe, it, expect } from "vitest";
import app from "../src/index";

describe("Health API", () => {
  it("GET /api/v1/health debe responder correctamente", async () => {
    const response = await app.request(
      "/api/v1/health",
      {
        method: "GET",
      }
    );

    expect(response.status).toBe(200);

    const body = await response.json();

    expect(body).toEqual({
      status: "ok",
      service: "criadero-kikirikis-api",
    });
  });
});
