export type BeatPlaybackMode = "full" | "preview";

const blockingRequestStatuses = new Set([
  "pending",
  "contacted",
  "payment_pending",
  "paid",
  "review_pending",
]);

export function isBlockingAccessRequest(status?: string | null) {
  return Boolean(status && blockingRequestStatuses.has(status));
}

export function resolveBeatPermissions(input: {
  isAuthenticated: boolean;
  isAdmin: boolean;
  hasBeatAccess: boolean;
  hasConfirmedPayment?: boolean;
  isPublicPlayback: boolean;
  requestStatus?: string | null;
}) {
  const hasFullPlayback =
    input.isPublicPlayback || input.isAdmin || input.hasBeatAccess;

  return {
    playbackMode: (hasFullPlayback ? "full" : "preview") as BeatPlaybackMode,
    canRequestAccess:
      input.isAuthenticated &&
      !input.isAdmin &&
      !input.hasBeatAccess &&
      !isBlockingAccessRequest(input.requestStatus),
    canDownload: input.hasBeatAccess && input.hasConfirmedPayment === true,
    canLicense: input.hasBeatAccess && input.hasConfirmedPayment === true,
  };
}
