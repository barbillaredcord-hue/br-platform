

import type { ChromaVector, FftFrame } from "./types";

const CHROMA_NOTES = [
  "C",
  "C#",
  "D",
  "Eb",
  "E",
  "F",
  "F#",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
] as const;

function frequencyToMidi(frequency: number) {
  return 69 + 12 * Math.log2(frequency / 440);
}

function midiToChroma(midi: number) {
  const note = Math.round(midi) % 12;
  return (note + 12) % 12;
}

export function calculateChroma(frames: FftFrame[]): ChromaVector {
  const chroma = new Array<number>(12).fill(0);

  for (const frame of frames) {
    for (let i = 0; i < frame.frequencies.length; i += 1) {
      const frequency = frame.frequencies[i];

      if (frequency < 20 || frequency > 5000) {
        continue;
      }

      const magnitude = frame.powerSpectrum[i] ?? frame.magnitudes[i] ?? 0;
      const chromaIndex = midiToChroma(frequencyToMidi(frequency));
      chroma[chromaIndex] += magnitude;
    }
  }

  const maxValue = Math.max(...chroma, 0.000001);
  const normalized = chroma.map((value) => value / maxValue);

  let dominantIndex = 0;

  for (let i = 1; i < normalized.length; i += 1) {
    if (normalized[i] > normalized[dominantIndex]) {
      dominantIndex = i;
    }
  }

  return {
    notes: [...CHROMA_NOTES],
    values: normalized.map((value) => Number(value.toFixed(3))),
    dominantNote: CHROMA_NOTES[dominantIndex],
    confidence: Number(normalized[dominantIndex].toFixed(3)),
  };
}