import { getBandEnergy } from "../fft";
import type { FftAnalysisResult } from "../fft";
import type { BassFeature, FeatureFrame } from "./types";

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function estimateLowFrequencyEnergy(frames: FeatureFrame[]) {
  const lowMovementFrames = frames.filter((frame) => frame.zeroCrossingRate < 0.08);
  const lowEnergy = average(lowMovementFrames.map((frame) => frame.energy));
  const totalEnergy = average(frames.map((frame) => frame.energy));

  if (!totalEnergy) {
    return 0;
  }

  return Math.min(1, lowEnergy / totalEnergy);
}

export function analyzeBass(frames: FeatureFrame[], fftAnalysis?: FftAnalysisResult): BassFeature {
  const estimatedLowFrequencyEnergy = estimateLowFrequencyEnergy(frames);
  const estimatedSubBassPresence = frames.length
    ? frames.filter((frame) => frame.energy >= 0.12 && frame.zeroCrossingRate < 0.06).length / frames.length
    : 0;

  const fftSubEnergy = fftAnalysis ? getBandEnergy(fftAnalysis.bands, "sub") : 0;
  const fftBassEnergy = fftAnalysis ? getBandEnergy(fftAnalysis.bands, "bass") : 0;

  const lowFrequencyEnergy = fftAnalysis
    ? Math.min(1, fftSubEnergy * 0.55 + fftBassEnergy * 0.45)
    : estimatedLowFrequencyEnergy;
  const subBassPresence = fftAnalysis ? fftSubEnergy : estimatedSubBassPresence;

  let score = 60;

  if (lowFrequencyEnergy >= 0.55 && lowFrequencyEnergy <= 0.95) score += 28;
  else if (lowFrequencyEnergy >= 0.35) score += 14;
  else score -= 18;

  if (subBassPresence >= 0.18 && subBassPresence <= 0.70) score += 12;
  else if (subBassPresence > 0.82) score -= 10;
  else score -= 6;

  let label = "Balanced";

  if (score >= 90) label = "Strong Bass";
  else if (score >= 75) label = "Good Bass";
  else if (score >= 60) label = "Light Bass";
  else label = "Weak Bass";

  return {
    score: clamp(score),
    confidence: fftAnalysis ? 0.88 : frames.length ? 0.62 : 0.2,
    label,
    details: [
      `${fftAnalysis ? "FFT" : "Estimated"} low-frequency energy: ${Math.round(lowFrequencyEnergy * 100)}%`,
      `${fftAnalysis ? "FFT" : "Estimated"} sub-bass presence: ${Math.round(subBassPresence * 100)}%`,
      fftAnalysis
        ? "Bass uses FFT sub and bass frequency bands."
        : "Bass is estimated from frame energy and low zero-crossing activity until FFT band analysis is provided.",
    ],
    lowFrequencyEnergy: Number(lowFrequencyEnergy.toFixed(2)),
    subBassPresence: Number(subBassPresence.toFixed(2)),
  };
}