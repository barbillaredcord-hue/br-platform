import type { PersistedBeatAnalysis } from "@/lib/music-analysis/persistence";
import { resolveBeatId } from "./beat-identifiers";
import { getAuthenticatedAdminBrowserClient } from "./session-client";

type BeatAnalysisRow = {
  analysis_version: string | null;
  analysis_confidence: number | null;
  analyzed_at: string | null;
  analysis_source: PersistedBeatAnalysis["source"] | null;
  analysis_review_status: PersistedBeatAnalysis["reviewStatus"] | null;
  detected_bpm: number | null;
  detected_key: string | null;
  detected_genre: string | null;
  detected_subgenres: string[] | null;
  detected_mood: string | null;
  quality_score: number | null;
  preview_recommendation: PersistedBeatAnalysis["previewRecommendation"];
  analysis_features: PersistedBeatAnalysis["features"];
};

export type ManualBeatMetadata = {
  bpm: number;
  musicalKey: string;
  genre: string;
};

const ANALYSIS_COLUMNS = [
  "analysis_version",
  "analysis_confidence",
  "analyzed_at",
  "analysis_source",
  "analysis_review_status",
  "detected_bpm",
  "detected_key",
  "detected_genre",
  "detected_subgenres",
  "detected_mood",
  "quality_score",
  "preview_recommendation",
  "analysis_features",
].join(",");

function mapAnalysisRow(row: BeatAnalysisRow): PersistedBeatAnalysis | null {
  if (!row.analysis_version || !row.analyzed_at || !row.analysis_source) {
    return null;
  }

  return {
    version: row.analysis_version,
    confidence: row.analysis_confidence,
    analyzedAt: row.analyzed_at,
    source: row.analysis_source,
    reviewStatus: row.analysis_review_status ?? "pending",
    detectedBpm: row.detected_bpm,
    detectedKey: row.detected_key,
    detectedGenre: row.detected_genre,
    detectedSubgenres: row.detected_subgenres ?? [],
    detectedMood: row.detected_mood,
    qualityScore: row.quality_score,
    previewRecommendation: row.preview_recommendation,
    features: row.analysis_features,
  };
}

function toAnalysisPayload(analysis: PersistedBeatAnalysis) {
  return {
    analysis_version: analysis.version,
    analysis_confidence: analysis.confidence,
    analyzed_at: analysis.analyzedAt,
    analysis_source: analysis.source,
    analysis_review_status: analysis.reviewStatus,
    detected_bpm: analysis.detectedBpm,
    detected_key: analysis.detectedKey,
    detected_genre: analysis.detectedGenre,
    detected_subgenres: analysis.detectedSubgenres,
    detected_mood: analysis.detectedMood,
    quality_score: analysis.qualityScore,
    preview_recommendation: analysis.previewRecommendation,
    analysis_features: analysis.features,
  };
}

export async function getBeatAnalysisAsAdmin(beatId: string) {
  const authClient = await getAuthenticatedAdminBrowserClient();

  if (!authClient.supabase || !authClient.isAdmin) {
    return { ok: false as const, message: authClient.message, analysis: null };
  }

  const resolvedBeatId = await resolveBeatId(beatId, authClient.supabase);

  if (!resolvedBeatId) {
    return { ok: false as const, message: "Beat inválido.", analysis: null };
  }

  const { data, error } = await authClient.supabase
    .from("beats")
    .select(ANALYSIS_COLUMNS)
    .eq("id", resolvedBeatId)
    .maybeSingle<BeatAnalysisRow>();

  if (error) {
    return {
      ok: false as const,
      message: "No se pudo cargar el análisis persistido.",
      analysis: null,
    };
  }

  return { ok: true as const, message: "", analysis: data ? mapAnalysisRow(data) : null };
}

export async function persistBeatAnalysisAsAdmin(input: {
  beatId: string;
  analysis: PersistedBeatAnalysis;
  manualMetadata?: ManualBeatMetadata;
}) {
  const authClient = await getAuthenticatedAdminBrowserClient();

  if (!authClient.supabase || !authClient.isAdmin) {
    return { ok: false as const, message: authClient.message, analysis: null };
  }

  const resolvedBeatId = await resolveBeatId(input.beatId, authClient.supabase);

  if (!resolvedBeatId) {
    return { ok: false as const, message: "Beat inválido.", analysis: null };
  }

  const payload: Record<string, unknown> = toAnalysisPayload(input.analysis);

  if (input.manualMetadata) {
    payload.bpm = Math.round(input.manualMetadata.bpm);
    payload.musical_key = input.manualMetadata.musicalKey.trim();
    payload.genre = input.manualMetadata.genre.trim();
  }

  const { data, error } = await authClient.supabase
    .from("beats")
    .update(payload)
    .eq("id", resolvedBeatId)
    .select(`${ANALYSIS_COLUMNS},bpm,musical_key,genre`)
    .maybeSingle<BeatAnalysisRow & {
      bpm: number | null;
      musical_key: string | null;
      genre: string | null;
    }>();

  if (error || !data) {
    return {
      ok: false as const,
      message: "No se pudo guardar el análisis musical.",
      analysis: null,
    };
  }

  return {
    ok: true as const,
    message: "Análisis musical guardado.",
    analysis: mapAnalysisRow(data),
    beat: {
      bpm: data.bpm,
      musical_key: data.musical_key,
      genre: data.genre,
    },
  };
}
