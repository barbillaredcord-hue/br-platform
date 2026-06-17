"use client";


import Link from "next/link";
import type { Beat } from "@/data/beats";
import { useUser } from "@/context/UserContext";
import { userCanAccessBeat } from "@/lib/access";
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
  const { currentUser, isAuthenticated } = useUser();
  const hasAccess = userCanAccessBeat(currentUser, beat);
  const previewSeconds = getPreviewSeconds(beat);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {hasAccess ? (
          <>
            <PlayButton beat={beat} mode="full" queue={queue} showPauseState>
              Escuchar Beat Completo
            </PlayButton>
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
        ) : !isAuthenticated ? (
          <>
            <PlayButton beat={beat} mode="preview" queue={queue} showPauseState>
              Escuchar Preview {previewSeconds}s
            </PlayButton>
            <Link href="/login" className="inline-flex h-11 items-center rounded-md border border-cyan-300/30 px-5 text-sm font-bold text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-300/10">
              Iniciar sesión
            </Link>
            <Link href="/register" className="inline-flex h-11 items-center rounded-md border border-white/10 px-5 text-sm font-bold text-zinc-200 transition hover:border-cyan-300 hover:text-cyan-200">
              Registrarse
            </Link>
          </>
        ) : (
          <>
            <PlayButton beat={beat} mode="preview" queue={queue} showPauseState>
              Escuchar Preview {previewSeconds}s
            </PlayButton>
            <RequestAccessButton beatId={beat.dbId ?? beat.id} />
          </>
        )}
      </div>
      <p className="max-w-2xl text-sm leading-6 text-zinc-400">
        Pagos coordinados directamente con B.R. El acceso completo se habilita manualmente después de confirmar la compra.
      </p>
    </div>
  );
}
