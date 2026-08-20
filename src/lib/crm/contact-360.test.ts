import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node strip-types necesita la extensión explícita.
import { buildCrmContact360 } from "./contact-360.ts";

function contact(input: Parameters<typeof buildCrmContact360>[0] = {
  profile: {
    id: "profile-1",
    email: "contact@example.com",
    username: null,
    displayName: "Contacto",
    phone: null,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
}) {
  return buildCrmContact360(input);
}

test("A: profile sin actividad produce Contact 360 válido y vacío", () => {
  const result = contact();
  assert.equal(result.state.isLead, false);
  assert.equal(result.state.isClient, false);
  assert.equal(result.metrics.requestCount, 0);
  assert.deepEqual(result.relationshipTypes, ["contact"]);
});

test("B: solicitudes reflejan interés y lead derivado", () => {
  const result = contact({
    profile: contact().identity,
    requests: [
      { beatId: "beat-1", status: "pending" },
      { beatId: "beat-2", status: "rejected" },
      { beatId: "beat-3", status: "fulfilled" },
    ],
  });
  assert.equal(result.state.isLead, true);
  assert.equal(result.metrics.openRequestCount, 1);
  assert.equal(result.metrics.rejectedRequestCount, 1);
  assert.equal(result.metrics.fulfilledRequestCount, 1);
  assert.deepEqual(result.beats.requested.map((beat) => beat.id), ["beat-1", "beat-2", "beat-3"]);
});

test("C: pago confirmado define cliente sin depender de etiqueta", () => {
  const result = contact({
    profile: contact().identity,
    requests: [{ beatId: "beat-2", status: "pending" }],
    payments: [{ beatId: "beat-1", amount: 500, currency: "MXN", licenseType: "Premium" }],
  });
  assert.equal(result.state.isClient, true);
  assert.equal(result.state.isLead, false);
  assert.equal(result.metrics.historicalValueByCurrency.MXN, 500);
  assert.deepEqual(result.metrics.licenseTypes, ["Premium"]);
});

test("D: beat_access determina acceso vigente", () => {
  const result = contact({
    profile: contact().identity,
    activeAccesses: [{ beatId: "beat-1" }],
  });
  assert.equal(result.state.hasActiveAccess, true);
  assert.equal(result.state.isCommerciallyActive, true);
});

test("E: revocación conserva historial y no fabrica acceso", () => {
  const result = contact({
    profile: contact().identity,
    revocations: [{ beatId: "beat-1", revokedAt: "2026-02-01T00:00:00.000Z" }],
  });
  assert.equal(result.state.hasActiveAccess, false);
  assert.equal(result.metrics.revocationCount, 1);
});

test("F: acceso restaurado mantiene revocación histórica", () => {
  const result = contact({
    profile: contact().identity,
    activeAccesses: [{ beatId: "beat-1" }],
    revocations: [{ beatId: "beat-1" }],
  });
  assert.equal(result.state.hasActiveAccess, true);
  assert.equal(result.metrics.revocationCount, 1);
});

test("G: artist explícito no modifica la identidad ni roles Auth", () => {
  const result = contact({
    profile: contact().identity,
    relationships: [{ id: "r1", relationshipType: "artist", isActive: true, createdAt: null, updatedAt: null }],
  });
  assert.equal(result.identity.id, "profile-1");
  assert.ok(result.relationshipTypes.includes("artist"));
});

test("H: relaciones explícitas simultáneas son válidas", () => {
  const result = contact({
    profile: contact().identity,
    payments: [{ amount: 100, currency: "MXN" }],
    relationships: [
      { id: "r1", relationshipType: "artist", isActive: true, createdAt: null, updatedAt: null },
      { id: "r2", relationshipType: "client", isActive: true, createdAt: null, updatedAt: null },
    ],
  });
  assert.ok(result.relationshipTypes.includes("artist"));
  assert.ok(result.relationshipTypes.includes("client"));
});

test("I: la misma relación no duplica el tipo en Contact 360", () => {
  const result = contact({
    profile: contact().identity,
    relationships: [
      { id: "r1", relationshipType: "artist", isActive: true, createdAt: null, updatedAt: null },
      { id: "r2", relationshipType: "artist", isActive: true, createdAt: null, updatedAt: null },
    ],
  });
  assert.equal(result.relationshipTypes.filter((type) => type === "artist").length, 1);
});

test("J: relación desactivada permanece visible pero no es relación actual", () => {
  const result = contact({
    profile: contact().identity,
    relationships: [{ id: "r1", relationshipType: "artist", isActive: false, createdAt: null, updatedAt: null }],
  });
  assert.equal(result.relationships[0].isActive, false);
  assert.equal(result.relationshipTypes.includes("artist"), false);
});

test("K: commercial_activity no concede acceso", () => {
  const result = contact({
    profile: contact().identity,
    activities: [{ eventType: "mp3_download", beatId: "beat-1" }],
  });
  assert.equal(result.metrics.mp3DownloadCount, 1);
  assert.equal(result.state.hasActiveAccess, false);
});

test("L: access_revocations no niega beat_access vigente", () => {
  const result = contact({
    profile: contact().identity,
    activeAccesses: [{ beatId: "beat-1" }],
    revocations: [{ beatId: "beat-1" }],
  });
  assert.equal(result.state.hasActiveAccess, true);
});
