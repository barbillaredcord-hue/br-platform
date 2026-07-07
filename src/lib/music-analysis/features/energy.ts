import type { AudioDiagnostics } from "../types";
import type { EnergyFeature, FeatureFrame } from "./types";

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function analyzeEnergy(
  diagnostics: AudioDiagnostics,
  frames: FeatureFrame[],
): EnergyFeature {
  const energies = frames.map((frame) => frame.energy);
  const averageEnergy = average(energies);
  const maxEnergy = Math.max(...energies, diagnostics.peak, 0.001);
  const peakRatio = averageEnergy > 0 ? maxEnergy / averageEnergy : 0;

  let score = 100;

  if (diagnostics.rms < 0.10) score -= 20;
  if (diagnostics.rms > 0.32) score -= 15;
  if (peakRatio < 1.15) score -= 10;
  if (peakRatio > 2.6) score -= 8;

  let label = "Balanced";

  if (score >= 90) label = "Excellent";
  else if (score >= 75) label = "Good";
  else if (score >= 60) label = "Fair";
  else label = "Weak";

  const details: string[] = [];

  details.push(`Average RMS: ${diagnostics.rms.toFixed(3)}`);
  details.push(`Peak: ${diagnostics.peak.toFixed(3)}`);
  details.push(`Average Energy: ${averageEnergy.toFixed(3)}`);
  details.push(`Peak Ratio: ${peakRatio.toFixed(2)}`);

  return {
    score: clamp(score),
    confidence: 0.9,
    label,
    details,
    averageRms: Number(diagnostics.rms.toFixed(3)),
    peak: Number(diagnostics.peak.toFixed(3)),
    peakRatio: Number(peakRatio.toFixed(2)),
  };
}
