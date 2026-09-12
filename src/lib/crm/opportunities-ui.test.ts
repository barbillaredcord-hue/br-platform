import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import type { CrmOpportunityRow } from "./opportunities.ts";
import {
  formatOpportunityValue,
  getOpportunityUiActions,
  isOpportunityRequestBeatCoherent,
  resolveOpportunityRequestBeat,
  selectOpportunityUiSections,
// @ts-expect-error Node strip-types necesita la extensión explícita.
} from "./opportunities-ui.ts";

const NOW = "2026-08-21T12:00:00.000Z";

function row(
  input: Partial<CrmOpportunityRow> & Pick<CrmOpportunityRow, "id" | "status">,
): CrmOpportunityRow {
  const { id, status, ...overrides } = input;

  return {
    id,
    profile_id: "11111111-1111-4111-8111-111111111111",
    title: "Opportunity",
    status,
    source: "manual",
    beat_id: null,
    access_request_id: null,
    estimated_value: null,
    currency: null,
    summary: null,
    created_by: null,
    updated_by: null,
    created_at: NOW,
    updated_at: NOW,
    closed_at: status.startsWith("closed_") ? NOW : null,
    archived_at: null,
    ...overrides,
  };
}

test("UI vacía no fabrica métricas ni pipeline", () => {
  const result = selectOpportunityUiSections([]);

  assert.deepEqual(result.active, []);
  assert.deepEqual(result.closed, []);
  assert.deepEqual(result.archived, []);
  assert.deepEqual(result.metrics.pipelineByCurrency, {});
});

test("UI separa activas, cerradas y archivadas sin sumar monedas distintas", () => {
  const result = selectOpportunityUiSections([
    row({ id: "open", status: "open", estimated_value: 1000, currency: "MXN" }),
    row({ id: "qualified", status: "qualified", estimated_value: "250.50", currency: "MXN" }),
    row({ id: "proposal", status: "proposal", estimated_value: 400, currency: "USD" }),
    row({ id: "won", status: "closed_won", estimated_value: 999, currency: "MXN" }),
    row({ id: "lost", status: "closed_lost" }),
    row({ id: "archived", status: "open", estimated_value: 5000, currency: "MXN", archived_at: NOW }),
  ]);

  assert.deepEqual(result.active.map((item) => item.id), ["open", "qualified", "proposal"]);
  assert.deepEqual(result.closed.map((item) => item.id), ["won", "lost"]);
  assert.deepEqual(result.archived.map((item) => item.id), ["archived"]);
  assert.deepEqual(result.metrics.pipelineByCurrency, { MXN: 1250.5, USD: 400 });
  assert.equal(result.metrics.wonCount, 1);
  assert.equal(result.metrics.lostCount, 1);
});

test("acciones visibles respetan la state machine", () => {
  assert.deepEqual(
    getOpportunityUiActions("open").map((item) => item.action),
    ["change_status", "close_lost"],
  );
  assert.ok(!getOpportunityUiActions("open").some((item) => item.action === "close_won"));
  assert.ok(getOpportunityUiActions("proposal").some((item) => item.action === "close_won"));
  assert.deepEqual(getOpportunityUiActions("closed_won"), [
    { action: "reopen", label: "Reabrir oportunidad" },
  ]);
});

test("source access_request conserva coherencia con el beat", () => {
  assert.equal(isOpportunityRequestBeatCoherent(null, "beat-a"), true);
  assert.equal(isOpportunityRequestBeatCoherent("beat-a", "beat-a"), true);
  assert.equal(isOpportunityRequestBeatCoherent("beat-b", "beat-a"), false);
  assert.equal(resolveOpportunityRequestBeat("beat-b", "beat-a"), "beat-a");
});

test("valor estimado se presenta por moneda y nunca como revenue", () => {
  assert.match(formatOpportunityValue(12500, "MXN"), /12,500/);
  assert.match(formatOpportunityValue(400, "USD"), /400/);
  assert.equal(formatOpportunityValue(null, null), "Sin valor estimado");
});

test("panel conserva empty state, perfil eliminado y error backend de closed_won", () => {
  const source = readFileSync(
    path.join(process.cwd(), "src/components/admin/CrmOpportunitiesPanel.tsx"),
    "utf8",
  );

  assert.match(source, /No hay oportunidades registradas para este contacto\./);
  assert.match(source, /Perfil eliminado/);
  assert.ok(getOpportunityUiActions("proposal").some((action) => action.label === "Cerrar como ganada"));
  assert.match(source, /payload\?\.message/);
  assert.doesNotMatch(source, /alert\s*\(/);
});

test("GET existente entrega opciones y excluye archivadas del resumen", () => {
  const source = readFileSync(
    path.join(process.cwd(), "src/app/api/admin/crm/opportunities/route.ts"),
    "utf8",
  );

  assert.match(source, /from\("access_requests"\)[\s\S]*?\.eq\("user_id", profileId\)/);
  assert.match(source, /from\("beats"\)[\s\S]*?\.select\("id,title,slug"\)/);
  assert.match(source, /selectOpportunitySummary\(opportunities\)/);
  assert.doesNotMatch(source, /selectOpportunitySummary\(opportunities,\s*\{\s*includeArchived/);
});
