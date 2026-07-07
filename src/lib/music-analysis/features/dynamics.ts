

import type { AudioDiagnostics } from "../types";
import type { DynamicsFeature, FeatureFrame } from "./types";

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function analyzeDynamics(
  diagnostics: AudioDiagnostics,
  frames: FeatureFrame[],
): DynamicsFeature {
  const rmsValues = frames.map((frame) => frame.rms);
  const averageRms = average(rmsValues);
  const crestFactor = averageRms > 0 ? diagnostics.peak / averageRms : 0;

  let score = 100;

  if (diagnostics.dynamicRange < 0.30) score -= 25;
  else if (diagnostics.dynamicRange < 0.45) score -= 10;
  else if (diagnostics.dynamicRange > 0.85) score -= 8;

  if (crestFactor < 1.4) score -= 12;
  else if (crestFactor > 3.2) score -= 10;

  let label = "Balanced";

  if (score >= 90) label = "Excellent";
  else if (score >= 75) label = "Natural";
  else if (score >= 60) label = "Compressed";
  else label = "Flat";

  return {
    score: clamp(score),
    confidence: frames.length ? 0.88 : 0.4,
    label,
    details: [
      `Dynamic range: ${diagnostics.dynamicRange.toFixed(3)}`,
      `Estimated crest factor: ${crestFactor.toFixed(2)}`,
      `Average frame RMS: ${averageRms.toFixed(3)}`,
    ],
    dynamicRange: Number(diagnostics.dynamicRange.toFixed(3)),
    crestFactor: Number(crestFactor.toFixed(2)),
  };
}