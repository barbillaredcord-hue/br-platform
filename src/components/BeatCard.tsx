"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { AccessStatusBadge } from "@/components/AccessStatusBadge";
import { useUser } from "@/context/UserContext";
import type { Beat } from "@/data/beats";
import { userCanAccessBeat } from "@/lib/access";
import { isBeatSaved, SAVED_BEATS_EVENT, toggleSavedBeatId } from "@/lib/saved-beats";
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

function getPreviewSeconds(beat: Beat) {
  const previewMeta = beat as Beat & { previewDurationSeconds?: number | null };
  const seconds = previewMeta.previewDurationSeconds ?? 15;

  return Math.min(30, Math.max(15, Math.round(seconds)));
}

export function BeatCard({ beat, gradientIndex, queue }: BeatCardProps) {
  const { currentUser } = useUser();
  const hasAccess = userCanAccessBeat(currentUser, beat);
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

  return (
    <article className="relative w-56 shrink-0 snap-start rounded-lg bg-[#15181c] p-3 transition hover:bg-[#1c2127]">
      <button
        type="button"
        aria-label={isSaved ? `Quitar ${beat.name} de guardados` : `Guardar ${beat.name}`}
        onClick={toggleSaved}
        className={`absolute right-5 top-5 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold transition ${
          isSaved
            ? "border-cyan-300/60 bg-cyan-300 text-black"
            : "border-white/15 bg-black/30 text-cyan-100 hover:border-cyan-300/60 hover:bg-cyan-300/10"
        }`}
      >
        <Heart className={`h-4 w-4 ${isSaved ? "fill-black" : ""}`} aria-hidden="true" />
      </button>
      <Link href={`/beats/${beat.id}`} className="block">
        <div className={`mb-4 grid aspect-square place-items-center rounded-lg ${coverGradients[gradientIndex % coverGradients.length]}`}>
          <span className="text-4xl font-black text-white/85">B.R</span>
        </div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-semibold">{beat.name}</h3>
            <p className="mt-1 text-sm text-zinc-400">
              {beat.genre} · {beat.bpm} BPM
            </p>
          </div>
          {beat.locked ? <AccessBadge /> : null}
        </div>
        <div className="mt-3">
          <AccessStatusBadge hasAccess={hasAccess} />
        </div>
        <p className="mt-2 truncate text-xs font-semibold text-zinc-500">{hasAccess ? "Acceso completo activo" : "Acceso privado disponible"}</p>
      </Link>
      <div className="mt-4 grid gap-2">
        <PlayButton variant="light" beat={beat} mode={hasAccess ? "full" : "preview"} queue={queue} showPauseState>
          {hasAccess ? "Full" : `Preview ${previewSeconds}s`}
        </PlayButton>
        <button
          type="button"
          aria-label={isSaved ? `Quitar ${beat.name} de guardados` : `Guardar ${beat.name}`}
          onClick={toggleSaved}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-cyan-300/20 px-3 text-xs font-bold text-cyan-100 transition hover:border-cyan-300/60 hover:bg-cyan-300/10"
        >
          <Heart className={`h-4 w-4 ${isSaved ? "fill-cyan-200 text-cyan-200" : ""}`} aria-hidden="true" />
          {isSaved ? "Guardado" : "Guardar"}
        </button>
      </div>
    </article>
  );
}
