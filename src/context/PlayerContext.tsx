"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Beat } from "@/data/beats";
import { useUser } from "@/context/UserContext";
import { userCanAccessBeat } from "@/lib/access";

export type PlayerMode = "preview" | "full";
type PlaybackRequestMode = PlayerMode | "auto";

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
  playBeat: (beat: Beat, mode?: PlaybackRequestMode, queue?: Beat[]) => void;
  playNext: () => void;
  playPrevious: () => void;
  togglePlayback: () => void;
  seekTo: (seconds: number) => void;
  pause: () => void;
  closePlayer: () => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

function getPreviewLimit(beat: Beat) {
  const previewDurationSeconds = (beat as Beat & { previewDurationSeconds?: number }).previewDurationSeconds;

  if (!previewDurationSeconds) {
    return 15;
  }

  return Math.min(30, Math.max(15, Math.round(previewDurationSeconds)));
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useUser();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentUserRef = useRef(currentUser);
  const [currentBeat, setCurrentBeat] = useState<Beat | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mode, setMode] = useState<PlayerMode>("preview");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [queue, setQueueState] = useState<Beat[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const startAudio = useCallback((beat: Beat, nextMode: PlayerMode) => {
    const previewLimit = getPreviewLimit(beat);
    const nextAudioUrl = nextMode === "full" ? beat.fullAudioUrl : beat.previewUrl || beat.fullAudioUrl;

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

  const resolvePlaybackMode = useCallback((beat: Beat, requestedMode: PlaybackRequestMode) => {
    // Do not use access to filter catalog visibility. Access only controls playback/download/protected actions.
    const hasAccess = userCanAccessBeat(currentUserRef.current, beat);

    if (requestedMode === "auto") {
      return hasAccess ? "full" : "preview";
    }

    if (requestedMode === "full" && !hasAccess) {
      return "preview";
    }

    return requestedMode;
  }, []);

  const playBeat = useCallback(
    (beat: Beat, nextMode: PlaybackRequestMode = "preview", nextQueue?: Beat[]) => {
      const effectiveQueue = nextQueue?.length ? nextQueue : queue.length ? queue : [beat];
      const nextIndex = effectiveQueue.findIndex((item) => item.id === beat.id);

      setQueueState(effectiveQueue);
      setCurrentIndex(nextIndex >= 0 ? nextIndex : 0);
      const resolvedMode = resolvePlaybackMode(beat, nextMode);

      startAudio(beat, resolvedMode);
    },
    [queue, resolvePlaybackMode, startAudio],
  );

  const playNext = useCallback(() => {
    const nextIndex = currentIndex + 1;
    const nextBeat = queue[nextIndex];

    if (!nextBeat) {
      return;
    }

    const resolvedMode = resolvePlaybackMode(nextBeat, "auto");

    playBeat(nextBeat, resolvedMode, queue);
  }, [currentIndex, playBeat, queue, resolvePlaybackMode]);

  const playPrevious = useCallback(() => {
    const previousIndex = currentIndex - 1;
    const previousBeat = queue[previousIndex];

    if (!previousBeat) {
      return;
    }

    const resolvedMode = resolvePlaybackMode(previousBeat, "auto");

    playBeat(previousBeat, resolvedMode, queue);
  }, [currentIndex, playBeat, queue, resolvePlaybackMode]);

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

  const seekTo = useCallback((seconds: number) => {
    const audio = audioRef.current;

    if (!audio || !Number.isFinite(seconds)) {
      return;
    }

    const previewLimit = currentBeat ? getPreviewLimit(currentBeat) : 15;
    const maxTime = mode === "preview" ? Math.min(duration || previewLimit, previewLimit) : duration || audio.duration || 0;
    const nextTime = Math.max(0, Math.min(seconds, maxTime));

    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  }, [currentBeat, duration, mode]);

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
      seekTo,
      pause,
      closePlayer,
    }),
    [audioUrl, closePlayer, currentBeat, currentIndex, currentTime, duration, isPlaying, mode, pause, playBeat, playNext, playPrevious, queue, seekTo, togglePlayback],
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
