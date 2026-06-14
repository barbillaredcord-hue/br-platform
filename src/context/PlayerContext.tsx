"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { Beat } from "@/data/beats";

export type PlayerMode = "preview" | "full";

type PlayerContextValue = {
  currentBeat: Beat | null;
  isPlaying: boolean;
  mode: PlayerMode;
  playBeat: (beat: Beat, mode?: PlayerMode) => void;
  togglePlayback: () => void;
  pause: () => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentBeat, setCurrentBeat] = useState<Beat | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mode, setMode] = useState<PlayerMode>("preview");

  const value = useMemo<PlayerContextValue>(
    () => ({
      currentBeat,
      isPlaying,
      mode,
      playBeat: (beat, nextMode = "preview") => {
        setCurrentBeat(beat);
        setMode(nextMode);
        setIsPlaying(true);
      },
      togglePlayback: () => {
        if (currentBeat) {
          setIsPlaying((playing) => !playing);
        }
      },
      pause: () => setIsPlaying(false),
    }),
    [currentBeat, isPlaying, mode],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const context = useContext(PlayerContext);

  if (!context) {
    throw new Error("usePlayer must be used within PlayerProvider");
  }

  return context;
}
