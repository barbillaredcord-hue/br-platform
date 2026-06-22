"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Beat } from "@/data/beats";
import type { AccessRequestStatus } from "@/data/accessRequests";
import { PlayButton } from "./PlayButton";

import { useUser } from "@/context/UserContext";
import { getAccessRequestForBeat, getUserAccessRevocations, type AccessRevocationRow } from "@/lib/supabase/queries";
import { userCanAccessBeat } from "@/lib/access";

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
  const hasEffectiveAccess = hasBeatAccess && !revocation;
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
        const status = request?.status;
        setRevocation(foundRevocation);
        setRequestStatus(foundRevocation || status === "rejected" ? null : status ?? null);
      }
    }

    void loadRequestStatus();

    return () => {
      isMounted = false;
    };
  }, [beat.dbId, beat.id, currentUser]);

  return (
    <section className="relative overflow-hidden rounded-lg border border-cyan-300/20 bg-[radial-gradient(circle_at_20%_20%,rgba(103,232,249,0.28),transparent_30%),linear-gradient(135deg,#111827,#050607_70%)] p-6 md:p-10">
      <div className="max-w-2xl">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <p className="text-sm font-bold uppercase text-cyan-200">{label}</p>
          {requestStatus ? (
            <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${requestStatusStyles[requestStatus] ?? "border-white/10 bg-white/5 text-zinc-300"}`}>
              {requestStatusLabels[requestStatus] ?? "Solicitud en proceso"}
            </span>
          ) : null}
          {revocation ? (
            <span className="inline-flex rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-1 text-[11px] font-bold text-amber-100">
              Acceso revocado
            </span>
          ) : null}
        </div>
        <h1 className="text-4xl font-black leading-tight md:text-6xl">{beat.name}</h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-zinc-300">
          {revocation
            ? `Tu acceso a este beat fue revocado. Motivo: ${revocation.reason}. Puedes reproducir preview y pedir revisión desde la página del beat.`
            : isPublicPlayback
              ? "Reproducción full pública activa. Descarga y licencia siguen protegidas por acceso."
              : canPreviewPrivate
                ? `Preview privado de ${previewSeconds} segundos. Acceso completo bajo aprobación de B.R.`
                : "Inicia sesión o confirma tu email para escuchar preview de beats privados."}
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          {canPlay ? (
            <PlayButton beat={beat} mode={playbackMode} queue={[beat]} showPauseState>
              {playbackMode === "full" ? "Reproducir full" : "Reproducir preview"}
            </PlayButton>
          ) : (
            <>
              <Link href="/login" className="inline-flex h-11 items-center rounded-md bg-cyan-300 px-5 text-sm font-bold text-black hover:bg-cyan-200">
                Iniciar sesión
              </Link>
              <Link href="/register" className="inline-flex h-11 items-center rounded-md border border-white/10 px-5 text-sm font-bold text-zinc-200 hover:border-cyan-300 hover:text-cyan-200">
                Registrarse
              </Link>
            </>
          )}
          <span className="rounded-md border border-white/10 px-4 py-3 text-sm text-zinc-300">
            {beat.genre} / {beat.bpm} BPM / Preview {previewSeconds}s
          </span>
        </div>
      </div>
    </section>
  );
}
