import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node strip-types necesita la extensión explícita.
import { deriveCrmPersonFoundation } from "./foundation.ts";

test("profiles conserva la identidad y permite relaciones simultáneas", () => {
  const result = deriveCrmPersonFoundation({
    profileId: "profile-1",
    requests: [{ beatId: "beat-1", status: "pending" }],
    payments: [{ beatId: "beat-2", amount: 500, currency: "mxn" }],
    explicitRelationships: ["artist", "collaborator"],
  });

  assert.deepEqual(result.identity, {
    source: "profiles",
    profileId: "profile-1",
  });
  assert.deepEqual(result.relationshipKinds, [
    "contact",
    "artist",
    "collaborator",
    "lead",
    "client",
  ]);
});

test("las métricas se derivan sin mezclar monedas ni duplicar historial", () => {
  const result = deriveCrmPersonFoundation({
    profileId: "profile-1",
    payments: [
      { beatId: "beat-1", amount: 100, currency: "mxn" },
      { beatId: "beat-2", amount: "25", currency: "USD" },
      { beatId: "beat-3", amount: -5, currency: "MXN" },
    ],
    activities: [
      { eventType: "mp3_download" },
      { eventType: "license_download" },
      { eventType: "manual_payment" },
    ],
  });

  assert.deepEqual(result.metrics.historicalValueByCurrency, {
    MXN: 100,
    USD: 25,
  });
  assert.equal(result.metrics.paymentCount, 3);
  assert.equal(result.metrics.mp3DownloadCount, 1);
  assert.equal(result.metrics.licenseDownloadCount, 1);
});

test("beat_access actual y revocaciones históricas conservan autoridades separadas", () => {
  const result = deriveCrmPersonFoundation({
    profileId: "profile-1",
    payments: [{ beatId: "beat-1", amount: 500, currency: "MXN" }],
    activeAccesses: [{ beatId: "beat-2" }],
    revocations: [{ beatId: "beat-1" }],
  });

  assert.equal(result.commercialStage, "active_client");
  assert.deepEqual(result.beatIds.acquired, ["beat-1"]);
  assert.deepEqual(result.beatIds.currentAccess, ["beat-2"]);
  assert.equal(result.metrics.revocationCount, 1);
  assert.deepEqual(result.followUpSignals, ["paid_without_current_access"]);
});

test("el seguimiento se expresa como señales deterministas", () => {
  const result = deriveCrmPersonFoundation({
    profileId: "profile-1",
    requests: [
      { beatId: "beat-1", status: "review_pending" },
      { beatId: "beat-2", status: "payment_pending" },
    ],
  });

  assert.equal(result.commercialStage, "engaged");
  assert.deepEqual(result.followUpSignals, [
    "open_access_request",
    "payment_pending",
  ]);
});

test("última actividad usa el evento válido más reciente", () => {
  const result = deriveCrmPersonFoundation({
    profileId: "profile-1",
    profileCreatedAt: "2026-01-01T00:00:00.000Z",
    requests: [
      {
        createdAt: "valor-inválido",
        updatedAt: "2026-02-01T00:00:00.000Z",
      },
    ],
    activities: [{ createdAt: "2026-03-01T00:00:00.000Z" }],
  });

  assert.equal(result.metrics.lastActivityAt, "2026-03-01T00:00:00.000Z");
});
