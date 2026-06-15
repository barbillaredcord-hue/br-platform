"use client";

import type { Beat } from "@/data/beats";
import { useUser } from "@/context/UserContext";
import { userCanAccessBeat } from "@/lib/access";
import { AccessStatusBadge } from "./AccessStatusBadge";

export function BeatAccessSummary({ beat }: { beat: Beat }) {
  const { currentUser } = useUser();
  const hasAccess = userCanAccessBeat(currentUser, beat);

  return (
    <section className="rounded-lg border border-cyan-300/20 bg-[#101317] p-5">
      <h2 className="text-xl font-bold">
        {hasAccess ? "Acceso completo autorizado" : "Solo preview disponible"}
      </h2>
      <div className="mt-3">
        <AccessStatusBadge hasAccess={hasAccess} />
      </div>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
        {!currentUser
          ? "Inicia sesión para solicitar acceso o descargar después de comprar."
          : hasAccess
            ? `${currentUser.name} tiene permiso para escuchar y descargar este beat en MP3.`
            : `${currentUser.name} solo puede escuchar el preview público de 15 segundos para este beat.`}
      </p>
    </section>
  );
}
