

import type { FftWindowType } from "./types";

export function createWindow(size: number, type: FftWindowType = "hann") {
  const safeSize = Math.max(1, Math.floor(size));
  const window = new Float32Array(safeSize);

  if (safeSize === 1) {
    window[0] = 1;
    return window;
  }

  for (let index = 0; index < safeSize; index += 1) {
    const ratio = index / (safeSize - 1);

    if (type === "hamming") {
      window[index] = 0.54 - 0.46 * Math.cos(2 * Math.PI * ratio);
    } else if (type === "blackman") {
      window[index] = 0.42 - 0.5 * Math.cos(2 * Math.PI * ratio) + 0.08 * Math.cos(4 * Math.PI * ratio);
    } else if (type === "rectangular") {
      window[index] = 1;
    } else {
      window[index] = 0.5 * (1 - Math.cos(2 * Math.PI * ratio));
    }
  }

  return window;
}

export function applyWindow(frame: Float32Array, window: Float32Array) {
  const size = Math.min(frame.length, window.length);
  const output = new Float32Array(size);

  for (let index = 0; index < size; index += 1) {
    output[index] = frame[index] * window[index];
  }

  return output;
}