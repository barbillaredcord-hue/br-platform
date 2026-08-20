import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import type { BeatClassification } from "../beat-metadata";
import type { MusicFeatures } from "./features";
import type { KeyAnalysisResult } from "./key";
import type { BeatQualityResult } from "./quality";
// @ts-expect-error Node strip-types necesita la extensión explícita.
import { BR_ANALYSIS_VERSION, buildPersistedBeatAnalysis, calculateAnalysisConfidence, decideAnalysisLoad } from "./persistence.ts";

const feature = {
  score: 80,
  confidence: 0.8,
  label: "estable",
  details: [],
};

const musicFeatures = {
  frames: [{ index: 0, start: 0, end: 1, rms: 0.2, peak: 0.8, energy: 0.5, zeroCrossingRate: 0.1 }],
  energy: { ...feature, averageRms: 0.2, peak: 0.8, peakRatio: 0.2 },
  brightness: { ...feature, spectralCentroid: 1200, highFrequencyRatio: 0.2 },
  dynamics: { ...feature, dynamicRange: 0.5, crestFactor: 2 },
  stereo: { ...feature, width: 0.5, correlation: 0.5 },
  bass: { ...feature, lowFrequencyEnergy: 0.5, subBassPresence: 0.5 },
  drums: { ...feature, transientDensity: 0.5, transientStrength: 0.5 },
  vocals: { ...feature, vocalProbability: 0.2, instrumentalProbability: 0.8 },
  danceability: { ...feature, tempoFit: 0.8, rhythmicRegularity: 0.8 },
  aggressiveness: { ...feature, transientImpact: 0.5, brightnessImpact: 0.5, loudnessImpact: 0.5 },
  musicality: { ...feature, harmonicConfidence: 0.8, balance: 0.8, stability: 0.8 },
} as MusicFeatures;

const classification: BeatClassification = {
  primaryGenre: "Unclassified",
  subgenres: [],
  mood: "Neutral",
  energy: "Medium",
  useCase: "General",
  confidence: 0.6,
  source: "audio_feature_heuristic_v2_ambiguous:hip_hop:50:2",
  reasoning: "Señales técnicas disponibles.",
  recommendedPreviewStart: 18,
  recommendedPreviewDuration: 20,
  previewConfidence: 0.7,
  previewReason: "Mayor energía.",
};

const keyAnalysis: KeyAnalysisResult = {
  primary: "C Minor",
  alternatives: ["Eb Major"],
  confidence: 0.5,
  candidates: [{ key: "C Minor", score: 1.2 }],
  reason: "ok",
};

const quality: BeatQualityResult = {
  score: 88,
  grade: "A",
  sections: {
    loudness: 80,
    dynamics: 80,
    peakHealth: 80,
    waveformBalance: 80,
    musicalStability: 80,
    previewQuality: 80,
  },
  strengths: ["Estable"],
  warnings: [],
  recommendations: [],
};

function build(analyzedAt = "2026-08-16T20:00:00.000Z") {
  return buildPersistedBeatAnalysis({
    source: "automatic",
    analyzedAt,
    bpm: 140,
    bpmAlternatives: [70],
    bpmReason: "normalized",
    keyAnalysis,
    classification,
    diagnostics: {
      durationSeconds: 180,
      sampleRate: 44100,
      channels: 2,
      rms: 0.2,
      peak: 0.8,
      dynamicRange: 0.5,
      waveformAverage: 0.5,
      waveformPeakRatio: 0.3,
    },
    musicFeatures,
    quality,
  });
}

test("A: beat sin análisis requiere analizar", () => {
  assert.equal(decideAnalysisLoad(null), "analyze");
});

test("B: versión actual carga persistido", () => {
  assert.equal(decideAnalysisLoad(build()), "load");
});

test("C: versión vieja queda marcada para reproceso", () => {
  assert.equal(decideAnalysisLoad({ ...build(), version: "br-analysis-v0" }), "outdated");
});

test("D: reanálisis actualiza versión, fecha y origen", () => {
  const next = buildPersistedBeatAnalysis({
    ...{
      source: "manual" as const,
      analyzedAt: "2026-08-16T21:00:00.000Z",
      bpm: 140,
      bpmAlternatives: [70],
      bpmReason: "normalized",
      keyAnalysis,
      classification,
      diagnostics: build().features!.diagnostics,
      musicFeatures,
      quality,
    },
  });

  assert.equal(next.version, BR_ANALYSIS_VERSION);
  assert.equal(next.source, "manual");
  assert.equal(next.analyzedAt, "2026-08-16T21:00:00.000Z");
});

test("E: el resultado automático no contiene metadata editorial", () => {
  const manual = { genre: "Trap", previewUrl: "/manual.mp3" };
  const result = build() as unknown as Record<string, unknown>;

  assert.equal("genre" in result, false);
  assert.equal("previewUrl" in result, false);
  assert.deepEqual(manual, { genre: "Trap", previewUrl: "/manual.mp3" });
});

test("F: Quality Score y explicación quedan persistidos", () => {
  const result = build();

  assert.equal(result.qualityScore, 88);
  assert.deepEqual(result.features?.quality, quality);
});

test("G: confidence nula se conserva sin fabricar precisión", () => {
  assert.equal(calculateAnalysisConfidence({}), null);
});

test("H: persistencia usa un UPDATE único y solo publica estado confirmado", () => {
  const analysisSource = readFileSync(
    path.join(process.cwd(), "src/lib/supabase/analysis.ts"),
    "utf8",
  );
  const editorSource = readFileSync(
    path.join(process.cwd(), "src/components/admin/PreviewEditorForm.tsx"),
    "utf8",
  );

  assert.equal((analysisSource.match(/\.update\(payload\)/g) ?? []).length, 1);
  assert.match(editorSource, /if \(!persistenceResult\.ok \|\| !persistenceResult\.analysis\)/);
  assert.match(editorSource, /setPersistedAnalysis\(persistenceResult\.analysis\)/);
});

test("I: recomendación no contiene ni sustituye el preview publicado", () => {
  const result = build();

  assert.deepEqual(result.previewRecommendation, {
    startSecond: 18,
    durationSeconds: 20,
    confidence: 0.7,
    reason: "Mayor energía.",
  });
  assert.equal("previewUrl" in (result as unknown as Record<string, unknown>), false);
});

test("J: un fallo no publica fecha ni resultado parcial en la UI", () => {
  const editorSource = readFileSync(
    path.join(process.cwd(), "src/components/admin/PreviewEditorForm.tsx"),
    "utf8",
  );
  const persistCall = editorSource.indexOf("await persistBeatAnalysisAsAdmin");
  const successGuard = editorSource.indexOf("if (!persistenceResult.ok || !persistenceResult.analysis)", persistCall);
  const publishState = editorSource.indexOf("setPersistedAnalysis(persistenceResult.analysis)", successGuard);

  assert.ok(persistCall >= 0);
  assert.ok(successGuard > persistCall);
  assert.ok(publishState > successGuard);
});

test("K: features extensas y frames no se persisten", () => {
  const result = build();

  assert.equal(result.features?.frameCount, 1);
  assert.equal("frames" in (result.features?.music ?? {}), false);
  assert.equal("fft" in (result.features ?? {}), false);
  assert.equal("chromaFrames" in (result.features ?? {}), false);
});

test("J clasificación: detected genre, subgenres y confidence se persisten", () => {
  const result = buildPersistedBeatAnalysis({
    source: "automatic",
    analyzedAt: "2026-08-18T18:00:00.000Z",
    bpm: 144,
    bpmAlternatives: [72],
    keyAnalysis,
    classification: {
      ...classification,
      primaryGenre: "Hip Hop",
      subgenres: ["Trap"],
      confidence: 0.78,
      source: "audio_feature_heuristic_v2_strong:86:20",
    },
    diagnostics: build().features!.diagnostics,
    musicFeatures,
    quality,
  });

  assert.equal(result.detectedGenre, "Hip Hop");
  assert.deepEqual(result.detectedSubgenres, ["Trap"]);
  assert.equal(result.features?.classification.confidence, 0.78);
});

test("K clasificación: v2 es actual y resultados v1 quedan stale", () => {
  assert.equal(BR_ANALYSIS_VERSION, "br-analysis-v2");
  assert.equal(decideAnalysisLoad(build()), "load");
  assert.equal(decideAnalysisLoad({ ...build(), version: "br-analysis-v1" }), "outdated");
});

test("L clasificación: analyzed_at cambia al reprocesar", () => {
  const previous = build("2026-08-18T18:00:00.000Z");
  const reprocessed = build("2026-08-18T18:05:00.000Z");

  assert.notEqual(reprocessed.analyzedAt, previous.analyzedAt);
});

test("M clasificación: Quality Score no cambia por la corrección", () => {
  assert.equal(build().qualityScore, quality.score);
  assert.deepEqual(build().features?.quality, quality);
});

test("N clasificación: preview recommendation conserva su contrato", () => {
  assert.deepEqual(build().previewRecommendation, {
    startSecond: 18,
    durationSeconds: 20,
    confidence: 0.7,
    reason: "Mayor energía.",
  });
});
