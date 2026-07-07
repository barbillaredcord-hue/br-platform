import { analyzeAudioDiagnostics } from "./diagnostics";
import { segmentAudio } from "./segmenter";
import type { BeatAnalysisResult } from "./types";

export function buildWaveformSamples(buffer: AudioBuffer, sampleCount = 180) {
  const channelData = buffer.getChannelData(0);
  const blockSize = Math.max(1, Math.floor(channelData.length / sampleCount));
  const samples: number[] = [];

  for (let index = 0; index < sampleCount; index += 1) {
    const start = index * blockSize;
    let sum = 0;

    for (let sampleIndex = 0; sampleIndex < blockSize && start + sampleIndex < channelData.length; sampleIndex += 1) {
      sum += Math.abs(channelData[start + sampleIndex]);
    }

    samples.push(Math.min(1, sum / blockSize));
  }

  const maxSample = Math.max(...samples, 0.01);
  return samples.map((sample) => sample / maxSample);
}

export async function analyzeBeat(buffer: AudioBuffer): Promise<BeatAnalysisResult> {
  const waveformSamples = buildWaveformSamples(buffer);
  const diagnostics = analyzeAudioDiagnostics(buffer, waveformSamples);
  const segments = segmentAudio(buffer);

  return {
    duration: buffer.duration,
    diagnostics,
    bpm: 0,
    key: "",
    genre: "",
    subgenres: [],
    mood: "",
    energy: "",
    previewStart: 0,
    previewDuration: 15,
    qualityScore: 0,
    segments: segments.map((segment) => ({ segment })),
  };
}