export const OPPORTUNITY_STATUSES = [
  "open",
  "qualified",
  "proposal",
  "closed_won",
  "closed_lost",
] as const;

export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number];

export const OPPORTUNITY_SOURCES = [
  "manual",
  "access_request",
  "commercial_activity",
  "relationship",
  "existing_customer",
  "revocation",
  "other",
] as const;

export type OpportunitySource = (typeof OPPORTUNITY_SOURCES)[number];

export type CrmOpportunityRow = {
  id: string;
  profile_id: string | null;
  title: string;
  status: OpportunityStatus;
  source: OpportunitySource;
  beat_id: string | null;
  access_request_id: string | null;
  estimated_value: number | string | null;
  currency: string | null;
  summary: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  archived_at: string | null;
};

export type CreateOpportunityInput = {
  profileId: string;
  title: string;
  source: OpportunitySource;
  beatId?: string | null;
  accessRequestId?: string | null;
  estimatedValue?: number | null;
  currency?: string | null;
  summary?: string | null;
};

export type UpdateOpportunityInput = {
  title?: string;
  summary?: string | null;
  estimatedValue?: number | null;
  currency?: string | null;
  beatId?: string | null;
};

export type OpportunityAdminActor = {
  id: string;
  isAdmin: boolean;
};

export type OpportunityAccessRequest = {
  id: string;
  profileId: string;
  beatId: string;
};

export type OpportunityInsert = Omit<
  CrmOpportunityRow,
  "id" | "created_at" | "updated_at"
>;

export type OpportunityUpdate = Partial<
  Pick<
    CrmOpportunityRow,
    | "title"
    | "summary"
    | "estimated_value"
    | "currency"
    | "beat_id"
    | "status"
    | "closed_at"
    | "archived_at"
    | "updated_at"
    | "updated_by"
  >
>;

export interface OpportunityRepository {
  profileExists(profileId: string): Promise<boolean>;
  beatExists(beatId: string): Promise<boolean>;
  getAccessRequest(requestId: string): Promise<OpportunityAccessRequest | null>;
  getOpportunity(opportunityId: string): Promise<CrmOpportunityRow | null>;
  hasManualPayment(profileId: string, beatId: string): Promise<boolean>;
  insertOpportunity(input: OpportunityInsert): Promise<CrmOpportunityRow>;
  updateOpportunity(
    opportunityId: string,
    patch: OpportunityUpdate,
    expectedStatus?: OpportunityStatus,
  ): Promise<CrmOpportunityRow | null>;
  listOpportunitiesForProfile(
    profileId: string | null,
    includeArchived: boolean,
  ): Promise<CrmOpportunityRow[]>;
  archiveOpportunitiesForProfile(
    profileId: string,
    patch: Pick<OpportunityUpdate, "archived_at" | "updated_at" | "updated_by">,
  ): Promise<number>;
}

export type OpportunityErrorCode =
  | "forbidden"
  | "validation"
  | "not_found"
  | "conflict";

export class OpportunityDomainError extends Error {
  public readonly code: OpportunityErrorCode;

  constructor(
    code: OpportunityErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "OpportunityDomainError";
    this.code = code;
  }
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ACTIVE_STATUSES = new Set<OpportunityStatus>([
  "open",
  "qualified",
  "proposal",
]);
const CLOSED_STATUSES = new Set<OpportunityStatus>([
  "closed_won",
  "closed_lost",
]);
const VALID_TRANSITIONS: Record<OpportunityStatus, readonly OpportunityStatus[]> = {
  open: ["qualified", "closed_lost"],
  qualified: ["open", "proposal", "closed_lost"],
  proposal: ["qualified", "closed_won", "closed_lost"],
  closed_won: ["open"],
  closed_lost: ["open"],
};

function hasOwn(input: object, key: string) {
  return Object.prototype.hasOwnProperty.call(input, key);
}

function assertUuid(value: string, label: string) {
  if (!UUID_PATTERN.test(value)) {
    throw new OpportunityDomainError("validation", `${label} inválido.`);
  }
}

function requireAdmin(actor: OpportunityAdminActor) {
  if (!actor.isAdmin) {
    throw new OpportunityDomainError("forbidden", "Acceso restringido.");
  }

  assertUuid(actor.id, "Administrador");
}

function normalizeTitle(value: string) {
  const title = value.trim();

  if (title.length < 3 || title.length > 160) {
    throw new OpportunityDomainError(
      "validation",
      "El título debe tener entre 3 y 160 caracteres.",
    );
  }

  return title;
}

function normalizeSummary(value?: string | null) {
  if (value == null) {
    return null;
  }

  const summary = value.trim();

  if (summary.length > 2000) {
    throw new OpportunityDomainError(
      "validation",
      "El resumen no puede exceder 2000 caracteres.",
    );
  }

  return summary || null;
}

export function isOpportunityStatus(value: unknown): value is OpportunityStatus {
  return OPPORTUNITY_STATUSES.includes(value as OpportunityStatus);
}

export function isOpportunitySource(value: unknown): value is OpportunitySource {
  return OPPORTUNITY_SOURCES.includes(value as OpportunitySource);
}

export function normalizeOpportunityCurrency(value?: string | null) {
  if (value == null || value.trim() === "") {
    return null;
  }

  const currency = value.trim().toUpperCase();

  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new OpportunityDomainError(
      "validation",
      "La moneda debe usar un código de tres letras.",
    );
  }

  return currency;
}

function normalizeEstimatedValue(value?: number | null) {
  if (value == null) {
    return null;
  }

  if (!Number.isFinite(value) || value < 0) {
    throw new OpportunityDomainError(
      "validation",
      "El valor estimado debe ser un número mayor o igual a cero.",
    );
  }

  return value;
}

function normalizeValueAndCurrency(
  estimatedValue?: number | null,
  currency?: string | null,
) {
  const normalizedValue = normalizeEstimatedValue(estimatedValue);
  const normalizedCurrency = normalizeOpportunityCurrency(currency);

  if (normalizedValue !== null && normalizedCurrency === null) {
    throw new OpportunityDomainError(
      "validation",
      "La moneda es obligatoria cuando existe valor estimado.",
    );
  }

  if (normalizedValue === null && normalizedCurrency !== null) {
    throw new OpportunityDomainError(
      "validation",
      "La moneda requiere un valor estimado.",
    );
  }

  return {
    estimatedValue: normalizedValue,
    currency: normalizedCurrency,
  };
}

async function validateBeat(
  repository: OpportunityRepository,
  beatId: string | null,
) {
  if (beatId === null) {
    return;
  }

  assertUuid(beatId, "Beat");

  if (!(await repository.beatExists(beatId))) {
    throw new OpportunityDomainError("not_found", "Beat no encontrado.");
  }
}

async function validateAccessRequestContext(input: {
  repository: OpportunityRepository;
  accessRequestId: string | null;
  profileId: string;
  beatId: string | null;
  source: OpportunitySource;
}) {
  if (input.accessRequestId === null) {
    return;
  }

  assertUuid(input.accessRequestId, "Solicitud");

  if (input.source !== "access_request") {
    throw new OpportunityDomainError(
      "validation",
      "Una solicitud relacionada requiere source access_request.",
    );
  }

  const request = await input.repository.getAccessRequest(input.accessRequestId);

  if (!request) {
    throw new OpportunityDomainError("not_found", "Solicitud no encontrada.");
  }

  if (request.profileId !== input.profileId) {
    throw new OpportunityDomainError(
      "validation",
      "La solicitud no pertenece al perfil de la oportunidad.",
    );
  }

  if (input.beatId !== null && request.beatId !== input.beatId) {
    throw new OpportunityDomainError(
      "validation",
      "El beat no coincide con la solicitud relacionada.",
    );
  }
}

function requireOpportunity(
  opportunity: CrmOpportunityRow | null,
): CrmOpportunityRow {
  if (!opportunity) {
    throw new OpportunityDomainError("not_found", "Opportunity no encontrada.");
  }

  return opportunity;
}

function requireOperationalOpportunity(opportunity: CrmOpportunityRow) {
  if (opportunity.archived_at) {
    throw new OpportunityDomainError(
      "conflict",
      "La Opportunity archivada no admite cambios operativos.",
    );
  }
}

export function canTransitionOpportunityStatus(
  from: OpportunityStatus,
  to: OpportunityStatus,
) {
  return VALID_TRANSITIONS[from].includes(to);
}

export async function createOpportunity(
  repository: OpportunityRepository,
  actor: OpportunityAdminActor,
  input: CreateOpportunityInput,
) {
  requireAdmin(actor);
  assertUuid(input.profileId, "Perfil");

  if (!(await repository.profileExists(input.profileId))) {
    throw new OpportunityDomainError("not_found", "Perfil no encontrado.");
  }

  if (!isOpportunitySource(input.source)) {
    throw new OpportunityDomainError("validation", "Origen inválido.");
  }

  const title = normalizeTitle(input.title);
  const summary = normalizeSummary(input.summary);
  const beatId = input.beatId ?? null;
  const accessRequestId = input.accessRequestId ?? null;
  const value = normalizeValueAndCurrency(
    input.estimatedValue,
    input.currency,
  );

  if (input.source === "other" && !summary) {
    throw new OpportunityDomainError(
      "validation",
      "El origen other requiere un resumen.",
    );
  }

  await validateBeat(repository, beatId);
  await validateAccessRequestContext({
    repository,
    accessRequestId,
    profileId: input.profileId,
    beatId,
    source: input.source,
  });

  return repository.insertOpportunity({
    profile_id: input.profileId,
    title,
    status: "open",
    source: input.source,
    beat_id: beatId,
    access_request_id: accessRequestId,
    estimated_value: value.estimatedValue,
    currency: value.currency,
    summary,
    created_by: actor.id,
    updated_by: actor.id,
    closed_at: null,
    archived_at: null,
  });
}

export async function updateOpportunity(
  repository: OpportunityRepository,
  actor: OpportunityAdminActor,
  opportunityId: string,
  input: UpdateOpportunityInput,
  now = new Date().toISOString(),
) {
  requireAdmin(actor);
  assertUuid(opportunityId, "Opportunity");

  const opportunity = requireOpportunity(
    await repository.getOpportunity(opportunityId),
  );
  requireOperationalOpportunity(opportunity);

  const patch: OpportunityUpdate = {
    updated_at: now,
    updated_by: actor.id,
  };

  if (hasOwn(input, "title")) {
    patch.title = normalizeTitle(input.title ?? "");
  }

  if (hasOwn(input, "summary")) {
    patch.summary = normalizeSummary(input.summary);
  }

  const nextBeatId = hasOwn(input, "beatId")
    ? input.beatId ?? null
    : opportunity.beat_id;

  if (hasOwn(input, "beatId")) {
    await validateBeat(repository, nextBeatId);
    patch.beat_id = nextBeatId;
  }

  if (opportunity.access_request_id && nextBeatId !== null) {
    const request = await repository.getAccessRequest(
      opportunity.access_request_id,
    );

    if (request && request.beatId !== nextBeatId) {
      throw new OpportunityDomainError(
        "validation",
        "El beat no coincide con la solicitud relacionada.",
      );
    }
  }

  if (hasOwn(input, "estimatedValue") || hasOwn(input, "currency")) {
    const currentValue =
      opportunity.estimated_value === null
        ? null
        : Number(opportunity.estimated_value);
    const nextEstimatedValue = hasOwn(input, "estimatedValue")
      ? input.estimatedValue ?? null
      : currentValue;
    const nextCurrency = hasOwn(input, "currency")
      ? input.currency ?? null
      : nextEstimatedValue === null
        ? null
        : opportunity.currency;
    const value = normalizeValueAndCurrency(nextEstimatedValue, nextCurrency);
    patch.estimated_value = value.estimatedValue;
    patch.currency = value.currency;
  }

  if (Object.keys(patch).length === 2) {
    throw new OpportunityDomainError(
      "validation",
      "No hay cambios permitidos para actualizar.",
    );
  }

  return requireOpportunity(
    await repository.updateOpportunity(opportunityId, patch),
  );
}

export async function changeOpportunityStatus(
  repository: OpportunityRepository,
  actor: OpportunityAdminActor,
  opportunityId: string,
  nextStatus: OpportunityStatus,
  now = new Date().toISOString(),
) {
  requireAdmin(actor);
  assertUuid(opportunityId, "Opportunity");

  if (!isOpportunityStatus(nextStatus)) {
    throw new OpportunityDomainError("validation", "Estado inválido.");
  }

  const opportunity = requireOpportunity(
    await repository.getOpportunity(opportunityId),
  );
  requireOperationalOpportunity(opportunity);

  if (!canTransitionOpportunityStatus(opportunity.status, nextStatus)) {
    throw new OpportunityDomainError(
      "conflict",
      `Transición no permitida: ${opportunity.status} → ${nextStatus}.`,
    );
  }

  if (nextStatus === "closed_won") {
    if (!opportunity.profile_id || !opportunity.beat_id) {
      throw new OpportunityDomainError(
        "conflict",
        "La venta requiere un perfil vigente y un beat relacionado.",
      );
    }

    if (
      !(await repository.hasManualPayment(
        opportunity.profile_id,
        opportunity.beat_id,
      ))
    ) {
      throw new OpportunityDomainError(
        "conflict",
        "No existe un pago confirmado para este perfil y beat.",
      );
    }
  }

  const closedAt = CLOSED_STATUSES.has(nextStatus) ? now : null;
  const updated = await repository.updateOpportunity(
    opportunityId,
    {
      status: nextStatus,
      closed_at: closedAt,
      updated_at: now,
      updated_by: actor.id,
    },
    opportunity.status,
  );

  if (!updated) {
    throw new OpportunityDomainError(
      "conflict",
      "La Opportunity cambió durante la operación. Vuelve a intentarlo.",
    );
  }

  return updated;
}

export function closeOpportunityWon(
  repository: OpportunityRepository,
  actor: OpportunityAdminActor,
  opportunityId: string,
  now?: string,
) {
  return changeOpportunityStatus(
    repository,
    actor,
    opportunityId,
    "closed_won",
    now,
  );
}

export function closeOpportunityLost(
  repository: OpportunityRepository,
  actor: OpportunityAdminActor,
  opportunityId: string,
  now?: string,
) {
  return changeOpportunityStatus(
    repository,
    actor,
    opportunityId,
    "closed_lost",
    now,
  );
}

export function reopenOpportunity(
  repository: OpportunityRepository,
  actor: OpportunityAdminActor,
  opportunityId: string,
  now?: string,
) {
  return changeOpportunityStatus(
    repository,
    actor,
    opportunityId,
    "open",
    now,
  );
}

export async function archiveOpportunity(
  repository: OpportunityRepository,
  actor: OpportunityAdminActor,
  opportunityId: string,
  now = new Date().toISOString(),
) {
  requireAdmin(actor);
  assertUuid(opportunityId, "Opportunity");

  const opportunity = requireOpportunity(
    await repository.getOpportunity(opportunityId),
  );

  if (opportunity.archived_at) {
    return opportunity;
  }

  return requireOpportunity(
    await repository.updateOpportunity(opportunityId, {
      archived_at: now,
      updated_at: now,
      updated_by: actor.id,
    }),
  );
}

export async function archiveOpportunitiesForProfileDeletion(
  repository: OpportunityRepository,
  profileId: string,
  updatedBy: string | null,
  now = new Date().toISOString(),
) {
  assertUuid(profileId, "Perfil");

  if (updatedBy !== null) {
    assertUuid(updatedBy, "Administrador");
  }

  return repository.archiveOpportunitiesForProfile(profileId, {
    archived_at: now,
    updated_at: now,
    updated_by: updatedBy,
  });
}

export async function getOpportunity(
  repository: OpportunityRepository,
  actor: OpportunityAdminActor,
  opportunityId: string,
) {
  requireAdmin(actor);
  assertUuid(opportunityId, "Opportunity");
  return requireOpportunity(await repository.getOpportunity(opportunityId));
}

export async function listOpportunitiesForProfile(
  repository: OpportunityRepository,
  actor: OpportunityAdminActor,
  profileId: string | null,
  includeArchived = false,
) {
  requireAdmin(actor);

  if (profileId !== null) {
    assertUuid(profileId, "Perfil");
  }

  return repository.listOpportunitiesForProfile(profileId, includeArchived);
}

export function getOpportunityProfileLabel(
  profileId: string | null,
  knownLabel?: string | null,
) {
  if (profileId === null) {
    return "Perfil eliminado";
  }

  return knownLabel?.trim() || profileId;
}

export function selectOpportunitySummary(
  opportunities: readonly CrmOpportunityRow[],
  options: { includeArchived?: boolean } = {},
) {
  const rows = options.includeArchived
    ? [...opportunities]
    : opportunities.filter((opportunity) => opportunity.archived_at === null);
  const open = rows.filter((opportunity) => ACTIVE_STATUSES.has(opportunity.status));
  const closed = rows.filter((opportunity) => CLOSED_STATUSES.has(opportunity.status));
  const pipelineByCurrency: Record<string, number> = {};

  for (const opportunity of open) {
    if (opportunity.estimated_value === null || !opportunity.currency) {
      continue;
    }

    const value = Number(opportunity.estimated_value);

    if (!Number.isFinite(value) || value < 0) {
      continue;
    }

    pipelineByCurrency[opportunity.currency] =
      (pipelineByCurrency[opportunity.currency] ?? 0) + value;
  }

  return {
    open,
    closed,
    metrics: {
      openCount: rows.filter((row) => row.status === "open").length,
      qualifiedCount: rows.filter((row) => row.status === "qualified").length,
      proposalCount: rows.filter((row) => row.status === "proposal").length,
      wonCount: rows.filter((row) => row.status === "closed_won").length,
      lostCount: rows.filter((row) => row.status === "closed_lost").length,
      pipelineByCurrency,
    },
  };
}
