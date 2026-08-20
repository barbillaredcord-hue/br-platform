import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node strip-types necesita la extensión explícita.
import { getAccessRequestPaymentState, summarizeAccessRequests } from "./access-request-admin.ts";

const baseRequest = {
  id: "request-1",
  user_id: "user-1",
  beat_id: "beat-1",
};

test("aprobada sin pago queda como pago pendiente y no completada", () => {
  const request = { ...baseRequest, status: "payment_pending" };
  const summary = summarizeAccessRequests([request], new Set());

  assert.equal(summary.paymentPending.length, 1);
  assert.equal(summary.completed.length, 0);
  assert.equal(getAccessRequestPaymentState(request, new Set()), "pending");
});

test("contactar conserva el workflow antes de aprobación", () => {
  const request = { ...baseRequest, status: "contacted" };
  const summary = summarizeAccessRequests([request], new Set());

  assert.equal(summary.active.length, 1);
  assert.equal(summary.paymentPending.length, 0);
  assert.equal(getAccessRequestPaymentState(request, new Set()), "not_confirmed");
});

test("confirmar pago elimina el pendiente y cuenta la orden completada", () => {
  const request = { ...baseRequest, status: "fulfilled" };
  const paidPairs = new Set(["user-1:beat-1"]);
  const summary = summarizeAccessRequests([request], paidPairs);

  assert.equal(summary.paymentPending.length, 0);
  assert.equal(summary.completed.length, 1);
  assert.equal(getAccessRequestPaymentState(request, paidPairs), "paid");
});

test("rechazada no entra en pendientes y permanece en historial", () => {
  const request = { ...baseRequest, status: "rejected" };
  const summary = summarizeAccessRequests([request], new Set());

  assert.equal(summary.paymentPending.length, 0);
  assert.equal(summary.rejected.length, 1);
  assert.equal(summary.history.length, 1);
});

test("pago histórico sigue visible aunque el acceso haya sido revocado", () => {
  const request = { ...baseRequest, status: "fulfilled" };
  const paidPairs = new Set(["user-1:beat-1"]);

  assert.equal(getAccessRequestPaymentState(request, paidPairs), "paid");
  assert.equal(summarizeAccessRequests([request], paidPairs).history.length, 1);
});
