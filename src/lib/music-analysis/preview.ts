

export type PreviewSuggestion = {
  recommendedPreviewStart: number;
  recommendedPreviewDuration: number;
  previewConfidence: number;
  previewReason: string;
};

function clampPreviewStart(start: number, durationSeconds = 0) {
  const maxStart = Math.max(0, Math.floor(durationSeconds - 15));
  return Math.min(maxStart, Math.max(0, Math.round(start || 0)));
}

function normalizePreviewDuration(duration: number) {
  if (!Number.isFinite(duration)) {
    return 15;
  }

  return Math.min(30, Math.max(10, Math.round(duration)));
}

export function findBestPreviewSegment(waveformSamples: number[] = [], durationSeconds = 0): PreviewSuggestion {
  const fallbackDuration = normalizePreviewDuration(durationSeconds >= 20 ? 20 : 15);

  if (!waveformSamples.length || durationSeconds <= 0) {
    return {
      recommendedPreviewStart: 0,
      recommendedPreviewDuration: fallbackDuration,
      previewConfidence: 0.25,
      previewReason: "No hay suficiente waveform disponible; se recomienda revisar el preview manualmente.",
    };
  }

  const windowDuration = durationSeconds >= 60 ? 20 : 15;
  const windowSize = Math.max(1, Math.round((windowDuration / durationSeconds) * waveformSamples.length));
  let bestIndex = 0;
  let bestScore = -Infinity;

  for (let index = 0; index <= waveformSamples.length - windowSize; index += 1) {
    const window = waveformSamples.slice(index, index + windowSize);
    const average = window.reduce((sum, sample) => sum + sample, 0) / window.length;
    const peakRatio = window.filter((sample) => sample >= 0.72).length / window.length;
    const earlyPenalty = index / waveformSamples.length < 0.08 ? 0.12 : 0;
    const outroPenalty = index / waveformSamples.length > 0.82 ? 0.16 : 0;
    const score = average + peakRatio * 0.35 - earlyPenalty - outroPenalty;

    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  }

  const startRatio = bestIndex / waveformSamples.length;
  const recommendedPreviewStart = clampPreviewStart(startRatio * durationSeconds, durationSeconds);
  const confidence = Math.min(0.92, Math.max(0.35, bestScore));

  return {
    recommendedPreviewStart,
    recommendedPreviewDuration: normalizePreviewDuration(windowDuration),
    previewConfidence: Number(confidence.toFixed(2)),
    previewReason: `Preview sugerido por energía promedio y densidad de picos en la onda (${recommendedPreviewStart}s).`,
  };
}