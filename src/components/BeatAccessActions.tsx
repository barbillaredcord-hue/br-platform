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

export function BeatAccessActions({ beat, queue }: { beat: Beat; queue: Beat[] }) {
  const { currentUser, isAuthenticated, isEmailConfirmed } = useUser();
  const isAdmin = currentUser?.role === "admin";
  const hasBeatAccess = userCanAccessBeat(currentUser, beat);
  const hasFullAccess = isAdmin || hasBeatAccess;
  const isPublicPlayback = beat.playbackVisibility === "public";
  const canPreviewPrivate = Boolean(currentUser && isEmailConfirmed);
  const previewSeconds = getPreviewSeconds(beat);

  const savedBeatId = beat.dbId ?? beat.id;
  const [isSaved, setIsSaved] = useState(false);

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

  const toggleSaved = () => {
    const nextIds = toggleSavedBeatId(savedBeatId, currentUser?.id);
    setIsSaved(nextIds.includes(savedBeatId));
  };

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
        {hasFullAccess ? (
          <>
            <PlayButton beat={beat} mode="full" queue={queue} showPauseState>
              {isAdmin ? "Escuchar Full" : "Escuchar Beat Completo"}
            </PlayButton>
            {saveButton}
            {!isAdmin ? (
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
            <PlayButton beat={beat} mode="full" queue={queue} showPauseState>
              Escuchar Full
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
          : isPublicPlayback && !hasBeatAccess
            ? "Escucha full pública activa. Solicita acceso para descarga/licencia."
            : !canPreviewPrivate
              ? "Inicia sesión o confirma tu email para escuchar preview de beats privados."
            : "Pagos coordinados directamente con B.R. El acceso completo se habilita manualmente después de confirmar la compra."}
      </p>
    </div>
  );
}
