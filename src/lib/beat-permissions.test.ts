import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
// @ts-expect-error Node strip-types necesita la extensión explícita.
import { resolveBeatPermissions } from "./beat-permissions.ts";

function permissions(overrides: Partial<Parameters<typeof resolveBeatPermissions>[0]> = {}) {
  return resolveBeatPermissions({
    isAuthenticated: true,
    isAdmin: false,
    hasBeatAccess: false,
    isPublicPlayback: false,
    ...overrides,
  });
}

test("A: público sin acceso reproduce full, permite solicitar y no da derechos comerciales", () => {
  const result = permissions({ isPublicPlayback: true });
  assert.equal(result.playbackMode, "full");
  assert.equal(result.canRequestAccess, true);
  assert.equal(result.canDownload, false);
  assert.equal(result.canLicense, false);
});

test("B: público con acceso reproduce full, pero exige pago para derechos comerciales", () => {
  const result = permissions({ isPublicPlayback: true, hasBeatAccess: true });
  assert.deepEqual(result, {
    playbackMode: "full",
    canRequestAccess: false,
    canDownload: false,
    canLicense: false,
  });
});

test("C: una revocación histórica no cambia el resultado sin beat_access", () => {
  const result = permissions({ isPublicPlayback: true, requestStatus: "fulfilled" });
  assert.equal(result.playbackMode, "full");
  assert.equal(result.canRequestAccess, true);
  assert.equal(result.canDownload, false);
  assert.equal(result.canLicense, false);
});

test("D: privado sin acceso queda en preview y permite solicitar", () => {
  const result = permissions();
  assert.equal(result.playbackMode, "preview");
  assert.equal(result.canRequestAccess, true);
});

test("E: privado con acceso reproduce full y no solicita", () => {
  const result = permissions({ hasBeatAccess: true });
  assert.equal(result.playbackMode, "full");
  assert.equal(result.canRequestAccess, false);
  assert.equal(result.canDownload, false);
  assert.equal(result.canLicense, false);
});

test("E.1: acceso y pago confirmado habilitan MP3 y licencia", () => {
  const result = permissions({ hasBeatAccess: true, hasConfirmedPayment: true });

  assert.equal(result.playbackMode, "full");
  assert.equal(result.canDownload, true);
  assert.equal(result.canLicense, true);
});

test("F-G-H: cuenta es histórica, beat permite re-solicitar y una pendiente bloquea duplicados", () => {
  const accountSource = readFileSync(
    path.join(process.cwd(), "src/components/account/AccountData.tsx"),
    "utf8",
  );
  const beatSource = readFileSync(
    path.join(process.cwd(), "src/components/BeatAccessActions.tsx"),
    "utf8",
  );

  assert.doesNotMatch(accountSource, />Solicitar acceso</);
  assert.match(accountSource, />\s*Ver beat/);
  assert.match(beatSource, /RequestAccessButton/);
  assert.equal(permissions({ requestStatus: "rejected" }).canRequestAccess, true);
  assert.equal(permissions({ requestStatus: "review_rejected" }).canRequestAccess, true);
  assert.equal(permissions({ requestStatus: "pending" }).canRequestAccess, false);
});

test("I: historial Admin usa revoked_at y no trunca sus datos principales", () => {
  const source = readFileSync(
    path.join(process.cwd(), "src/components/admin/AccessRequestsTable.tsx"),
    "utf8",
  );

  assert.match(source, /formatLocalDateTime\(revocation\.revoked_at\)/);
  assert.doesNotMatch(source, /className="[^"]*truncate[^"]*"/);
  assert.match(source, /Revocaciones:/);
});

test("playback público conserva endpoint server-side y signed URL; download/license exigen acceso y pago", () => {
  const playbackSource = readFileSync(
    path.join(process.cwd(), "src/app/api/beats/[id]/playback/route.ts"),
    "utf8",
  );
  const downloadSource = readFileSync(
    path.join(process.cwd(), "src/app/api/beats/[id]/download/route.ts"),
    "utf8",
  );
  const licenseSource = readFileSync(
    path.join(process.cwd(), "src/app/api/beats/[id]/license/route.ts"),
    "utf8",
  );

  assert.match(playbackSource, /beat\.playback_visibility !== "public"/);
  assert.match(playbackSource, /createSignedUrl/);
  assert.doesNotMatch(playbackSource, /getPublicUrl/);
  assert.match(downloadSource, /from\("beat_access"\)/);
  assert.match(downloadSource, /from\("manual_payments"\)/);
  assert.match(licenseSource, /from\("beat_access"\)/);
  assert.match(licenseSource, /from\("manual_payments"\)/);
});
