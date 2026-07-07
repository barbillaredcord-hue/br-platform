import type { AudioDiagnostics } from "./types";
import type { KeyAnalysisResult } from "./key";
import type { PreviewSuggestion } from "./preview";
import type { MusicFeatures } from "./features";

export type BeatQualityGrade = "A+" | "A" | "B" | "C" | "D";

export type BeatQualityInput = {
  diagnostics: AudioDiagnostics;
  bpm?: number;
  alternativeBpms?: number[];
  keyAnalysis?: KeyAnalysisResult;
  previewSuggestion?: PreviewSuggestion;
  musicFeatures?: MusicFeatures;
};

export type BeatQualityResult = {
  score: number;
  grade: BeatQualityGrade;
  sections: {
    loudness: number;
    dynamics: number;
    peakHealth: number;
    waveformBalance: number;
    musicalStability: number;
    previewQuality: number;
    bass?: number;
    drums?: number;
    stereo?: number;
    danceability?: number;
    aggressiveness?: number;
    musicality?: number;
  };
  strengths: string[];
  warnings: string[];
  recommendations: string[];
};

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function gradeFromScore(score: number): BeatQualityGrade {
  if (score >= 95) {
    return "A+";
  }

  if (score >= 85) {
    return "A";
  }

  if (score >= 72) {
    return "B";
  }

  if (score >= 60) {
    return "C";
  }

  return "D";
}

function scoreLoudness(rms: number) {
  if (rms >= 0.14 && rms <= 0.28) {
    return 100;
  }

  if (rms >= 0.1 && rms < 0.14) {
    return 82;
  }

  if (rms > 0.28 && rms <= 0.36) {
    return 78;
  }

  if (rms >= 0.06 && rms < 0.1) {
    return 58;
  }

  if (rms > 0.36) {
    return 52;
  }

  return 35;
}

function scoreDynamics(dynamicRange: number) {
  if (dynamicRange >= 0.45 && dynamicRange <= 0.72) {
    return 100;
  }

  if (dynamicRange >= 0.32 && dynamicRange < 0.45) {
    return 78;
  }

  if (dynamicRange > 0.72 && dynamicRange <= 0.86) {
    return 76;
  }

  if (dynamicRange < 0.32) {
    return 55;
  }

  return 60;
}

function scorePeakHealth(peak: number) {
  if (peak >= 0.72 && peak <= 0.96) {
    return 100;
  }

  if (peak > 0.96 && peak < 0.99) {
    return 78;
  }

  if (peak >= 0.99) {
    return 45;
  }

  if (peak >= 0.55 && peak < 0.72) {
    return 72;
  }

  return 48;
}

function scoreWaveformBalance(waveformAverage: number, waveformPeakRatio: number) {
  let score = 80;

  if (waveformAverage >= 0.42 && waveformAverage <= 0.68) {
    score += 12;
  } else {
    score -= 12;
  }

  if (waveformPeakRatio >= 0.18 && waveformPeakRatio <= 0.48) {
    score += 8;
  } else if (waveformPeakRatio > 0.62) {
    score -= 18;
  } else {
    score -= 8;
  }

  return clampScore(score);
}

function scoreMusicalStability(input: BeatQualityInput) {
  let score = 70;

  if (input.bpm && input.bpm >= 40 && input.bpm <= 240) {
    score += 12;
  } else {
    score -= 20;
  }

  if (input.alternativeBpms?.length) {
    score += 4;
  }

  if (input.keyAnalysis?.reason === "ok") {
    score += 14;
  } else if (input.keyAnalysis?.reason?.includes("ambiguous_key")) {
    score -= 8;
  } else if (input.keyAnalysis?.candidates.length) {
    score += 4;
  } else {
    score -= 18;
  }

  return clampScore(score);
}

function scorePreviewQuality(previewSuggestion?: PreviewSuggestion) {
  if (!previewSuggestion) {
    return 60;
  }

  return clampScore(previewSuggestion.previewConfidence * 100);
}

function calculateFeatureWeightedScore(input: BeatQualityInput, baseSections: BeatQualityResult["sections"]) {
  if (!input.musicFeatures) {
    return clampScore(
      baseSections.loudness * 0.2 +
        baseSections.dynamics * 0.18 +
        baseSections.peakHealth * 0.17 +
        baseSections.waveformBalance * 0.15 +
        baseSections.musicalStability * 0.15 +
        baseSections.previewQuality * 0.15,
    );
  }

  const { musicFeatures } = input;

  return clampScore(
    baseSections.loudness * 0.12 +
      baseSections.dynamics * 0.1 +
      baseSections.peakHealth * 0.1 +
      musicFeatures.energy.score * 0.1 +
      musicFeatures.bass.score * 0.1 +
      musicFeatures.drums.score * 0.1 +
      musicFeatures.stereo.score * 0.1 +
      musicFeatures.danceability.score * 0.1 +
      musicFeatures.musicality.score * 0.16 +
      baseSections.previewQuality * 0.08 +
      (100 - musicFeatures.aggressiveness.score) * 0.04,
  );
}

export function calculateBeatQuality(input: BeatQualityInput): BeatQualityResult {
  const { diagnostics } = input;

  const sections: BeatQualityResult["sections"] = {
    loudness: clampScore(scoreLoudness(diagnostics.rms)),
    dynamics: clampScore(scoreDynamics(diagnostics.dynamicRange)),
    peakHealth: clampScore(scorePeakHealth(diagnostics.peak)),
    waveformBalance: clampScore(scoreWaveformBalance(diagnostics.waveformAverage, diagnostics.waveformPeakRatio)),
    musicalStability: scoreMusicalStability(input),
    previewQuality: scorePreviewQuality(input.previewSuggestion),
  };

  if (input.musicFeatures) {
    sections.bass = input.musicFeatures.bass.score;
    sections.drums = input.musicFeatures.drums.score;
    sections.stereo = input.musicFeatures.stereo.score;
    sections.danceability = input.musicFeatures.danceability.score;
    sections.aggressiveness = input.musicFeatures.aggressiveness.score;
    sections.musicality = input.musicFeatures.musicality.score;
  }

  const score = calculateFeatureWeightedScore(input, sections);

  const strengths: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  if (sections.loudness >= 85) {
    strengths.push("Nivel RMS saludable para publicación.");
  } else {
    warnings.push("El nivel RMS podría no estar en el rango ideal.");
    recommendations.push("Revisa ganancia/master para acercar el RMS a un rango más consistente.");
  }

  if (sections.dynamics >= 85) {
    strengths.push("Buen rango dinámico.");
  } else {
    warnings.push("La dinámica puede estar demasiado comprimida o demasiado abierta.");
  }

  if (sections.peakHealth >= 85) {
    strengths.push("Buen headroom sin señales fuertes de clipping.");
  } else if (diagnostics.peak >= 0.99) {
    warnings.push("Posible clipping o picos demasiado cercanos a 0 dBFS.");
    recommendations.push("Reduce el limiter o baja el master para recuperar headroom.");
  }

  if (sections.waveformBalance >= 85) {
    strengths.push("La forma de onda tiene buen balance de energía.");
  } else {
    warnings.push("La distribución de energía del beat puede requerir revisión.");
  }

  if (input.keyAnalysis?.reason?.includes("ambiguous_key")) {
    warnings.push("La tonalidad está ambigua entre varias opciones cercanas.");
    recommendations.push("Confirma manualmente la tonalidad antes de guardar metadata final.");
  }

  if (input.musicFeatures) {
    strengths.push(`Energy: ${input.musicFeatures.energy.label}.`);
    strengths.push(`Stereo: ${input.musicFeatures.stereo.label}.`);

    if (input.musicFeatures.bass.score < 70) {
      warnings.push("La presencia de bajos/sub puede ser ligera para ciertos estilos urbanos.");
      recommendations.push("Revisa 808/sub bass si el beat debe sentirse más pesado.");
    }

    if (input.musicFeatures.danceability.score >= 80) {
      strengths.push("Buen potencial de groove/danceability.");
    }

    if (input.musicFeatures.aggressiveness.score < 40) {
      recommendations.push("El beat se percibe suave; si buscas más impacto, revisa transientes, brillo o percusión.");
    }
  }

  if (!input.previewSuggestion || sections.previewQuality < 70) {
    recommendations.push("Revisa manualmente el preview sugerido para asegurar que representa bien el beat.");
  }

  if (!strengths.length) {
    strengths.push("Análisis técnico generado correctamente para revisión inicial.");
  }

  return {
    score,
    grade: gradeFromScore(score),
    sections,
    strengths,
    warnings,
    recommendations,
  };
}
