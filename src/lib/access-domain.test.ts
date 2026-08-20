import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
// @ts-expect-error Node strip-types necesita la extensión explícita.
import { resolveAccessDomainState } from "./access-domain.ts";

test("A: nunca tuvo acceso", () => {
  assert.deepEqual(resolveAccessDomainState({ hasActiveAccess: false }), {
    status: "none",
    hasCurrentAccess: false,
    hasHistoricalRevocation: false,
    revocationCount: 0,
  });
});

test("B: acceso normal", () => {
  assert.equal(
    resolveAccessDomainState({ hasActiveAccess: true }).status,
    "active",
  );
});

test("C: revocado sin acceso vigente", () => {
  assert.equal(
    resolveAccessDomainState({
      hasActiveAccess: false,
      revocationCount: 1,
    }).status,
    "revoked",
  );
});

test("D: acceso restaurado prevalece sobre el historial", () => {
  const state = resolveAccessDomainState({
    hasActiveAccess: true,
    revocationCount: 1,
  });

  assert.equal(state.status, "restored");
  assert.equal(state.hasCurrentAccess, true);
});

test("E: varias revocaciones permanecen históricas con acceso vigente", () => {
  const state = resolveAccessDomainState({
    hasActiveAccess: true,
    revocationCount: 3,
  });

  assert.equal(state.status, "restored");
  assert.equal(state.revocationCount, 3);
});

test("F: pago manual restaura acceso sin borrar la revocación", () => {
  const beforePayment = resolveAccessDomainState({
    hasActiveAccess: false,
    revocationCount: 1,
  });
  const afterPayment = resolveAccessDomainState({
    hasActiveAccess: true,
    revocationCount: beforePayment.revocationCount,
  });

  assert.equal(beforePayment.status, "revoked");
  assert.equal(afterPayment.status, "restored");
  assert.equal(afterPayment.revocationCount, 1);

  const routeSource = readFileSync(
    path.join(process.cwd(), "src/app/api/admin/manual-payment/route.ts"),
    "utf8",
  );

  assert.equal(
    /from\("access_revocations"\)[\s\S]{0,200}\.delete\(\)/.test(routeSource),
    false,
  );
  assert.match(routeSource, /previous_revocation_preserved:\s*true/);
});
