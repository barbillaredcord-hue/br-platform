import { getBandEnergy } from "../fft";
import type { FftAnalysisResult } from "../fft";
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

export function analyzeBrightness(frames: FeatureFrame[], fftAnalysis?: FftAnalysisResult): BrightnessFeature {
  const fftCentroid = fftAnalysis?.spectrum.spectralCentroid ?? 0;
  const fftHighEnergy = fftAnalysis
    ? (getBandEnergy(fftAnalysis.bands, "presence") +
        getBandEnergy(fftAnalysis.bands, "brilliance") +
        getBandEnergy(fftAnalysis.bands, "air")) / 3
    : 0;

  const centroidValues = frames.map((frame) => estimateSpectralCentroidFromZcr(frame.zeroCrossingRate));
  const estimatedSpectralCentroid = average(centroidValues);
  const estimatedHighFrequencyRatio = frames.length
    ? frames.filter((frame) => frame.zeroCrossingRate >= 0.12).length / frames.length
    : 0;

  const spectralCentroid = fftCentroid || estimatedSpectralCentroid;
  const highFrequencyRatio = fftAnalysis ? fftHighEnergy : estimatedHighFrequencyRatio;

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
    confidence: fftAnalysis ? 0.88 : frames.length ? 0.72 : 0.25,
    label,
    details: [
      `${fftAnalysis ? "FFT" : "Estimated"} spectral centroid: ${Math.round(spectralCentroid)} Hz`,
      `${fftAnalysis ? "FFT high-band energy" : "High-frequency frame ratio"}: ${Math.round(highFrequencyRatio * 100)}%`,
      fftAnalysis
        ? "Brightness uses FFT spectrum and high-frequency band energy."
        : "Brightness is estimated from zero-crossing activity until FFT spectral analysis is provided.",
    ],
    spectralCentroid: Math.round(spectralCentroid),
    highFrequencyRatio: Number(highFrequencyRatio.toFixed(2)),
  };
}