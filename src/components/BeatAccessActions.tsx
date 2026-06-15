"use client";

import { Download } from "lucide-react";
import type { Beat } from "@/data/beats";
import { useUser } from "@/context/UserContext";
import { canAccessBeat } from "@/lib/access";
import { PlayButton } from "./PlayButton";
import { RequestAccessButton } from "./RequestAccessButton";

export function BeatAccessActions({ beat, queue }: { beat: Beat; queue: Beat[] }) {
  const { currentUser } = useUser();
  const hasAccess = canAccessBeat(currentUser.id, beat.id);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {hasAccess ? (
          <>
            <PlayButton beat={beat} mode="full" queue={queue} showPauseState>
              Escuchar Beat Completo
            </PlayButton>
            <a
              href={beat.fullAudioUrl}
              download
              className="inline-flex h-11 items-center gap-2 rounded-md border border-cyan-300/30 px-5 text-sm font-bold text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-300/10"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Descargar MP3
            </a>
          </>
        ) : (
          <>
            <PlayButton beat={beat} mode="preview" queue={queue} showPauseState>
              Escuchar Preview 15s
            </PlayButton>
            <RequestAccessButton />
          </>
        )}
      </div>
      <p className="max-w-2xl text-sm leading-6 text-zinc-400">
        Pagos coordinados directamente con B.R. El acceso completo se habilita manualmente después de confirmar la compra.
      </p>
    </div>
  );
}
