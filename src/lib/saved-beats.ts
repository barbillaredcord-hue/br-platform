export const SAVED_BEATS_EVENT = "br:saved-beats-updated";

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function getSavedBeatStorageKey(userId?: string | null) {
  return `br:saved-beats:${userId || "guest"}`;
}

function readIds(key: string) {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function writeIds(key: string, ids: string[]) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(Array.from(new Set(ids))));
}

export function getSavedBeatIds(userId?: string | null) {
  return readIds(getSavedBeatStorageKey(userId));
}

export function isBeatSaved(beatId: string, userId?: string | null) {
  return getSavedBeatIds(userId).includes(beatId);
}

export function toggleSavedBeatId(beatId: string, userId?: string | null) {
  const key = getSavedBeatStorageKey(userId);
  const currentIds = readIds(key);
  const nextIds = currentIds.includes(beatId)
    ? currentIds.filter((id) => id !== beatId)
    : [...currentIds, beatId];

  writeIds(key, nextIds);

  window.dispatchEvent(new CustomEvent(SAVED_BEATS_EVENT, {
    detail: {
      userId: userId || "guest",
      ids: nextIds,
    },
  }));

  return nextIds;
}
