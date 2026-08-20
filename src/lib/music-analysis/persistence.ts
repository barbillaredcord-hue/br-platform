import type { BeatClassification } from "@/lib/beat-metadata";
import type { MusicFeatures } from "./features";
import type { KeyAnalysisResult } from "./key";
import type { BeatQualityResult } from "./quality";
import type { AudioDiagnostics } from "./types";

export const BR_ANALYSIS_VERSION = "br-analysis-v2";

export type BeatAnalysisSource = "automatic" | "manual";
export type BeatAnalysisReviewStatus = "pending" | "reviewed";

export type PreviewRecommendation = {
  startSecond: number;
  durationSeconds: number;
  confidence: number | null;
  reason: string;
};

export type CompactAnalysisFeatures = {
  frameCount: number;
  diagnostics: AudioDiagnostics;
  bpm: {
    alternatives: number[];
    reason: string | null;
  };
  key: {
    alternatives: string[];
    confidence: number | null;
    candidates: KeyAnalysisResult["candidates"];
    reason: string | null;
  };
  classification: {
    energy: string;
    useCase: string;
    source: string;
    reasoning: string;
    confidence: number | null;
  };
  music: Omit<MusicFeatures, "frames">;
  quality: BeatQualityResult;
};

export type PersistedBeatAnalysis = {
  version: string;
  confidence: number | null;
  analyzedAt: string;
  source: BeatAnalysisSource;
  reviewStatus: BeatAnalysisReviewStatus;
  detectedBpm: number | null;
  detectedKey: string | null;
  detectedGenre: string | null;
  detectedSubgenres: string[];
  detectedMood: string | null;
  qualityScore: number | null;
  previewRecommendation: PreviewRecommendation | null;
  features: CompactAnalysisFeatures | null;
};

export type BuildPersistedBeatAnalysisInput = {
  source: BeatAnalysisSource;
  analyzedAt: string;
  bpm: number | null;
  bpmAlternatives: number[];
  bpmReason?: string;
  keyAnalysis: KeyAnalysisResult;
  classification: BeatClassification;
  diagnostics: AudioDiagnostics;
  musicFeatures: MusicFeatures;
  quality: BeatQualityResult;
};

function boundedConfidence(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  return Math.min(1, Math.max(0, value));
}

export function calculateAnalysisConfidence(input: {
  classificationConfidence?: number | null;
  keyConfidence?: number | null;
  previewConfidence?: number | null;
  featureConfidences?: Array<number | null | undefined>;
}) {
  const featureValues = (input.featureConfidences ?? [])
    .map(boundedConfidence)
    .filter((value): value is number => value !== null);
  const featureConfidence = featureValues.length
    ? featureValues.reduce((sum, value) => sum + value, 0) / featureValues.length
    : null;
  const signals = [
    boundedConfidence(input.classificationConfidence),
    boundedConfidence(input.keyConfidence),
    boundedConfidence(input.previewConfidence),
    featureConfidence,
  ].filter((value): value is number => value !== null);

  if (!signals.length) {
    return null;
  }

  return Number(
    (signals.reduce((sum, value) => sum + value, 0) / signals.length).toFixed(4),
  );
}

export function buildPersistedBeatAnalysis(
  input: BuildPersistedBeatAnalysisInput,
): PersistedBeatAnalysis {
  const compactMusicFeatures: Omit<MusicFeatures, "frames"> = {
    energy: input.musicFeatures.energy,
    brightness: input.musicFeatures.brightness,
    dynamics: input.musicFeatures.dynamics,
    stereo: input.musicFeatures.stereo,
    bass: input.musicFeatures.bass,
    drums: input.musicFeatures.drums,
    vocals: input.musicFeatures.vocals,
    danceability: input.musicFeatures.danceability,
    aggressiveness: input.musicFeatures.aggressiveness,
    musicality: input.musicFeatures.musicality,
  };
  const featureConfidences = Object.values(compactMusicFeatures).map(
    (feature) => feature.confidence,
  );
  const previewRecommendation: PreviewRecommendation = {
    startSecond: Math.max(0, Math.round(input.classification.recommendedPreviewStart)),
    durationSeconds: Math.max(
      1,
      Math.round(input.classification.recommendedPreviewDuration),
    ),
    confidence: boundedConfidence(input.classification.previewConfidence),
    reason: input.classification.previewReason,
  };

  return {
    version: BR_ANALYSIS_VERSION,
    confidence: calculateAnalysisConfidence({
      classificationConfidence: input.classification.confidence,
      keyConfidence: input.keyAnalysis.confidence,
      previewConfidence: input.classification.previewConfidence,
      featureConfidences,
    }),
    analyzedAt: input.analyzedAt,
    source: input.source,
    reviewStatus: "pending",
    detectedBpm:
      input.bpm && input.bpm >= 40 && input.bpm <= 240
        ? Math.round(input.bpm)
        : null,
    detectedKey: input.keyAnalysis.primary.trim() || null,
    detectedGenre: input.classification.primaryGenre.trim() || null,
    detectedSubgenres: input.classification.subgenres,
    detectedMood: input.classification.mood.trim() || null,
    qualityScore: Number.isFinite(input.quality.score)
      ? Math.min(100, Math.max(0, Math.round(input.quality.score)))
      : null,
    previewRecommendation,
    features: {
      frameCount: input.musicFeatures.frames.length,
      diagnostics: input.diagnostics,
      bpm: {
        alternatives: input.bpmAlternatives,
        reason: input.bpmReason?.trim() || null,
      },
      key: {
        alternatives: input.keyAnalysis.alternatives,
        confidence: boundedConfidence(input.keyAnalysis.confidence),
        candidates: input.keyAnalysis.candidates.slice(0, 8),
        reason: input.keyAnalysis.reason?.trim() || null,
      },
      classification: {
        energy: input.classification.energy,
        useCase: input.classification.useCase,
        source: input.classification.source,
        reasoning: input.classification.reasoning,
        confidence: boundedConfidence(input.classification.confidence),
      },
      music: compactMusicFeatures,
      quality: input.quality,
    },
  };
}

export type AnalysisLoadDecision = "analyze" | "load" | "outdated";

export function decideAnalysisLoad(
  analysis: PersistedBeatAnalysis | null,
): AnalysisLoadDecision {
  if (!analysis?.analyzedAt || !analysis.features) {
    return "analyze";
  }

  return analysis.version === BR_ANALYSIS_VERSION ? "load" : "outdated";
}

export function withReviewedStatus(
  analysis: PersistedBeatAnalysis,
): PersistedBeatAnalysis {
  return { ...analysis, reviewStatus: "reviewed" };
}
