export type CrmRelationshipKind =
  | "contact"
  | "lead"
  | "client"
  | "artist"
  | "producer"
  | "collaborator";

export type CrmCommercialStage =
  | "contact"
  | "engaged"
  | "client"
  | "active_client";

export type CrmFollowUpSignal =
  | "open_access_request"
  | "payment_pending"
  | "paid_without_current_access";

interface CrmDatedRecord {
  createdAt?: string | null;
}

export interface CrmAccessRequestSignal extends CrmDatedRecord {
  beatId?: string | null;
  status?: string | null;
  updatedAt?: string | null;
}

export interface CrmPaymentSignal extends CrmDatedRecord {
  beatId?: string | null;
  amount?: number | string | null;
  currency?: string | null;
  licenseType?: string | null;
}

export interface CrmActiveAccessSignal {
  beatId?: string | null;
  grantedAt?: string | null;
}

export interface CrmActivitySignal extends CrmDatedRecord {
  beatId?: string | null;
  eventType?: string | null;
}

export interface CrmRevocationSignal {
  beatId?: string | null;
  revokedAt?: string | null;
}

export interface CrmPersonFoundationInput {
  profileId: string;
  profileCreatedAt?: string | null;
  requests?: readonly CrmAccessRequestSignal[];
  payments?: readonly CrmPaymentSignal[];
  activeAccesses?: readonly CrmActiveAccessSignal[];
  activities?: readonly CrmActivitySignal[];
  revocations?: readonly CrmRevocationSignal[];
  explicitRelationships?: readonly CrmRelationshipKind[];
}

export interface CrmPersonFoundation {
  identity: {
    source: "profiles";
    profileId: string;
  };
  relationshipKinds: CrmRelationshipKind[];
  commercialStage: CrmCommercialStage;
  followUpSignals: CrmFollowUpSignal[];
  metrics: {
    requestCount: number;
    paymentCount: number;
    activeAccessCount: number;
    activityCount: number;
    revocationCount: number;
    mp3DownloadCount: number;
    licenseDownloadCount: number;
    historicalValueByCurrency: Record<string, number>;
    lastActivityAt: string | null;
  };
  beatIds: {
    interests: string[];
    acquired: string[];
    currentAccess: string[];
  };
}

const OPEN_REQUEST_STATUSES = new Set([
  "pending",
  "contacted",
  "review_pending",
]);

function uniqueValues(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
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

export function deriveCrmPersonFoundation(
  input: CrmPersonFoundationInput,
): CrmPersonFoundation {
  const requests = input.requests ?? [];
  const payments = input.payments ?? [];
  const activeAccesses = input.activeAccesses ?? [];
  const activities = input.activities ?? [];
  const revocations = input.revocations ?? [];
  const relationships = new Set<CrmRelationshipKind>([
    "contact",
    ...(input.explicitRelationships ?? []),
  ]);

  if (requests.length > 0) {
    relationships.add("lead");
  }

  if (payments.length > 0) {
    relationships.add("client");
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

  const followUpSignals = new Set<CrmFollowUpSignal>();

  if (requests.some((request) => OPEN_REQUEST_STATUSES.has(request.status ?? ""))) {
    followUpSignals.add("open_access_request");
  }

  if (requests.some((request) => request.status === "payment_pending")) {
    followUpSignals.add("payment_pending");
  }

  const activeBeatIds = new Set(
    activeAccesses.flatMap((access) => (access.beatId ? [access.beatId] : [])),
  );

  if (payments.some((payment) => payment.beatId && !activeBeatIds.has(payment.beatId))) {
    followUpSignals.add("paid_without_current_access");
  }

  const hasCommercialEngagement =
    requests.length > 0 || activities.length > 0 || revocations.length > 0;
  const commercialStage: CrmCommercialStage =
    payments.length > 0 && activeAccesses.length > 0
      ? "active_client"
      : payments.length > 0
        ? "client"
        : hasCommercialEngagement
          ? "engaged"
          : "contact";

  return {
    identity: {
      source: "profiles",
      profileId: input.profileId,
    },
    relationshipKinds: [...relationships],
    commercialStage,
    followUpSignals: [...followUpSignals],
    metrics: {
      requestCount: requests.length,
      paymentCount: payments.length,
      activeAccessCount: activeAccesses.length,
      activityCount: activities.length,
      revocationCount: revocations.length,
      mp3DownloadCount: activities.filter(
        (activity) => activity.eventType === "mp3_download",
      ).length,
      licenseDownloadCount: activities.filter(
        (activity) => activity.eventType === "license_download",
      ).length,
      historicalValueByCurrency,
      lastActivityAt: latestValidTimestamp([
        input.profileCreatedAt,
        ...requests.flatMap((request) => [request.createdAt, request.updatedAt]),
        ...payments.map((payment) => payment.createdAt),
        ...activeAccesses.map((access) => access.grantedAt),
        ...activities.map((activity) => activity.createdAt),
        ...revocations.map((revocation) => revocation.revokedAt),
      ]),
    },
    beatIds: {
      interests: uniqueValues(requests.map((request) => request.beatId)),
      acquired: uniqueValues(payments.map((payment) => payment.beatId)),
      currentAccess: uniqueValues(
        activeAccesses.map((access) => access.beatId),
      ),
    },
  };
}
