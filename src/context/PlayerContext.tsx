"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Beat } from "@/data/beats";
import { useUser } from "@/context/UserContext";
import { userCanAccessBeat, userCanPreviewPrivateBeat } from "@/lib/access";

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

const fadeMs = 280;
const fadeSteps = 10;
const autoAdvanceDelayMs = 500;
const recentPlaybackLimit = 100;

function fadeAudio(audio: HTMLAudioElement, from: number, to: number, onDone?: () => void) {
  let step = 0;
  const intervalMs = Math.max(16, Math.round(fadeMs / fadeSteps));
  const delta = to - from;

  audio.volume = Math.max(0, Math.min(1, from));

  const interval = window.setInterval(() => {
    step += 1;
    const progress = Math.min(1, step / fadeSteps);
    audio.volume = Math.max(0, Math.min(1, from + delta * progress));

    if (progress >= 1) {
      window.clearInterval(interval);
      onDone?.();
    }
  }, intervalMs);
}

function getBeatKey(beat: Beat) {
  return beat.dbId ?? beat.id;
}

function uniqueBeats(beats: Beat[]) {
  const seen = new Set<string>();
  const result: Beat[] = [];

  beats.forEach((beat) => {
    const key = getBeatKey(beat);

    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    result.push(beat);
  });

  return result;
}

function getRelatedNextBeat(currentBeat: Beat | null, currentQueue: Beat[], catalogQueue: Beat[], recentPlayedKeys: string[]) {
  if (!currentBeat) {
    return null;
  }

  const currentKey = getBeatKey(currentBeat);
  const recentKeys = new Set(recentPlayedKeys);
  const catalog = uniqueBeats([...currentQueue, ...catalogQueue]).filter((beat) => {
    const key = getBeatKey(beat);
    return key !== currentKey && !recentKeys.has(key);
  });

  if (catalog.length === 0) {
    return null;
  }

  const sameGenre = catalog.find((beat) => beat.genre && currentBeat.genre && beat.genre.toLowerCase() === currentBeat.genre.toLowerCase());

  return sameGenre ?? catalog[0] ?? null;
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, isEmailConfirmed } = useUser();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentUserRef = useRef(currentUser);
  const isEmailConfirmedRef = useRef(isEmailConfirmed);
  const autoAdvanceRef = useRef<() => void>(() => undefined);
  const catalogQueueRef = useRef<Beat[]>([]);
  const recentPlayedKeysRef = useRef<string[]>([]);
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
    isEmailConfirmedRef.current = isEmailConfirmed;
  }, [currentUser, isEmailConfirmed]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const rememberCatalogBeats = useCallback((beats: Beat[]) => {
    if (!beats.length) {
      return;
    }

    catalogQueueRef.current = uniqueBeats([...catalogQueueRef.current, ...beats]);
  }, []);

  const rememberPlayedBeat = useCallback((beat: Beat) => {
    const key = getBeatKey(beat);

    recentPlayedKeysRef.current = [key, ...recentPlayedKeysRef.current.filter((item) => item !== key)].slice(0, recentPlaybackLimit);
  }, []);

  const startAudio = useCallback((beat: Beat, nextMode: PlayerMode) => {
    const previewLimit = getPreviewLimit(beat);
    const nextAudioUrl = nextMode === "full" ? beat.fullAudioUrl : beat.previewUrl || beat.fullAudioUrl;
    let didFinish = false;

    function finishAndAdvance() {
      if (didFinish) {
        return;
      }

      didFinish = true;

      fadeAudio(audio, audio.volume, 0, () => {
        audio.pause();
        setIsPlaying(false);

        window.setTimeout(() => {
          autoAdvanceRef.current();
        }, autoAdvanceDelayMs);
      });
    }

    audioRef.current?.pause();

    const audio = new Audio(nextAudioUrl);
    audio.volume = 0;
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
        finishAndAdvance();
      }
    });

    audio.addEventListener("ended", () => {
      finishAndAdvance();
    });

    audio.addEventListener("error", () => {
      console.error("Audio file not found");
      setIsPlaying(false);
    });

    audio.play()
      .then(() => {
        setIsPlaying(true);
        fadeAudio(audio, 0, 1);
      })
      .catch(() => {
        console.error("Audio file not found");
        setIsPlaying(false);
      });
  }, []);

  const resolvePlaybackMode = useCallback((beat: Beat, requestedMode: PlaybackRequestMode) => {
    // Do not use access to filter catalog visibility. Access only controls playback/download/protected actions.
    const currentUser = currentUserRef.current;
    const hasConfirmedEmail = isEmailConfirmedRef.current;

    if (requestedMode === "preview") {
      return beat.playbackVisibility === "public" || userCanPreviewPrivateBeat(currentUser, hasConfirmedEmail, beat) ? "preview" : null;
    }

    if (currentUser?.role === "admin") {
      return "full";
    }

    if (beat.playbackVisibility === "public") {
      return "full";
    }

    const hasAccess = userCanAccessBeat(currentUser, beat);
    const canPreviewPrivate = userCanPreviewPrivateBeat(currentUser, hasConfirmedEmail, beat);

    if (requestedMode === "auto") {
      return hasAccess ? "full" : canPreviewPrivate ? "preview" : null;
    }

    if (requestedMode === "full" && !hasAccess) {
      return canPreviewPrivate ? "preview" : null;
    }

    return requestedMode;
  }, []);

  const playBeat = useCallback(
    (beat: Beat, nextMode: PlaybackRequestMode = "preview", nextQueue?: Beat[]) => {
      const effectiveQueue = nextQueue?.length ? nextQueue : queue.length ? queue : [beat];
      const nextIndex = effectiveQueue.findIndex((item) => item.id === beat.id);

      rememberCatalogBeats(effectiveQueue);
      rememberPlayedBeat(beat);
      setQueueState(effectiveQueue);
      setCurrentIndex(nextIndex >= 0 ? nextIndex : 0);
      const resolvedMode = resolvePlaybackMode(beat, nextMode);

      if (!resolvedMode) {
        return;
      }

      startAudio(beat, resolvedMode);
    },
    [queue, rememberCatalogBeats, rememberPlayedBeat, resolvePlaybackMode, startAudio],
  );

  const playNext = useCallback(() => {
    const nextIndex = currentIndex + 1;
    const nextBeat = queue[nextIndex];

    if (nextBeat) {
      const resolvedMode = resolvePlaybackMode(nextBeat, "auto");
      if (!resolvedMode) {
        return;
      }
      playBeat(nextBeat, resolvedMode, queue);
      return;
    }

    const relatedNextBeat = getRelatedNextBeat(currentBeat, queue, catalogQueueRef.current, recentPlayedKeysRef.current);

    if (!relatedNextBeat) {
      return;
    }

    const extendedQueue = uniqueBeats([...queue, relatedNextBeat]);
    const resolvedMode = resolvePlaybackMode(relatedNextBeat, "auto");
    if (!resolvedMode) {
      return;
    }

    playBeat(relatedNextBeat, resolvedMode, extendedQueue);
  }, [currentBeat, currentIndex, playBeat, queue, resolvePlaybackMode]);

  const playPrevious = useCallback(() => {
    const previousIndex = currentIndex - 1;
    const previousBeat = queue[previousIndex];

    if (!previousBeat) {
      return;
    }

    const resolvedMode = resolvePlaybackMode(previousBeat, "auto");
    if (!resolvedMode) {
      return;
    }

    playBeat(previousBeat, resolvedMode, queue);
  }, [currentIndex, playBeat, queue, resolvePlaybackMode]);

  useEffect(() => {
    autoAdvanceRef.current = playNext;
  }, [playNext]);

  const togglePlayback = useCallback(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    if (audio.paused) {
      audio.play()
        .then(() => {
          setIsPlaying(true);
          fadeAudio(audio, audio.volume, 1);
        })
        .catch(() => {
          console.error("Audio file not found");
          setIsPlaying(false);
        });
      return;
    }

    fadeAudio(audio, audio.volume, 0, () => {
      audio.pause();
      setIsPlaying(false);
    });
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
    const audio = audioRef.current;

    if (!audio) {
      setIsPlaying(false);
      return;
    }

    audio.pause();
    setIsPlaying(false);
  }, []);

  const closePlayer = useCallback(() => {
    audioRef.current?.pause();
    if (audioRef.current) {
      audioRef.current.volume = 0;
    }
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
      setQueue: (beats) => {
        rememberCatalogBeats(beats);
        setQueueState(beats);
      },
      playBeat,
      playNext,
      playPrevious,
      togglePlayback,
      seekTo,
      pause,
      closePlayer,
    }),
    [audioUrl, closePlayer, currentBeat, currentIndex, currentTime, duration, isPlaying, mode, pause, playBeat, playNext, playPrevious, queue, rememberCatalogBeats, seekTo, togglePlayback],
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
