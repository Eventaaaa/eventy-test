import { beforeAll, describe, expect, it } from "vitest";
import { buildContractContext, dataOf, type ContractContext } from "./contract-context";
import { asRecord, requestJson, type JsonRecord } from "./http";

type Shape = "array" | "object";

interface ContractCase {
  label: string;
  path: string;
  token?: "user" | "owner";
  shape: Shape;
  fields?: string[];
  minLength?: number;
}

interface CaseFactory {
  label: string;
  build(context: ContractContext): ContractCase;
}

let context: ContractContext;

function tokenFor(kind: "user" | "owner" | undefined): string | undefined {
  if (kind === "user") return context.userToken;
  if (kind === "owner") return context.ownerToken;
  return undefined;
}

function asObject(value: unknown): JsonRecord | null {
  return asRecord(value);
}

function assertShape(contract: ContractCase, body: unknown): void {
  const value = dataOf(body);

  if (contract.shape === "array") {
    expect(Array.isArray(value), `${contract.label} should return an array`).toBe(true);
    const items = value as unknown[];
    if (contract.minLength !== undefined) {
      expect(items.length, `${contract.label} should return data`).toBeGreaterThanOrEqual(
        contract.minLength,
      );
    }

    const first = asRecord(items[0]);
    if (contract.fields && first) {
      for (const field of contract.fields) {
        expect(field in first, `${contract.label} item should contain ${field}`).toBe(true);
      }
    }
    return;
  }

  const record = asObject(value);
  expect(record, `${contract.label} should return an object`).not.toBeNull();
  for (const field of contract.fields ?? []) {
    expect(field in (record ?? {}), `${contract.label} should contain ${field}`).toBe(true);
  }
}

async function runCase(contract: ContractCase): Promise<void> {
  const token = tokenFor(contract.token);
  const { response, body } = await requestJson(contract.path, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  expect(response.status, `${contract.label} (${contract.path})`).toBe(200);
  assertShape(contract, body);
}

const publicCases: CaseFactory[] = [
  {
    label: "public venues list",
    build: () => ({
      label: "public venues list",
      path: "/api/v1/venues",
      shape: "array",
      fields: ["id", "name", "price_per_person", "city"],
      minLength: 1,
    }),
  },
  {
    label: "public venue detail",
    build: (ctx) => ({
      label: "public venue detail",
      path: `/api/v1/venues/${ctx.publicVenueId}`,
      shape: "object",
      fields: ["id", "name", "capacity", "price_per_person"],
    }),
  },
  {
    label: "availability recommendations",
    build: () => ({
      label: "availability recommendations",
      path: "/api/v1/venues/availability-recommendations?date=2026-11-22&limit=3",
      shape: "array",
      fields: ["venue_id", "date", "period"],
    }),
  },
  {
    label: "facilities",
    build: () => ({
      label: "facilities",
      path: "/api/v1/facilities",
      shape: "array",
      fields: ["id", "name", "icon"],
      minLength: 1,
    }),
  },
  {
    label: "occasions",
    build: () => ({
      label: "occasions",
      path: "/api/v1/occasions",
      shape: "array",
      fields: ["id", "name", "slug"],
      minLength: 1,
    }),
  },
  {
    label: "site settings",
    build: () => ({
      label: "site settings",
      path: "/api/v1/site-settings",
      shape: "array",
      fields: ["id", "key", "value"],
      minLength: 1,
    }),
  },
  {
    label: "ads",
    build: () => ({
      label: "ads",
      path: "/api/v1/ads",
      shape: "array",
      fields: ["id", "person", "business", "phone"],
    }),
  },
  {
    label: "pricing config",
    build: () => ({
      label: "pricing config",
      path: "/api/v1/config/pricing",
      shape: "object",
      fields: ["currency", "periods", "rule_types", "weekdays"],
    }),
  },
  {
    label: "payment methods",
    build: () => ({
      label: "payment methods",
      path: "/api/v1/payment-methods",
      shape: "array",
      fields: ["code", "label", "provider"],
      minLength: 1,
    }),
  },
  {
    label: "public venue services",
    build: () => ({
      label: "public venue services",
      path: "/api/v1/venue-services/public",
      shape: "array",
      fields: ["id", "name", "pivot"],
      minLength: 1,
    }),
  },
  {
    label: "metadata",
    build: () => ({
      label: "metadata",
      path: "/api/v1/metadata",
      shape: "object",
      fields: ["periods", "social_platforms", "media_types", "team_roles"],
    }),
  },
  {
    label: "venue reviews",
    build: (ctx) => ({
      label: "venue reviews",
      path: `/api/v1/venues/${ctx.publicVenueId}/reviews`,
      shape: "array",
    }),
  },
  {
    label: "availability slots by month",
    build: (ctx) => ({
      label: "availability slots by month",
      path: `/api/v1/venues/${ctx.publicVenueId}/availability-slots/by-month?month=11&year=2026`,
      shape: "array",
      fields: ["id", "date", "period", "status"],
    }),
  },
];

const userCases: CaseFactory[] = [
  {
    label: "user profile",
    build: () => ({ label: "user profile", path: "/api/v1/profile", token: "user", shape: "object", fields: ["id", "email", "role"] }),
  },
  {
    label: "company icons",
    build: () => ({ label: "company icons", path: "/api/v1/profile/company-icons", token: "user", shape: "array", fields: ["key", "name", "svg"], minLength: 1 }),
  },
  {
    label: "user bookings",
    build: () => ({ label: "user bookings", path: "/api/v1/bookings", token: "user", shape: "array", fields: ["id", "booking_date", "booking_status", "total_price"], minLength: 1 }),
  },
  {
    label: "user booking detail",
    build: (ctx) => ({ label: "user booking detail", path: `/api/v1/bookings/${ctx.bookingId}`, token: "user", shape: "object", fields: ["id", "venue_id", "booking_date"] }),
  },
  {
    label: "user payments",
    build: () => ({ label: "user payments", path: "/api/v1/payments", token: "user", shape: "array", fields: ["id", "booking_id", "amount", "status"], minLength: 1 }),
  },
  {
    label: "user notifications",
    build: () => ({ label: "user notifications", path: "/api/v1/notifications", token: "user", shape: "array" }),
  },
  {
    label: "contribution registries",
    build: () => ({ label: "contribution registries", path: "/api/v1/contribution-registries", token: "user", shape: "array", fields: ["id", "public_slug", "items"], minLength: 1 }),
  },
  {
    label: "contribution registry detail",
    build: (ctx) => ({ label: "contribution registry detail", path: `/api/v1/contribution-registries/${ctx.registryId}`, token: "user", shape: "object", fields: ["id", "public_slug", "title"] }),
  },
  {
    label: "public contribution registry",
    build: (ctx) => ({ label: "public contribution registry", path: `/api/v1/public/contribution-registries/${ctx.registrySlug}`, shape: "object", fields: ["public_slug", "title"] }),
  },
  {
    label: "event timelines",
    build: () => ({ label: "event timelines", path: "/api/v1/timelines", token: "user", shape: "array", fields: ["id", "title", "share_token"], minLength: 1 }),
  },
  {
    label: "event timeline detail",
    build: (ctx) => ({ label: "event timeline detail", path: `/api/v1/timelines/${ctx.timelineId}`, token: "user", shape: "object", fields: ["id", "title"] }),
  },
  {
    label: "public timeline",
    build: (ctx) => ({ label: "public timeline", path: `/api/v1/public/timelines/${ctx.timelineToken}`, shape: "object", fields: ["id", "share_token"] }),
  },
];

const ownerCases: CaseFactory[] = [
  {
    label: "owner venues",
    build: () => ({ label: "owner venues", path: "/api/v1/venues", token: "owner", shape: "array", fields: ["id", "name", "is_active"], minLength: 1 }),
  },
  {
    label: "owner venue detail",
    build: (ctx) => ({ label: "owner venue detail", path: `/api/v1/venues/${ctx.ownerVenueId}`, token: "owner", shape: "object", fields: ["id", "name", "address", "city"] }),
  },
  {
    label: "venue media",
    build: (ctx) => ({ label: "venue media", path: `/api/v1/venues/${ctx.ownerVenueId}/media`, token: "owner", shape: "array", fields: ["id", "venue_id", "type"] }),
  },
  {
    label: "pricing rules",
    build: (ctx) => ({ label: "pricing rules", path: `/api/v1/venues/${ctx.ownerVenueId}/pricing-rules`, token: "owner", shape: "array", fields: ["id", "venue_id", "rule_type", "price"], minLength: 1 }),
  },
  {
    label: "catering options",
    build: (ctx) => ({ label: "catering options", path: `/api/v1/venues/${ctx.ownerVenueId}/catering-options`, token: "owner", shape: "array", fields: ["id", "title", "price_per_person"], minLength: 1 }),
  },
  {
    label: "venue rules",
    build: (ctx) => ({ label: "venue rules", path: `/api/v1/venues/${ctx.ownerVenueId}/rules`, token: "owner", shape: "array", fields: ["id", "title", "short"], minLength: 1 }),
  },
  {
    label: "facility details",
    build: (ctx) => ({ label: "facility details", path: `/api/v1/venues/${ctx.ownerVenueId}/facility-details`, token: "owner", shape: "array", fields: ["title", "items"], minLength: 1 }),
  },
  {
    label: "social accounts",
    build: (ctx) => ({ label: "social accounts", path: `/api/v1/venues/${ctx.ownerVenueId}/social-accounts`, token: "owner", shape: "array", fields: ["id", "platform", "url"], minLength: 1 }),
  },
  {
    label: "team members",
    build: (ctx) => ({ label: "team members", path: `/api/v1/venues/${ctx.ownerVenueId}/team-members`, token: "owner", shape: "array", fields: ["id", "slot", "role", "status"], minLength: 1 }),
  },
  {
    label: "venue faqs",
    build: (ctx) => ({ label: "venue faqs", path: `/api/v1/venues/${ctx.ownerVenueId}/faqs`, token: "owner", shape: "array", fields: ["id", "question", "answer"], minLength: 1 }),
  },
  {
    label: "daily offers",
    build: (ctx) => ({ label: "daily offers", path: `/api/v1/venues/${ctx.ownerVenueId}/daily-offers`, token: "owner", shape: "array", fields: ["id", "date", "discount_percent"], minLength: 1 }),
  },
  {
    label: "venue facilities",
    build: (ctx) => ({ label: "venue facilities", path: `/api/v1/venues/${ctx.ownerVenueId}/facilities`, token: "owner", shape: "array", fields: ["id", "name", "icon"], minLength: 1 }),
  },
  {
    label: "venue occasions",
    build: (ctx) => ({ label: "venue occasions", path: `/api/v1/venues/${ctx.ownerVenueId}/occasions`, token: "owner", shape: "array", fields: ["id", "name", "slug"], minLength: 1 }),
  },
  {
    label: "venue availability slots",
    build: (ctx) => ({ label: "venue availability slots", path: `/api/v1/venues/${ctx.ownerVenueId}/availability-slots`, token: "owner", shape: "object" }),
  },
  {
    label: "owner availability slots by month",
    build: (ctx) => ({ label: "owner availability slots by month", path: `/api/v1/venues/${ctx.ownerVenueId}/availability-slots/by-month?month=11&year=2026`, token: "owner", shape: "array", fields: ["id", "date", "period", "status"] }),
  },
  {
    label: "venue services",
    build: () => ({ label: "venue services", path: "/api/v1/venue-services", token: "owner", shape: "array", fields: ["id", "name"], minLength: 1 }),
  },
  {
    label: "owner bookings",
    build: () => ({ label: "owner bookings", path: "/api/v1/bookings", token: "owner", shape: "array", fields: ["id", "venue_id", "booking_date"], minLength: 1 }),
  },
  {
    label: "booking years",
    build: () => ({ label: "booking years", path: "/api/v1/bookings/years", token: "owner", shape: "array", minLength: 1 }),
  },
  {
    label: "booking stats",
    build: () => ({ label: "booking stats", path: "/api/v1/bookings/stats", token: "owner", shape: "object", fields: ["summary", "statusBreakdown", "paymentBreakdown", "bookingsByMonth", "dateRange"] }),
  },
  {
    label: "monthly statistics",
    build: () => ({ label: "monthly statistics", path: "/api/v1/statistics/monthly", token: "owner", shape: "object", fields: ["dateRange", "totals", "monthly", "venues"] }),
  },
  {
    label: "owner notifications",
    build: () => ({ label: "owner notifications", path: "/api/v1/notifications", token: "owner", shape: "array" }),
  },
];

const protectedPaths = [
  "/api/v1/profile",
  "/api/v1/bookings",
  "/api/v1/payments",
  "/api/v1/notifications",
  "/api/v1/timelines",
  "/api/v1/contribution-registries",
];

describe("frontend backend data contracts", () => {
  beforeAll(async () => {
    context = await buildContractContext();
  }, 90000);

  for (const factory of [...publicCases, ...userCases, ...ownerCases]) {
    it(factory.label, async () => {
      await runCase(factory.build(context));
    });
  }

  it("facility detail items expose the denormalized facility name and top flag", async () => {
    const { response, body } = await requestJson(
      `/api/v1/venues/${context.ownerVenueId}/facility-details`,
      { headers: { Authorization: `Bearer ${context.ownerToken}` } },
    );

    expect(response.status).toBe(200);

    const groups = dataOf(body) as unknown[];
    const group = asRecord(groups[0]);
    const items = (group?.items ?? []) as unknown[];
    const item = asRecord(items[0]);

    expect(item).not.toBeNull();
    for (const field of ["id", "facility_id", "facility_name", "label", "is_top"]) {
      expect(field in (item ?? {}), `facility detail item should contain ${field}`).toBe(true);
    }
  });

  it("venue topFacilities contains only starred detail rows", async () => {
    const headers = { Authorization: `Bearer ${context.ownerToken}` };
    const { response, body } = await requestJson(
      `/api/v1/venues/${context.ownerVenueId}?includeFacilityDetails=true`,
      { headers },
    );

    expect(response.status).toBe(200);

    const venue = dataOf(body) as Record<string, unknown>;
    const topFacilities = (venue?.topFacilities ?? []) as unknown[];

    expect(Array.isArray(venue?.topFacilities)).toBe(true);
    for (const facility of topFacilities) {
      expect(asRecord(facility)?.is_top).toBe(true);
    }

    const { body: detailsBody } = await requestJson(
      `/api/v1/venues/${context.ownerVenueId}/facility-details`,
      { headers },
    );
    const groups = dataOf(detailsBody) as unknown[];
    const starredNames = groups.flatMap((group) => {
      const items = (asRecord(group)?.items ?? []) as unknown[];
      return items
        .filter((item) => asRecord(item)?.is_top === true)
        .map((item) => String(asRecord(item)?.label ?? ""));
    });

    expect(topFacilities.map((facility) => asRecord(facility)?.name).sort())
      .toEqual(starredNames.sort());
  });

  it.each(protectedPaths)("rejects anonymous access to %s", async (path) => {
    const { response } = await requestJson(path);
    expect([401, 403]).toContain(response.status);
  });
});
