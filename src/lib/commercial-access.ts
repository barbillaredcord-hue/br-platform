import type { AccessDomainState } from "./access-domain";

export type CommercialActivityAccessPresentation = {
  includeInActivity: boolean;
  hasActiveAccess: boolean;
  accessState: AccessDomainState["status"];
  canRevoke: boolean;
  revocationCount: number;
};

export type CommercialPaymentState = "paid" | "pending" | "not_confirmed";

export type CommercialWorkflowState =
  | "none"
  | "requested"
  | "under_review"
  | "rejected"
  | "payment_pending"
  | "fulfilled";

export type CommercialOperationStatus =
  | "none"
  | "requested"
  | "under_review"
  | "rejected"
  | "payment_pending"
  | "paid"
  | "access_active"
  | "revoked"
  | "restored";

export type CommercialAccessOrigin = "none" | "commercial" | "administrative";

export type CommercialOperationState = {
  status: CommercialOperationStatus;
  workflowState: CommercialWorkflowState;
  paymentState: CommercialPaymentState;
  accessState: AccessDomainState;
  accessOrigin: CommercialAccessOrigin;
};

export function resolveCommercialPaymentState(input: {
  hasConfirmedPayment: boolean;
  requestStatus?: string | null;
}): CommercialPaymentState {
  if (input.hasConfirmedPayment) {
    return "paid";
  }

  return input.requestStatus === "payment_pending"
    ? "pending"
    : "not_confirmed";
}

function resolveCommercialWorkflowState(
  requestStatus?: string | null,
): CommercialWorkflowState {
  switch (requestStatus) {
    case "pending":
      return "requested";
    case "contacted":
    case "review_pending":
      return "under_review";
    case "rejected":
    case "review_rejected":
    case "cancelled":
      return "rejected";
    case "approved":
    case "paid":
    case "payment_pending":
      return "payment_pending";
    case "fulfilled":
      return "fulfilled";
    default:
      return "none";
  }
}

export function resolveCommercialOperationState(input: {
  requestStatus?: string | null;
  hasConfirmedPayment: boolean;
  hasActiveAccess: boolean;
  revocationCount?: number;
}): CommercialOperationState {
  const workflowState = resolveCommercialWorkflowState(input.requestStatus);
  const paymentState = resolveCommercialPaymentState(input);
  const revocationCount = Math.max(0, Math.floor(input.revocationCount ?? 0));
  const accessState: AccessDomainState = {
    status: input.hasActiveAccess
      ? revocationCount > 0
        ? "restored"
        : "active"
      : revocationCount > 0
        ? "revoked"
        : "none",
    hasCurrentAccess: input.hasActiveAccess,
    hasHistoricalRevocation: revocationCount > 0,
    revocationCount,
  };
  const accessOrigin: CommercialAccessOrigin = input.hasActiveAccess
    ? input.hasConfirmedPayment
      ? "commercial"
      : "administrative"
    : "none";

  let status: CommercialOperationStatus;

  if (accessState.status === "restored") {
    status = "restored";
  } else if (accessState.status === "active") {
    status = "access_active";
  } else if (
    workflowState === "requested" ||
    workflowState === "under_review" ||
    workflowState === "payment_pending"
  ) {
    status = workflowState;
  } else if (accessState.status === "revoked") {
    status = "revoked";
  } else if (paymentState === "paid") {
    status = "paid";
  } else if (workflowState === "rejected") {
    status = "rejected";
  } else {
    status = "none";
  }

  return {
    status,
    workflowState,
    paymentState,
    accessState,
    accessOrigin,
  };
}

export function buildCommercialActivityAccessPresentation(input: {
  hasCommercialActivity: boolean;
  accessState: AccessDomainState;
}): CommercialActivityAccessPresentation {
  return {
    includeInActivity: input.hasCommercialActivity,
    hasActiveAccess: input.accessState.hasCurrentAccess,
    accessState: input.accessState.status,
    canRevoke: input.accessState.hasCurrentAccess,
    revocationCount: input.accessState.revocationCount,
  };
}
