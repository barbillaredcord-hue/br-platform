export type FeatureScore = {
  score: number;
  confidence: number;
  label: string;
  details: string[];
};

export type FeatureFrame = {
  index: number;
  start: number;
  end: number;
  rms: number;
  peak: number;
  energy: number;
  zeroCrossingRate: number;
};

export type EnergyFeature = FeatureScore & {
  averageRms: number;
  peak: number;
  peakRatio: number;
};

export type BrightnessFeature = FeatureScore & {
  spectralCentroid: number;
  highFrequencyRatio: number;
};

export type DynamicsFeature = FeatureScore & {
  dynamicRange: number;
  crestFactor: number;
};

export type StereoFeature = FeatureScore & {
  width: number;
  correlation: number;
};

export type BassFeature = FeatureScore & {
  lowFrequencyEnergy: number;
  subBassPresence: number;
};

export type DrumsFeature = FeatureScore & {
  transientDensity: number;
  transientStrength: number;
};

export type VocalsFeature = FeatureScore & {
  vocalProbability: number;
  instrumentalProbability: number;
};

export type DanceabilityFeature = FeatureScore & {
  tempoFit: number;
  rhythmicRegularity: number;
};

export type AggressivenessFeature = FeatureScore & {
  transientImpact: number;
  brightnessImpact: number;
  loudnessImpact: number;
};

export type MusicalityFeature = FeatureScore & {
  harmonicConfidence: number;
  balance: number;
  stability: number;
};

export type MusicFeatures = {
  frames: FeatureFrame[];
  energy: EnergyFeature;
  brightness: BrightnessFeature;
  dynamics: DynamicsFeature;
  stereo: StereoFeature;
  bass: BassFeature;
  drums: DrumsFeature;
  vocals: VocalsFeature;
  danceability: DanceabilityFeature;
  aggressiveness: AggressivenessFeature;
  musicality: MusicalityFeature;
};
