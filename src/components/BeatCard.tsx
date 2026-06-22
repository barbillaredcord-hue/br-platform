"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { AccessStatusBadge } from "@/components/AccessStatusBadge";
import { useUser } from "@/context/UserContext";
import type { AccessRequestStatus } from "@/data/accessRequests";
import type { Beat } from "@/data/beats";
import { userCanAccessBeat } from "@/lib/access";
import { isBeatSaved, SAVED_BEATS_EVENT, toggleSavedBeatId } from "@/lib/saved-beats";
import { getAccessRequestForBeat, getUserAccessRevocations, type AccessRevocationRow } from "@/lib/supabase/queries";
import { AccessBadge } from "./AccessBadge";
import { PlayButton } from "./PlayButton";

type BeatCardProps = {
  beat: Beat;
  gradientIndex: number;
  queue?: Beat[];
};

const coverGradients = [
  "bg-[linear-gradient(135deg,#67e8f9,#312e81)]",
  "bg-[linear-gradient(135deg,#155e75,#0f172a)]",
  "bg-[linear-gradient(135deg,#22d3ee,#18181b)]",
  "bg-[linear-gradient(135deg,#0f172a,#0891b2)]",
];

const requestStatusLabels: Partial<Record<AccessRequestStatus, string>> = {
  pending: "Solicitud pendiente",
  contacted: "B.R te contactó",
  payment_pending: "Pago pendiente",
  paid: "Pago recibido",
};

const requestStatusStyles: Partial<Record<AccessRequestStatus, string>> = {
  pending: "border-cyan-300/30 bg-cyan-300/10 text-cyan-100",
  contacted: "border-sky-300/30 bg-sky-300/10 text-sky-100",
  payment_pending: "border-amber-300/30 bg-amber-300/10 text-amber-100",
  paid: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
};

function getPreviewSeconds(beat: Beat) {
  const previewMeta = beat as Beat & { previewDurationSeconds?: number | null };
  const seconds = previewMeta.previewDurationSeconds ?? 15;

  return Math.min(30, Math.max(15, Math.round(seconds)));
}

function shouldShowRequestStatus(status: AccessRequestStatus | undefined, hasPlaybackAccess: boolean) {
  if (hasPlaybackAccess || !status) {
    return false;
  }

  return status === "pending" || status === "contacted" || status === "payment_pending" || status === "paid";
}

function revocationMatchesBeat(revocation: AccessRevocationRow, beatId: string) {
  const revokedBeat = Array.isArray(revocation.beats) ? revocation.beats[0] : revocation.beats;

  return revocation.beat_id === beatId || revokedBeat?.slug === beatId;
}

export function BeatCard({ beat, gradientIndex, queue }: BeatCardProps) {
  const savedBeatId = beat.dbId ?? beat.id;
  const [isSaved, setIsSaved] = useState(false);
  const [requestStatus, setRequestStatus] = useState<AccessRequestStatus | null>(null);
  const [revocation, setRevocation] = useState<AccessRevocationRow | null>(null);

  const { currentUser, isEmailConfirmed } = useUser();
  const isAdmin = currentUser?.role === "admin";
  const hasBeatAccess = userCanAccessBeat(currentUser, beat);
  const hasRevocation = Boolean(revocation);
  const hasPlaybackAccess = (isAdmin || hasBeatAccess) && !hasRevocation;
  const isPublicPlayback = beat.playbackVisibility === "public" && !hasRevocation;
  const canPreviewPrivate = Boolean(currentUser && isEmailConfirmed);
  const previewSeconds = getPreviewSeconds(beat);
  const canShowPlayButton = isAdmin || isPublicPlayback || (hasBeatAccess && !hasRevocation) || (!hasRevocation && canPreviewPrivate);
  const playbackMode = isAdmin || isPublicPlayback || (hasBeatAccess && !hasRevocation) ? "full" : "preview";
  const playbackLabel = isAdmin || isPublicPlayback || (hasBeatAccess && !hasRevocation) ? "Full" : `Preview ${previewSeconds}s`;

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
    let isMounted = true;

    async function loadRequestStatus() {
      if (!currentUser) {
        setRequestStatus(null);
        setRevocation(null);
        return;
      }

      const [request, userRevocations] = await Promise.all([
        getAccessRequestForBeat(currentUser.id, savedBeatId),
        getUserAccessRevocations(currentUser.id),
      ]);
      const foundRevocation = userRevocations.find((item) => revocationMatchesBeat(item, savedBeatId)) ?? null;
      const status = request?.status;

      if (isMounted) {
        setRevocation(foundRevocation);
        setRequestStatus(foundRevocation ? null : shouldShowRequestStatus(status, hasPlaybackAccess) ? status ?? null : null);
      }
    }

    void loadRequestStatus();

    return () => {
      isMounted = false;
    };
  }, [currentUser, hasPlaybackAccess, savedBeatId]);

  const toggleSaved = () => {
    const nextIds = toggleSavedBeatId(savedBeatId, currentUser?.id);
    setIsSaved(nextIds.includes(savedBeatId));
  };

  return (
    <article className="relative w-40 shrink-0 snap-start rounded-lg bg-[#15181c] p-2 transition hover:bg-[#1c2127] sm:w-56 sm:p-3">
      <button
        type="button"
        aria-label={isSaved ? `Quitar ${beat.name} de guardados` : `Guardar ${beat.name}`}
        onClick={toggleSaved}
        className={`absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold transition sm:right-5 sm:top-5 sm:h-9 sm:w-9 ${
          isSaved
            ? "border-cyan-300/60 bg-cyan-300 text-black"
            : "border-white/15 bg-black/30 text-cyan-100 hover:border-cyan-300/60 hover:bg-cyan-300/10"
        }`}
      >
        <Heart className={`h-4 w-4 ${isSaved ? "fill-black" : ""}`} aria-hidden="true" />
      </button>
      <Link href={`/beats/${beat.id}`} className="block">
        <div className={`mb-2 grid aspect-square place-items-center rounded-md sm:mb-4 sm:rounded-lg ${coverGradients[gradientIndex % coverGradients.length]}`}>
          <span className="text-3xl font-black text-white/85 sm:text-4xl">B.R</span>
        </div>
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold sm:text-base">{beat.name}</h3>
            <p className="mt-0.5 truncate text-xs text-zinc-400 sm:mt-1 sm:text-sm">
              {beat.genre} · {beat.bpm} BPM
            </p>
          </div>
          {beat.locked && !hasPlaybackAccess ? <AccessBadge /> : null}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5 sm:mt-3 sm:gap-2">
          <AccessStatusBadge hasAccess={hasPlaybackAccess} />
          {hasRevocation ? (
            <span className="inline-flex w-fit rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-1 text-[11px] font-bold text-amber-100">
              Acceso revocado
            </span>
          ) : null}
          {requestStatus ? (
            <span className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-[11px] font-bold ${requestStatusStyles[requestStatus] ?? "border-white/10 bg-white/5 text-zinc-300"}`}>
              {requestStatusLabels[requestStatus] ?? "Solicitud en proceso"}
            </span>
          ) : null}
        </div>
        <p className="mt-1.5 truncate text-[11px] font-semibold text-zinc-500 sm:mt-2 sm:text-xs">
          {hasRevocation
            ? "Acceso revocado: solo preview"
            : isAdmin
              ? "Admin: reproducción full disponible"
              : isPublicPlayback
                ? "Full público, descarga protegida"
                : hasBeatAccess
                  ? "Acceso completo activo"
                  : canPreviewPrivate
                    ? "Preview privado disponible"
                  : "Inicia sesión y confirma email"}
        </p>
      </Link>
      <div className="mt-3 grid gap-2 sm:mt-4">
        {canShowPlayButton ? (
          <PlayButton variant="light" beat={beat} mode={playbackMode} queue={queue} showPauseState>
            {playbackLabel}
          </PlayButton>
        ) : (
          <Link href={currentUser ? "/account/settings" : "/login"} className="inline-flex h-9 items-center justify-center rounded-md bg-white text-xs font-bold text-black hover:bg-cyan-200 sm:h-10 sm:text-sm">
            {currentUser ? "Confirmar email" : "Iniciar sesión"}
          </Link>
        )}
        <button
          type="button"
          aria-label={isSaved ? `Quitar ${beat.name} de guardados` : `Guardar ${beat.name}`}
          onClick={toggleSaved}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-cyan-300/20 px-3 text-xs font-bold text-cyan-100 transition hover:border-cyan-300/60 hover:bg-cyan-300/10 sm:h-10"
        >
          <Heart className={`h-4 w-4 ${isSaved ? "fill-cyan-200 text-cyan-200" : ""}`} aria-hidden="true" />
          {isSaved ? "Guardado" : "Guardar"}
        </button>
      </div>
    </article>
  );
}
