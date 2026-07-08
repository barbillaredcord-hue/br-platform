

import type { FftFrame, HarmonicSummary, SpectrumPeak } from "./types";

function average(values: number[]) {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function findStrongestPeak(frames: FftFrame[]) {
  let strongest: SpectrumPeak = {
    frequency: 0,
    magnitude: 0,
    binIndex: 0,
  };

  for (const frame of frames) {
    for (let index = 1; index < frame.magnitudes.length; index += 1) {
      const frequency = frame.frequencies[index];

      if (frequency < 40 || frequency > 1200) {
        continue;
      }

      const magnitude = frame.magnitudes[index] ?? 0;

      if (magnitude > strongest.magnitude) {
        strongest = {
          frequency,
          magnitude,
          binIndex: index,
        };
      }
    }
  }

  return strongest;
}

function nearestBin(frame: FftFrame, frequency: number) {
  let bestIndex = 0;
  let bestDistance = Infinity;

  for (let index = 0; index < frame.frequencies.length; index += 1) {
    const distance = Math.abs(frame.frequencies[index] - frequency);

    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  }

  return bestIndex;
}

export function analyzeHarmonics(frames: FftFrame[]): HarmonicSummary {
  if (!frames.length) {
    return {
      fundamentalFrequency: 0,
      harmonicRatio: 0,
      inharmonicity: 0,
      richness: 0,
    };
  }

  const strongestPeak = findStrongestPeak(frames);
  const fundamentalFrequency = strongestPeak.frequency;

  if (!fundamentalFrequency) {
    return {
      fundamentalFrequency: 0,
      harmonicRatio: 0,
      inharmonicity: 0,
      richness: 0,
    };
  }

  const harmonicRatios: number[] = [];
  const inharmonicityValues: number[] = [];
  const richnessValues: number[] = [];

  for (const frame of frames) {
    const fundamentalBin = nearestBin(frame, fundamentalFrequency);
    const fundamentalPower = frame.powerSpectrum[fundamentalBin] ?? 0;
    let harmonicPower = 0;
    let detectedHarmonics = 0;
    let expectedHarmonics = 0;

    for (let harmonic = 2; harmonic <= 8; harmonic += 1) {
      const harmonicFrequency = fundamentalFrequency * harmonic;

      if (harmonicFrequency >= frame.sampleRate / 2) {
        continue;
      }

      expectedHarmonics += 1;
      const harmonicBin = nearestBin(frame, harmonicFrequency);
      const power = frame.powerSpectrum[harmonicBin] ?? 0;
      harmonicPower += power;

      if (power > fundamentalPower * 0.08) {
        detectedHarmonics += 1;
      }

      const actualFrequency = frame.frequencies[harmonicBin];
      const deviation = Math.abs(actualFrequency - harmonicFrequency) / Math.max(harmonicFrequency, 1);
      inharmonicityValues.push(deviation);
    }

    const totalPower = fundamentalPower + harmonicPower;

    if (totalPower > 0) {
      harmonicRatios.push(harmonicPower / totalPower);
    }

    if (expectedHarmonics > 0) {
      richnessValues.push(detectedHarmonics / expectedHarmonics);
    }
  }

  const harmonicRatio = average(harmonicRatios);
  const inharmonicity = average(inharmonicityValues);
  const richness = average(richnessValues);

  return {
    fundamentalFrequency: Math.round(fundamentalFrequency),
    harmonicRatio: Number(harmonicRatio.toFixed(3)),
    inharmonicity: Number(inharmonicity.toFixed(4)),
    richness: Number(richness.toFixed(3)),
  };
}