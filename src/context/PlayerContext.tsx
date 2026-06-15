"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Beat } from "@/data/beats";
import { useUser } from "@/context/UserContext";
import { userCanAccessBeat } from "@/lib/access";

export type PlayerMode = "preview" | "full";

type PlayerContextValue = {
  currentBeat: Beat | null;
  isPlaying: boolean;
  mode: PlayerMode;
  audioUrl: string | null;
  duration: number;
  currentTime: number;
  queue: Beat[];
  currentIndex: number;
  setQueue: (beats: Beat[]) => void;
  playBeat: (beat: Beat, mode?: PlayerMode, queue?: Beat[]) => void;
  playNext: () => void;
  playPrevious: () => void;
  togglePlayback: () => void;
  pause: () => void;
  closePlayer: () => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useUser();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentBeat, setCurrentBeat] = useState<Beat | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mode, setMode] = useState<PlayerMode>("preview");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [queue, setQueueState] = useState<Beat[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const startAudio = useCallback((beat: Beat, nextMode: PlayerMode) => {
    const nextAudioUrl = nextMode === "full" ? beat.fullAudioUrl : beat.previewUrl;
    const previewLimit = 15;

    audioRef.current?.pause();

    const audio = new Audio(nextAudioUrl);
    audioRef.current = audio;

    setCurrentBeat(beat);
    setMode(nextMode);
    setAudioUrl(nextAudioUrl);
    setCurrentTime(0);
    setDuration(nextMode === "preview" ? previewLimit : 0);

    audio.addEventListener("loadedmetadata", () => {
      const safeDuration = Number.isFinite(audio.duration) ? audio.duration : 0;
      setDuration(nextMode === "preview" ? Math.min(safeDuration || previewLimit, previewLimit) : safeDuration);
    });

    audio.addEventListener("timeupdate", () => {
      const nextTime = nextMode === "preview" ? Math.min(audio.currentTime, previewLimit) : audio.currentTime;
      setCurrentTime(nextTime);

      if (nextMode === "preview" && audio.currentTime >= previewLimit) {
        audio.pause();
        setIsPlaying(false);
      }
    });

    audio.addEventListener("ended", () => {
      setIsPlaying(false);
    });

    audio.addEventListener("error", () => {
      console.error("Audio file not found");
      setIsPlaying(false);
    });

    audio.play()
      .then(() => setIsPlaying(true))
      .catch(() => {
        console.error("Audio file not found");
        setIsPlaying(false);
      });
  }, []);

  const resolveMode = useCallback((beat: Beat, requestedMode: PlayerMode) => {
    if (requestedMode === "full" && !userCanAccessBeat(currentUser, beat)) {
      return "preview";
    }

    return requestedMode;
  }, [currentUser]);

  const playBeat = useCallback(
    (beat: Beat, nextMode: PlayerMode = "preview", nextQueue?: Beat[]) => {
      const effectiveQueue = nextQueue?.length ? nextQueue : queue.length ? queue : [beat];
      const nextIndex = effectiveQueue.findIndex((item) => item.id === beat.id);

      setQueueState(effectiveQueue);
      setCurrentIndex(nextIndex >= 0 ? nextIndex : 0);
      startAudio(beat, resolveMode(beat, nextMode));
    },
    [queue, resolveMode, startAudio],
  );

  const playNext = useCallback(() => {
    const nextIndex = currentIndex + 1;
    const nextBeat = queue[nextIndex];

    if (!nextBeat) {
      return;
    }

    playBeat(nextBeat, resolveMode(nextBeat, mode), queue);
  }, [currentIndex, mode, playBeat, queue, resolveMode]);

  const playPrevious = useCallback(() => {
    const previousIndex = currentIndex - 1;
    const previousBeat = queue[previousIndex];

    if (!previousBeat) {
      return;
    }

    playBeat(previousBeat, resolveMode(previousBeat, mode), queue);
  }, [currentIndex, mode, playBeat, queue, resolveMode]);

  const togglePlayback = useCallback(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    if (audio.paused) {
      audio.play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          console.error("Audio file not found");
          setIsPlaying(false);
        });
      return;
    }

    audio.pause();
    setIsPlaying(false);
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const closePlayer = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    setCurrentBeat(null);
    setIsPlaying(false);
    setAudioUrl(null);
    setCurrentTime(0);
    setDuration(0);
    setCurrentIndex(-1);
  }, []);

  const value = useMemo<PlayerContextValue>(
    () => ({
      currentBeat,
      isPlaying,
      mode,
      audioUrl,
      duration,
      currentTime,
      queue,
      currentIndex,
      setQueue: setQueueState,
      playBeat,
      playNext,
      playPrevious,
      togglePlayback,
      pause,
      closePlayer,
    }),
    [audioUrl, closePlayer, currentBeat, currentIndex, currentTime, duration, isPlaying, mode, pause, playBeat, playNext, playPrevious, queue, togglePlayback],
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
