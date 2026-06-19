"use client";

import type { Beat } from "@/data/beats";
import { useUser } from "@/context/UserContext";
import { userCanAccessBeat } from "@/lib/access";
import { AccessStatusBadge } from "./AccessStatusBadge";

function getPreviewSeconds(beat: Beat) {
  const previewMeta = beat as Beat & { previewDurationSeconds?: number | null };
  const seconds = previewMeta.previewDurationSeconds ?? 15;

  return Math.min(30, Math.max(15, Math.round(seconds)));
}

export function BeatAccessSummary({ beat }: { beat: Beat }) {
  const { currentUser } = useUser();
  const isAdmin = currentUser?.role === "admin";
  const hasBeatAccess = userCanAccessBeat(currentUser, beat);
  const hasPlaybackAccess = isAdmin || hasBeatAccess;
  const isPublicPlayback = beat.playbackVisibility === "public";
  const previewSeconds = getPreviewSeconds(beat);

  return (
    <section className="rounded-lg border border-cyan-300/20 bg-[#101317] p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">
            {isAdmin ? "Admin B.RCEO" : isPublicPlayback ? "Beat público" : "Beat privado"}
          </p>
          <h2 className="mt-2 text-xl font-bold">
            {isAdmin
              ? "Acceso completo de administración"
              : isPublicPlayback
                ? "Escucha completa pública"
                : hasBeatAccess
                  ? "Acceso completo autorizado"
                  : "Solo preview disponible"}
          </h2>
        </div>
        <AccessStatusBadge hasAccess={hasPlaybackAccess || isPublicPlayback} />
      </div>

      <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-400">
        {isAdmin
          ? "Admin B.RCEO: tienes acceso completo de gestión y reproducción a este beat sin solicitar acceso como usuario."
          : isPublicPlayback && !hasBeatAccess
            ? "Este beat tiene escucha completa pública. Para descargar MP3 o licencia todavía necesitas acceso aprobado."
            : !currentUser
              ? `Puedes escuchar el preview público de ${previewSeconds} segundos. Inicia sesión para solicitar acceso o descargar después de comprar.`
              : hasBeatAccess
                ? `${currentUser.name} tiene permiso para escuchar y descargar este beat en MP3.`
                : `${currentUser.name} solo puede escuchar el preview público de ${previewSeconds} segundos para este beat.`}
      </p>
    </section>
  );
}
