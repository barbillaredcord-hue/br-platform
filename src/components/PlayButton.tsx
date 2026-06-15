"use client";

import { Pause, Play } from "lucide-react";
import type { Beat } from "@/data/beats";
import type { PlayerMode } from "@/context/PlayerContext";
import { usePlayer } from "@/context/PlayerContext";

type PlayButtonProps = {
  children?: React.ReactNode;
  variant?: "primary" | "light" | "circle";
  className?: string;
  ariaLabel?: string;
  beat?: Beat;
  mode?: PlayerMode;
  queue?: Beat[];
  showPauseState?: boolean;
};

const variants = {
  primary: "h-11 gap-2 rounded-md bg-cyan-300 px-5 text-sm font-bold text-black hover:bg-cyan-200",
  light: "h-10 w-full gap-2 rounded-md bg-white text-sm font-bold text-black hover:bg-cyan-200",
  circle: "h-11 w-11 rounded-full bg-cyan-300 text-black hover:bg-cyan-200",
};

export function PlayButton({
  children,
  variant = "primary",
  className = "",
  ariaLabel,
  beat,
  mode = "preview",
  queue,
  showPauseState = false,
}: PlayButtonProps) {
  const { currentBeat, isPlaying, mode: currentMode, playBeat, togglePlayback } = usePlayer();
  const isActive = Boolean(beat && currentBeat?.id === beat.id && currentMode === mode);
  const isPausedIcon = showPauseState && isActive && isPlaying;

  return (
    <button
      type="button"
      className={`flex items-center justify-center transition ${variants[variant]} ${className}`}
      aria-label={ariaLabel}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();

        if (!beat) {
          togglePlayback();
          return;
        }

        if (isActive) {
          togglePlayback();
          return;
        }

        playBeat(beat, mode, queue);
      }}
    >
      {isPausedIcon ? (
        <Pause className="h-4 w-4 fill-current" aria-hidden="true" />
      ) : (
        <Play className="h-4 w-4 fill-current" aria-hidden="true" />
      )}
      {children}
    </button>
  );
}
