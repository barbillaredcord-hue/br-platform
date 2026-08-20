import type { MusicFeatures } from "@/lib/music-analysis/features";

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

  return match?.genre ?? "Unclassified";
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
  musicFeatures?: Pick<
    MusicFeatures,
    | "bass"
    | "brightness"
    | "danceability"
    | "drums"
    | "dynamics"
    | "aggressiveness"
    | "musicality"
    | "vocals"
  >;
};

export type BeatClassification = {
  primaryGenre: string;
  subgenres: string[];
  mood: string;
  energy: string;
  useCase: string;
  confidence: number | null;
  source: string;
  reasoning: string;
  recommendedPreviewStart: number;
  recommendedPreviewDuration: number;
  previewConfidence: number;
  previewReason: string;
};

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function tempoFit(bpm: number | null, min: number, max: number) {
  if (!bpm) {
    return 0;
  }

  if (bpm >= min && bpm <= max) {
    return 100;
  }

  const distance = bpm < min ? min - bpm : bpm - max;
  return clampNumber(100 - distance * 5, 0, 100);
}

type GenreCandidate = {
  genre: "Hip Hop" | "Electronic" | "R&B" | "Pop";
  score: number;
  independentFamilies: number;
  contradictions: string[];
};

function meanScore(...values: number[]) {
  return average(values.map((value) => clampNumber(value, 0, 100)));
}

function spectralBrightness(input: BeatClassificationInput) {
  const brightness = input.musicFeatures?.brightness;

  if (!brightness) return 0;

  const centroidScore = clampNumber((brightness.spectralCentroid - 1_200) / 18, 0, 100);
  const highFrequencyScore = clampNumber(brightness.highFrequencyRatio * 180, 0, 100);
  return meanScore(centroidScore, highFrequencyScore);
}

function rhythmicEvidence(input: BeatClassificationInput) {
  const features = input.musicFeatures;

  if (!features) return 0;

  return meanScore(
    features.danceability.rhythmicRegularity * 100,
    (features.drums.transientDensity / 0.32) * 100,
  );
}

function bassEvidence(input: BeatClassificationInput) {
  const bass = input.musicFeatures?.bass;

  if (!bass) return 0;

  return meanScore(
    bass.lowFrequencyEnergy * 100,
    (Math.min(bass.subBassPresence, 0.75) / 0.75) * 100,
  );
}

function confidenceForCandidate(
  level: "strong" | "partial",
  score: number,
  margin: number,
  contradictionCount: number,
) {
  if (level === "strong") {
    return Number(clampNumber(0.72 + (score - 78) * 0.006 + (margin - 12) * 0.004, 0.72, 0.84).toFixed(2));
  }

  return Number(clampNumber(0.55 + (score - 68) * 0.004 + (margin - 10) * 0.003 - contradictionCount * 0.08, 0.55, 0.66).toFixed(2));
}

function inferStrictSubgenres(
  genre: GenreCandidate["genre"],
  confidence: number,
  input: BeatClassificationInput,
  bpm: number | null,
) {
  const features = input.musicFeatures;

  if (!features || confidence < 0.76 || !bpm) return [];

  if (
    genre === "Hip Hop" &&
    bpm >= 135 && bpm <= 160 &&
    features.bass.lowFrequencyEnergy >= 0.55 &&
    features.bass.subBassPresence >= 0.55 &&
    features.drums.transientDensity >= 0.2 &&
    features.danceability.rhythmicRegularity >= 0.5 &&
    features.vocals.instrumentalProbability >= 0.65
  ) {
    return ["Trap"];
  }

  if (
    genre === "Hip Hop" &&
    bpm >= 78 && bpm <= 98 &&
    features.drums.transientDensity >= 0.22 &&
    features.drums.transientStrength >= 0.018 &&
    features.brightness.spectralCentroid >= 900 &&
    features.brightness.spectralCentroid <= 3_000 &&
    features.musicality.score >= 70 &&
    features.aggressiveness.score <= 55
  ) {
    return ["Boom Bap"];
  }

  if (
    genre === "Electronic" &&
    confidence >= 0.8 &&
    bpm >= 120 && bpm <= 130 &&
    features.danceability.score >= 82 &&
    features.danceability.rhythmicRegularity >= 0.68 &&
    features.brightness.spectralCentroid >= 1_600
  ) {
    return ["House"];
  }

  return [];
}

function inferGenreFromAudioFeatures(input: BeatClassificationInput, bpm: number | null) {
  const features = input.musicFeatures;

  if (!features) {
    return {
      genre: "Unclassified",
      subgenres: [] as string[],
      confidence: null,
      source: "audio_features_unavailable",
    };
  }

  const rhythm = rhythmicEvidence(input);
  const bass = bassEvidence(input);
  const brightness = spectralBrightness(input);
  const instrumental = features.vocals.instrumentalProbability * 100;
  const vocal = features.vocals.vocalProbability * 100;
  const hipHopTempo = Math.max(tempoFit(bpm, 76, 104), tempoFit(bpm, 132, 160));
  const hipHopContradictions = [
    bpm && bpm >= 76 && bpm <= 104 && features.drums.transientDensity < 0.2
      ? "low_tempo_without_distinct_transients"
      : "",
    bpm && bpm >= 118 && bpm <= 132 && brightness >= 70 && features.danceability.rhythmicRegularity >= 0.68
      ? "electronic_profile_competes"
      : "",
  ].filter(Boolean);
  const candidates = ([
    {
      genre: "Hip Hop",
      score: hipHopTempo * 0.28 + rhythm * 0.28 + bass * 0.24 + features.musicality.score * 0.12 + instrumental * 0.08 - hipHopContradictions.length * 18,
      independentFamilies: [hipHopTempo, rhythm, bass, features.musicality.score].filter((score) => score >= 65).length,
      contradictions: hipHopContradictions,
    },
    {
      genre: "Electronic",
      score: tempoFit(bpm, 118, 132) * 0.32 + rhythm * 0.28 + brightness * 0.22 + features.danceability.score * 0.18,
      independentFamilies: [tempoFit(bpm, 118, 132), rhythm, brightness, features.danceability.score].filter((score) => score >= 70).length,
      contradictions: [brightness < 45 ? "dark_spectrum" : "", rhythm < 60 ? "weak_rhythmic_regularity" : ""].filter(Boolean),
    },
    {
      genre: "R&B",
      score: tempoFit(bpm, 68, 105) * 0.28 + features.musicality.score * 0.26 + vocal * 0.24 + (100 - features.aggressiveness.score) * 0.12 + features.dynamics.score * 0.1,
      independentFamilies: [tempoFit(bpm, 68, 105), features.musicality.score, vocal, 100 - features.aggressiveness.score].filter((score) => score >= 68).length,
      contradictions: [vocal < 38 ? "insufficient_vocal_evidence" : "", features.vocals.confidence < 0.55 ? "low_vocal_detector_confidence" : ""].filter(Boolean),
    },
    {
      genre: "Pop",
      score: tempoFit(bpm, 90, 135) * 0.24 + features.musicality.score * 0.26 + vocal * 0.24 + brightness * 0.16 + features.danceability.score * 0.1,
      independentFamilies: [tempoFit(bpm, 90, 135), features.musicality.score, vocal, brightness].filter((score) => score >= 70).length,
      contradictions: [vocal < 45 ? "insufficient_vocal_evidence" : "", brightness < 55 ? "insufficient_brightness" : "", features.vocals.confidence < 0.55 ? "low_vocal_detector_confidence" : ""].filter(Boolean),
    },
  ] satisfies GenreCandidate[]).sort((first, second) => second.score - first.score);
  const first = candidates[0];
  const second = candidates[1];
  const margin = first.score - second.score;
  const strong = first.score >= 78 && margin >= 12 && first.independentFamilies >= 3 && first.contradictions.length === 0;
  const partial = first.score >= 68 && margin >= 10 && first.independentFamilies >= 2 && first.contradictions.length <= 1;

  if (!strong && !partial) {
    return {
      genre: "Unclassified",
      subgenres: [] as string[],
      confidence: null,
      source: `audio_feature_heuristic_v2_ambiguous:${first.genre.toLowerCase().replaceAll(" ", "_")}:${Math.round(first.score)}:${Math.round(margin)}`,
    };
  }

  const level = strong ? "strong" : "partial";
  const confidence = confidenceForCandidate(level, first.score, margin, first.contradictions.length);

  return {
    genre: first.genre,
    subgenres: inferStrictSubgenres(first.genre, confidence, input, bpm),
    confidence,
    source: `audio_feature_heuristic_v2_${level}:${Math.round(first.score)}:${Math.round(margin)}`,
  };
}

function normalizePreviewDurationByAudioLength(durationSeconds?: number) {
  const safeDuration = Math.round(durationSeconds || 0);

  if (safeDuration >= 90) {
    return 20;
  }

  if (safeDuration >= 45) {
    return 15;
  }

  return 15;
}

function findBestPreviewSegment(waveformSamples: number[] = [], durationSeconds?: number) {
  const safeSamples = waveformSamples.filter((sample) => Number.isFinite(sample));
  const safeDuration = Math.round(durationSeconds || 0);
  const recommendedPreviewDuration = normalizePreviewDurationByAudioLength(safeDuration);

  if (safeSamples.length < 12 || safeDuration <= recommendedPreviewDuration) {
    return {
      recommendedPreviewStart: 0,
      recommendedPreviewDuration,
      previewConfidence: 0.35,
      previewReason: "Audio corto o sin suficientes datos de onda; preview sugerido desde el inicio.",
    };
  }

  const minStartSecond = safeDuration >= 60 ? Math.round(safeDuration * 0.12) : 0;
  const maxStartSecond = Math.max(minStartSecond, safeDuration - recommendedPreviewDuration - 2);
  const windowSampleCount = Math.max(4, Math.round((recommendedPreviewDuration / safeDuration) * safeSamples.length));
  const minStartIndex = Math.round((minStartSecond / safeDuration) * safeSamples.length);
  const maxStartIndex = Math.max(minStartIndex, Math.min(safeSamples.length - windowSampleCount, Math.round((maxStartSecond / safeDuration) * safeSamples.length)));
  const globalAverage = average(safeSamples);
  let bestStartIndex = minStartIndex;
  let bestScore = -Infinity;
  let bestAverage = 0;
  let bestPeakRatio = 0;

  for (let startIndex = minStartIndex; startIndex <= maxStartIndex; startIndex += 1) {
    const window = safeSamples.slice(startIndex, startIndex + windowSampleCount);
    const windowAverage = average(window);
    const peakRatio = window.filter((sample) => sample >= 0.72).length / Math.max(window.length, 1);
    const positionRatio = startIndex / Math.max(safeSamples.length, 1);
    const introPenalty = positionRatio < 0.12 ? 0.18 : 0;
    const outroPenalty = positionRatio > 0.82 ? 0.22 : 0;
    const score = windowAverage + peakRatio * 0.35 - introPenalty - outroPenalty;

    if (score > bestScore) {
      bestScore = score;
      bestStartIndex = startIndex;
      bestAverage = windowAverage;
      bestPeakRatio = peakRatio;
    }
  }

  const recommendedPreviewStart = clampNumber(Math.round((bestStartIndex / safeSamples.length) * safeDuration), 0, maxStartSecond);
  const energyLift = Math.max(0, bestAverage - globalAverage);
  const previewConfidence = clampNumber(0.48 + energyLift * 0.7 + bestPeakRatio * 0.28, 0.45, 0.91);
  const previewReason =
    bestPeakRatio >= 0.2
      ? `Mayor energía detectada cerca de ${recommendedPreviewStart}s con picos consistentes; posible hook/drop.`
      : `Segmento más estable detectado cerca de ${recommendedPreviewStart}s; mejor balance de energía para preview.`;

  return {
    recommendedPreviewStart,
    recommendedPreviewDuration,
    previewConfidence: Number(previewConfidence.toFixed(2)),
    previewReason,
  };
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
  const features = input.musicFeatures;

  if (
    ["dark", "minor", "evil", "night", "drill", "trap"].some((word) => text.includes(word)) ||
    (key.includes("minor") && (features?.aggressiveness.score ?? 0) >= 50)
  ) {
    return "Dark";
  }

  if (["sad", "pain", "melancholy", "emotional"].some((word) => text.includes(word))) {
    return "Emotional";
  }

  if (
    ["club", "party", "dance", "perreo"].some((word) => text.includes(word)) ||
    ["Reggaeton", "Dembow", "House"].includes(primaryGenre) ||
    (features?.danceability.score ?? 0) >= 78
  ) {
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
  const bpm = detectBeatBpm(input);
  const genreSignal = inferGenreFromAudioFeatures(input, bpm);
  const primaryGenre = genreSignal.genre;
  const energyFromWaveform = detectWaveformEnergy(input.waveformSamples ?? []);
  const energy =
    bpm && bpm >= 135 && energyFromWaveform !== "Low Energy"
      ? "High Energy"
      : bpm && bpm <= 85 && energyFromWaveform !== "High Energy"
        ? "Low Energy"
        : energyFromWaveform;

  const mood = detectMood(input, primaryGenre);
  const useCase = detectUseCase(input, mood, energy);
  const previewSuggestion = findBestPreviewSegment(input.waveformSamples, input.durationSeconds);

  const subgenres = genreSignal.subgenres;

  const genreSignals = "BPM, espectro de bajos, ritmo/transientes, danceability, brightness espectral, estimación vocal y musicality";

  return {
    primaryGenre,
    subgenres,
    mood,
    energy,
    useCase,
    confidence: genreSignal.confidence,
    source: genreSignal.source,
    reasoning:
      primaryGenre === "Unclassified"
        ? `B.R detectó BPM, tonalidad, duración, energía y preview desde el audio, pero las features no separan un género con margen suficiente. Fuente: ${genreSignal.source}. Señales de género: ${genreSignals}. Mood ${mood}, energía ${energy}, uso recomendado ${useCase}. ${previewSuggestion.previewReason}`
        : `Clasificación asistida, no modelo ML: ${primaryGenre}${subgenres.length ? ` / ${subgenres.join(", ")}` : ""}, ${mood}, ${energy}. Fuente: ${genreSignal.source}; usa BPM, bass, drums, danceability, aggressiveness, musicality, vocals y brightness. Confianza conservadora ${genreSignal.confidence ?? "sin dato"}. ${previewSuggestion.previewReason}`,
    recommendedPreviewStart: previewSuggestion.recommendedPreviewStart,
    recommendedPreviewDuration: previewSuggestion.recommendedPreviewDuration,
    previewConfidence: previewSuggestion.previewConfidence,
    previewReason: previewSuggestion.previewReason,
  };
}
