import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

function source(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("D-E: pago pendiente se ofrece sin beat_access y pago usa la RPC atómica", () => {
  const optionsRoute = source("src/app/api/admin/manual-payment-options/route.ts");
  const paymentRoute = source("src/app/api/admin/manual-payment/route.ts");

  assert.match(optionsRoute, /from\("access_requests"\)/);
  assert.match(optionsRoute, /\.eq\("status", "payment_pending"\)/);
  assert.match(paymentRoute, /record_manual_payment_atomic/);
  assert.doesNotMatch(paymentRoute, /access_revocations[^\n]*delete/);
});

test("H: delete y recover propagan invalidación desde sus wrappers", () => {
  const queries = source("src/lib/supabase/queries.ts");

  assert.match(queries, /output\.restored > 0[\s\S]*notifyDomainChange\("access"\)/);
  assert.match(queries, /deleteUserAsAdmin[\s\S]*notifyDomainChange\("all"\)/);
});

test("dispatcher local tiene una implementación única", () => {
  const dispatcher = source("src/lib/domain-events.ts");
  const access = source("src/lib/supabase/access.ts");
  const queries = source("src/lib/supabase/queries.ts");
  const userContext = source("src/context/UserContext.tsx");

  assert.match(dispatcher, /function notifyAccessStateChanged/);
  assert.doesNotMatch(access, /function notifyAccessStateChanged/);
  assert.doesNotMatch(queries, /function notifyAccessStateChanged/);
  assert.match(queries, /export \{ notifyAccessStateChanged \}/);
  assert.match(userContext, /notifyAccessStateChanged\(\)/);
});

test("Q: Dashboard cuenta pagos confirmados desde manual_payments, no solicitudes", () => {
  const dashboard = source("src/components/admin/AdminDashboardStats.tsx");

  assert.match(dashboard, /Solicitudes por cobrar/);
  assert.match(dashboard, /Pagos confirmados/);
  assert.match(dashboard, /confirmedPaymentCount = paidPairKeys\.size/);
  assert.doesNotMatch(dashboard, /completedRequests/);
});

test("R-S: Commercial cuenta pagos desde manual_payments y conserva actividad histórica", () => {
  const activityRoute = source("src/app/api/admin/commercial-activity/route.ts");
  const commercialRoute = source("src/app/api/admin/commercial-users/route.ts");

  assert.match(activityRoute, /from\("manual_payments"\)/);
  assert.match(activityRoute, /confirmed_payments/);
  assert.match(commercialRoute, /resolveCommercialOperationState/);
  assert.match(commercialRoute, /access_origin/);
  assert.match(commercialRoute, /from\("commercial_activity"\)/);
  assert.match(commercialRoute, /from\("beat_access"\)/);
});

test("T: el resumen de derechos del usuario exige sesión, acceso actual y pago real", () => {
  const entitlementsRoute = source("src/app/api/account/entitlements/route.ts");

  assert.match(entitlementsRoute, /auth\.getUser\(token\)/);
  assert.match(entitlementsRoute, /from\("beat_access"\)/);
  assert.match(entitlementsRoute, /from\("manual_payments"\)/);
  assert.match(entitlementsRoute, /activeBeatIds\.filter\(\(beatId\) => paidBeatIds\.has\(beatId\)\)/);
});

test("U: aceptar revisión no crea pago ni acceso; restaurar concede solo acceso", () => {
  const queries = source("src/lib/supabase/queries.ts");
  const approveSection = queries.slice(
    queries.indexOf("export async function approveAccessRequest"),
    queries.indexOf("export async function acceptAccessReview"),
  );
  const acceptSection = queries.slice(
    queries.indexOf("export async function acceptAccessReview"),
    queries.indexOf("export async function rejectAccessReview"),
  );

  assert.match(acceptSection, /status: "review_approved"/);
  assert.doesNotMatch(acceptSection, /beat_access|manual_payments/);
  assert.match(approveSection, /request\.status === "review_approved"/);
  assert.match(approveSection, /grant_beat_access_atomic/);
  assert.doesNotMatch(approveSection, /manual_payments/);
});
