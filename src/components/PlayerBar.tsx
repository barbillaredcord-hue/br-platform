"use client";

import { Pause, Play, SkipBack, SkipForward, X } from "lucide-react";
import { useEffect } from "react";
import type { Beat } from "@/data/beats";
import { usePlayer } from "@/context/PlayerContext";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "00:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function getPreviewSeconds(beat: Beat) {
  const previewMeta = beat as Beat & { previewDurationSeconds?: number | null };
  const seconds = previewMeta.previewDurationSeconds ?? 15;

  return Math.min(30, Math.max(15, Math.round(seconds)));
}

export function PlayerBar() {
  const {
    audioUrl,
    closePlayer,
    currentBeat,
    isPlaying,
    mode,
    duration,
    currentTime,
    queue,
    currentIndex,
    playNext,
    playPrevious,
    seekTo,
    togglePlayback,
  } = usePlayer();

  const previewSeconds = currentBeat ? getPreviewSeconds(currentBeat) : 15;
  const modeLabel = mode === "full" ? "Acceso completo" : `Preview ${previewSeconds}s`;
  const durationLabel = formatTime(duration);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < queue.length - 1;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName.toLowerCase();

      if (
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        target?.isContentEditable
      ) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        togglePlayback();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [togglePlayback]);

  if (!currentBeat || !audioUrl) {
    return null;
  }

  return (
    <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#050607]/95 px-3 py-3 text-white shadow-[0_-18px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl md:px-8">
      <div className="relative mx-auto grid max-w-7xl gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 ring-1 ring-cyan-300/10 md:grid-cols-[minmax(0,1fr)_auto_minmax(280px,1fr)_auto] md:items-center md:p-4">
        <div className="min-w-0 pr-10 md:pr-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <p className="truncate text-sm font-black md:text-base">{currentBeat.name}</p>
            <span
              className={`rounded-full border px-2.5 py-1 text-[11px] font-black uppercase ${
                mode === "full"
                  ? "border-emerald-300/40 bg-emerald-300/10 text-emerald-200"
                  : "border-cyan-300/40 bg-cyan-300/10 text-cyan-100"
              }`}
            >
              {modeLabel}
            </span>
          </div>
          <p className="mt-1 truncate text-xs font-semibold text-zinc-400 md:text-sm">
            {currentBeat.genre} · {mode === "preview" ? `duración ${previewSeconds}s` : "audio completo"}
          </p>
        </div>

        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-zinc-300 transition hover:border-cyan-300 hover:bg-cyan-300/10 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Beat anterior"
            disabled={!hasPrevious}
            onClick={playPrevious}
          >
            <SkipBack className="h-4 w-4 fill-current" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="grid h-12 w-12 place-items-center rounded-full bg-cyan-300 text-black shadow-[0_0_28px_rgba(103,232,249,0.35)] transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={isPlaying ? "Pausar" : "Reproducir"}
            disabled={!currentBeat}
            onClick={togglePlayback}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 fill-current" aria-hidden="true" />
            ) : (
              <Play className="h-4 w-4 fill-current" aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-zinc-300 transition hover:border-cyan-300 hover:bg-cyan-300/10 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Siguiente beat"
            disabled={!hasNext}
            onClick={playNext}
          >
            <SkipForward className="h-4 w-4 fill-current" aria-hidden="true" />
          </button>
        </div>

        <div className="grid min-w-0 gap-2">
          <div className="flex items-center justify-between gap-3 text-[11px] font-bold uppercase text-zinc-500">
            <span>{formatTime(currentTime)}</span>
            <span>{durationLabel}</span>
          </div>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(currentTime, duration || currentTime || 0)}
            onChange={(event) => seekTo(Number(event.target.value))}
            aria-label="Avance del beat"
            className="h-2 w-full cursor-pointer accent-cyan-300"
          />
        </div>

        <button
          type="button"
          onClick={closePlayer}
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-black/30 text-zinc-400 transition hover:border-cyan-300 hover:text-cyan-100 md:static md:h-9 md:w-9"
          aria-label="Ocultar player"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </footer>
  );
}
