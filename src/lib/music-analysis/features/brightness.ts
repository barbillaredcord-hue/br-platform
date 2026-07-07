

import type { BrightnessFeature, FeatureFrame } from "./types";

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function estimateSpectralCentroidFromZcr(zeroCrossingRate: number) {
  return Math.max(0, Math.min(9000, zeroCrossingRate * 22050));
}

export function analyzeBrightness(frames: FeatureFrame[]): BrightnessFeature {
  const centroidValues = frames.map((frame) => estimateSpectralCentroidFromZcr(frame.zeroCrossingRate));
  const spectralCentroid = average(centroidValues);
  const highFrequencyRatio = frames.length
    ? frames.filter((frame) => frame.zeroCrossingRate >= 0.12).length / frames.length
    : 0;

  let score = 65;

  if (spectralCentroid >= 1800 && spectralCentroid <= 5200) score += 25;
  else if (spectralCentroid > 5200 && spectralCentroid <= 7000) score += 12;
  else if (spectralCentroid < 1200) score -= 18;
  else score -= 8;

  if (highFrequencyRatio >= 0.18 && highFrequencyRatio <= 0.55) score += 10;
  else if (highFrequencyRatio > 0.72) score -= 16;
  else score -= 6;

  let label = "Balanced";

  if (score >= 90) label = "Bright";
  else if (score >= 75) label = "Clear";
  else if (score >= 60) label = "Warm";
  else label = "Dark";

  return {
    score: clamp(score),
    confidence: frames.length ? 0.72 : 0.25,
    label,
    details: [
      `Estimated spectral centroid: ${Math.round(spectralCentroid)} Hz`,
      `High-frequency frame ratio: ${Math.round(highFrequencyRatio * 100)}%`,
      "Brightness is estimated from zero-crossing activity until full FFT spectral analysis is added.",
    ],
    spectralCentroid: Math.round(spectralCentroid),
    highFrequencyRatio: Number(highFrequencyRatio.toFixed(2)),
  };
}