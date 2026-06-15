export type BeatStatus = "Público Preview" | "Privado" | "Exclusivo";

export type Beat = {
  id: string;
  dbId?: string;
  name: string;
  genre: string;
  bpm: number;
  locked: boolean;
  key?: string;
  status: BeatStatus;
  previewUrl: string;
  fullAudioUrl: string;
  isDemoAudio: false;
};

export type BeatRow = {
  title: string;
  beats: Beat[];
};

export const beatRows: BeatRow[] = ([
  {
    title: "Trap",
    beats: [
      {
        id: "back-alley-receipt",
        name: "Back Alley Receipt",
        genre: "Trap",
        bpm: 142,
        locked: false,
        key: "F minor",
        status: "Público Preview",
        previewUrl: "/audio/previews/back-alley-receipt-preview.mp3",
        fullAudioUrl: "/audio/full/Back Alley Receipt-2.mp3",
        isDemoAudio: false,
      },
    ],
  },
  {
    title: "Drill",
    beats: [
      {
        id: "dust-on-my-name",
        name: "Dust On My Name",
        genre: "Drill",
        bpm: 144,
        locked: true,
        key: "G minor",
        status: "Privado",
        previewUrl: "/audio/previews/dust-on-my-name-preview.mp3",
        fullAudioUrl: "/audio/full/Dust On My Name (Without Lead Vocal) (Without No Lead Vocal).mp3",
        isDemoAudio: false,
      },
    ],
  },
] satisfies BeatRow[]).filter((row) => row.beats.length > 0);

export const featuredBeat: Beat = beatRows[0].beats[0];

export const allBeats: Beat[] = beatRows.flatMap((row) => row.beats);

export function getBeatById(id: string) {
  return allBeats.find((beat) => beat.id === id);
}

export function getRelatedBeats(beat: Beat) {
  const sameGenre = allBeats.filter((item) => item.genre === beat.genre && item.id !== beat.id);
  const fallback = allBeats.filter((item) => item.id !== beat.id);

  return (sameGenre.length > 0 ? sameGenre : fallback).slice(0, 4);
}
