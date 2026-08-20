import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node strip-types necesita la extensión explícita.
import { classifyBeatFromRealData } from "./beat-metadata.ts";

type ClassificationInput = Parameters<typeof classifyBeatFromRealData>[0];

function audioFeatures(overrides: Record<string, Record<string, unknown>> = {}) {
  const base = {
    bass: { score: 60, confidence: 0.88, lowFrequencyEnergy: 0.4, subBassPresence: 0.3 },
    brightness: { score: 65, confidence: 0.88, spectralCentroid: 1_800, highFrequencyRatio: 0.2 },
    danceability: { score: 68, confidence: 0.76, tempoFit: 0.8, rhythmicRegularity: 0.5 },
    drums: { score: 70, confidence: 0.66, transientDensity: 0.18, transientStrength: 0.02 },
    dynamics: { score: 75, confidence: 0.88, dynamicRange: 0.6, crestFactor: 3 },
    aggressiveness: { score: 40, confidence: 0.8, transientImpact: 0.2, brightnessImpact: 0.2, loudnessImpact: 0.4 },
    musicality: { score: 72, confidence: 0.72, harmonicConfidence: 0.68, balance: 0.72, stability: 0.72 },
    vocals: { score: 80, confidence: 0.48, vocalProbability: 0.2, instrumentalProbability: 0.8 },
  };

  return Object.fromEntries(
    Object.entries(base).map(([name, value]) => [name, { ...value, ...overrides[name] }]),
  ) as ClassificationInput["musicFeatures"];
}

function classify(input: Partial<ClassificationInput> = {}) {
  return classifyBeatFromRealData({
    currentBpm: 144,
    durationSeconds: 180,
    waveformSamples: Array.from({ length: 40 }, (_, index) => 0.25 + (index % 5) * 0.1),
    musicFeatures: audioFeatures(),
    ...input,
  });
}

const strongHipHopFeatures = audioFeatures({
  bass: { score: 82, lowFrequencyEnergy: 0.68, subBassPresence: 0.8 },
  brightness: { score: 48, spectralCentroid: 1_400, highFrequencyRatio: 0.1 },
  danceability: { score: 78, rhythmicRegularity: 0.7 },
  drums: { score: 90, transientDensity: 0.3, transientStrength: 0.035 },
  musicality: { score: 80 },
  vocals: { vocalProbability: 0.15, instrumentalProbability: 0.85 },
});

test("A/I: señales ambiguas usan Unclassified y subgenres vacío", () => {
  const result = classify({
    currentBpm: null,
    musicFeatures: audioFeatures({
      bass: { score: 50, lowFrequencyEnergy: 0.3, subBassPresence: 0.2 },
      brightness: { score: 50, spectralCentroid: 1_300, highFrequencyRatio: 0.08 },
      danceability: { score: 50, rhythmicRegularity: 0.35 },
      drums: { score: 50, transientDensity: 0.08, transientStrength: 0.008 },
      dynamics: { score: 50 },
      aggressiveness: { score: 50 },
      musicality: { score: 50 },
      vocals: { vocalProbability: 0.5, instrumentalProbability: 0.5 },
    }),
  });

  assert.equal(result.primaryGenre, "Unclassified");
  assert.deepEqual(result.subgenres, []);
  assert.equal(result.confidence, null);
});

test("B/C: evidencia parcial produce categoría amplia con confidence limitada", () => {
  const result = classify({
    musicFeatures: audioFeatures({
      bass: { score: 70, lowFrequencyEnergy: 0.55, subBassPresence: 0.5 },
      brightness: { score: 45, spectralCentroid: 1_250, highFrequencyRatio: 0.05 },
      danceability: { score: 62, rhythmicRegularity: 0.48 },
      drums: { score: 62, transientDensity: 0.18, transientStrength: 0.015 },
      musicality: { score: 66 },
      vocals: { vocalProbability: 0.25, instrumentalProbability: 0.75 },
    }),
  });

  assert.equal(result.primaryGenre, "Hip Hop");
  assert.ok(result.confidence !== null && result.confidence >= 0.55 && result.confidence <= 0.66);
  assert.deepEqual(result.subgenres, []);
  assert.match(result.source, /_partial:/);
});

test("C: evidencia fuerte produce género amplio y subgénero solo con gate estricto", () => {
  const result = classify({ musicFeatures: strongHipHopFeatures });

  assert.equal(result.primaryGenre, "Hip Hop");
  assert.deepEqual(result.subgenres, ["Trap"]);
  assert.ok(result.confidence !== null && result.confidence >= 0.72);
  assert.match(result.source, /_strong:/);
});

test("D: candidatos cercanos no producen clasificación fuerte", () => {
  const result = classify({
    currentBpm: 128,
    musicFeatures: audioFeatures({
      bass: { score: 72, lowFrequencyEnergy: 0.55, subBassPresence: 0.55 },
      brightness: { score: 78, spectralCentroid: 2_500, highFrequencyRatio: 0.35 },
      danceability: { score: 85, rhythmicRegularity: 0.7 },
      drums: { score: 82, transientDensity: 0.24, transientStrength: 0.025 },
      musicality: { score: 75 },
      vocals: { vocalProbability: 0.3, instrumentalProbability: 0.7 },
    }),
  });

  assert.equal(result.primaryGenre, "Unclassified");
  assert.equal(result.confidence, null);
});

test("E: evidencia contradictoria reduce una inferencia hip hop a Unclassified", () => {
  const result = classify({
    currentBpm: 100,
    musicFeatures: audioFeatures({
      bass: { score: 78, lowFrequencyEnergy: 0.73, subBassPresence: 1 },
      brightness: { score: 41, spectralCentroid: 1_089, highFrequencyRatio: 0 },
      danceability: { score: 82, rhythmicRegularity: 0.58 },
      drums: { score: 100, transientDensity: 0.17, transientStrength: 0.02 },
      musicality: { score: 72 },
      vocals: { vocalProbability: 0.11, instrumentalProbability: 0.89 },
    }),
  });

  assert.equal(result.primaryGenre, "Unclassified");
  assert.equal(result.confidence, null);
  assert.match(result.source, /_ambiguous:/);
});

test("F: genre manual nunca alimenta ni es sobrescrito por autoanálisis", () => {
  const withoutManual = classify({ musicFeatures: strongHipHopFeatures });
  const withManual = classify({ currentGenre: "Jazz manual", musicFeatures: strongHipHopFeatures });

  assert.equal(withManual.primaryGenre, withoutManual.primaryGenre);
  assert.equal(withManual.confidence, withoutManual.confidence);
  assert.equal(withManual.subgenres.join(","), withoutManual.subgenres.join(","));
});

test("G/H: reproceso puede cambiar detected genre y elimina subgénero ambiguo", () => {
  const first = classify({ musicFeatures: strongHipHopFeatures });
  const manualGenre = "Trap editorial";
  const reprocessed = classify({
    currentGenre: manualGenre,
    currentBpm: null,
    musicFeatures: audioFeatures({
      bass: { lowFrequencyEnergy: 0.2, subBassPresence: 0.1 },
      brightness: { spectralCentroid: 1_200, highFrequencyRatio: 0.02 },
      danceability: { rhythmicRegularity: 0.2 },
      drums: { transientDensity: 0.05, transientStrength: 0.004 },
      musicality: { score: 45 },
    }),
  });

  assert.equal(first.primaryGenre, "Hip Hop");
  assert.equal(reprocessed.primaryGenre, "Unclassified");
  assert.deepEqual(reprocessed.subgenres, []);
  assert.equal(manualGenre, "Trap editorial");
});
