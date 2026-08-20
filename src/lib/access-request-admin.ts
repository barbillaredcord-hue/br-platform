export type AccessRequestSummaryInput = {
  id: string;
  user_id: string;
  beat_id: string;
  status: string;
};

const activeStatuses = new Set([
  "pending",
  "contacted",
  "payment_pending",
  "paid",
  "review_pending",
]);

export function getAccessRequestPairKey(
  request: Pick<AccessRequestSummaryInput, "user_id" | "beat_id">,
) {
  return `${request.user_id}:${request.beat_id}`;
}

export function getAccessRequestPaymentState(
  request: AccessRequestSummaryInput,
  paidPairKeys: ReadonlySet<string>,
) {
  if (paidPairKeys.has(getAccessRequestPairKey(request))) {
    return "paid" as const;
  }

  if (request.status === "payment_pending") {
    return "pending" as const;
  }

  return "not_confirmed" as const;
}

export function summarizeAccessRequests<T extends AccessRequestSummaryInput>(
  requests: T[],
  paidPairKeys: ReadonlySet<string>,
) {
  const active = requests.filter((request) => activeStatuses.has(request.status));
  const activeIds = new Set(active.map((request) => request.id));

  return {
    active,
    pending: active.filter((request) => request.status === "pending"),
    paymentPending: active.filter(
      (request) =>
        request.status === "payment_pending" &&
        !paidPairKeys.has(getAccessRequestPairKey(request)),
    ),
    completed: requests.filter((request) =>
      paidPairKeys.has(getAccessRequestPairKey(request)),
    ),
    rejected: requests.filter((request) =>
      ["rejected", "review_rejected", "cancelled"].includes(request.status),
    ),
    history: requests.filter((request) => !activeIds.has(request.id)),
  };
}
