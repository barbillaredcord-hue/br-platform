

export type FftWindowType = "hann" | "hamming" | "blackman" | "rectangular";

export type FrequencyBandName =
  | "sub"
  | "bass"
  | "lowMid"
  | "mid"
  | "presence"
  | "brilliance"
  | "air";

export type FrequencyBandDefinition = {
  name: FrequencyBandName;
  label: string;
  minHz: number;
  maxHz: number;
};

export type FrequencyBandEnergy = FrequencyBandDefinition & {
  energy: number;
  normalizedEnergy: number;
};

export type FftFrame = {
  index: number;
  start: number;
  end: number;
  sampleRate: number;
  fftSize: number;
  magnitudes: number[];
  phases: number[];
  frequencies: number[];
  powerSpectrum: number[];
};

export type SpectrumSummary = {
  spectralCentroid: number;
  spectralRolloff: number;
  spectralFlatness: number;
  spectralBandwidth: number;
  spectralFlux: number;
};

export type SpectrumPeak = {
  frequency: number;
  magnitude: number;
  binIndex: number;
};

export type ChromaVector = {
  notes: string[];
  values: number[];
  dominantNote: string;
  confidence: number;
};

export type TransientEvent = {
  time: number;
  strength: number;
  band?: FrequencyBandName;
};

export type HarmonicSummary = {
  fundamentalFrequency: number;
  harmonicRatio: number;
  inharmonicity: number;
  richness: number;
};

export type FftAnalysisResult = {
  sampleRate: number;
  fftSize: number;
  hopSize: number;
  windowType: FftWindowType;
  frames: FftFrame[];
  bands: FrequencyBandEnergy[];
  spectrum: SpectrumSummary;
  peaks: SpectrumPeak[];
  chroma: ChromaVector;
  transients: TransientEvent[];
  harmonics: HarmonicSummary;
};