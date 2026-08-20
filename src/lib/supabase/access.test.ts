import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const supabaseDir = path.join(process.cwd(), "src/lib/supabase");
const accessSource = fs.readFileSync(path.join(supabaseDir, "access.ts"), "utf8");
const queriesSource = fs.readFileSync(path.join(supabaseDir, "queries.ts"), "utf8");
const paymentRouteSource = fs.readFileSync(
  path.join(process.cwd(), "src/app/api/admin/manual-payment/route.ts"),
  "utf8",
);

test("queries conserva la façade pública del acceso extraído", () => {
  const exports = [
    "getUserBeatAccess",
    "getUserAccessRevocations",
    "getAccessRevocations",
    "acknowledgeAccessRevocation",
    "getAccessRevocationsForBeat",
    "canAccessBeatSupabase",
    "approveAccessRequest",
    "rejectAccessRequest",
    "grantBeatAccess",
    "revokeBeatAccess",
  ];

  assert.match(queriesSource, /from "\.\/access"/);
  exports.forEach((name) => assert.match(queriesSource, new RegExp(`\\b${name}\\b`)));
  assert.match(queriesSource, /export type \{ AccessRevocationRow \} from "\.\/access"/);
});

test("el módulo Access no depende de la façade ni crea otro cliente", () => {
  assert.doesNotMatch(accessSource, /from "\.\/queries"/);
  assert.doesNotMatch(accessSource, /createClient|createSupabaseBrowserClient/);
});

test("los comandos críticos siguen delegando en las RPCs 14.5D", () => {
  [
    "grant_beat_access_atomic",
    "revoke_beat_access_atomic",
    "approve_access_request_atomic",
    "reject_access_request_atomic",
  ].forEach((rpc) => assert.match(accessSource, new RegExp(`\\b${rpc}\\b`)));

  assert.match(paymentRouteSource, /\brecord_manual_payment_atomic\b/);
});
