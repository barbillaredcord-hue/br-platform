export type AudioSegment = {
  index: number;
  start: number;
  end: number;
  duration: number;
  rms: number;
  peak: number;
  energy: number;
  silence: boolean;
};

export type AudioDiagnostics = {
  durationSeconds: number;
  sampleRate: number;
  channels: number;
  rms: number;
  peak: number;
  dynamicRange: number;
  waveformAverage: number;
  waveformPeakRatio: number;
};

export type SegmentAnalysis = {
  segment: AudioSegment;
  bpm?: number;
  key?: string;
  keyConfidence?: number;
  genre?: string;
  mood?: string;
  energyLabel?: string;
};

export type BeatAnalysisResult = {
  duration: number;
  diagnostics: AudioDiagnostics;
  bpm: number;
  key: string;
  genre: string;
  subgenres: string[];
  mood: string;
  energy: string;
  previewStart: number;
  previewDuration: number;
  qualityScore: number;
  segments: SegmentAnalysis[];
};