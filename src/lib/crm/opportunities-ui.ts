import {
  canTransitionOpportunityStatus,
  selectOpportunitySummary,
  type CrmOpportunityRow,
  type OpportunitySource,
  type OpportunityStatus,
// @ts-expect-error Node strip-types necesita la extensión explícita en los tests.
} from "./opportunities.ts";

export const OPPORTUNITY_STATUS_LABELS: Record<OpportunityStatus, string> = {
  open: "Abierta",
  qualified: "Calificada",
  proposal: "Propuesta",
  closed_won: "Ganada",
  closed_lost: "Perdida",
};

export const OPPORTUNITY_SOURCE_LABELS: Record<OpportunitySource, string> = {
  manual: "Manual",
  access_request: "Solicitud de acceso",
  commercial_activity: "Actividad comercial",
  relationship: "Relación CRM",
  existing_customer: "Cliente existente",
  revocation: "Revocación",
  other: "Otro",
};

export type OpportunityUiAction =
  | { action: "change_status"; label: string; status: OpportunityStatus }
  | { action: "close_won" | "close_lost" | "reopen"; label: string };

const ACTIONS_BY_STATUS: Record<OpportunityStatus, readonly OpportunityUiAction[]> = {
  open: [
    { action: "change_status", status: "qualified", label: "Calificar" },
    { action: "close_lost", label: "Cerrar como perdida" },
  ],
  qualified: [
    { action: "change_status", status: "open", label: "Volver a abierta" },
    { action: "change_status", status: "proposal", label: "Pasar a propuesta" },
    { action: "close_lost", label: "Cerrar como perdida" },
  ],
  proposal: [
    { action: "change_status", status: "qualified", label: "Volver a calificada" },
    { action: "close_won", label: "Cerrar como ganada" },
    { action: "close_lost", label: "Cerrar como perdida" },
  ],
  closed_won: [{ action: "reopen", label: "Reabrir oportunidad" }],
  closed_lost: [{ action: "reopen", label: "Reabrir oportunidad" }],
};

export function getOpportunityUiActions(status: OpportunityStatus) {
  return ACTIONS_BY_STATUS[status].filter((action) => {
    if (action.action === "change_status") {
      return canTransitionOpportunityStatus(status, action.status);
    }

    if (action.action === "close_won") {
      return canTransitionOpportunityStatus(status, "closed_won");
    }

    if (action.action === "close_lost") {
      return canTransitionOpportunityStatus(status, "closed_lost");
    }

    return canTransitionOpportunityStatus(status, "open");
  });
}

export function selectOpportunityUiSections(
  opportunities: readonly CrmOpportunityRow[],
) {
  const archived = opportunities.filter((row) => row.archived_at !== null);
  const summary = selectOpportunitySummary(opportunities);

  return {
    active: summary.open,
    closed: summary.closed,
    archived,
    metrics: summary.metrics,
  };
}

export function isOpportunityRequestBeatCoherent(
  beatId: string | null,
  requestBeatId: string | null,
) {
  return beatId === null || requestBeatId === null || beatId === requestBeatId;
}

export function resolveOpportunityRequestBeat(
  currentBeatId: string,
  requestBeatId: string | null,
) {
  return requestBeatId ?? currentBeatId;
}

export function formatOpportunityValue(
  value: number | string | null,
  currency: string | null,
) {
  if (value === null || !currency) {
    return "Sin valor estimado";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "Sin valor estimado";
  }

  try {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString("es-MX")}`;
  }
}
