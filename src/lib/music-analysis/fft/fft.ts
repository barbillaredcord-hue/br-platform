import { applyWindow, createWindow } from "./window";
import type { FftFrame, FftWindowType } from "./types";

function nextPowerOfTwo(value: number) {
  return 2 ** Math.ceil(Math.log2(Math.max(1, value)));
}

function reverseBits(value: number, bitCount: number) {
  let reversed = 0;

  for (let index = 0; index < bitCount; index += 1) {
    reversed = (reversed << 1) | (value & 1);
    value >>= 1;
  }

  return reversed;
}

function fftRadix2(realInput: Float32Array) {
  const size = nextPowerOfTwo(realInput.length);
  const bitCount = Math.log2(size);
  const real = new Array<number>(size).fill(0);
  const imaginary = new Array<number>(size).fill(0);

  for (let index = 0; index < realInput.length; index += 1) {
    const reversedIndex = reverseBits(index, bitCount);
    real[reversedIndex] = realInput[index];
  }

  for (let length = 2; length <= size; length *= 2) {
    const angle = (-2 * Math.PI) / length;
    const wLengthReal = Math.cos(angle);
    const wLengthImaginary = Math.sin(angle);

    for (let start = 0; start < size; start += length) {
      let wReal = 1;
      let wImaginary = 0;
      const halfLength = length / 2;

      for (let offset = 0; offset < halfLength; offset += 1) {
        const evenIndex = start + offset;
        const oddIndex = evenIndex + halfLength;

        const oddReal = real[oddIndex] * wReal - imaginary[oddIndex] * wImaginary;
        const oddImaginary = real[oddIndex] * wImaginary + imaginary[oddIndex] * wReal;

        real[oddIndex] = real[evenIndex] - oddReal;
        imaginary[oddIndex] = imaginary[evenIndex] - oddImaginary;
        real[evenIndex] += oddReal;
        imaginary[evenIndex] += oddImaginary;

        const nextWReal = wReal * wLengthReal - wImaginary * wLengthImaginary;
        const nextWImaginary = wReal * wLengthImaginary + wImaginary * wLengthReal;

        wReal = nextWReal;
        wImaginary = nextWImaginary;
      }
    }
  }

  return { real, imaginary, size };
}

function createFrequencies(sampleRate: number, fftSize: number) {
  const binCount = fftSize / 2;
  const frequencies: number[] = [];

  for (let index = 0; index < binCount; index += 1) {
    frequencies.push((index * sampleRate) / fftSize);
  }

  return frequencies;
}

export function analyzeFftFrame(input: {
  frame: Float32Array;
  sampleRate: number;
  start: number;
  index: number;
  windowType?: FftWindowType;
}): FftFrame {
  const fftSize = nextPowerOfTwo(input.frame.length);
  const window = createWindow(input.frame.length, input.windowType ?? "hann");
  const windowedFrame = applyWindow(input.frame, window);
  const { real, imaginary } = fftRadix2(windowedFrame);
  const binCount = fftSize / 2;
  const magnitudes: number[] = [];
  const phases: number[] = [];
  const powerSpectrum: number[] = [];
  const frequencies = createFrequencies(input.sampleRate, fftSize);

  for (let bin = 0; bin < binCount; bin += 1) {
    const magnitude = Math.sqrt(real[bin] * real[bin] + imaginary[bin] * imaginary[bin]) / fftSize;
    const phase = Math.atan2(imaginary[bin], real[bin]);

    magnitudes.push(Number(magnitude.toFixed(8)));
    phases.push(Number(phase.toFixed(6)));
    powerSpectrum.push(Number((magnitude * magnitude).toFixed(10)));
  }

  return {
    index: input.index,
    start: Number(input.start.toFixed(3)),
    end: Number((input.start + input.frame.length / input.sampleRate).toFixed(3)),
    sampleRate: input.sampleRate,
    fftSize,
    magnitudes,
    phases,
    frequencies,
    powerSpectrum,
  };
}

export function buildFftFrames(input: {
  buffer: AudioBuffer;
  fftSize?: number;
  hopSize?: number;
  windowType?: FftWindowType;
  maxFrames?: number;
}) {
  const fftSize = input.fftSize ?? 2048;
  const hopSize = input.hopSize ?? fftSize;
  const channelData = input.buffer.getChannelData(0);
  const frames: FftFrame[] = [];
  const maxFrames = input.maxFrames ?? 240;

  for (let offset = 0; offset + fftSize <= channelData.length && frames.length < maxFrames; offset += hopSize) {
    const frame = channelData.slice(offset, offset + fftSize);

    frames.push(
      analyzeFftFrame({
        frame,
        sampleRate: input.buffer.sampleRate,
        start: offset / input.buffer.sampleRate,
        index: frames.length,
        windowType: input.windowType ?? "hann",
      }),
    );
  }

  return frames;
}
