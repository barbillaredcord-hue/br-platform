
import type { DanceabilityFeature, DrumsFeature, EnergyFeature, FeatureFrame } from "./types";

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function scoreTempoFit(bpm?: number) {
  if (!bpm) {
    return 50;
  }

  if (bpm >= 80 && bpm <= 105) {
    return 92;
  }

  if (bpm >= 120 && bpm <= 150) {
    return 88;
  }

  if (bpm >= 70 && bpm < 80) {
    return 74;
  }

  if (bpm > 150 && bpm <= 180) {
    return 76;
  }

  return 58;
}

function calculateRhythmicRegularity(frames: FeatureFrame[]) {
  if (frames.length < 3) {
    return 0.45;
  }

  const energeticFrames = frames.filter((frame) => frame.energy >= 0.12);
  const activeRatio = energeticFrames.length / frames.length;
  const transientLikeFrames = frames.filter((frame, index) => index > 0 && frame.energy - frames[index - 1].energy > 0.025);
  const transientRatio = transientLikeFrames.length / frames.length;

  return Math.min(1, activeRatio * 0.55 + transientRatio * 0.45);
}

export function analyzeDanceability(
  frames: FeatureFrame[],
  energy: EnergyFeature,
  drums: DrumsFeature,
  bpm?: number,
): DanceabilityFeature {
  const tempoFit = scoreTempoFit(bpm);
  const rhythmicRegularity = calculateRhythmicRegularity(frames);
  const score = clamp(
    tempoFit * 0.36 +
      rhythmicRegularity * 100 * 0.34 +
      drums.score * 0.2 +
      energy.score * 0.1,
  );

  let label = "Moderate";

  if (score >= 86) label = "Very Danceable";
  else if (score >= 72) label = "Danceable";
  else if (score >= 58) label = "Moderate";
  else label = "Low Groove";

  return {
    score,
    confidence: Math.min(0.84, (energy.confidence + drums.confidence) / 2),
    label,
    details: [
      `Tempo fit: ${tempoFit}/100`,
      `Rhythmic regularity: ${Math.round(rhythmicRegularity * 100)}%`,
      `Drum score: ${drums.score}/100`,
    ],
    tempoFit: Number((tempoFit / 100).toFixed(2)),
    rhythmicRegularity: Number(rhythmicRegularity.toFixed(2)),
  };
}