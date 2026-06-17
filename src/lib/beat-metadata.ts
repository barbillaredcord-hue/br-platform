type BeatMetadataInput = {
  title?: string;
  fileName?: string;
  audioUrl?: string;
  currentGenre?: string;
  currentBpm?: number | null;
  currentKey?: string | null;
};

const genreKeywords = [
  { genre: "Trap", keywords: ["trap", "808", "dark", "rage"] },
  { genre: "Drill", keywords: ["uk drill", "ny drill", "drill"] },
  { genre: "Reggaeton", keywords: ["reggaeton", "reggaetón", "perreo", "latin"] },
  { genre: "Boom Bap", keywords: ["boom bap", "boombap", "old school"] },
  { genre: "R&B", keywords: ["rnb", "r&b", "soul"] },
  { genre: "Afrobeat", keywords: ["afrobeat", "amapiano", "afro"] },
  { genre: "Corridos/Regional", keywords: ["corrido", "tumbado", "regional"] },
  { genre: "Pop", keywords: ["pop"] },
  { genre: "Jersey", keywords: ["jersey"] },
  { genre: "House", keywords: ["house"] },
  { genre: "Techno", keywords: ["techno"] },
  { genre: "Dembow", keywords: ["dembow"] },
  { genre: "Hip Hop", keywords: ["hiphop", "hip-hop", "rap"] },
];

const notePattern = "(C#|Db|D#|Eb|F#|Gb|G#|Ab|A#|Bb|C|D|E|F|G|A|B)";
const keyPattern = new RegExp(`\\b${notePattern}\\s*(sharp|#)?\\s*(major|maj|minor|min|m)?\\b`, "i");

function metadataText(input: BeatMetadataInput) {
  return [input.title, input.fileName, input.audioUrl].filter(Boolean).join(" ");
}

function normalizeNote(note: string, sharpWord?: string) {
  const base = note.length === 2 ? `${note[0].toUpperCase()}${note[1]}` : note.toUpperCase();

  if (sharpWord && sharpWord.toLowerCase() === "sharp" && !base.includes("#")) {
    return `${base}#`;
  }

  return base;
}

export function detectBeatGenre(input: BeatMetadataInput): string {
  const text = metadataText(input).toLowerCase();
  const match = genreKeywords.find((item) => item.keywords.some((keyword) => text.includes(keyword)));

  return match?.genre ?? (input.currentGenre?.trim() || "Hip Hop");
}

export function detectBeatBpm(input: BeatMetadataInput): number | null {
  const text = metadataText(input);
  const matches = [
    ...text.matchAll(/\b(\d{2,3})\s*bpm\b/gi),
    ...text.matchAll(/\bbpm\s*(\d{2,3})\b/gi),
    ...text.matchAll(/(?:^|[_-])(\d{2,3})(?:[_-]|$)/g),
  ];
  const bpm = matches.map((match) => Number(match[1])).find((value) => value >= 40 && value <= 240);

  if (bpm) {
    return bpm;
  }

  return input.currentBpm ?? null;
}

export function detectBeatKey(input: BeatMetadataInput): string | null {
  const text = metadataText(input);
  const match = text.match(keyPattern);

  if (!match) {
    return input.currentKey?.trim() || null;
  }

  const note = normalizeNote(match[1], match[2]);
  const modeText = match[3]?.toLowerCase();
  let mode = "Major";

  if (modeText?.startsWith("min") || modeText === "m") {
    mode = "Minor";
  }

  return `${note} ${mode}`;
}

export function detectBeatMetadata(input: BeatMetadataInput) {
  return {
    genre: detectBeatGenre(input),
    bpm: detectBeatBpm(input),
    key: detectBeatKey(input),
  };
}
