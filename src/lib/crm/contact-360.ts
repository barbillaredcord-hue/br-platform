export type CrmRelationshipType =
  | "lead"
  | "client"
  | "artist"
  | "producer"
  | "collaborator";

export interface CrmContactProfile {
  id: string;
  email: string | null;
  username: string | null;
  displayName: string | null;
  phone: string | null;
  createdAt: string | null;
}

export interface CrmContactRelationship {
  id: string;
  relationshipType: CrmRelationshipType;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CrmContactBeat {
  id: string;
  title: string | null;
  slug: string | null;
}

export interface CrmContact360Input {
  profile: CrmContactProfile;
  relationships?: readonly CrmContactRelationship[];
  requests?: ReadonlyArray<{
    beatId?: string | null;
    status?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
  }>;
  payments?: ReadonlyArray<{
    beatId?: string | null;
    amount?: number | string | null;
    currency?: string | null;
    licenseType?: string | null;
    createdAt?: string | null;
  }>;
  activeAccesses?: ReadonlyArray<{
    beatId?: string | null;
    grantedAt?: string | null;
  }>;
  activities?: ReadonlyArray<{
    beatId?: string | null;
    eventType?: string | null;
    createdAt?: string | null;
  }>;
  revocations?: ReadonlyArray<{
    beatId?: string | null;
    revokedAt?: string | null;
  }>;
  beats?: readonly CrmContactBeat[];
}

const OPEN_REQUEST_STATUSES = new Set([
  "pending",
  "contacted",
  "review_pending",
  "payment_pending",
]);
const REJECTED_REQUEST_STATUSES = new Set([
  "rejected",
  "review_rejected",
  "cancelled",
]);

function compactBeats(
  ids: readonly string[],
  beatsById: ReadonlyMap<string, CrmContactBeat>,
) {
  return ids.map((id) => beatsById.get(id) ?? { id, title: null, slug: null });
}

function latestValidTimestamp(values: Array<string | null | undefined>) {
  let latest: { value: string; timestamp: number } | null = null;

  for (const value of values) {
    if (!value) {
      continue;
    }

    const timestamp = new Date(value).getTime();

    if (Number.isFinite(timestamp) && (!latest || timestamp > latest.timestamp)) {
      latest = { value, timestamp };
    }
  }

  return latest?.value ?? null;
}

function uniqueValues(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

export function buildCrmContact360(input: CrmContact360Input) {
  const relationships = input.relationships ?? [];
  const requests = input.requests ?? [];
  const payments = input.payments ?? [];
  const activeAccesses = input.activeAccesses ?? [];
  const activities = input.activities ?? [];
  const revocations = input.revocations ?? [];
  const activeRelationships = relationships.filter((relationship) => relationship.isActive);
  const relationshipTypes = new Set<string>([
    "contact",
    ...activeRelationships.map((relationship) => relationship.relationshipType),
  ]);

  if (requests.length > 0 && payments.length === 0) {
    relationshipTypes.add("lead");
  }

  if (payments.length > 0) {
    relationshipTypes.add("client");
  }

  const historicalValueByCurrency: Record<string, number> = {};

  for (const payment of payments) {
    const amount = Number(payment.amount ?? 0);

    if (!Number.isFinite(amount) || amount <= 0) {
      continue;
    }

    const currency = payment.currency?.trim().toUpperCase() || "UNSPECIFIED";
    historicalValueByCurrency[currency] =
      (historicalValueByCurrency[currency] ?? 0) + amount;
  }

  const requestedBeatIds = uniqueValues(requests.map((request) => request.beatId));
  const paidBeatIds = uniqueValues(payments.map((payment) => payment.beatId));
  const activeAccessBeatIds = uniqueValues(
    activeAccesses.map((access) => access.beatId),
  );
  const openRequestCount = requests.filter((request) =>
    OPEN_REQUEST_STATUSES.has(request.status ?? ""),
  ).length;
  const pendingPaymentCount = requests.filter(
    (request) => request.status === "payment_pending",
  ).length;
  const rejectedRequestCount = requests.filter((request) =>
    REJECTED_REQUEST_STATUSES.has(request.status ?? ""),
  ).length;
  const fulfilledRequestCount = requests.filter(
    (request) => request.status === "fulfilled",
  ).length;
  const isClient = payments.length > 0;
  const isLead = requests.length > 0 && !isClient;
  const beatsById = new Map((input.beats ?? []).map((beat) => [beat.id, beat]));

  return {
    identity: input.profile,
    relationships: relationships.slice().sort((first, second) => {
      if (first.isActive !== second.isActive) {
        return first.isActive ? -1 : 1;
      }

      return first.relationshipType.localeCompare(second.relationshipType);
    }),
    relationshipTypes: [...relationshipTypes],
    state: {
      isLead,
      isClient,
      hasActiveAccess: activeAccesses.length > 0,
      hasPendingPayment: pendingPaymentCount > 0,
      isCommerciallyActive:
        activeAccesses.length > 0 || openRequestCount > 0,
      lastActivityAt: latestValidTimestamp([
        input.profile.createdAt,
        ...requests.flatMap((request) => [request.createdAt, request.updatedAt]),
        ...payments.map((payment) => payment.createdAt),
        ...activeAccesses.map((access) => access.grantedAt),
        ...activities.map((activity) => activity.createdAt),
        ...revocations.map((revocation) => revocation.revokedAt),
      ]),
    },
    metrics: {
      requestCount: requests.length,
      openRequestCount,
      pendingPaymentCount,
      rejectedRequestCount,
      fulfilledRequestCount,
      paymentCount: payments.length,
      historicalValueByCurrency,
      licenseTypes: uniqueValues(payments.map((payment) => payment.licenseType)),
      activeAccessCount: activeAccesses.length,
      revocationCount: revocations.length,
      activityCount: activities.length,
      mp3DownloadCount: activities.filter(
        (activity) => activity.eventType === "mp3_download",
      ).length,
      licenseDownloadCount: activities.filter(
        (activity) => activity.eventType === "license_download",
      ).length,
    },
    beats: {
      requested: compactBeats(requestedBeatIds, beatsById),
      paid: compactBeats(paidBeatIds, beatsById),
      activeAccess: compactBeats(activeAccessBeatIds, beatsById),
      revoked: compactBeats(
        [...new Set(revocations.flatMap((revocation) => revocation.beatId ? [revocation.beatId] : []))],
        beatsById,
      ),
    },
  };
}
