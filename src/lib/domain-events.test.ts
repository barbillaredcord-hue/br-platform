import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node strip-types necesita la extensión explícita.
import { getDomainInvalidationEvents } from "./domain-events.ts";

test("access invalida únicamente el estado actual", () => {
  assert.deepEqual(getDomainInvalidationEvents("access"), [
    "br-access-state-changed",
  ]);
});

test("requests invalida únicamente el workflow", () => {
  assert.deepEqual(getDomainInvalidationEvents("requests"), [
    "br-access-requests-refresh",
  ]);
});

test("grant invalida acceso actual y solicitudes", () => {
  assert.deepEqual(getDomainInvalidationEvents("grant"), [
    "br-access-state-changed",
    "br-access-requests-refresh",
  ]);
});

test("pago manual invalida acceso, solicitudes y comercial", () => {
  assert.deepEqual(getDomainInvalidationEvents("manual-payment"), [
    "br-access-state-changed",
    "br-access-requests-refresh",
    "br-commercial-activity-refresh",
  ]);
});
