import { describe, expect, it } from "vitest";
import { asRecord, backendUrl, requestJson } from "./http";

const userEmail = process.env.EVENTY_INTEGRATION_EMAIL ?? "test-user@eventy.com";
const userPassword = process.env.EVENTY_INTEGRATION_PASSWORD ?? "TestUser123!";

describe("Eventy backend HTTP integration", () => {
  it("responds to the Laravel health endpoint", async () => {
    const response = await fetch(`${backendUrl}/up`);

    expect(response.status).toBe(200);
  });

  it("lists venues through the public API", async () => {
    const { response, body } = await requestJson("/api/v1/venues");

    expect(response.status).toBe(200);
    const payload = asRecord(body);
    expect(payload).not.toBeNull();
    expect(Array.isArray(payload?.data)).toBe(true);
  });

  it("reads a venue detail using the contract consumed by both frontends", async () => {
    const list = await requestJson("/api/v1/venues");
    expect(list.response.status).toBe(200);

    const listPayload = asRecord(list.body);
    const venues = Array.isArray(listPayload?.data) ? listPayload.data : [];
    const firstVenue = asRecord(venues[0]);
    expect(firstVenue).not.toBeNull();

    const detail = await requestJson(`/api/v1/venues/${String(firstVenue?.id)}`);
    expect(detail.response.status).toBe(200);

    const detailPayload = asRecord(detail.body);
    const data = asRecord(detailPayload?.data);
    expect(data?.id).toBe(firstVenue?.id);
    expect(typeof data?.name).toBe("string");
  });

  it("serves the batched availability recommendation endpoint used by the user frontend", async () => {
    const date = new Date().toISOString().slice(0, 10);
    const { response, body } = await requestJson(
      `/api/v1/venues/availability-recommendations?date=${date}&limit=3`,
    );

    expect(response.status).toBe(200);
    const payload = asRecord(body);
    expect(Array.isArray(payload?.data)).toBe(true);
  });

  it("rejects unauthenticated profile access", async () => {
    const { response } = await requestJson("/api/v1/profile");

    expect(response.status).toBe(401);
  });

  it("logs in a deterministic user and reads the protected profile", async () => {
    const login = await requestJson("/api/v1/login", {
      method: "POST",
      body: JSON.stringify({ email: userEmail, password: userPassword }),
    });

    expect(login.response.status).toBe(200);
    const loginPayload = asRecord(login.body);
    const token = loginPayload?.token;
    expect(typeof token).toBe("string");

    const profile = await requestJson("/api/v1/profile", {
      headers: { Authorization: `Bearer ${String(token)}` },
    });

    expect(profile.response.status).toBe(200);
    const profilePayload = asRecord(profile.body);
    const data = asRecord(profilePayload?.data);
    expect(data?.email).toBe(userEmail);
  });
});
