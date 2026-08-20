export type AccessDomainStatus = "none" | "active" | "revoked" | "restored";

export type AccessDomainState = {
  status: AccessDomainStatus;
  hasCurrentAccess: boolean;
  hasHistoricalRevocation: boolean;
  revocationCount: number;
};

type ResolveAccessDomainStateInput = {
  hasActiveAccess: boolean;
  revocationCount?: number;
};

export function resolveAccessDomainState({
  hasActiveAccess,
  revocationCount = 0,
}: ResolveAccessDomainStateInput): AccessDomainState {
  const safeRevocationCount = Math.max(0, Math.floor(revocationCount));
  const hasHistoricalRevocation = safeRevocationCount > 0;

  if (hasActiveAccess) {
    return {
      status: hasHistoricalRevocation ? "restored" : "active",
      hasCurrentAccess: true,
      hasHistoricalRevocation,
      revocationCount: safeRevocationCount,
    };
  }

  return {
    status: hasHistoricalRevocation ? "revoked" : "none",
    hasCurrentAccess: false,
    hasHistoricalRevocation,
    revocationCount: safeRevocationCount,
  };
}

export function getCurrentAccessLabel(state: AccessDomainState) {
  switch (state.status) {
    case "active":
      return "Acceso activo";
    case "restored":
      return "Acceso restaurado";
    case "revoked":
      return "Revocado actualmente";
    default:
      return "Sin acceso";
  }
}
