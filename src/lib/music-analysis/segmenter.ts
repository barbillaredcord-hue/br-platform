import type { AudioSegment } from "./types";

function calculateRms(frame: Float32Array) {
  let sum = 0;

  for (const sample of frame) {
    sum += sample * sample;
  }

  return Math.sqrt(sum / frame.length);
}

function calculatePeak(frame: Float32Array) {
  let peak = 0;

  for (const sample of frame) {
    peak = Math.max(peak, Math.abs(sample));
  }

  return peak;
}

export function segmentAudio(
  buffer: AudioBuffer,
  secondsPerSegment = 8,
): AudioSegment[] {
  const channel = buffer.getChannelData(0);

  const samplesPerSegment =
    Math.floor(buffer.sampleRate * secondsPerSegment);

  const segments: AudioSegment[] = [];

  let index = 0;

  for (
    let offset = 0;
    offset < channel.length;
    offset += samplesPerSegment
  ) {
    const slice = channel.slice(offset, offset + samplesPerSegment);

    const rms = calculateRms(slice);
    const peak = calculatePeak(slice);

    segments.push({
      index,

      start: offset / buffer.sampleRate,

      end:
        Math.min(offset + samplesPerSegment, channel.length) /
        buffer.sampleRate,

      duration: slice.length / buffer.sampleRate,

      rms,

      peak,

      energy: rms,

      silence: rms < 0.015,
    });

    index++;
  }

  return segments;
}