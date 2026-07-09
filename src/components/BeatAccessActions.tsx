"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import type { Beat } from "@/data/beats";
import { useUser } from "@/context/UserContext";
import { userCanAccessBeat } from "@/lib/access";
import { isBeatSaved, SAVED_BEATS_EVENT, toggleSavedBeatId } from "@/lib/saved-beats";
import DownloadBeatButton from "./DownloadBeatButton";
import DownloadLicenseButton from "./DownloadLicenseButton";
import { PlayButton } from "./PlayButton";
import { RequestAccessButton } from "./RequestAccessButton";

function getPreviewSeconds(beat: Beat) {
  const previewMeta = beat as Beat & { previewDurationSeconds?: number | null };
  const seconds = previewMeta.previewDurationSeconds ?? 15;

  return Math.min(30, Math.max(15, Math.round(seconds)));
}

function userHasRevokedBeatAccess(currentUser: ReturnType<typeof useUser>["currentUser"], beat: Beat) {
  if (!currentUser?.id) {
    return false;
  }

  const accessBeat = beat as Beat & {
    revokedUserIds?: string[] | null;
    revokedAccessUserIds?: string[] | null;
    accessRevocations?: Array<{ userId?: string | null; user_id?: string | null }> | null;
    accessStatus?: string | null;
    accessRequestStatus?: string | null;
    requestStatus?: string | null;
  };

  const revokedIds = [
    ...(accessBeat.revokedUserIds ?? []),
    ...(accessBeat.revokedAccessUserIds ?? []),
    ...(accessBeat.accessRevocations ?? []).map((revocation) => revocation.userId ?? revocation.user_id ?? ""),
  ].filter(Boolean);

  const statusValues = [accessBeat.accessStatus, accessBeat.accessRequestStatus, accessBeat.requestStatus]
    .filter(Boolean)
    .map((status) => String(status).toLowerCase());

  return revokedIds.includes(currentUser.id) || statusValues.some((status) => status.includes("revok") || status.includes("reject") || status.includes("rechaz") || status.includes("denied"));
}

function dismissedBeatRevocationKey(userId?: string | null) {
  return `br:dismissed-revocations:${userId || "guest"}`;
}

function getDismissedBeatRevocations(userId?: string | null) {
  if (typeof window === "undefined") {
    return [] as string[];
  }

  try {
    const rawValue = window.localStorage.getItem(dismissedBeatRevocationKey(userId));
    const parsedValue = rawValue ? JSON.parse(rawValue) : [];

    return Array.isArray(parsedValue) ? parsedValue.map(String) : [];
  } catch {
    return [] as string[];
  }
}

function saveDismissedBeatRevocations(userId: string | null | undefined, beatIds: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(dismissedBeatRevocationKey(userId), JSON.stringify(Array.from(new Set(beatIds))));
}

export function BeatAccessActions({ beat, queue }: { beat: Beat; queue: Beat[] }) {
  const { currentUser, isAuthenticated, isEmailConfirmed } = useUser();
  const isAdmin = currentUser?.role === "admin";
  const hasRevokedAccess = userHasRevokedBeatAccess(currentUser, beat);
  const hasBeatAccess = !hasRevokedAccess && userCanAccessBeat(currentUser, beat);
  const isPublicPlayback = beat.playbackVisibility === "public";
  const hasFullPlayback = isAdmin || hasBeatAccess || isPublicPlayback;
  const canPreviewPrivate = Boolean(currentUser && isEmailConfirmed);
  const previewSeconds = getPreviewSeconds(beat);

  const savedBeatId = beat.dbId ?? beat.id;
  const [isSaved, setIsSaved] = useState(false);
  const [dismissedRevokedBeatIds, setDismissedRevokedBeatIds] = useState<string[]>([]);

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
    const syncDismissedRevocations = () => {
      setDismissedRevokedBeatIds(getDismissedBeatRevocations(currentUser?.id));
    };

    syncDismissedRevocations();

    window.addEventListener("storage", syncDismissedRevocations);
    window.addEventListener("br:revocation-dismissed", syncDismissedRevocations);

    return () => {
      window.removeEventListener("storage", syncDismissedRevocations);
      window.removeEventListener("br:revocation-dismissed", syncDismissedRevocations);
    };
  }, [currentUser?.id]);

  const toggleSaved = () => {
    const nextIds = toggleSavedBeatId(savedBeatId, currentUser?.id);
    setIsSaved(nextIds.includes(savedBeatId));
  };

  const dismissRevokedNotice = () => {
    const beatIdentity = beat as Beat & { dbId?: string | null; slug?: string | null };
    const idsToDismiss = [savedBeatId, beatIdentity.dbId, beatIdentity.id, beatIdentity.slug]
      .filter(Boolean)
      .map(String);
    const nextIds = Array.from(new Set([...dismissedRevokedBeatIds, ...idsToDismiss]));

    setDismissedRevokedBeatIds(nextIds);
    saveDismissedBeatRevocations(currentUser?.id, nextIds);
    window.dispatchEvent(new Event("br:revocation-dismissed"));
  };

  const beatIdentity = beat as Beat & { slug?: string | null };
  const showRevokedNotice = hasRevokedAccess && !dismissedRevokedBeatIds.includes(savedBeatId) && !dismissedRevokedBeatIds.includes(String(beat.id)) && !dismissedRevokedBeatIds.includes(String(beatIdentity.slug ?? ""));

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
              <>
                <span className="inline-flex min-h-11 items-center rounded-md border border-rose-300/30 px-5 text-sm font-bold text-rose-100">
                  Acceso completo revocado
                </span>
                <button type="button" onClick={dismissRevokedNotice} className="inline-flex min-h-11 items-center rounded-md border border-white/10 px-5 text-sm font-bold text-zinc-200 transition hover:border-rose-300 hover:text-rose-100">
                  Ya lo vi
                </button>
              </>
            ) : (
              <RequestAccessButton beatId={beat.dbId ?? beat.id} />
            )}
          </>
        ) : hasFullPlayback ? (
          <>
            <PlayButton beat={beat} mode="full" queue={queue} showPauseState>
              {isAdmin ? "Escuchar Full" : "Escuchar Beat Completo"}
            </PlayButton>
            {saveButton}
            {!isAdmin && hasBeatAccess ? (
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
              <RequestAccessButton beatId={beat.dbId ?? beat.id} />
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
            <RequestAccessButton beatId={beat.dbId ?? beat.id} />
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
                ? `Preview ${previewSeconds}s disponible. Puedes pedir revisión si necesitas aclarar el acceso.`
                : isPublicPlayback && !hasBeatAccess
                ? "Escucha preview disponible. Solicita acceso para escuchar completo, descargar MP3 o licencia."
                : !canPreviewPrivate
                  ? "Inicia sesión o confirma tu email para escuchar preview de beats privados."
                  : "Pagos coordinados directamente con B.R. El acceso completo se habilita manualmente después de confirmar la compra."}
      </p>
    </div>
  );
}
