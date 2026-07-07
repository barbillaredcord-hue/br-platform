

import type { KeyAnalysisResult } from "../key";
import type { BrightnessFeature, DynamicsFeature, EnergyFeature, MusicalityFeature, StereoFeature } from "./types";

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function keyConfidenceScore(keyAnalysis?: KeyAnalysisResult) {
  if (!keyAnalysis) {
    return 45;
  }

  if (keyAnalysis.reason === "ok") {
    return 92;
  }

  if (keyAnalysis.reason?.includes("ambiguous_key")) {
    return 64;
  }

  if (keyAnalysis.candidates.length) {
    return 72;
  }

  return 42;
}

export function analyzeMusicality(
  energy: EnergyFeature,
  brightness: BrightnessFeature,
  dynamics: DynamicsFeature,
  stereo: StereoFeature,
  keyAnalysis?: KeyAnalysisResult,
): MusicalityFeature {
  const harmonicConfidence = keyConfidenceScore(keyAnalysis);
  const balance = clamp((energy.score + brightness.score + dynamics.score + stereo.score) / 4);
  const stability = clamp(harmonicConfidence * 0.45 + dynamics.score * 0.28 + energy.score * 0.27);
  const score = clamp(harmonicConfidence * 0.35 + balance * 0.35 + stability * 0.3);

  let label = "Developing";

  if (score >= 90) label = "Excellent";
  else if (score >= 78) label = "Strong";
  else if (score >= 64) label = "Solid";

  return {
    score,
    confidence: keyAnalysis?.candidates.length ? 0.72 : 0.45,
    label,
    details: [
      `Harmonic confidence: ${harmonicConfidence}/100`,
      `Overall balance: ${balance}/100`,
      `Musical stability: ${stability}/100`,
    ],
    harmonicConfidence: Number((harmonicConfidence / 100).toFixed(2)),
    balance: Number((balance / 100).toFixed(2)),
    stability: Number((stability / 100).toFixed(2)),
  };
}