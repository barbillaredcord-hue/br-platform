export type Beat = {
  id: string;
  name: string;
  genre: string;
  bpm: number;
  locked: boolean;
  key?: string;
};

export type BeatRow = {
  title: string;
  beats: Beat[];
};

export const beatRows: BeatRow[] = [
  {
    title: "Trap",
    beats: [
      { id: "midnight-flex", name: "Midnight Flex", genre: "Trap", bpm: 142, locked: false, key: "F minor" },
      { id: "no-sleep", name: "No Sleep", genre: "Trap", bpm: 150, locked: true, key: "C# minor" },
      { id: "diamond-rain", name: "Diamond Rain", genre: "Trap", bpm: 138, locked: false, key: "A minor" },
      { id: "cold-chain", name: "Cold Chain", genre: "Trap", bpm: 146, locked: true, key: "D minor" },
    ],
  },
  {
    title: "Drill",
    beats: [
      { id: "black-zone", name: "Black Zone", genre: "Drill", bpm: 144, locked: true, key: "G minor" },
      { id: "street-code", name: "Street Code", genre: "Drill", bpm: 142, locked: false, key: "E minor" },
      { id: "night-shift", name: "Night Shift", genre: "Drill", bpm: 148, locked: true, key: "B minor" },
      { id: "south-echo", name: "South Echo", genre: "Drill", bpm: 140, locked: false, key: "F# minor" },
    ],
  },
  {
    title: "Reggaeton",
    beats: [
      { id: "perla-azul", name: "Perla Azul", genre: "Reggaeton", bpm: 96, locked: false, key: "A minor" },
      { id: "after-club", name: "After Club", genre: "Reggaeton", bpm: 92, locked: true, key: "D minor" },
      { id: "luna-vip", name: "Luna VIP", genre: "Reggaeton", bpm: 94, locked: false, key: "G minor" },
      { id: "malecon", name: "Malecón", genre: "Reggaeton", bpm: 98, locked: true, key: "C minor" },
    ],
  },
  {
    title: "Exclusivos",
    beats: [
      { id: "royal-pack", name: "Royal Pack", genre: "Exclusive", bpm: 132, locked: true, key: "C# minor" },
      { id: "private-vault", name: "Private Vault", genre: "Exclusive", bpm: 128, locked: true, key: "F minor" },
      { id: "aqua-room", name: "Aqua Room", genre: "Exclusive", bpm: 136, locked: true, key: "A# minor" },
      { id: "gold-signal", name: "Gold Signal", genre: "Exclusive", bpm: 124, locked: true, key: "E minor" },
    ],
  },
];

export const featuredBeat: Beat = {
  id: "aqua-nights",
  name: "Aqua Nights",
  genre: "Trap",
  bpm: 144,
  locked: false,
  key: "F minor",
};

export const allBeats: Beat[] = [featuredBeat, ...beatRows.flatMap((row) => row.beats)];

export function getBeatById(id: string) {
  return allBeats.find((beat) => beat.id === id);
}

export function getRelatedBeats(beat: Beat) {
  return allBeats.filter((item) => item.genre === beat.genre && item.id !== beat.id).slice(0, 4);
}
