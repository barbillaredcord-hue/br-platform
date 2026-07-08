

export * from "./types";
export * from "./window";
export * from "./fft";
export * from "./bands";
export * from "./spectrum";
export * from "./peaks";
export * from "./transients";
export * from "./harmonics";
export * from "./chroma";

import { calculateFrequencyBands } from "./bands";
import { calculateChroma } from "./chroma";
import { buildFftFrames } from "./fft";
import { analyzeHarmonics } from "./harmonics";
import { findSpectrumPeaks } from "./peaks";
import { summarizeSpectrum } from "./spectrum";
import { detectTransients } from "./transients";
import type { FftAnalysisResult, FftWindowType } from "./types";

export function analyzeSpectrum(input: {
  buffer: AudioBuffer;
  fftSize?: number;
  hopSize?: number;
  windowType?: FftWindowType;
  maxFrames?: number;
}): FftAnalysisResult {
  const fftSize = input.fftSize ?? 2048;
  const hopSize = input.hopSize ?? fftSize;
  const windowType = input.windowType ?? "hann";

  const frames = buildFftFrames({
    buffer: input.buffer,
    fftSize,
    hopSize,
    windowType,
    maxFrames: input.maxFrames,
  });

  return {
    sampleRate: input.buffer.sampleRate,
    fftSize,
    hopSize,
    windowType,
    frames,
    bands: calculateFrequencyBands(frames),
    spectrum: summarizeSpectrum(frames),
    peaks: findSpectrumPeaks(frames),
    chroma: calculateChroma(frames),
    transients: detectTransients(frames),
    harmonics: analyzeHarmonics(frames),
  };
}