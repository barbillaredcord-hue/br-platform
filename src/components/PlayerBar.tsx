"use client";

import { Pause, Play, SkipBack, SkipForward, X } from "lucide-react";
import { useEffect } from "react";
import { usePlayer } from "@/context/PlayerContext";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "00:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function PlayerBar() {
  const { audioUrl, closePlayer, currentBeat, isPlaying, mode, duration, currentTime, queue, currentIndex, playNext, playPrevious, seekTo, togglePlayback } = usePlayer();
  const status = mode === "full" ? "Acceso completo" : "Preview 15s";
  const progress = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;
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
    <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#090b0d] px-4 py-3 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="truncate font-semibold">{currentBeat?.name ?? "Selecciona un beat"}</p>
          <p className="text-sm text-zinc-400">
            {currentBeat ? `${currentBeat.genre} · ${status}` : "Preview 15s"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-zinc-300 transition hover:border-cyan-300 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Beat anterior"
            disabled={!hasPrevious}
            onClick={playPrevious}
          >
            <SkipBack className="h-4 w-4 fill-current" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-full bg-cyan-300 text-black transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
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
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-zinc-300 transition hover:border-cyan-300 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Siguiente beat"
            disabled={!hasNext}
            onClick={playNext}
          >
            <SkipForward className="h-4 w-4 fill-current" aria-hidden="true" />
          </button>
        </div>
        <div className="flex flex-1 items-center gap-3 md:max-w-xl">
          <span className="text-xs text-zinc-500">{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(currentTime, duration || currentTime || 0)}
            onChange={(event) => seekTo(Number(event.target.value))}
            aria-label="Avance del beat"
            className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 accent-cyan-300"
            style={{ background: `linear-gradient(to right, rgb(103 232 249) ${progress}%, rgba(255,255,255,0.10) ${progress}%)` }}
          />
          <span className="text-xs text-zinc-500">{formatTime(duration)}</span>
        </div>
        <button type="button" onClick={closePlayer} className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-zinc-300 transition hover:border-cyan-300 hover:text-cyan-200" aria-label="Ocultar player">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </footer>
  );
}
