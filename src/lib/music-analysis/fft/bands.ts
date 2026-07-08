

import type { FftFrame, FrequencyBandDefinition, FrequencyBandEnergy } from "./types";

export const frequencyBands: FrequencyBandDefinition[] = [
  { name: "sub", label: "Sub", minHz: 20, maxHz: 60 },
  { name: "bass", label: "Bass", minHz: 60, maxHz: 250 },
  { name: "lowMid", label: "Low Mid", minHz: 250, maxHz: 500 },
  { name: "mid", label: "Mid", minHz: 500, maxHz: 2000 },
  { name: "presence", label: "Presence", minHz: 2000, maxHz: 5000 },
  { name: "brilliance", label: "Brilliance", minHz: 5000, maxHz: 10000 },
  { name: "air", label: "Air", minHz: 10000, maxHz: 20000 },
];

function average(values: number[]) {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function calculateBandEnergy(frame: FftFrame, band: FrequencyBandDefinition) {
  const values = frame.frequencies
    .map((frequency, index) => ({ frequency, power: frame.powerSpectrum[index] ?? 0 }))
    .filter((item) => item.frequency >= band.minHz && item.frequency < band.maxHz)
    .map((item) => item.power);

  return average(values);
}

export function calculateFrequencyBands(frames: FftFrame[]): FrequencyBandEnergy[] {
  const bandEnergies = frequencyBands.map((band) => {
    const energy = average(frames.map((frame) => calculateBandEnergy(frame, band)));

    return {
      ...band,
      energy,
      normalizedEnergy: 0,
    };
  });

  const maxEnergy = Math.max(...bandEnergies.map((band) => band.energy), 0.000001);

  return bandEnergies.map((band) => ({
    ...band,
    energy: Number(band.energy.toFixed(6)),
    normalizedEnergy: Number((band.energy / maxEnergy).toFixed(3)),
  }));
}

export function getBandEnergy(bands: FrequencyBandEnergy[], name: FrequencyBandDefinition["name"]) {
  return bands.find((band) => band.name === name)?.normalizedEnergy ?? 0;
}