

import type { FftFrame, TransientEvent } from "./types";

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function frameEnergy(frame: FftFrame) {
  return average(frame.powerSpectrum);
}

export function detectTransients(
  frames: FftFrame[],
  threshold = 0.18,
): TransientEvent[] {
  if (frames.length < 2) {
    return [];
  }

  const events: TransientEvent[] = [];

  let previousEnergy = frameEnergy(frames[0]);

  for (let index = 1; index < frames.length; index += 1) {
    const currentEnergy = frameEnergy(frames[index]);
    const delta = currentEnergy - previousEnergy;

    if (delta > threshold) {
      events.push({
        time: Number(frames[index].start.toFixed(3)),
        strength: Number(delta.toFixed(4)),
      });
    }

    previousEnergy = currentEnergy;
  }

  return events;
}