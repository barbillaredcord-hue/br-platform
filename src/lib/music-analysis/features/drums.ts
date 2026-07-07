

import type { DrumsFeature, FeatureFrame } from "./types";

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function calculateTransientStrength(frames: FeatureFrame[]) {
  if (frames.length < 2) {
    return 0;
  }

  const deltas: number[] = [];

  for (let index = 1; index < frames.length; index += 1) {
    deltas.push(Math.max(0, frames[index].energy - frames[index - 1].energy));
  }

  return average(deltas);
}

export function analyzeDrums(frames: FeatureFrame[]): DrumsFeature {
  const transientStrength = calculateTransientStrength(frames);
  const transientDensity = frames.length
    ? frames.filter((frame, index) => index > 0 && frame.energy - frames[index - 1].energy > 0.035).length / frames.length
    : 0;

  let score = 62;

  if (transientDensity >= 0.16 && transientDensity <= 0.52) score += 24;
  else if (transientDensity > 0.52 && transientDensity <= 0.72) score += 10;
  else score -= 10;

  if (transientStrength >= 0.012 && transientStrength <= 0.09) score += 14;
  else if (transientStrength > 0.12) score -= 10;
  else score -= 6;

  let label = "Moderate";

  if (score >= 90) label = "Punchy";
  else if (score >= 75) label = "Tight";
  else if (score >= 60) label = "Moderate";
  else label = "Soft";

  return {
    score: clamp(score),
    confidence: frames.length >= 8 ? 0.66 : 0.25,
    label,
    details: [
      `Transient density: ${Math.round(transientDensity * 100)}%`,
      `Transient strength: ${transientStrength.toFixed(3)}`,
      "Drum activity is estimated from frame energy changes until full transient detection is added.",
    ],
    transientDensity: Number(transientDensity.toFixed(2)),
    transientStrength: Number(transientStrength.toFixed(3)),
  };
}