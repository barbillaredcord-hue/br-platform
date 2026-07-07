

import type { StereoFeature } from "./types";

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function calculateCorrelation(left: Float32Array, right: Float32Array) {
  const length = Math.min(left.length, right.length);

  if (!length) {
    return 0;
  }

  let dot = 0;
  let leftPower = 0;
  let rightPower = 0;

  for (let index = 0; index < length; index += 1) {
    dot += left[index] * right[index];
    leftPower += left[index] * left[index];
    rightPower += right[index] * right[index];
  }

  const denominator = Math.sqrt(leftPower * rightPower);

  if (!denominator) {
    return 0;
  }

  return dot / denominator;
}

function calculateStereoWidth(left: Float32Array, right: Float32Array) {
  const length = Math.min(left.length, right.length);

  if (!length) {
    return 0;
  }

  const sideValues: number[] = [];
  const midValues: number[] = [];

  for (let index = 0; index < length; index += 1) {
    const mid = (left[index] + right[index]) / 2;
    const side = (left[index] - right[index]) / 2;

    midValues.push(Math.abs(mid));
    sideValues.push(Math.abs(side));
  }

  const midAverage = average(midValues);
  const sideAverage = average(sideValues);

  if (!midAverage) {
    return 0;
  }

  return Math.min(1, sideAverage / midAverage);
}

export function analyzeStereo(buffer: AudioBuffer): StereoFeature {
  if (buffer.numberOfChannels < 2) {
    return {
      score: 58,
      confidence: 0.9,
      label: "Mono",
      details: ["Audio has one channel; stereo width cannot be evaluated."],
      width: 0,
      correlation: 1,
    };
  }

  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);
  const width = calculateStereoWidth(left, right);
  const correlation = calculateCorrelation(left, right);

  let score = 75;

  if (width >= 0.18 && width <= 0.62) score += 22;
  else if (width > 0.62 && width <= 0.82) score += 8;
  else if (width > 0.82) score -= 14;
  else score -= 12;

  if (correlation >= 0.15 && correlation <= 0.98) score += 8;
  else if (correlation < 0) score -= 22;
  else if (correlation > 0.99) score -= 6;

  let label = "Balanced";

  if (score >= 90) label = "Wide";
  else if (score >= 75) label = "Balanced";
  else if (score >= 60) label = "Narrow";
  else label = "Phase Risk";

  return {
    score: clamp(score),
    confidence: 0.82,
    label,
    details: [
      `Stereo width: ${width.toFixed(2)}`,
      `L/R correlation: ${correlation.toFixed(2)}`,
      correlation < 0 ? "Negative correlation can indicate phase issues." : "Stereo correlation is within a usable range.",
    ],
    width: Number(width.toFixed(2)),
    correlation: Number(correlation.toFixed(2)),
  };
}