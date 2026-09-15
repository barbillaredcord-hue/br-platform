"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Beat } from "@/data/beats";
import type { AccessRequestStatus } from "@/data/accessRequests";
import { PlayButton } from "./PlayButton";

import { useUser } from "@/context/UserContext";
import { getAccessRequestForBeat, getUserAccessRevocations, type AccessRevocationRow } from "@/lib/supabase/queries";
import { userCanAccessBeat } from "@/lib/access";
import { resolveAccessDomainState } from "@/lib/access-domain";

type HeroBeatProps = {
  beat: Beat;
  label?: string;
};

function getPreviewSeconds(beat: Beat) {
  const previewMeta = beat as Beat & { previewDurationSeconds?: number | null };
  const seconds = previewMeta.previewDurationSeconds ?? 15;

  return Math.min(30, Math.max(15, Math.round(seconds)));
}

const requestStatusLabels: Partial<Record<AccessRequestStatus, string>> = {
  pending: "Solicitud pendiente",
  contacted: "B.R te contactó",
  payment_pending: "Pago pendiente",
  paid: "Pago recibido",
  fulfilled: "Acceso liberado",
  approved: "Acceso aprobado",
  rejected: "Solicitud rechazada",
  cancelled: "Solicitud cancelada",
};

const requestStatusStyles: Partial<Record<AccessRequestStatus, string>> = {
  pending: "border-cyan-300/30 bg-cyan-300/10 text-cyan-100",
  contacted: "border-sky-300/30 bg-sky-300/10 text-sky-100",
  payment_pending: "border-amber-300/30 bg-amber-300/10 text-amber-100",
  paid: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
  fulfilled: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
  approved: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
  rejected: "border-red-300/30 bg-red-300/10 text-red-100",
  cancelled: "border-zinc-400/30 bg-zinc-400/10 text-zinc-200",
};

function revocationMatchesBeat(revocation: AccessRevocationRow, beatId: string) {
  const revokedBeat = Array.isArray(revocation.beats) ? revocation.beats[0] : revocation.beats;

  return revocation.beat_id === beatId || revokedBeat?.slug === beatId;
}

export function HeroBeat({ beat, label = "Beat destacado" }: HeroBeatProps) {
  const previewSeconds = getPreviewSeconds(beat);
  const { currentUser, isEmailConfirmed } = useUser();
  const isAdmin = currentUser?.role === "admin";
  const hasBeatAccess = userCanAccessBeat(currentUser, beat);
  const isPublicPlayback = beat.playbackVisibility === "public";
  const canPreviewPrivate = Boolean(currentUser && isEmailConfirmed);
  const [requestStatus, setRequestStatus] = useState<AccessRequestStatus | null>(null);
  const [revocation, setRevocation] = useState<AccessRevocationRow | null>(null);
  const accessState = resolveAccessDomainState({
    hasActiveAccess: hasBeatAccess,
    revocationCount: revocation ? 1 : 0,
  });
  const hasEffectiveAccess = accessState.hasCurrentAccess;
  const isCurrentlyRevoked = accessState.status === "revoked";
  const canPlay = isAdmin || isPublicPlayback || hasEffectiveAccess || canPreviewPrivate;
  const playbackMode = isAdmin || isPublicPlayback || hasEffectiveAccess ? "full" : "preview";

  useEffect(() => {
    let isMounted = true;

    async function loadRequestStatus() {
      if (!currentUser) {
        setRequestStatus(null);
        setRevocation(null);
        return;
      }

      const beatId = beat.dbId ?? beat.id;
      const [request, userRevocations] = await Promise.all([
        getAccessRequestForBeat(currentUser.id, beatId),
        getUserAccessRevocations(currentUser.id),
      ]);
      const foundRevocation = userRevocations.find((item) => revocationMatchesBeat(item, beatId)) ?? null;

      if (isMounted) {
        setRevocation(foundRevocation);
        setRequestStatus(request?.status ?? null);
      }
    }

    const refresh = () => void loadRequestStatus();

    refresh();
    window.addEventListener("br-access-state-changed", refresh);
    window.addEventListener("br-access-requests-refresh", refresh);

    return () => {
      isMounted = false;
      window.removeEventListener("br-access-state-changed", refresh);
      window.removeEventListener("br-access-requests-refresh", refresh);
    };
  }, [beat.dbId, beat.id, currentUser]);

  const accessMessage = isCurrentlyRevoked && revocation
    ? isPublicPlayback
      ? `Tu acceso protegido fue revocado. Motivo: ${revocation.reason}. El full sigue disponible por ser público; descarga y licencia permanecen bloqueadas.`
      : `Tu acceso a este beat fue revocado. Motivo: ${revocation.reason}. Puedes reproducir preview y pedir revisión desde la página del beat.`
    : accessState.status === "restored"
      ? "Tu acceso completo está activo nuevamente. La revocación anterior permanece únicamente en el historial."
      : isPublicPlayback
        ? "Full público disponible. Descarga y licencia continúan protegidas por acceso."
        : canPreviewPrivate
          ? `Preview privado de ${previewSeconds} segundos. El acceso completo requiere aprobación de B.R.`
          : "Inicia sesión o confirma tu email para escuchar el preview de este beat.";

  return (
    <section className="relative overflow-hidden rounded-xl border border-cyan-300/20 bg-[radial-gradient(circle_at_18%_18%,rgba(103,232,249,0.24),transparent_28%),linear-gradient(135deg,#111827,#050607_72%)] p-4 sm:p-6 md:p-8">
      <div className="max-w-3xl">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200 sm:text-sm">{label}</p>

        <h1 className="mt-2 break-words text-3xl font-black leading-tight tracking-tight sm:text-4xl md:text-5xl">{beat.name}</h1>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-zinc-200 sm:text-sm">
          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">{beat.genre}</span>
          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">{beat.bpm} BPM</span>
          {beat.key ? <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">{beat.key}</span> : null}
          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">
            {playbackMode === "full" ? "Full" : `Preview ${previewSeconds}s`}
          </span>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2 sm:gap-3">
          {canPlay ? (
            <PlayButton beat={beat} mode={playbackMode} queue={[beat]} showPauseState>
              {playbackMode === "full" ? "Reproducir" : "Escuchar preview"}
            </PlayButton>
          ) : (
            <>
              <Link href="/login" className="inline-flex h-10 items-center rounded-md bg-cyan-300 px-4 text-sm font-bold text-black hover:bg-cyan-200 sm:h-11 sm:px-5">
                Iniciar sesión
              </Link>
              <Link href="/register" className="inline-flex h-10 items-center rounded-md border border-white/10 px-4 text-sm font-bold text-zinc-200 hover:border-cyan-300 hover:text-cyan-200 sm:h-11 sm:px-5">
                Registrarse
              </Link>
            </>
          )}
        </div>

        <div className="mt-5 border-t border-white/10 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            {requestStatus ? (
              <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${requestStatusStyles[requestStatus] ?? "border-white/10 bg-white/5 text-zinc-300"}`}>
                {requestStatusLabels[requestStatus] ?? "Solicitud en proceso"}
              </span>
            ) : null}
            {accessState.status === "restored" ? (
              <span className="inline-flex rounded-full border border-emerald-300/30 bg-emerald-300/10 px-2.5 py-1 text-[11px] font-bold text-emerald-100">
                Acceso restaurado
              </span>
            ) : isCurrentlyRevoked ? (
              <span className="inline-flex rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-1 text-[11px] font-bold text-amber-100">
                Acceso revocado
              </span>
            ) : null}
          </div>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-zinc-400 sm:text-sm">{accessMessage}</p>
        </div>
      </div>
    </section>
  );
}
