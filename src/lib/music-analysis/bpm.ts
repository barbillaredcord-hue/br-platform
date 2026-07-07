export type NormalizedBpmResult = {
  bpm: number;
  alternativeBpms: number[];
  reason: "invalid" | "double_tempo" | "half_tempo" | "direct";
};

export function normalizeDetectedBpm(rawBpm: number): NormalizedBpmResult {
  const roundedRawBpm = Math.round(rawBpm);

  if (!Number.isFinite(roundedRawBpm) || roundedRawBpm < 40 || roundedRawBpm > 240) {
    return {
      bpm: 0,
      alternativeBpms: [],
      reason: "invalid",
    };
  }

  if (roundedRawBpm > 160) {
    return {
      bpm: Math.round(roundedRawBpm / 2),
      alternativeBpms: [roundedRawBpm],
      reason: "double_tempo",
    };
  }

  if (roundedRawBpm < 70) {
    return {
      bpm: Math.round(roundedRawBpm * 2),
      alternativeBpms: [roundedRawBpm],
      reason: "half_tempo",
    };
  }

  return {
    bpm: roundedRawBpm,
    alternativeBpms: [],
    reason: "direct",
  };
}
