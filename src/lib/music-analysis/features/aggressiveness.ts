import type { AggressivenessFeature, BrightnessFeature, DrumsFeature, EnergyFeature } from "./types";

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function analyzeAggressiveness(
  energy: EnergyFeature,
  brightness: BrightnessFeature,
  drums: DrumsFeature,
): AggressivenessFeature {
  const transientImpact = drums.transientDensity * 100;
  const brightnessImpact = brightness.highFrequencyRatio * 100;
  const loudnessImpact = energy.averageRms * 320;

  const score = clamp(
    transientImpact * 0.38 +
      brightnessImpact * 0.28 +
      loudnessImpact * 0.34,
  );

  let label = "Moderate";

  if (score >= 86) label = "Aggressive";
  else if (score >= 70) label = "Energetic";
  else if (score >= 50) label = "Moderate";
  else label = "Soft";

  return {
    score,
    confidence: Math.min(0.85, (energy.confidence + brightness.confidence + drums.confidence) / 3),
    label,
    details: [
      `Transient impact: ${Math.round(transientImpact)}%`,
      `Brightness impact: ${Math.round(brightnessImpact)}%`,
      `Loudness impact: ${Math.round(loudnessImpact)}%`,
    ],
    transientImpact: Number((transientImpact / 100).toFixed(2)),
    brightnessImpact: Number((brightnessImpact / 100).toFixed(2)),
    loudnessImpact: Number((loudnessImpact / 100).toFixed(2)),
  };
}
