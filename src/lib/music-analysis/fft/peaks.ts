

import type { FftFrame, SpectrumPeak } from "./types";

function average(values: number[]) {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function buildAverageMagnitude(frames: FftFrame[]) {
  const firstFrame = frames[0];

  if (!firstFrame) {
    return {
      frequencies: [] as number[],
      magnitudes: [] as number[],
    };
  }

  const magnitudes = firstFrame.magnitudes.map((_, binIndex) =>
    average(frames.map((frame) => frame.magnitudes[binIndex] ?? 0)),
  );

  return {
    frequencies: firstFrame.frequencies,
    magnitudes,
  };
}

export function findSpectrumPeaks(frames: FftFrame[], maxPeaks = 12): SpectrumPeak[] {
  const { frequencies, magnitudes } = buildAverageMagnitude(frames);

  if (!frequencies.length || !magnitudes.length) {
    return [];
  }

  const maxMagnitude = Math.max(...magnitudes, 0.000001);
  const threshold = maxMagnitude * 0.18;
  const peaks: SpectrumPeak[] = [];

  for (let index = 1; index < magnitudes.length - 1; index += 1) {
    const previous = magnitudes[index - 1];
    const current = magnitudes[index];
    const next = magnitudes[index + 1];
    const frequency = frequencies[index];

    if (frequency < 20 || frequency > 20000) {
      continue;
    }

    if (current > threshold && current >= previous && current >= next) {
      peaks.push({
        frequency: Math.round(frequency),
        magnitude: Number(current.toFixed(8)),
        binIndex: index,
      });
    }
  }

  return peaks
    .sort((a, b) => b.magnitude - a.magnitude)
    .slice(0, maxPeaks);
}