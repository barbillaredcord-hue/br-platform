import type { AudioDiagnostics, AudioSegment } from "./types";

export function calculateAverageEnergy(
  segments: AudioSegment[],
): number {
  if (!segments.length) {
    return 0;
  }

  return (
    segments.reduce(
      (sum, segment) => sum + segment.energy,
      0,
    ) / segments.length
  );
}

export function getLoudSegments(
  segments: AudioSegment[],
): AudioSegment[] {
  return segments.filter(
    (segment) => !segment.silence,
  );
}

export function analyzeAudioDiagnostics(
  buffer: AudioBuffer,
  waveformSamples: number[],
): AudioDiagnostics {
  const channelData = buffer.getChannelData(0);

  let sumSquares = 0;
  let peak = 0;

  for (let index = 0; index < channelData.length; index += 1) {
    const sample = channelData[index];
    const absoluteSample = Math.abs(sample);

    sumSquares += sample * sample;
    peak = Math.max(peak, absoluteSample);
  }

  const rms = Math.sqrt(
    sumSquares / Math.max(channelData.length, 1),
  );

  const waveformAverage = waveformSamples.length
    ? waveformSamples.reduce(
        (sum, sample) => sum + sample,
        0,
      ) / waveformSamples.length
    : 0;

  const waveformPeakRatio = waveformSamples.length
    ? waveformSamples.filter(
        (sample) => sample >= 0.72,
      ).length / waveformSamples.length
    : 0;

  return {
    durationSeconds: Number(buffer.duration.toFixed(2)),
    sampleRate: buffer.sampleRate,
    channels: buffer.numberOfChannels,

    rms: Number(rms.toFixed(3)),
    peak: Number(peak.toFixed(3)),

    dynamicRange: Number((peak - rms).toFixed(3)),

    waveformAverage: Number(
      waveformAverage.toFixed(3),
    ),

    waveformPeakRatio: Number(
      waveformPeakRatio.toFixed(3),
    ),
  };
}