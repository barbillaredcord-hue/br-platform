

import type { FftFrame, SpectrumSummary } from "./types";

function average(values: number[]) {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function calculateFrameCentroid(frame: FftFrame) {
  let weightedSum = 0;
  let magnitudeSum = 0;

  for (let index = 0; index < frame.frequencies.length; index += 1) {
    const frequency = frame.frequencies[index];
    const magnitude = frame.magnitudes[index] ?? 0;

    weightedSum += frequency * magnitude;
    magnitudeSum += magnitude;
  }

  return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
}

function calculateFrameRolloff(frame: FftFrame, threshold = 0.85) {
  const totalEnergy = frame.powerSpectrum.reduce((sum, value) => sum + value, 0);

  if (!totalEnergy) {
    return 0;
  }

  let cumulativeEnergy = 0;

  for (let index = 0; index < frame.powerSpectrum.length; index += 1) {
    cumulativeEnergy += frame.powerSpectrum[index];

    if (cumulativeEnergy >= totalEnergy * threshold) {
      return frame.frequencies[index] ?? 0;
    }
  }

  return frame.frequencies.at(-1) ?? 0;
}

function calculateFrameFlatness(frame: FftFrame) {
  const powers = frame.powerSpectrum.filter((value) => value > 0);

  if (!powers.length) {
    return 0;
  }

  const geometricMean = Math.exp(
    powers.reduce((sum, value) => sum + Math.log(value), 0) / powers.length,
  );
  const arithmeticMean = average(powers);

  return arithmeticMean > 0 ? geometricMean / arithmeticMean : 0;
}

function calculateFrameBandwidth(frame: FftFrame, centroid: number) {
  let weightedVariance = 0;
  let magnitudeSum = 0;

  for (let index = 0; index < frame.frequencies.length; index += 1) {
    const frequency = frame.frequencies[index];
    const magnitude = frame.magnitudes[index] ?? 0;
    const distance = frequency - centroid;

    weightedVariance += distance * distance * magnitude;
    magnitudeSum += magnitude;
  }

  return magnitudeSum > 0 ? Math.sqrt(weightedVariance / magnitudeSum) : 0;
}

function calculateFrameFlux(current: FftFrame, previous?: FftFrame) {
  if (!previous) {
    return 0;
  }

  const length = Math.min(current.magnitudes.length, previous.magnitudes.length);
  let sum = 0;

  for (let index = 0; index < length; index += 1) {
    const delta = (current.magnitudes[index] ?? 0) - (previous.magnitudes[index] ?? 0);
    sum += Math.max(0, delta);
  }

  return length > 0 ? sum / length : 0;
}

export function summarizeSpectrum(frames: FftFrame[]): SpectrumSummary {
  if (!frames.length) {
    return {
      spectralCentroid: 0,
      spectralRolloff: 0,
      spectralFlatness: 0,
      spectralBandwidth: 0,
      spectralFlux: 0,
    };
  }

  const centroids = frames.map(calculateFrameCentroid);
  const rolloffs = frames.map((frame) => calculateFrameRolloff(frame));
  const flatnessValues = frames.map(calculateFrameFlatness);
  const bandwidths = frames.map((frame, index) => calculateFrameBandwidth(frame, centroids[index] ?? 0));
  const fluxValues = frames.map((frame, index) => calculateFrameFlux(frame, frames[index - 1]));

  return {
    spectralCentroid: Math.round(average(centroids)),
    spectralRolloff: Math.round(average(rolloffs)),
    spectralFlatness: Number(average(flatnessValues).toFixed(4)),
    spectralBandwidth: Math.round(average(bandwidths)),
    spectralFlux: Number(average(fluxValues).toFixed(8)),
  };
}