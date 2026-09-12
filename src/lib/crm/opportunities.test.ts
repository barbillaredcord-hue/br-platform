import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  OpportunityDomainError,
  archiveOpportunitiesForProfileDeletion,
  archiveOpportunity,
  canTransitionOpportunityStatus,
  changeOpportunityStatus,
  closeOpportunityLost,
  closeOpportunityWon,
  createOpportunity,
  getOpportunityProfileLabel,
  OPPORTUNITY_STATUSES,
  reopenOpportunity,
  selectOpportunitySummary,
  updateOpportunity,
  type CrmOpportunityRow,
  type OpportunityAccessRequest,
  type OpportunityInsert,
  type OpportunityRepository,
  type OpportunityStatus,
  type OpportunityUpdate,
// @ts-expect-error Node strip-types necesita la extensión explícita.
} from "./opportunities.ts";

const ADMIN_ID = "00000000-0000-4000-8000-000000000001";
const PROFILE_ID = "00000000-0000-4000-8000-000000000002";
const OTHER_PROFILE_ID = "00000000-0000-4000-8000-000000000003";
const BEAT_ID = "00000000-0000-4000-8000-000000000004";
const OTHER_BEAT_ID = "00000000-0000-4000-8000-000000000005";
const REQUEST_ID = "00000000-0000-4000-8000-000000000006";
const OPPORTUNITY_ID = "00000000-0000-4000-8000-000000000007";
const NOW = "2026-08-21T15:00:00.000Z";
const actor = { id: ADMIN_ID, isAdmin: true };

function source(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function row(
  overrides: Partial<CrmOpportunityRow> = {},
): CrmOpportunityRow {
  return {
    id: OPPORTUNITY_ID,
    profile_id: PROFILE_ID,
    title: "Licencia para nuevo sencillo",
    status: "open",
    source: "manual",
    beat_id: BEAT_ID,
    access_request_id: null,
    estimated_value: 500,
    currency: "MXN",
    summary: null,
    created_by: ADMIN_ID,
    updated_by: ADMIN_ID,
    created_at: "2026-08-21T14:00:00.000Z",
    updated_at: "2026-08-21T14:00:00.000Z",
    closed_at: null,
    archived_at: null,
    ...overrides,
  };
}

class FakeOpportunityRepository implements OpportunityRepository {
  profiles = new Set([PROFILE_ID, OTHER_PROFILE_ID]);
  beats = new Set([BEAT_ID, OTHER_BEAT_ID]);
  requests = new Map<string, OpportunityAccessRequest>();
  opportunities = new Map<string, CrmOpportunityRow>();
  payments = new Set<string>();
  crmWrites: string[] = [];
  authorityWrites: string[] = [];

  async profileExists(profileId: string) {
    return this.profiles.has(profileId);
  }

  async beatExists(beatId: string) {
    return this.beats.has(beatId);
  }

  async getAccessRequest(requestId: string) {
    return this.requests.get(requestId) ?? null;
  }

  async getOpportunity(opportunityId: string) {
    return this.opportunities.get(opportunityId) ?? null;
  }

  async hasManualPayment(profileId: string, beatId: string) {
    return this.payments.has(`${profileId}:${beatId}`);
  }

  async insertOpportunity(input: OpportunityInsert) {
    const opportunity = row({ ...input, id: OPPORTUNITY_ID });
    this.opportunities.set(opportunity.id, opportunity);
    this.crmWrites.push("insert:crm_opportunities");
    return opportunity;
  }

  async updateOpportunity(
    opportunityId: string,
    patch: OpportunityUpdate,
    expectedStatus?: OpportunityStatus,
  ) {
    const current = this.opportunities.get(opportunityId);

    if (!current || (expectedStatus && current.status !== expectedStatus)) {
      return null;
    }

    const updated = { ...current, ...patch };
    this.opportunities.set(opportunityId, updated);
    this.crmWrites.push("update:crm_opportunities");
    return updated;
  }

  async listOpportunitiesForProfile(
    profileId: string | null,
    includeArchived: boolean,
  ) {
    return [...this.opportunities.values()].filter(
      (opportunity) =>
        opportunity.profile_id === profileId &&
        (includeArchived || opportunity.archived_at === null),
    );
  }

  async archiveOpportunitiesForProfile(
    profileId: string,
    patch: Pick<OpportunityUpdate, "archived_at" | "updated_at" | "updated_by">,
  ) {
    let count = 0;

    for (const [id, opportunity] of this.opportunities) {
      if (opportunity.profile_id !== profileId || opportunity.archived_at) {
        continue;
      }

      this.opportunities.set(id, { ...opportunity, ...patch });
      count += 1;
    }

    this.crmWrites.push("archive:crm_opportunities");
    return count;
  }
}

function repositoryWithOpportunity(overrides: Partial<CrmOpportunityRow> = {}) {
  const repository = new FakeOpportunityRepository();
  repository.opportunities.set(OPPORTUNITY_ID, row(overrides));
  return repository;
}

test("state machine cubre exhaustivamente las transiciones permitidas", () => {
  const expected: Record<OpportunityStatus, OpportunityStatus[]> = {
    open: ["qualified", "closed_lost"],
    qualified: ["open", "proposal", "closed_lost"],
    proposal: ["qualified", "closed_won", "closed_lost"],
    closed_won: ["open"],
    closed_lost: ["open"],
  };

  for (const from of OPPORTUNITY_STATUSES) {
    for (const to of OPPORTUNITY_STATUSES) {
      assert.equal(
        canTransitionOpportunityStatus(from, to),
        expected[from].includes(to),
        `${from} -> ${to}`,
      );
    }
  }
});

test("crear exige Admin y profile válido, inicia open y no muta autoridades", async () => {
  const repository = new FakeOpportunityRepository();
  const opportunity = await createOpportunity(repository, actor, {
    profileId: PROFILE_ID,
    title: "  Licencia para sencillo  ",
    source: "manual",
    beatId: BEAT_ID,
    estimatedValue: 0,
    currency: "mxn",
  });

  assert.equal(opportunity.profile_id, PROFILE_ID);
  assert.equal(opportunity.status, "open");
  assert.equal(opportunity.title, "Licencia para sencillo");
  assert.equal(opportunity.estimated_value, 0);
  assert.equal(opportunity.currency, "MXN");
  assert.deepEqual(repository.crmWrites, ["insert:crm_opportunities"]);
  assert.deepEqual(repository.authorityWrites, []);

  await assert.rejects(
    createOpportunity(repository, { ...actor, isAdmin: false }, {
      profileId: PROFILE_ID,
      title: "Otra oportunidad",
      source: "manual",
    }),
    (error: unknown) =>
      error instanceof OpportunityDomainError && error.code === "forbidden",
  );
});

test("crear nunca acepta profile null, inexistente ni source abierto", async () => {
  const repository = new FakeOpportunityRepository();

  await assert.rejects(
    createOpportunity(repository, actor, {
      profileId: "",
      title: "Oportunidad inválida",
      source: "manual",
    }),
    /Perfil inválido/,
  );
  await assert.rejects(
    createOpportunity(repository, actor, {
      profileId: "00000000-0000-4000-8000-000000000099",
      title: "Perfil inexistente",
      source: "manual",
    }),
    /Perfil no encontrado/,
  );
  await assert.rejects(
    createOpportunity(repository, actor, {
      profileId: PROFILE_ID,
      title: "Origen inválido",
      source: "contact_360" as never,
    }),
    /Origen inválido/,
  );
});

test("estimated_value exige valor no negativo y currency coherente", async () => {
  const repository = new FakeOpportunityRepository();

  await assert.rejects(
    createOpportunity(repository, actor, {
      profileId: PROFILE_ID,
      title: "Valor negativo",
      source: "manual",
      estimatedValue: -1,
      currency: "MXN",
    }),
    /mayor o igual a cero/,
  );
  await assert.rejects(
    createOpportunity(repository, actor, {
      profileId: PROFILE_ID,
      title: "Sin moneda",
      source: "manual",
      estimatedValue: 100,
    }),
    /moneda es obligatoria/,
  );
  await assert.rejects(
    createOpportunity(repository, actor, {
      profileId: PROFILE_ID,
      title: "Moneda sin valor",
      source: "manual",
      currency: "MXN",
    }),
    /moneda requiere un valor/,
  );
});

test("access_request debe pertenecer al profile y coincidir con beat", async () => {
  const repository = new FakeOpportunityRepository();
  repository.requests.set(REQUEST_ID, {
    id: REQUEST_ID,
    profileId: OTHER_PROFILE_ID,
    beatId: BEAT_ID,
  });

  await assert.rejects(
    createOpportunity(repository, actor, {
      profileId: PROFILE_ID,
      title: "Solicitud de otro perfil",
      source: "access_request",
      accessRequestId: REQUEST_ID,
      beatId: BEAT_ID,
    }),
    /no pertenece al perfil/,
  );

  repository.requests.set(REQUEST_ID, {
    id: REQUEST_ID,
    profileId: PROFILE_ID,
    beatId: OTHER_BEAT_ID,
  });

  await assert.rejects(
    createOpportunity(repository, actor, {
      profileId: PROFILE_ID,
      title: "Beat incoherente",
      source: "access_request",
      accessRequestId: REQUEST_ID,
      beatId: BEAT_ID,
    }),
    /beat no coincide/,
  );
});

test("update controla campos, conserva profile y no permite status genérico", async () => {
  const repository = repositoryWithOpportunity();
  const updated = await updateOpportunity(
    repository,
    actor,
    OPPORTUNITY_ID,
    {
      title: "  Propuesta actualizada  ",
      estimatedValue: 750,
      currency: "usd",
    },
    NOW,
  );

  assert.equal(updated.title, "Propuesta actualizada");
  assert.equal(updated.profile_id, PROFILE_ID);
  assert.equal(updated.status, "open");
  assert.equal(updated.currency, "USD");
});

test("closed_won falla sin pago aunque exista acceso o review_approved", async () => {
  const repository = repositoryWithOpportunity({
    status: "proposal",
    source: "access_request",
    access_request_id: REQUEST_ID,
  });

  await assert.rejects(
    closeOpportunityWon(repository, actor, OPPORTUNITY_ID, NOW),
    /No existe un pago confirmado/,
  );
  assert.equal(repository.opportunities.get(OPPORTUNITY_ID)?.status, "proposal");
  assert.deepEqual(repository.authorityWrites, []);
});

test("closed_won exige proposal, beat y pago real sin crear el pago", async () => {
  const repository = repositoryWithOpportunity({ status: "proposal" });
  repository.payments.add(`${PROFILE_ID}:${BEAT_ID}`);

  const won = await closeOpportunityWon(
    repository,
    actor,
    OPPORTUNITY_ID,
    NOW,
  );

  assert.equal(won.status, "closed_won");
  assert.equal(won.closed_at, NOW);
  assert.deepEqual(repository.authorityWrites, []);

  const noBeatRepository = repositoryWithOpportunity({
    status: "proposal",
    beat_id: null,
  });
  await assert.rejects(
    closeOpportunityWon(noBeatRepository, actor, OPPORTUNITY_ID, NOW),
    /perfil vigente y un beat/,
  );
});

test("closed_lost y reopen solo cambian CRM", async () => {
  const repository = repositoryWithOpportunity({ status: "qualified" });
  const lost = await closeOpportunityLost(
    repository,
    actor,
    OPPORTUNITY_ID,
    NOW,
  );

  assert.equal(lost.status, "closed_lost");
  assert.equal(lost.closed_at, NOW);

  const reopened = await reopenOpportunity(
    repository,
    actor,
    OPPORTUNITY_ID,
    "2026-08-21T16:00:00.000Z",
  );
  assert.equal(reopened.status, "open");
  assert.equal(reopened.closed_at, null);
  assert.deepEqual(repository.authorityWrites, []);
});

test("archive conserva status y la retención archiva antes de anonimizar", async () => {
  const repository = repositoryWithOpportunity({ status: "qualified" });
  const archived = await archiveOpportunity(
    repository,
    actor,
    OPPORTUNITY_ID,
    NOW,
  );

  assert.equal(archived.status, "qualified");
  assert.equal(archived.archived_at, NOW);

  repository.opportunities.set(OPPORTUNITY_ID, row());
  const count = await archiveOpportunitiesForProfileDeletion(
    repository,
    PROFILE_ID,
    ADMIN_ID,
    NOW,
  );
  assert.equal(count, 1);
  assert.equal(repository.opportunities.get(OPPORTUNITY_ID)?.archived_at, NOW);
  assert.deepEqual(repository.authorityWrites, []);
});

test("selectores separan pipeline de cierres y soportan perfil eliminado", () => {
  const rows = [
    row({ id: "open", estimated_value: 100, currency: "MXN" }),
    row({ id: "qualified", status: "qualified", estimated_value: 25, currency: "USD" }),
    row({ id: "proposal", status: "proposal", estimated_value: "50", currency: "MXN" }),
    row({ id: "won", status: "closed_won", closed_at: NOW, estimated_value: 999, currency: "MXN" }),
    row({ id: "lost", status: "closed_lost", closed_at: NOW }),
    row({ id: "archived", archived_at: NOW, profile_id: null }),
  ];
  const summary = selectOpportunitySummary(rows);

  assert.deepEqual(summary.metrics, {
    openCount: 1,
    qualifiedCount: 1,
    proposalCount: 1,
    wonCount: 1,
    lostCount: 1,
    pipelineByCurrency: { MXN: 150, USD: 25 },
  });
  assert.equal(getOpportunityProfileLabel(null), "Perfil eliminado");
});

test("transiciones arbitrarias y cambios sobre archivadas se rechazan", async () => {
  const repository = repositoryWithOpportunity();

  await assert.rejects(
    changeOpportunityStatus(
      repository,
      actor,
      OPPORTUNITY_ID,
      "closed_won",
      NOW,
    ),
    /Transición no permitida/,
  );

  repository.opportunities.set(
    OPPORTUNITY_ID,
    row({ archived_at: NOW }),
  );
  await assert.rejects(
    updateOpportunity(repository, actor, OPPORTUNITY_ID, {
      title: "No editable",
    }),
    /archivada no admite cambios/,
  );
});

test("adaptador solo lee autoridades y escribe crm_opportunities", () => {
  const adapter = source("src/lib/crm/opportunities-supabase.ts");

  assert.match(adapter, /from\("access_requests"\)[\s\S]*?\.select\("id,user_id,beat_id"\)/);
  assert.match(adapter, /from\("manual_payments"\)[\s\S]*?\.select\("id"\)/);
  assert.doesNotMatch(adapter, /from\("access_requests"\)[\s\S]{0,120}?\.(insert|update|delete)\(/);
  assert.doesNotMatch(adapter, /from\("manual_payments"\)[\s\S]{0,120}?\.(insert|update|delete)\(/);
  assert.doesNotMatch(adapter, /from\("beat_access"\)|from\("access_revocations"\)|from\("commercial_activity"\)/);
});

test("delete-user y account/delete archivan antes de borrar profiles", () => {
  for (const route of [
    "src/app/api/admin/delete-user/route.ts",
    "src/app/api/account/delete/route.ts",
  ]) {
    const contents = source(route);
    const archiveCall = contents.lastIndexOf("archiveOpportunitiesForProfileDeletion(");
    const profileDelete = contents.lastIndexOf('.from("profiles")');

    assert.ok(archiveCall >= 0, route);
    assert.ok(profileDelete > archiveCall, route);
  }
});

test("migración conserva historial anonimizado y no concede DELETE", () => {
  const sql = source(
    "supabase/migrations/20260821145003_phase_15_2_crm_opportunities.sql",
  );

  assert.match(sql, /profile_id uuid references public\.profiles\(id\) on delete set null/);
  assert.match(sql, /profile_id is not null or archived_at is not null/);
  assert.match(sql, /created_by uuid references public\.profiles\(id\) on delete set null/);
  assert.match(sql, /updated_by uuid references public\.profiles\(id\) on delete set null/);
  assert.match(sql, /beat_id uuid references public\.beats\(id\) on delete set null/);
  assert.match(sql, /access_request_id uuid references public\.access_requests\(id\) on delete set null/);
  assert.doesNotMatch(sql, /grant[^;]*delete|for delete/i);
});
