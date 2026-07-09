export type NormalizedBpmResult = {
  bpm: number;
  alternativeBpms: number[];
  reason: "invalid" | "double_tempo" | "half_tempo" | "trap_triplet_pulse" | "direct";
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

  if (roundedRawBpm >= 110 && roundedRawBpm <= 130) {
    const trapPulseBpm = Math.round(roundedRawBpm * 0.75);
    const halfTimeBpm = Math.round(roundedRawBpm / 2);
    const doubleTimeBpm = Math.round(trapPulseBpm * 2);

    return {
      bpm: trapPulseBpm,
      alternativeBpms: [roundedRawBpm, halfTimeBpm, doubleTimeBpm].filter(
        (value, index, values) => value >= 40 && value <= 240 && values.indexOf(value) === index,
      ),
      reason: "trap_triplet_pulse",
    };
  }

  return {
    bpm: roundedRawBpm,
    alternativeBpms: [],
    reason: "direct",
  };
}
