export type Beat = {
  id: string;
  name: string;
  genre: string;
  bpm: number;
  locked: boolean;
};

export type BeatRow = {
  title: string;
  beats: Beat[];
};

export const beatRows: BeatRow[] = [
  {
    title: "Trap",
    beats: [
      { id: "midnight-flex", name: "Midnight Flex", genre: "Trap", bpm: 142, locked: false },
      { id: "no-sleep", name: "No Sleep", genre: "Trap", bpm: 150, locked: true },
      { id: "diamond-rain", name: "Diamond Rain", genre: "Trap", bpm: 138, locked: false },
      { id: "cold-chain", name: "Cold Chain", genre: "Trap", bpm: 146, locked: true },
    ],
  },
  {
    title: "Drill",
    beats: [
      { id: "black-zone", name: "Black Zone", genre: "Drill", bpm: 144, locked: true },
      { id: "street-code", name: "Street Code", genre: "Drill", bpm: 142, locked: false },
      { id: "night-shift", name: "Night Shift", genre: "Drill", bpm: 148, locked: true },
      { id: "south-echo", name: "South Echo", genre: "Drill", bpm: 140, locked: false },
    ],
  },
  {
    title: "Reggaeton",
    beats: [
      { id: "perla-azul", name: "Perla Azul", genre: "Reggaeton", bpm: 96, locked: false },
      { id: "after-club", name: "After Club", genre: "Reggaeton", bpm: 92, locked: true },
      { id: "luna-vip", name: "Luna VIP", genre: "Reggaeton", bpm: 94, locked: false },
      { id: "malecon", name: "Malecón", genre: "Reggaeton", bpm: 98, locked: true },
    ],
  },
  {
    title: "Exclusivos",
    beats: [
      { id: "royal-pack", name: "Royal Pack", genre: "Exclusive", bpm: 132, locked: true },
      { id: "private-vault", name: "Private Vault", genre: "Exclusive", bpm: 128, locked: true },
      { id: "aqua-room", name: "Aqua Room", genre: "Exclusive", bpm: 136, locked: true },
      { id: "gold-signal", name: "Gold Signal", genre: "Exclusive", bpm: 124, locked: true },
    ],
  },
];

export const featuredBeat: Beat = {
  id: "aqua-nights",
  name: "Aqua Nights",
  genre: "Trap",
  bpm: 144,
  locked: false,
};
