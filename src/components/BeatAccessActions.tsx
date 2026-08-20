"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Beat } from "@/data/beats";
import { useUser } from "@/context/UserContext";
import { userCanAccessBeat } from "@/lib/access";
import { resolveAccessDomainState } from "@/lib/access-domain";
import { resolveBeatPermissions } from "@/lib/beat-permissions";
import { getCurrentUserPaidBeatIds } from "@/lib/payment-entitlements";
import { isBeatSaved, SAVED_BEATS_EVENT, toggleSavedBeatId } from "@/lib/saved-beats";
import { acknowledgeAccessRevocation, getAccessRequestForBeat, getUserAccessRevocations, type AccessRevocationRow } from "@/lib/supabase/queries";
import DownloadBeatButton from "./DownloadBeatButton";
import DownloadLicenseButton from "./DownloadLicenseButton";
import { PlayButton } from "./PlayButton";
import { RequestAccessButton } from "./RequestAccessButton";

function getPreviewSeconds(beat: Beat) {
  const previewMeta = beat as Beat & { previewDurationSeconds?: number | null };
  const seconds = previewMeta.previewDurationSeconds ?? 15;

  return Math.min(30, Math.max(15, Math.round(seconds)));
}

function revocationMatchesBeat(revocation: AccessRevocationRow, userId: string, beatId: string) {
  const revokedBeat = Array.isArray(revocation.beats) ? revocation.beats[0] : revocation.beats;

  return revocation.user_id === userId && (revocation.beat_id === beatId || revokedBeat?.slug === beatId);
}

export function BeatAccessActions({ beat, queue }: { beat: Beat; queue: Beat[] }) {
  const { currentUser, isAuthenticated, isEmailConfirmed } = useUser();
  const isAdmin = currentUser?.role === "admin";
  const hasBeatAccess = userCanAccessBeat(currentUser, beat);
  const savedBeatId = beat.dbId ?? beat.id;
  const [paidBeatIds, setPaidBeatIds] = useState<Set<string> | null>(null);
  const isPublicPlayback = beat.playbackVisibility === "public";
  const hasConfirmedPayment = paidBeatIds?.has(savedBeatId) === true;
  const permissions = resolveBeatPermissions({
    isAuthenticated,
    isAdmin,
    hasBeatAccess,
    isPublicPlayback,
    hasConfirmedPayment,
  });
  const hasFullPlayback = permissions.playbackMode === "full";
  const canPreviewPrivate = Boolean(currentUser && isEmailConfirmed);
  const previewSeconds = getPreviewSeconds(beat);

  const [isSaved, setIsSaved] = useState(false);
  const [revocation, setRevocation] = useState<AccessRevocationRow | null>(null);
  const [visitRevocation, setVisitRevocation] = useState<AccessRevocationRow | null>(null);
  const acknowledgedRevocationIdsRef = useRef<Set<string>>(new Set());
  const accessState = resolveAccessDomainState({
    hasActiveAccess: hasBeatAccess,
    revocationCount: revocation ? 1 : 0,
  });
  const hasRevokedAccess = accessState.status === "revoked";

  useEffect(() => {
    const syncSavedState = () => {
      setIsSaved(isBeatSaved(savedBeatId, currentUser?.id));
    };

    syncSavedState();

    window.addEventListener(SAVED_BEATS_EVENT, syncSavedState);
    window.addEventListener("storage", syncSavedState);

    return () => {
      window.removeEventListener(SAVED_BEATS_EVENT, syncSavedState);
      window.removeEventListener("storage", syncSavedState);
    };
  }, [currentUser?.id, savedBeatId]);

  useEffect(() => {
    let cancelled = false;

    async function loadRevocation() {
      if (!currentUser?.id) {
        setRevocation(null);
        setVisitRevocation(null);
        return;
      }

      const [request, userRevocations] = await Promise.all([
        getAccessRequestForBeat(currentUser.id, savedBeatId),
        getUserAccessRevocations(currentUser.id),
      ]);
      const foundRevocation = userRevocations.find((item) => revocationMatchesBeat(item, currentUser.id, savedBeatId)) ?? null;

      if (cancelled) {
        return;
      }

      const currentRevocation = request?.status === "rejected" ? null : foundRevocation;
      setRevocation(currentRevocation);

      if (!currentRevocation || hasBeatAccess) {
        setVisitRevocation(null);
        return;
      }

      const revocationId = String(currentRevocation.id);

      if (!currentRevocation.acknowledged_by_user) {
        setVisitRevocation(currentRevocation);

        if (!acknowledgedRevocationIdsRef.current.has(revocationId)) {
          acknowledgedRevocationIdsRef.current.add(revocationId);
          await acknowledgeAccessRevocation(currentUser.id, revocationId);
        }
      } else {
        setVisitRevocation(null);
      }
    }

    const refresh = () => void loadRevocation();

    refresh();
    window.addEventListener("br-access-state-changed", refresh);
    window.addEventListener("br-access-requests-refresh", refresh);

    return () => {
      cancelled = true;
      window.removeEventListener("br-access-state-changed", refresh);
      window.removeEventListener("br-access-requests-refresh", refresh);
    };
  }, [currentUser?.id, hasBeatAccess, savedBeatId]);

  useEffect(() => {
    let cancelled = false;

    async function loadPaymentEntitlements() {
      if (!currentUser?.id || !hasBeatAccess || isAdmin) {
        setPaidBeatIds(new Set());
        return;
      }

      const paidIds = await getCurrentUserPaidBeatIds();

      if (!cancelled) {
        setPaidBeatIds(paidIds);
      }
    }

    void loadPaymentEntitlements();
    window.addEventListener("br-commercial-activity-refresh", loadPaymentEntitlements);

    return () => {
      cancelled = true;
      window.removeEventListener("br-commercial-activity-refresh", loadPaymentEntitlements);
    };
  }, [currentUser?.id, hasBeatAccess, isAdmin]);

  const toggleSaved = () => {
    const nextIds = toggleSavedBeatId(savedBeatId, currentUser?.id);
    setIsSaved(nextIds.includes(savedBeatId));
  };

  const showRevokedNotice = hasRevokedAccess && Boolean(visitRevocation);

  const saveButton = (
    <button
      type="button"
      aria-label={isSaved ? `Quitar ${beat.name} de guardados` : `Guardar ${beat.name}`}
      onClick={toggleSaved}
      className="inline-flex h-11 items-center gap-2 rounded-md border border-white/10 px-5 text-sm font-bold text-zinc-200 transition hover:border-cyan-300 hover:text-cyan-200"
    >
      <Heart className={`h-4 w-4 ${isSaved ? "fill-cyan-200 text-cyan-200" : ""}`} aria-hidden="true" />
      {isSaved ? "Guardado" : "Guardar"}
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {hasRevokedAccess && !isAdmin && !isPublicPlayback ? (
          <>
            <PlayButton beat={beat} mode="preview" queue={queue} showPauseState>
              Escuchar Preview {previewSeconds}s
            </PlayButton>
            {saveButton}
            {showRevokedNotice ? (
              <div className="rounded-md border border-rose-300/30 bg-rose-300/10 px-5 py-3 text-sm text-rose-100">
                <p className="font-bold">Acceso revocado</p>
                <p className="mt-1 text-xs text-zinc-300">Motivo: {visitRevocation?.reason || "Sin motivo registrado"}</p>
              </div>
            ) : null}
            <RequestAccessButton beatId={beat.dbId ?? beat.id} hasBeatAccess={hasBeatAccess} isPublicPlayback={isPublicPlayback} />
          </>
        ) : hasFullPlayback ? (
          <>
            <PlayButton beat={beat} mode="full" queue={queue} showPauseState>
              {isAdmin ? "Escuchar Full" : "Escuchar Beat Completo"}
            </PlayButton>
            {saveButton}
            {!isAdmin && permissions.canDownload && permissions.canLicense ? (
              <>
                <DownloadBeatButton
                  beatId={beat.dbId ?? beat.id}
                  fileName={beat.name}
                  className="inline-flex h-11 items-center gap-2 rounded-md border border-cyan-300/30 px-5 text-sm font-bold text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Descargar MP3
                </DownloadBeatButton>
                <DownloadLicenseButton
                  beatId={beat.dbId ?? beat.id}
                  fileName={beat.name}
                  className="inline-flex h-11 items-center gap-2 rounded-md border border-white/10 px-5 text-sm font-bold text-zinc-200 transition hover:border-cyan-300 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Descargar licencia
                </DownloadLicenseButton>
              </>
            ) : null}
            {!isAdmin && hasBeatAccess && !hasConfirmedPayment ? (
              <p className="max-w-md text-sm text-amber-100">
                {paidBeatIds === null
                  ? "Validando el pago para habilitar descarga y licencia..."
                  : "Acceso Full habilitado. La descarga y la licencia estarán disponibles cuando B.R confirme tu pago."}
              </p>
            ) : null}
            {!isAdmin && !hasBeatAccess ? (
              isAuthenticated ? (
                <RequestAccessButton beatId={beat.dbId ?? beat.id} hasBeatAccess={hasBeatAccess} isPublicPlayback={isPublicPlayback} />
              ) : (
                <>
                  <Link href="/login" className="inline-flex h-11 items-center rounded-md border border-cyan-300/30 px-5 text-sm font-bold text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-300/10">
                    Iniciar sesión
                  </Link>
                  <Link href="/register" className="inline-flex h-11 items-center rounded-md border border-white/10 px-5 text-sm font-bold text-zinc-200 transition hover:border-cyan-300 hover:text-cyan-200">
                    Registrarse
                  </Link>
                </>
              )
            ) : null}
          </>
        ) : isPublicPlayback ? (
          <>
            <PlayButton beat={beat} mode="preview" queue={queue} showPauseState>
              Escuchar Preview {previewSeconds}s
            </PlayButton>
            {saveButton}
            {!isAuthenticated ? (
              <>
                <Link href="/login" className="inline-flex h-11 items-center rounded-md border border-cyan-300/30 px-5 text-sm font-bold text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-300/10">
                  Iniciar sesión
                </Link>
                <Link href="/register" className="inline-flex h-11 items-center rounded-md border border-white/10 px-5 text-sm font-bold text-zinc-200 transition hover:border-cyan-300 hover:text-cyan-200">
                  Registrarse
                </Link>
              </>
            ) : (
              <RequestAccessButton beatId={beat.dbId ?? beat.id} hasBeatAccess={hasBeatAccess} isPublicPlayback={isPublicPlayback} />
            )}
          </>
        ) : !canPreviewPrivate ? (
          <>
            {saveButton}
            <Link href="/login" className="inline-flex h-11 items-center rounded-md border border-cyan-300/30 px-5 text-sm font-bold text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-300/10">
              Iniciar sesión
            </Link>
            <Link href="/register" className="inline-flex h-11 items-center rounded-md border border-white/10 px-5 text-sm font-bold text-zinc-200 transition hover:border-cyan-300 hover:text-cyan-200">
              Registrarse
            </Link>
            {isAuthenticated ? (
              <span className="inline-flex min-h-11 items-center rounded-md border border-amber-300/30 px-5 text-sm font-bold text-amber-100">
                Confirma tu email para escuchar preview
              </span>
            ) : null}
          </>
        ) : (
          <>
            <PlayButton beat={beat} mode="preview" queue={queue} showPauseState>
              Escuchar Preview {previewSeconds}s
            </PlayButton>
            {saveButton}
            <RequestAccessButton beatId={beat.dbId ?? beat.id} hasBeatAccess={hasBeatAccess} isPublicPlayback={isPublicPlayback} />
          </>
        )}
      </div>
      <p className="max-w-2xl text-sm leading-6 text-zinc-400">
        {isAdmin
          ? "Admin B.RCEO: tienes acceso completo de gestión y reproducción a este beat."
          : isPublicPlayback && hasRevokedAccess
            ? "Este beat es público, por eso puedes escucharlo completo. Tu descarga MP3 y licencia siguen bloqueadas por la revocación."
            : showRevokedNotice
              ? "Tu acceso completo a este beat fue revocado. Solo puedes escuchar el preview."
              : hasRevokedAccess
                ? `Preview ${previewSeconds}s disponible. Puedes solicitar acceso comercial nuevamente.`
                : isPublicPlayback && !hasBeatAccess
                ? "Escucha el beat completo. Solicita acceso comercial para descargar MP3 y licencia."
                : !canPreviewPrivate
                  ? "Inicia sesión o confirma tu email para escuchar preview de beats privados."
                  : "Pagos coordinados directamente con B.R. El acceso completo se habilita manualmente después de confirmar la compra."}
      </p>
    </div>
  );
}
