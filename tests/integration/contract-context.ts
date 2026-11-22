import { asRecord, requestJson, type JsonRecord } from "./http";

export interface ContractContext {
  userToken: string;
  ownerToken: string;
  publicVenueId?: number;
  ownerVenueId?: number;
  bookingId?: number;
  paymentId?: number;
  registryId?: number;
  registrySlug?: string;
  contributionItemId?: number;
  timelineId?: number;
  timelineToken?: string;
}

export function dataOf(body: unknown): unknown {
  const record = asRecord(body);
  return record && "data" in record ? record.data : body;
}

export function firstRecord(value: unknown): JsonRecord | null {
  if (Array.isArray(value)) {
    return asRecord(value[0]);
  }

  return asRecord(value);
}

export function idOf(value: unknown): number | undefined {
  const record = firstRecord(value);
  const id = record?.id;
  return typeof id === "number" ? id : typeof id === "string" ? Number(id) : undefined;
}

function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

async function login(email: string, password: string): Promise<string> {
  const { response, body } = await requestJson("/api/v1/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (response.status !== 200) {
    throw new Error(`login failed for ${email}: ${response.status}`);
  }

  const token = asRecord(body)?.token;
  if (typeof token !== "string") {
    throw new Error(`login response did not include a token for ${email}`);
  }

  return token;
}

async function optionalJson(path: string, token?: string): Promise<unknown> {
  const { response, body } = await requestJson(path, {
    headers: token ? auth(token) : undefined,
  });

  return response.ok ? body : null;
}

function requireId(value: number | undefined, label: string): number {
  if (value === undefined) {
    throw new Error(`contract setup could not resolve ${label}`);
  }

  return value;
}

export async function buildContractContext(): Promise<ContractContext> {
  const userEmail = process.env.EVENTY_INTEGRATION_EMAIL ?? "test-user@eventy.com";
  const userPassword = process.env.EVENTY_INTEGRATION_PASSWORD ?? "TestUser123!";
  const ownerEmail = process.env.EVENTY_OWNER_EMAIL ?? "owner-test@eventy.com";
  const ownerPassword = process.env.EVENTY_OWNER_PASSWORD ?? "OwnerTest123!";

  const userToken = await login(userEmail, userPassword);
  const ownerToken = await login(ownerEmail, ownerPassword);

  const [publicVenues, ownerVenues, bookings, payments, registries, timelines] = await Promise.all([
    optionalJson("/api/v1/venues"),
    optionalJson("/api/v1/venues", ownerToken),
    optionalJson("/api/v1/bookings", userToken),
    optionalJson("/api/v1/payments", userToken),
    optionalJson("/api/v1/contribution-registries", userToken),
    optionalJson("/api/v1/timelines", userToken),
  ]);

  const publicVenueId = idOf(dataOf(publicVenues));
  const ownerVenueId = idOf(dataOf(ownerVenues));
  const confirmed = Array.isArray(dataOf(bookings))
    ? (dataOf(bookings) as JsonRecord[]).find((booking) => booking.booking_status === "confirmed")
    : null;
  const bookingId = idOf(confirmed) ?? idOf(dataOf(bookings));
  const paymentId = idOf(dataOf(payments));

  if (bookingId === undefined) {
    throw new Error("contract setup could not resolve a booking");
  }

  let registryBody = firstRecord(dataOf(registries));
  if (!registryBody) {
    const created = await requestJson(`/api/v1/bookings/${bookingId}/contribution-registry`, {
      method: "POST",
      headers: auth(userToken),
    });
    registryBody = firstRecord(dataOf(created.body));
  }

  const registryId = requireId(idOf(registryBody), "contribution registry");
  const registrySlugValue = registryBody?.public_slug;
  const registrySlug = typeof registrySlugValue === "string" ? registrySlugValue : undefined;

  const registryItems = dataOf(registryBody?.items);
  let contributionItemId = idOf(registryItems);
  if (contributionItemId === undefined) {
    const created = await requestJson(`/api/v1/contribution-registries/${registryId}/items`, {
      method: "POST",
      headers: auth(userToken),
      body: JSON.stringify({
        vendor_name: "Integration Test Vendor",
        title: "Integration Test Registry Item",
        target_amount: 1000,
        currency: "EGP",
        status: "active",
      }),
    });
    contributionItemId = idOf(dataOf(created.body));
  }

  let timelineBody = firstRecord(dataOf(timelines));
  if (!timelineBody) {
    const created = await requestJson(`/api/v1/bookings/${bookingId}/timeline`, {
      method: "POST",
      headers: auth(userToken),
    });
    timelineBody = firstRecord(dataOf(created.body));
  }

  const timelineId = requireId(idOf(timelineBody), "event timeline");
  let timelineTokenValue = timelineBody?.share_token;
  if (typeof timelineTokenValue !== "string" || !timelineTokenValue) {
    const shared = await requestJson(`/api/v1/timelines/${timelineId}/share`, {
      method: "POST",
      headers: auth(userToken),
    });
    timelineBody = firstRecord(dataOf(shared.body));
    timelineTokenValue = timelineBody?.share_token;
  }
  const timelineToken = typeof timelineTokenValue === "string" ? timelineTokenValue : undefined;

  if (!registrySlug) {
    throw new Error("contract setup could not resolve a contribution registry slug");
  }

  if (!timelineToken) {
    throw new Error("contract setup could not resolve a timeline share token");
  }

  if (contributionItemId === undefined) {
    throw new Error("contract setup could not resolve a contribution item");
  }

  return {
    userToken,
    ownerToken,
    publicVenueId: publicVenueId ?? ownerVenueId,
    ownerVenueId,
    bookingId,
    paymentId,
    registryId,
    registrySlug,
    contributionItemId,
    timelineId,
    timelineToken,
  };
}
