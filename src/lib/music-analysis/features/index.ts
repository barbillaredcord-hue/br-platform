import type { KeyAnalysisResult } from "../key";
import type { AudioDiagnostics } from "../types";
import { analyzeAggressiveness } from "./aggressiveness";
import { analyzeBass } from "./bass";
import { analyzeBrightness } from "./brightness";
import { analyzeDanceability } from "./danceability";
import { analyzeDrums } from "./drums";
import { analyzeDynamics } from "./dynamics";
import { analyzeEnergy } from "./energy";
import { analyzeMusicality } from "./musicality";
import { analyzeStereo } from "./stereo";
import { analyzeVocals } from "./vocals";
import type { FeatureFrame, MusicFeatures } from "./types";

function calculateRms(frame: Float32Array) {
  if (!frame.length) return 0;

  let sum = 0;

  for (let index = 0; index < frame.length; index += 1) {
    sum += frame[index] * frame[index];
  }

  return Math.sqrt(sum / frame.length);
}

function calculatePeak(frame: Float32Array) {
  let peak = 0;

  for (let index = 0; index < frame.length; index += 1) {
    peak = Math.max(peak, Math.abs(frame[index]));
  }

  return peak;
}

function calculateZeroCrossingRate(frame: Float32Array) {
  if (frame.length < 2) return 0;

  let crossings = 0;

  for (let index = 1; index < frame.length; index += 1) {
    const previous = frame[index - 1];
    const current = frame[index];

    if (
      (previous >= 0 && current < 0) ||
      (previous < 0 && current >= 0)
    ) {
      crossings += 1;
    }
  }

  return crossings / (frame.length - 1);
}

export function buildFeatureFrames(
  buffer: AudioBuffer,
  secondsPerFrame = 2,
): FeatureFrame[] {
  const channelData = buffer.getChannelData(0);
  const samplesPerFrame = Math.max(
    1,
    Math.floor(buffer.sampleRate * secondsPerFrame),
  );

  const frames: FeatureFrame[] = [];

  let index = 0;

  for (
    let offset = 0;
    offset < channelData.length;
    offset += samplesPerFrame
  ) {
    const frame = channelData.slice(
      offset,
      offset + samplesPerFrame,
    );

    const start = offset / buffer.sampleRate;
    const end =
      Math.min(offset + samplesPerFrame, channelData.length) /
      buffer.sampleRate;

    const rms = calculateRms(frame);
    const peak = calculatePeak(frame);
    const zeroCrossingRate = calculateZeroCrossingRate(frame);

    frames.push({
      index,
      start: Number(start.toFixed(2)),
      end: Number(end.toFixed(2)),
      rms: Number(rms.toFixed(3)),
      peak: Number(peak.toFixed(3)),
      energy: Number(rms.toFixed(3)),
      zeroCrossingRate: Number(zeroCrossingRate.toFixed(4)),
    });

    index += 1;
  }

  return frames;
}

export function analyzeMusicFeatures(input: {
  buffer: AudioBuffer;
  diagnostics: AudioDiagnostics;
  bpm?: number;
  keyAnalysis?: KeyAnalysisResult;
}): MusicFeatures {
  const frames = buildFeatureFrames(input.buffer);

  const energy = analyzeEnergy(input.diagnostics, frames);
  const brightness = analyzeBrightness(frames);
  const dynamics = analyzeDynamics(input.diagnostics, frames);
  const stereo = analyzeStereo(input.buffer);
  const bass = analyzeBass(frames);
  const drums = analyzeDrums(frames);
  const vocals = analyzeVocals(frames, brightness);
  const danceability = analyzeDanceability(
    frames,
    energy,
    drums,
    input.bpm,
  );
  const aggressiveness = analyzeAggressiveness(
    energy,
    brightness,
    drums,
  );
  const musicality = analyzeMusicality(
    energy,
    brightness,
    dynamics,
    stereo,
    input.keyAnalysis,
  );

  return {
    frames,
    energy,
    brightness,
    dynamics,
    stereo,
    bass,
    drums,
    vocals,
    danceability,
    aggressiveness,
    musicality,
  };
}

export * from "./types";
