"use client";

import { Pause, Play } from "lucide-react";
import { usePlayer } from "@/context/PlayerContext";

export function PlayerBar() {
  const { currentBeat, isPlaying, mode, togglePlayback } = usePlayer();
  const status = mode === "full" ? "Acceso completo" : "Preview 15s";
  const progressWidth = currentBeat && isPlaying ? "w-1/3" : "w-0";

  return (
    <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#090b0d] px-4 py-3 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="truncate font-semibold">{currentBeat?.name ?? "Selecciona un beat"}</p>
          <p className="text-sm text-zinc-400">
            {currentBeat ? `${currentBeat.genre} · ${status}` : "Preview 15s"}
          </p>
        </div>
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
        <div className="flex flex-1 items-center gap-3 md:max-w-xl">
          <span className="text-xs text-zinc-500">0:00</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
            <div className={`h-full rounded-full bg-cyan-300 transition-all ${progressWidth}`} />
          </div>
          <span className="text-xs text-zinc-500">{mode === "full" ? "Full" : "0:15"}</span>
        </div>
      </div>
    </footer>
  );
}
