const COMMERCIALLY_OPEN_ACCESS_REQUEST_STATUSES = new Set([
  "pending",
  "contacted",
  "payment_pending",
  "review_pending",
  "review_approved",
]);

export function isCommerciallyOpenAccessRequestStatus(
  status?: string | null,
) {
  return COMMERCIALLY_OPEN_ACCESS_REQUEST_STATUSES.has(status ?? "");
}
