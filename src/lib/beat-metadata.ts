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

type BeatClassificationInput = BeatMetadataInput & {
  durationSeconds?: number;
  waveformSamples?: number[];
  notes?: string;
};

export type BeatClassification = {
  primaryGenre: string;
  subgenres: string[];
  mood: string;
  energy: string;
  useCase: string;
  confidence: number;
  source: string;
  reasoning: string;
};

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function detectWaveformEnergy(samples: number[]) {
  const safeSamples = samples.filter((sample) => Number.isFinite(sample));

  if (safeSamples.length === 0) {
    return "Medium Energy";
  }

  const avg = average(safeSamples);
  const peakRatio = safeSamples.filter((sample) => sample >= 0.72).length / safeSamples.length;

  if (avg >= 0.46 || peakRatio >= 0.32) {
    return "High Energy";
  }

  if (avg <= 0.22 && peakRatio <= 0.08) {
    return "Low Energy";
  }

  return "Medium Energy";
}

function detectMood(input: BeatClassificationInput, primaryGenre: string) {
  const text = metadataText(input).toLowerCase();
  const key = input.currentKey?.toLowerCase() ?? "";

  if (["dark", "minor", "evil", "night", "drill", "trap"].some((word) => text.includes(word)) || key.includes("minor")) {
    return "Dark";
  }

  if (["sad", "pain", "melancholy", "emotional"].some((word) => text.includes(word))) {
    return "Emotional";
  }

  if (["club", "party", "dance", "perreo"].some((word) => text.includes(word)) || ["Reggaeton", "Dembow", "House"].includes(primaryGenre)) {
    return "Club";
  }

  return "Focused";
}

function detectUseCase(input: BeatClassificationInput, mood: string, energy: string) {
  const text = metadataText(input).toLowerCase();

  if (["gym", "workout", "training"].some((word) => text.includes(word))) {
    return "Gym";
  }

  if (energy === "High Energy" && mood === "Dark") {
    return "Gym";
  }

  if (["freestyle", "cypher"].some((word) => text.includes(word))) {
    return "Freestyle";
  }

  if (mood === "Club") {
    return "Club";
  }

  if (mood === "Emotional") {
    return "Songwriting";
  }

  return "Recording";
}

export function classifyBeatFromRealData(input: BeatClassificationInput): BeatClassification {
  const primaryGenre = detectBeatGenre(input);
  const bpm = detectBeatBpm(input);
  const energyFromWaveform = detectWaveformEnergy(input.waveformSamples ?? []);
  const energy =
    bpm && bpm >= 135 && energyFromWaveform !== "Low Energy"
      ? "High Energy"
      : bpm && bpm <= 85 && energyFromWaveform !== "High Energy"
        ? "Low Energy"
        : energyFromWaveform;

  const mood = detectMood(input, primaryGenre);
  const useCase = detectUseCase(input, mood, energy);

  const subgenres = [primaryGenre, mood].filter((value, index, values) => value && values.indexOf(value) === index);

  const signals = [
    input.title ? "title" : "",
    input.fileName ? "fileName" : "",
    input.audioUrl ? "audioUrl" : "",
    bpm ? "bpm" : "",
    input.currentKey ? "key" : "",
    input.durationSeconds ? "duration" : "",
    input.waveformSamples?.length ? "waveform" : "",
    input.notes ? "notes" : "",
  ].filter(Boolean);

  const confidence = Math.min(0.92, 0.45 + signals.length * 0.06);

  return {
    primaryGenre,
    subgenres,
    mood,
    energy,
    useCase,
    confidence: Number(confidence.toFixed(2)),
    source: signals.join("+") || "metadata",
    reasoning: `Clasificación basada en ${signals.join(", ") || "metadata disponible"}: ${primaryGenre}, ${mood}, ${energy}, uso recomendado ${useCase}.`,
  };
}
