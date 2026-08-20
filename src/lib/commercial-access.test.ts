import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node strip-types necesita la extensión explícita.
import { resolveAccessDomainState } from "./access-domain.ts";
// @ts-expect-error Node strip-types necesita la extensión explícita.
import { buildCommercialActivityAccessPresentation, resolveCommercialOperationState, resolveCommercialPaymentState } from "./commercial-access.ts";

function present(input: {
  hasCommercialActivity: boolean;
  hasActiveAccess: boolean;
  revocationCount?: number;
}) {
  return buildCommercialActivityAccessPresentation({
    hasCommercialActivity: input.hasCommercialActivity,
    accessState: resolveAccessDomainState({
      hasActiveAccess: input.hasActiveAccess,
      revocationCount: input.revocationCount,
    }),
  });
}

test("A: actividad con acceso activo permite revocar", () => {
  assert.deepEqual(present({ hasCommercialActivity: true, hasActiveAccess: true }), {
    includeInActivity: true,
    hasActiveAccess: true,
    accessState: "active",
    canRevoke: true,
    revocationCount: 0,
  });
});

test("B: actividad revocada conserva historial y no permite revocar", () => {
  const result = present({
    hasCommercialActivity: true,
    hasActiveAccess: false,
    revocationCount: 1,
  });

  assert.equal(result.includeInActivity, true);
  assert.equal(result.accessState, "revoked");
  assert.equal(result.hasActiveAccess, false);
  assert.equal(result.canRevoke, false);
});

test("C: actividad restaurada vuelve a permitir revocar", () => {
  const result = present({
    hasCommercialActivity: true,
    hasActiveAccess: true,
    revocationCount: 2,
  });

  assert.equal(result.accessState, "restored");
  assert.equal(result.canRevoke, true);
});

test("D: acceso sin actividad no entra en Usuarios con actividad", () => {
  const result = present({
    hasCommercialActivity: false,
    hasActiveAccess: true,
  });

  assert.equal(result.includeInActivity, false);
  assert.equal(result.hasActiveAccess, true);
});

test("E: pago histórico no convierte un acceso revocado en activo", () => {
  const historicalPaymentExists = true;
  const result = present({
    hasCommercialActivity: historicalPaymentExists,
    hasActiveAccess: false,
    revocationCount: 1,
  });

  assert.equal(result.hasActiveAccess, false);
  assert.equal(result.canRevoke, false);
});

test("F: licencia histórica no convierte un acceso revocado en activo", () => {
  const historicalLicenseExists = true;
  const result = present({
    hasCommercialActivity: historicalLicenseExists,
    hasActiveAccess: false,
    revocationCount: 1,
  });

  assert.equal(result.includeInActivity, true);
  assert.equal(result.accessState, "revoked");
  assert.equal(result.canRevoke, false);
});

test("G: aprobación sin pago queda pendiente y no crea acceso", () => {
  assert.equal(
    resolveCommercialPaymentState({
      hasConfirmedPayment: false,
      requestStatus: "payment_pending",
    }),
    "pending",
  );
  assert.equal(present({ hasCommercialActivity: false, hasActiveAccess: false }).hasActiveAccess, false);
});

test("H: pago confirmado prevalece sobre el estado histórico de solicitud", () => {
  assert.equal(
    resolveCommercialPaymentState({
      hasConfirmedPayment: true,
      requestStatus: "payment_pending",
    }),
    "paid",
  );
});

test("I: actividad comercial histórica no crea acceso actual", () => {
  const result = present({ hasCommercialActivity: true, hasActiveAccess: false });

  assert.equal(result.includeInActivity, true);
  assert.equal(result.hasActiveAccess, false);
});

test("J: revocación histórica no invalida un acceso restaurado", () => {
  const result = present({
    hasCommercialActivity: true,
    hasActiveAccess: true,
    revocationCount: 3,
  });

  assert.equal(result.accessState, "restored");
  assert.equal(result.canRevoke, true);
});

test("K: selector comercial cubre solicitud, revisión, rechazo y pago pendiente", () => {
  const base = { hasConfirmedPayment: false, hasActiveAccess: false };

  assert.equal(resolveCommercialOperationState({ ...base, requestStatus: "pending" }).status, "requested");
  assert.equal(resolveCommercialOperationState({ ...base, requestStatus: "review_pending" }).status, "under_review");
  assert.equal(resolveCommercialOperationState({ ...base, requestStatus: "rejected" }).status, "rejected");
  assert.equal(resolveCommercialOperationState({ ...base, requestStatus: "payment_pending" }).status, "payment_pending");
});

test("L: pago confirmado no basta para fingir acceso actual", () => {
  const paid = resolveCommercialOperationState({
    requestStatus: "fulfilled",
    hasConfirmedPayment: true,
    hasActiveAccess: false,
  });

  assert.equal(paid.status, "paid");
  assert.equal(paid.accessState.hasCurrentAccess, false);
  assert.equal(paid.accessOrigin, "none");
});

test("M: grant administrativo se distingue del acceso comercial", () => {
  const administrative = resolveCommercialOperationState({
    requestStatus: "fulfilled",
    hasConfirmedPayment: false,
    hasActiveAccess: true,
  });
  const commercial = resolveCommercialOperationState({
    requestStatus: "fulfilled",
    hasConfirmedPayment: true,
    hasActiveAccess: true,
  });

  assert.equal(administrative.status, "access_active");
  assert.equal(administrative.accessOrigin, "administrative");
  assert.equal(commercial.status, "access_active");
  assert.equal(commercial.accessOrigin, "commercial");
});

test("N: restore conserva revocación y origen sin crear pago", () => {
  const restored = resolveCommercialOperationState({
    requestStatus: "fulfilled",
    hasConfirmedPayment: false,
    hasActiveAccess: true,
    revocationCount: 2,
  });

  assert.equal(restored.status, "restored");
  assert.equal(restored.accessState.revocationCount, 2);
  assert.equal(restored.accessOrigin, "administrative");
  assert.equal(restored.paymentState, "not_confirmed");
});

test("O: revocación prevalece sobre pago histórico para el estado actual", () => {
  const revoked = resolveCommercialOperationState({
    requestStatus: "fulfilled",
    hasConfirmedPayment: true,
    hasActiveAccess: false,
    revocationCount: 1,
  });

  assert.equal(revoked.status, "revoked");
  assert.equal(revoked.paymentState, "paid");
  assert.equal(revoked.accessState.hasCurrentAccess, false);
});
