

import type { BrightnessFeature, FeatureFrame, VocalsFeature } from "./types";

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function analyzeVocals(
  frames: FeatureFrame[],
  brightness: BrightnessFeature,
): VocalsFeature {
  const midActivity = frames.length
    ? frames.filter(
        (frame) =>
          frame.zeroCrossingRate >= 0.06 &&
          frame.zeroCrossingRate <= 0.18 &&
          frame.energy >= 0.08,
      ).length / frames.length
    : 0;

  const averageEnergy = average(frames.map((frame) => frame.energy));

  const vocalProbability = Math.min(
    1,
    midActivity * 0.55 +
      Math.min(1, averageEnergy * 2.2) * 0.25 +
      brightness.highFrequencyRatio * 0.2,
  );

  const instrumentalProbability = Math.max(0, 1 - vocalProbability);

  const score = clamp(instrumentalProbability * 100);

  let label = "Instrumental";

  if (vocalProbability >= 0.72) label = "Likely Vocal";
  else if (vocalProbability >= 0.42) label = "Possible Vocal";
  else if (vocalProbability >= 0.22) label = "Mostly Instrumental";

  return {
    score,
    confidence: frames.length ? 0.48 : 0.18,
    label,
    details: [
      `Estimated vocal probability: ${Math.round(vocalProbability * 100)}%`,
      `Estimated instrumental probability: ${Math.round(instrumentalProbability * 100)}%`,
      "Vocal probability is heuristic until vocal separation or ML detection is added.",
    ],
    vocalProbability: Number(vocalProbability.toFixed(2)),
    instrumentalProbability: Number(instrumentalProbability.toFixed(2)),
  };
}