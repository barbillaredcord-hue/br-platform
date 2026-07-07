

import Meyda from "meyda";

export type KeyCandidate = {
  key: string;
  score: number;
};

export type KeyAnalysisResult = {
  primary: string;
  alternatives: string[];
  confidence: number;
  candidates: KeyCandidate[];
  reason?: string;
};

type MutableMeyda = {
  bufferSize: number;
  sampleRate: number;
  extract: (feature: unknown, signal: Float32Array) => unknown;
};

const chromaNotes = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
const majorProfile = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const minorProfile = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

function getMeydaAnalyzer() {
  const meydaModule = Meyda as unknown as Partial<MutableMeyda> & { default?: Partial<MutableMeyda> };
  const analyzer = typeof meydaModule.extract === "function" ? meydaModule : meydaModule.default;

  if (!analyzer || typeof analyzer.extract !== "function") {
    return null;
  }

  return analyzer as MutableMeyda;
}

function emptyKeyAnalysis(reason: string): KeyAnalysisResult {
  return {
    primary: "",
    alternatives: [],
    confidence: 0,
    candidates: [],
    reason,
  };
}

function readChromaFeatures(features: unknown) {
  if (!features || typeof features !== "object") {
    return [] as number[];
  }

  if ("length" in features) {
    return Array.from(features as ArrayLike<number>).map((value) => Number(value) || 0);
  }

  if ("chroma" in features) {
    const chroma = (features as { chroma?: unknown }).chroma;

    if (chroma && typeof chroma === "object" && "length" in chroma) {
      return Array.from(chroma as ArrayLike<number>).map((value) => Number(value) || 0);
    }
  }

  return [] as number[];
}

function extractChromaFrame(meyda: MutableMeyda, frame: Float32Array) {
  try {
    const directFeatures = readChromaFeatures(meyda.extract("chroma", frame));

    if (directFeatures.length >= 12) {
      return directFeatures;
    }
  } catch {
    // Some Meyda builds require array syntax instead of a single feature name.
  }

  try {
    const groupedFeatures = readChromaFeatures(meyda.extract(["chroma"], frame));

    if (groupedFeatures.length >= 12) {
      return groupedFeatures;
    }
  } catch {
    // Chroma is unavailable for this frame/build.
  }

  return [] as number[];
}

function rotateProfile(profile: number[], shift: number) {
  return profile.map((_, index) => profile[(index - shift + profile.length) % profile.length]);
}

function scoreProfile(chroma: number[], profile: number[]) {
  return chroma.reduce((sum, value, index) => sum + value * profile[index], 0);
}

function normalizeChroma(chroma: number[]) {
  const total = chroma.reduce((sum, value) => sum + Math.max(0, value), 0);

  if (!total) {
    return chroma.map(() => 0);
  }

  return chroma.map((value) => Math.max(0, value) / total);
}

function averageFrameEnergy(frame: Float32Array) {
  let sum = 0;

  for (let index = 0; index < frame.length; index += 1) {
    sum += Math.abs(frame[index]);
  }

  return sum / Math.max(frame.length, 1);
}

function goertzelPower(frame: Float32Array, sampleRate: number, frequency: number) {
  const normalizedFrequency = frequency / sampleRate;
  const coefficient = 2 * Math.cos(2 * Math.PI * normalizedFrequency);
  let previous = 0;
  let previous2 = 0;

  for (let index = 0; index < frame.length; index += 1) {
    const current = frame[index] + coefficient * previous - previous2;
    previous2 = previous;
    previous = current;
  }

  return previous2 * previous2 + previous * previous - coefficient * previous * previous2;
}

function detectKeyFromChroma(chroma: number[]): KeyAnalysisResult {
  const normalizedChroma = normalizeChroma(chroma);
  const candidates: KeyCandidate[] = [];

  chromaNotes.forEach((note, index) => {
    candidates.push({
      key: `${note} Major`,
      score: scoreProfile(normalizedChroma, rotateProfile(majorProfile, index)),
    });

    candidates.push({
      key: `${note} Minor`,
      score: scoreProfile(normalizedChroma, rotateProfile(minorProfile, index)),
    });
  });

  candidates.sort((a, b) => b.score - a.score);

  const primary = candidates[0]?.key ?? "";
  const alternatives = candidates
    .slice(1, 7)
    .filter((candidate) => candidate.key !== primary)
    .slice(0, 4)
    .map((candidate) => candidate.key);
  const topScore = candidates[0]?.score ?? 0;
  const secondScore = candidates[1]?.score ?? 0;
  const scoreGap = topScore - secondScore;
  const confidence = topScore > 0 ? Number((scoreGap / Math.max(topScore, 0.01)).toFixed(2)) : 0;
  const ambiguous = scoreGap < 0.1;

  return {
    primary: ambiguous ? "" : primary,
    alternatives,
    confidence,
    candidates: candidates.slice(0, 8),
    reason: ambiguous ? "ambiguous_key" : "ok",
  };
}

function estimateChromaWithGoertzel(buffer: AudioBuffer): KeyAnalysisResult {
  const channelData = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;
  const frameSize = 4096;
  const hopSize = frameSize * 8;
  const chromaTotals = new Array(12).fill(0) as number[];
  let analyzedFrames = 0;

  for (let start = 0; start + frameSize <= channelData.length; start += hopSize) {
    const frame = channelData.slice(start, start + frameSize);
    const frameEnergy = averageFrameEnergy(frame);

    if (frameEnergy < 0.002) {
      continue;
    }

    for (let midi = 36; midi <= 84; midi += 1) {
      const frequency = 440 * 2 ** ((midi - 69) / 12);
      const pitchClass = ((midi % 12) + 12) % 12;
      const octaveWeight = midi >= 48 && midi <= 72 ? 1 : 0.55;
      chromaTotals[pitchClass] += goertzelPower(frame, sampleRate, frequency) * octaveWeight;
    }

    analyzedFrames += 1;
  }

  if (!analyzedFrames) {
    return emptyKeyAnalysis("goertzel_no_frames");
  }

  const result = detectKeyFromChroma(chromaTotals.map((value) => value / analyzedFrames));

  return {
    ...result,
    reason: `fallback_goertzel:${result.reason ?? "ok"}`,
  };
}

export function detectKeyFromAudioBuffer(buffer: AudioBuffer): KeyAnalysisResult {
  try {
    const channelData = buffer.getChannelData(0);
    const frameSize = 8192;
    const hopSize = frameSize * 4;
    const chromaTotals = new Array(12).fill(0) as number[];
    let analyzedFrames = 0;
    const meyda = getMeydaAnalyzer();

    if (!meyda) {
      return estimateChromaWithGoertzel(buffer);
    }

    meyda.bufferSize = frameSize;
    meyda.sampleRate = buffer.sampleRate;

    for (let start = 0; start + frameSize <= channelData.length; start += hopSize) {
      const frame = channelData.slice(start, start + frameSize);
      const chromaFeatures = extractChromaFrame(meyda, frame);

      if (chromaFeatures.length < 12) {
        continue;
      }

      const frameEnergy = averageFrameEnergy(frame);

      if (frameEnergy < 0.002) {
        continue;
      }

      const weight = Math.min(2.5, Math.max(0.35, frameEnergy * 12));

      chromaFeatures.slice(0, 12).forEach((value, index) => {
        chromaTotals[index] += (Number(value) || 0) * weight;
      });
      analyzedFrames += 1;
    }

    if (!analyzedFrames) {
      return estimateChromaWithGoertzel(buffer);
    }

    return detectKeyFromChroma(chromaTotals.map((value) => value / analyzedFrames));
  } catch (error) {
    const fallback = estimateChromaWithGoertzel(buffer);
    const message = error instanceof Error ? error.message : String(error);

    return {
      ...fallback,
      reason: `meyda_error_fallback:${message.slice(0, 48)}`,
    };
  }
}