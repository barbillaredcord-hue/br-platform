"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BrainCircuit, Save, Scissors } from "lucide-react";
import { analyze } from "web-audio-beat-detector";
import { classifyBeatFromRealData } from "@/lib/beat-metadata";
import { normalizeDetectedBpm } from "@/lib/music-analysis/bpm";
import { analyzeAudioDiagnostics } from "@/lib/music-analysis/diagnostics";
import { buildWaveformSamples } from "@/lib/music-analysis/engine";
import { analyzeMusicFeatures } from "@/lib/music-analysis/features";
import type { MusicFeatures } from "@/lib/music-analysis/features";
import { detectKeyFromAudioBuffer } from "@/lib/music-analysis/key";
import { calculateBeatQuality } from "@/lib/music-analysis/quality";
import {
  buildPersistedBeatAnalysis,
  decideAnalysisLoad,
  withReviewedStatus,
  type BeatAnalysisSource,
  type PersistedBeatAnalysis,
} from "@/lib/music-analysis/persistence";
import type { KeyAnalysisResult, KeyCandidate } from "@/lib/music-analysis/key";
import type { AudioDiagnostics } from "@/lib/music-analysis/types";
import type { BeatQualityResult } from "@/lib/music-analysis/quality";
import { createAdminChangeLog, updateBeatMetadataAsAdmin, updateBeatPreviewWithUpload } from "@/lib/supabase/queries";
import {
  getBeatAnalysisAsAdmin,
  persistBeatAnalysisAsAdmin,
} from "@/lib/supabase/analysis";
import { getAuthorizedFullAudioUrl } from "@/lib/full-audio-client";

function formatFileSize(size: number) {
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

function clampPreviewDuration(value: number) {
  return Math.min(30, Math.max(15, Math.round(value || 15)));
}

function normalizePreviewDuration(value: number) {
  return [15, 20, 25, 30].includes(value) ? value : 15;
}

function clampStartSecond(value: number) {
  return Math.max(0, Math.round(value || 0));
}


function splitCommaValues(value: string) {
  return value
    .split(/[,/;|]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getTopRankedKey(analysisKey: string, candidates: KeyCandidate[]) {
  return candidates[0]?.key?.trim() || analysisKey.trim();
}

function formatGenreConfidence(confidence: number | null | undefined) {
  if (confidence === null || confidence === undefined) return "Baja · sin evidencia suficiente";
  if (confidence >= 0.72) return `Alta · ${Math.round(confidence * 100)}%`;
  return `Moderada · ${Math.round(confidence * 100)}%`;
}



function drawWaveformCanvas(input: {
  canvas: HTMLCanvasElement;
  samples: number[];
  audioDuration: number;
  startSecond: number;
  durationSeconds: number;
}) {
  const { canvas, samples, audioDuration, startSecond, durationSeconds } = input;
  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  const width = canvas.width;
  const height = canvas.height;
  const centerY = height / 2;
  const barWidth = Math.max(2, width / Math.max(samples.length, 1));

  context.clearRect(0, 0, width, height);
  context.fillStyle = "#05070a";
  context.fillRect(0, 0, width, height);

  context.strokeStyle = "rgba(34, 197, 94, 0.14)";
  context.lineWidth = 1;
  for (let x = 0; x < width; x += 24) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }

  const safeDuration = Math.max(audioDuration, 1);
  const selectionStartX = Math.min(width, Math.max(0, (startSecond / safeDuration) * width));
  const selectionWidth = Math.min(width - selectionStartX, (durationSeconds / safeDuration) * width);

  context.fillStyle = "rgba(103, 232, 249, 0.12)";
  context.fillRect(selectionStartX, 0, selectionWidth, height);

  samples.forEach((sample, index) => {
    const x = index * barWidth;
    const barHeight = Math.max(2, sample * (height - 22));
    const y = centerY - barHeight / 2;
    const insideSelection = x >= selectionStartX && x <= selectionStartX + selectionWidth;

    context.fillStyle = insideSelection ? "rgba(103, 232, 249, 0.95)" : "rgba(34, 197, 94, 0.75)";
    context.fillRect(x, y, Math.max(1, barWidth - 1), barHeight);
  });

  context.strokeStyle = "#67e8f9";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(selectionStartX, 0);
  context.lineTo(selectionStartX, height);
  context.stroke();
}

async function audioUrlLooksMissing(url: string) {
  try {
    const headResponse = await fetch(url, { method: "HEAD", cache: "no-store" });

    if (headResponse.status === 404) {
      return true;
    }

    if (headResponse.ok) {
      return false;
    }
  } catch {
    // Some storage/CDN setups reject HEAD or CORS preflight; FFmpeg can still try the real fetch.
  }

  try {
    const rangeResponse = await fetch(url, {
      cache: "no-store",
      headers: { Range: "bytes=0-0" },
    });

    return rangeResponse.status === 404;
  } catch {
    return false;
  }
}

type PreviewEditorFormProps = {
  beatId: string;
  slug: string;
  title: string;
  currentPreviewUrl: string;
  currentBpm: number;
  currentGenre: string;
  currentMusicalKey?: string;
  initialDurationSeconds?: number;
};

export function PreviewEditorForm({
  beatId,
  slug,
  title,
  currentPreviewUrl,
  currentBpm,
  currentGenre,
  currentMusicalKey = "",
  initialDurationSeconds = 15,
}: PreviewEditorFormProps) {
  const router = useRouter();
  const fullAudioRef = useRef<HTMLAudioElement | null>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const generatedPreviewUrlRef = useRef<string | null>(null);
  const analysisRunSourceRef = useRef<BeatAnalysisSource>("automatic");
  const analysisNotesRef = useRef("");
  const persistedAnalysisRef = useRef<PersistedBeatAnalysis | null>(null);
  const [startSecond, setStartSecond] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(clampPreviewDuration(initialDurationSeconds));
  const [generatedPreviewFile, setGeneratedPreviewFile] = useState<File | null>(null);
  const [generatedPreviewUrl, setGeneratedPreviewUrl] = useState("");
  const [waveformSamples, setWaveformSamples] = useState<number[]>([]);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isWaveformLoading, setIsWaveformLoading] = useState(false);
  const [waveformMessage, setWaveformMessage] = useState("");
  const [audioDiagnostics, setAudioDiagnostics] = useState<AudioDiagnostics | null>(null);
  const [beatQuality, setBeatQuality] = useState<BeatQualityResult | null>(null);
  const [musicFeatures, setMusicFeatures] = useState<MusicFeatures | null>(null);
  const [status, setStatus] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [appliedBpm, setAppliedBpm] = useState(currentBpm);
  const [appliedGenre, setAppliedGenre] = useState(currentGenre);
  const [appliedMusicalKey, setAppliedMusicalKey] = useState(currentMusicalKey);
  const [analysisBpm, setAnalysisBpm] = useState(currentBpm ? String(currentBpm) : "");
  const [analysisAlternativeBpms, setAnalysisAlternativeBpms] = useState("");
  const [analysisKey, setAnalysisKey] = useState(currentMusicalKey);
  const [analysisAlternativeKeys, setAnalysisAlternativeKeys] = useState("");
  const [analysisKeyCandidates, setAnalysisKeyCandidates] = useState<KeyCandidate[]>([]);
  const [analysisKeyStatus, setAnalysisKeyStatus] = useState("");
  const [analysisGenres, setAnalysisGenres] = useState(currentGenre);
  const [analysisPreviewStart, setAnalysisPreviewStart] = useState("0");
  const [analysisPreviewDuration, setAnalysisPreviewDuration] = useState(15);
  const [analysisNotes, setAnalysisNotes] = useState("");
  const [isApplyingAnalysis, setIsApplyingAnalysis] = useState("");
  const [analysisProcessMessage, setAnalysisProcessMessage] = useState("");
  const [analysisReloadKey, setAnalysisReloadKey] = useState(0);
  const [authorizedFullAudioUrl, setAuthorizedFullAudioUrl] = useState("");
  const [persistedAnalysis, setPersistedAnalysis] = useState<PersistedBeatAnalysis | null>(null);
  const [isPersistedAnalysisLoaded, setIsPersistedAnalysisLoaded] = useState(false);
  const [analysisFrameCount, setAnalysisFrameCount] = useState(0);

  const hasRealPreview = Boolean(currentPreviewUrl);

  useEffect(() => {
    let isMounted = true;

    void getAuthorizedFullAudioUrl(beatId)
      .then((url) => {
        if (isMounted) setAuthorizedFullAudioUrl(url);
      })
      .catch(() => {
        if (isMounted) setWaveformMessage("No se pudo autorizar el audio completo.");
      });

    return () => { isMounted = false; };
  }, [beatId]);

  function requestAudioAnalysis() {
    analysisRunSourceRef.current = "manual";
    analysisNotesRef.current = analysisNotes;
    setAnalysisReloadKey((value) => value + 1);
  }

  useEffect(() => {
    let isMounted = true;

    void getBeatAnalysisAsAdmin(beatId).then((result) => {
      if (!isMounted) return;

      persistedAnalysisRef.current = result.analysis;
      setPersistedAnalysis(result.analysis);
      setIsPersistedAnalysisLoaded(true);
      if (!result.ok) setWaveformMessage(result.message);
    });

    return () => { isMounted = false; };
  }, [beatId]);

  
  useEffect(() => {
    let isMounted = true;

    async function loadWaveform() {
      if (!authorizedFullAudioUrl || !isPersistedAnalysisLoaded) {
        return;
      }
      setIsWaveformLoading(true);
      setWaveformMessage("");

      try {
        const response = await fetch(authorizedFullAudioUrl);
        if (!response.ok) {
          throw new Error(`Waveform fetch failed: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const audioContext = new AudioContext();
        const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
        const samples = buildWaveformSamples(decodedBuffer);
        const diagnostics = analyzeAudioDiagnostics(decodedBuffer, samples);
        const storedAnalysis = persistedAnalysisRef.current;
        const loadDecision = decideAnalysisLoad(storedAnalysis);

        if (analysisReloadKey === 0 && storedAnalysis && loadDecision !== "analyze") {
          await audioContext.close();

          if (!isMounted) return;

          const stored = storedAnalysis;
          const storedFeatures = stored.features;
          setWaveformSamples(samples);
          setAudioDuration(decodedBuffer.duration);
          setAudioDiagnostics(storedFeatures?.diagnostics ?? diagnostics);
          setBeatQuality(storedFeatures?.quality ?? null);
          setMusicFeatures(storedFeatures ? { frames: [], ...storedFeatures.music } : null);
          setAnalysisFrameCount(storedFeatures?.frameCount ?? 0);
          setAnalysisBpm(stored.detectedBpm ? String(stored.detectedBpm) : "");
          setAnalysisAlternativeBpms(storedFeatures?.bpm.alternatives.join(", ") ?? "");
          setAnalysisKey(stored.detectedKey ?? "");
          setAnalysisAlternativeKeys(storedFeatures?.key.alternatives.join(", ") ?? "");
          setAnalysisKeyCandidates(storedFeatures?.key.candidates ?? []);
          setAnalysisKeyStatus(storedFeatures?.key.reason ?? "");
          setAnalysisGenres([stored.detectedGenre, ...stored.detectedSubgenres].filter(Boolean).join(", "));
          setAnalysisPreviewStart(String(stored.previewRecommendation?.startSecond ?? 0));
          setAnalysisPreviewDuration(normalizePreviewDuration(stored.previewRecommendation?.durationSeconds ?? 15));
          setAnalysisNotes(storedFeatures?.classification.reasoning ?? "");
          setAnalysisProcessMessage(
            loadDecision === "outdated"
              ? `Análisis persistido ${stored.version} desactualizado. Usa Procesar de nuevo para actualizarlo.`
              : `Análisis persistido cargado: ${stored.version} · ${stored.detectedBpm ?? "BPM pendiente"} · ${stored.detectedKey ?? "key pendiente"}.`,
          );
          return;
        }

        let detectedBpm = 0;
        let detectedAlternativeBpms: number[] = [];
        let detectedBpmReason = "";
        let detectedKey = "";
        let detectedAlternativeKeys: string[] = [];
        let detectedKeyCandidates: KeyCandidate[] = [];
        let detectedKeyStatus = "";
        let detectedKeyAnalysis: KeyAnalysisResult | undefined;

        try {
          const normalizedBpm = normalizeDetectedBpm(await analyze(decodedBuffer));
          detectedBpm = normalizedBpm.bpm;
          detectedAlternativeBpms = normalizedBpm.alternativeBpms;
          detectedBpmReason = normalizedBpm.reason;
        } catch (bpmError) {
          console.warn("B.R BPM detection unavailable", { title, bpmError });
        }

        try {
          const keyAnalysis = detectKeyFromAudioBuffer(decodedBuffer);
          detectedKeyAnalysis = keyAnalysis;
          detectedKey = keyAnalysis.primary;
          detectedAlternativeKeys = keyAnalysis.alternatives;
          detectedKeyCandidates = keyAnalysis.candidates;
          detectedKeyStatus = keyAnalysis.reason ?? "ok";
        } catch (keyError) {
          detectedKeyStatus = "key_detection_error";
          console.warn("B.R key detection unavailable", { title, keyError });
        }

        const nextMusicFeatures = analyzeMusicFeatures({
          buffer: decodedBuffer,
          diagnostics,
          bpm: detectedBpm || undefined,
          keyAnalysis: detectedKeyAnalysis,
        });
        const classification = classifyBeatFromRealData({
          title,
          audioUrl: authorizedFullAudioUrl,
          currentGenre: "",
          currentBpm: detectedBpm || null,
          currentKey: detectedKey || null,
          durationSeconds: decodedBuffer.duration,
          waveformSamples: samples,
          notes: analysisNotesRef.current,
          musicFeatures: nextMusicFeatures,
        });
        const previewSuggestion = {
          recommendedPreviewStart: classification.recommendedPreviewStart,
          recommendedPreviewDuration: classification.recommendedPreviewDuration,
          previewConfidence: classification.previewConfidence,
          previewReason: classification.previewReason,
        };
        const nextBeatQuality = calculateBeatQuality({
          diagnostics,
          bpm: detectedBpm || undefined,
          alternativeBpms: detectedAlternativeBpms,
          keyAnalysis: detectedKeyAnalysis,
          previewSuggestion,
          musicFeatures: nextMusicFeatures,
        });
        const nextAnalysis = buildPersistedBeatAnalysis({
          source: analysisRunSourceRef.current,
          analyzedAt: new Date().toISOString(),
          bpm: detectedBpm || null,
          bpmAlternatives: detectedAlternativeBpms,
          bpmReason: detectedBpmReason,
          keyAnalysis: detectedKeyAnalysis ?? {
            primary: "",
            alternatives: [],
            confidence: 0,
            candidates: [],
            reason: detectedKeyStatus || "unavailable",
          },
          classification,
          diagnostics,
          musicFeatures: nextMusicFeatures,
          quality: nextBeatQuality,
        });
        await audioContext.close();

        if (!isMounted) return;

        const persistenceResult = await persistBeatAnalysisAsAdmin({
          beatId,
          analysis: nextAnalysis,
        });

        if (!isMounted) return;

        if (!persistenceResult.ok || !persistenceResult.analysis) {
          throw new Error(persistenceResult.message || "analysis_persistence_failed");
        }

        persistedAnalysisRef.current = persistenceResult.analysis;
        setPersistedAnalysis(persistenceResult.analysis);
        setWaveformSamples(samples);
        setAudioDuration(decodedBuffer.duration);
        setAudioDiagnostics(diagnostics);
        setBeatQuality(nextBeatQuality);
        setMusicFeatures(nextMusicFeatures);
        setAnalysisFrameCount(nextMusicFeatures.frames.length);
        setAnalysisKeyStatus(detectedKeyStatus);

        if (detectedBpm >= 40 && detectedBpm <= 240) {
          setAnalysisBpm(String(detectedBpm));
          setAnalysisAlternativeBpms(detectedAlternativeBpms.join(", "));
        }

        setAnalysisKeyCandidates(detectedKeyCandidates);

        if (detectedKey) {
          setAnalysisKey(detectedKey);
          setAnalysisAlternativeKeys(detectedAlternativeKeys.join(", "));
        }

        const nextGenres = [classification.primaryGenre, ...classification.subgenres]
          .filter((value, index, values) => value && values.indexOf(value) === index)
          .join(", ");
        setAnalysisGenres(nextGenres);
        setAnalysisPreviewStart(String(nextAnalysis.previewRecommendation?.startSecond ?? 0));
        setAnalysisPreviewDuration(normalizePreviewDuration(nextAnalysis.previewRecommendation?.durationSeconds ?? 15));
        setAnalysisNotes(classification.reasoning);
        setAnalysisProcessMessage(
          `Análisis ${nextAnalysis.version} persistido: ${classification.primaryGenre} · ${classification.mood} · Quality ${nextBeatQuality.score}/100.`,
        );
      } catch (error) {
        console.warn("B.R waveform unavailable", { title, error });
        if (isMounted && !persistedAnalysisRef.current) {
          setWaveformSamples([]);
          setAudioDiagnostics(null);
          setBeatQuality(null);
          setMusicFeatures(null);
          setAnalysisFrameCount(0);
          setAnalysisKeyCandidates([]);
          setAnalysisKeyStatus("waveform_load_error");
          setWaveformMessage("No se pudo leer onda; usa recorte manual.");
        } else if (isMounted) {
          setWaveformMessage("No se pudo reprocesar; se conserva el último análisis persistido.");
        }
      } finally {
        if (isMounted) {
          setIsWaveformLoading(false);
        }
      }
    }

    void loadWaveform();

    return () => {
      isMounted = false;
    };
  }, [analysisReloadKey, authorizedFullAudioUrl, beatId, isPersistedAnalysisLoaded, title]);

  useEffect(() => {
    if (!waveformCanvasRef.current || waveformSamples.length === 0) {
      return;
    }

    drawWaveformCanvas({
      canvas: waveformCanvasRef.current,
      samples: waveformSamples,
      audioDuration,
      startSecond,
      durationSeconds,
    });
  }, [audioDuration, durationSeconds, startSecond, waveformSamples]);

  function selectStartFromWaveform(event: React.MouseEvent<HTMLCanvasElement>) {
    if (!audioDuration || !waveformCanvasRef.current) {
      return;
    }

    const rect = waveformCanvasRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const ratio = Math.min(1, Math.max(0, clickX / rect.width));
    const nextStart = clampStartSecond(ratio * audioDuration);

    setStartSecond(nextStart);
    if (fullAudioRef.current) {
      fullAudioRef.current.currentTime = nextStart;
    }
    setStatus(`Inicio visual marcado en ${nextStart}s.`);
  }

  function setCurrentAudioTimeAsStart() {
    const nextStart = clampStartSecond(fullAudioRef.current?.currentTime ?? 0);
    setStartSecond(nextStart);
    if (fullAudioRef.current) {
      fullAudioRef.current.currentTime = nextStart;
    }
    setStatus(`Inicio del preview marcado en ${nextStart}s.`);
  }

  async function logAnalysisChange(input: {
    blockTitle: string;
    eventType: "ai_bpm_apply" | "ai_key_apply" | "ai_genre_apply" | "ai_preview_apply" | "ai_full_apply";
    description: string;
    previousValue: unknown;
    nextValue: unknown;
  }) {
    await createAdminChangeLog({
      blockTitle: input.blockTitle,
      eventType: input.eventType,
      targetType: "beat",
      targetName: title,
      description: input.description,
      commandText: "PreviewEditorForm.AIBeatAnalysisLite",
      metadata: {
        beatId,
        slug,
        previousValue: input.previousValue,
        nextValue: input.nextValue,
        analysisNotes,
      },
      temporary: true,
    });
  }

  async function applyAnalysisBpm() {
    const nextBpm = Number(analysisBpm);

    if (!Number.isFinite(nextBpm) || nextBpm < 40 || nextBpm > 240) {
      setStatus("BPM inválido. Usa un número entre 40 y 240.");
      return;
    }

    setIsApplyingAnalysis("bpm");
    const roundedBpm = Math.round(nextBpm);
    const result = await updateBeatMetadataAsAdmin(beatId, { bpm: roundedBpm });

    if (result.ok) {
      await logAnalysisChange({
        blockTitle: "AI Lite: BPM aplicado",
        eventType: "ai_bpm_apply",
        description: `Se aplicó BPM sugerido para ${title}: ${roundedBpm}.`,
        previousValue: appliedBpm,
        nextValue: { bpm: roundedBpm, alternatives: splitCommaValues(analysisAlternativeBpms) },
      });
      setAppliedBpm(roundedBpm);
      setStatus("BPM aplicado desde AI Beat Analysis Lite.");
      router.refresh();
    } else {
      setStatus(result.message ?? "No se pudo aplicar BPM.");
    }

    setIsApplyingAnalysis("");
  }

  async function applyAnalysisKey() {
    const nextKey = getTopRankedKey(analysisKey, analysisKeyCandidates);

    if (!nextKey) {
      setStatus("Agrega una tonalidad principal.");
      return;
    }

    setIsApplyingAnalysis("key");
    const result = await updateBeatMetadataAsAdmin(beatId, { musicalKey: nextKey });

    if (result.ok) {
      await logAnalysisChange({
        blockTitle: "AI Lite: tonalidad aplicada",
        eventType: "ai_key_apply",
        description: `Se aplicó tonalidad sugerida para ${title}: ${nextKey}.`,
        previousValue: appliedMusicalKey,
        nextValue: { musicalKey: nextKey, alternatives: splitCommaValues(analysisAlternativeKeys) },
      });
      setAppliedMusicalKey(nextKey);
      setAnalysisKey(nextKey);
      setStatus("Tonalidad aplicada desde AI Beat Analysis Lite.");
      router.refresh();
    } else {
      setStatus(result.message ?? "No se pudo aplicar tonalidad.");
    }

    setIsApplyingAnalysis("");
  }

  async function applyAnalysisGenres() {
    const genres = splitCommaValues(analysisGenres);
    const nextGenre = genres.join(", ");

    if (!nextGenre) {
      setStatus("Agrega al menos un género sugerido.");
      return;
    }

    setIsApplyingAnalysis("genre");
    const result = await updateBeatMetadataAsAdmin(beatId, { genre: nextGenre });

    if (result.ok) {
      await logAnalysisChange({
        blockTitle: "AI Lite: géneros aplicados",
        eventType: "ai_genre_apply",
        description: `Se aplicaron géneros sugeridos para ${title}: ${nextGenre}.`,
        previousValue: appliedGenre,
        nextValue: { genre: nextGenre, genres },
      });
      setAppliedGenre(nextGenre);
      setStatus("Géneros aplicados desde AI Beat Analysis Lite.");
      router.refresh();
    } else {
      setStatus(result.message ?? "No se pudo aplicar géneros.");
    }

    setIsApplyingAnalysis("");
  }

  async function applySuggestedPreview() {
    const nextStart = clampStartSecond(Number(analysisPreviewStart));
    const nextDuration = normalizePreviewDuration(Number(analysisPreviewDuration));
    const previousValue = { startSecond, durationSeconds };

    setStartSecond(nextStart);
    setDurationSeconds(nextDuration);
    if (fullAudioRef.current) {
      fullAudioRef.current.currentTime = nextStart;
    }

    setIsApplyingAnalysis("preview");
    await logAnalysisChange({
      blockTitle: "AI Lite: preview sugerido",
      eventType: "ai_preview_apply",
      description: `Se usó preview sugerido para ${title}: inicio ${nextStart}s, duración ${nextDuration}s.`,
      previousValue,
      nextValue: { startSecond: nextStart, durationSeconds: nextDuration },
    });
    setStatus(`Preview sugerido aplicado: ${nextStart}s por ${nextDuration}s.`);
    setIsApplyingAnalysis("");
  }

  async function applyFullAnalysis() {
    const nextBpm = Number(analysisBpm);
    const nextKey = getTopRankedKey(analysisKey, analysisKeyCandidates);
    const nextGenre = splitCommaValues(analysisGenres).join(", ");
    const nextStart = clampStartSecond(Number(analysisPreviewStart));
    const nextDuration = normalizePreviewDuration(Number(analysisPreviewDuration));

    if (!Number.isFinite(nextBpm) || nextBpm < 40 || nextBpm > 240) {
      setStatus("BPM inválido. Usa un número entre 40 y 240.");
      return;
    }

    if (!nextKey) {
      setStatus("Agrega una tonalidad principal antes de aplicar el análisis completo.");
      return;
    }

    if (!nextGenre) {
      setStatus("Agrega al menos un género antes de aplicar el análisis completo.");
      return;
    }

    if (!persistedAnalysis) {
      setStatus("Procesa y guarda el análisis antes de confirmarlo.");
      return;
    }

    const roundedBpm = Math.round(nextBpm);
    const previousValue = {
      bpm: appliedBpm,
      musicalKey: appliedMusicalKey,
      genre: appliedGenre,
      preview: { startSecond, durationSeconds },
    };
    const nextValue = {
      bpm: roundedBpm,
      musicalKey: nextKey,
      genre: nextGenre,
      preview: { startSecond: nextStart, durationSeconds: nextDuration },
      notes: analysisNotes,
    };

    setIsApplyingAnalysis("full");

    const result = await persistBeatAnalysisAsAdmin({
      beatId,
      analysis: withReviewedStatus(persistedAnalysis),
      manualMetadata: {
        bpm: roundedBpm,
        musicalKey: nextKey,
        genre: nextGenre,
      },
    });

    if (!result.ok || !result.analysis) {
      setStatus(result.message ?? "No se pudo aplicar el análisis completo.");
      setIsApplyingAnalysis("");
      return;
    }

    const savedBpm = result.beat?.bpm ?? roundedBpm;
    const savedKey = result.beat?.musical_key ?? nextKey;
    const savedGenre = result.beat?.genre ?? nextGenre;

    persistedAnalysisRef.current = result.analysis;
    setPersistedAnalysis(result.analysis);
    setAppliedBpm(savedBpm);
    setAnalysisBpm(String(savedBpm));
    setAppliedMusicalKey(savedKey);
    setAnalysisKey(savedKey);
    setAppliedGenre(savedGenre);
    setAnalysisGenres(savedGenre);
    setStartSecond(nextStart);
    setDurationSeconds(nextDuration);

    if (fullAudioRef.current) {
      fullAudioRef.current.currentTime = nextStart;
    }

    await logAnalysisChange({
      blockTitle: "AI Lite: análisis completo aplicado",
      eventType: "ai_full_apply",
      description: `Se aplicó análisis completo para ${title}: ${savedBpm} BPM · ${savedKey} · ${savedGenre} · preview ${nextStart}s/${nextDuration}s.`,
      previousValue,
      nextValue: {
        ...nextValue,
        bpm: savedBpm,
        musicalKey: savedKey,
        genre: savedGenre,
      },
    });

    setStatus(`Análisis completo aplicado: BPM ${savedBpm}, tonalidad ${savedKey}, géneros ${savedGenre}.`);
    router.refresh();

    setIsApplyingAnalysis("");
  }

  function clearAnalysis() {
    setAnalysisBpm(currentBpm ? String(currentBpm) : "");
    setAnalysisAlternativeBpms("");
    setAnalysisKey(currentMusicalKey);
    setAnalysisAlternativeKeys("");
    setAnalysisKeyCandidates([]);
    setAnalysisKeyStatus("");
    setAnalysisGenres(currentGenre);
    setAnalysisPreviewStart("0");
    setAnalysisPreviewDuration(15);
    setAnalysisNotes("");
    setAnalysisProcessMessage("");
    setAudioDiagnostics(null);
    setBeatQuality(null);
    setMusicFeatures(null);
    setAnalysisFrameCount(0);
    setStatus("AI Beat Analysis Lite limpiado.");
  }

  function clearGeneratedPreviewUrl() {
    if (generatedPreviewUrlRef.current) {
      URL.revokeObjectURL(generatedPreviewUrlRef.current);
      generatedPreviewUrlRef.current = null;
    }
  }

  async function generatePreviewFromFullBeat() {
    clearGeneratedPreviewUrl();
    setGeneratedPreviewFile(null);
    setGeneratedPreviewUrl("");

    const safeStart = clampStartSecond(startSecond);
    const safeDuration = clampPreviewDuration(durationSeconds);

    setStartSecond(safeStart);
    setDurationSeconds(safeDuration);
    setIsGenerating(true);
    setStatus("Cargando motor de recorte de audio...");

    try {
      const currentFullAudioUrl = await getAuthorizedFullAudioUrl(beatId);
      setAuthorizedFullAudioUrl(currentFullAudioUrl);
      const [{ FFmpeg }, { fetchFile, toBlobURL }] = await Promise.all([import("@ffmpeg/ffmpeg"), import("@ffmpeg/util")]);
      const ffmpeg = new FFmpeg();
      const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";

      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      });

      setStatus("Validando archivo de audio...");
      const isAudioMissing = await audioUrlLooksMissing(currentFullAudioUrl);

      if (isAudioMissing) {
        setStatus("Archivo de audio no encontrado. Revisa el MP3 del beat.");
        return;
      }

      setStatus("Descargando beat completo para recortar preview...");
      await ffmpeg.writeFile("input.mp3", await fetchFile(currentFullAudioUrl));

      setStatus(`Generando preview desde ${safeStart}s por ${safeDuration}s...`);
      await ffmpeg.exec(["-ss", String(safeStart), "-i", "input.mp3", "-t", String(safeDuration), "-vn", "-acodec", "libmp3lame", "-b:a", "192k", "preview.mp3"]);

      const output = await ffmpeg.readFile("preview.mp3");
      const outputBytes = typeof output === "string" ? new TextEncoder().encode(output) : output;

      if (outputBytes.byteLength === 0) {
        throw new Error("Preview output is empty");
      }

      const audioBuffer = new ArrayBuffer(outputBytes.byteLength);
      new Uint8Array(audioBuffer).set(outputBytes);
      const blob = new Blob([audioBuffer], { type: "audio/mpeg" });
      const file = new File([blob], `${slug}-preview-${safeStart}s-${safeDuration}s.mp3`, { type: "audio/mpeg" });

      generatedPreviewUrlRef.current = URL.createObjectURL(blob);
      setGeneratedPreviewFile(file);
      setGeneratedPreviewUrl(generatedPreviewUrlRef.current);
      setStatus("Preview generado. Reprodúcelo y guarda si te gusta el corte.");
    } catch (error) {
      const errorText = error instanceof Error ? error.message : String(error);
      console.warn("B.R preview generation warning", { title, error });
      setStatus(errorText.includes("404") ? "Archivo de audio no encontrado. Revisa el MP3 del beat." : "No se pudo generar el preview desde el beat completo. Revisa conexión, CORS del audio o dependencias de FFmpeg.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function saveGeneratedPreview() {
    if (!generatedPreviewFile) {
      setStatus("Primero genera un preview desde el beat completo.");
      return;
    }

    setIsSaving(true);
    setStatus("Subiendo preview generado...");

    const result = await updateBeatPreviewWithUpload({
      beatId,
      slug,
      file: generatedPreviewFile,
      durationSeconds,
    });

    setStatus(result.ok ? `Preview publicado correctamente: ${result.durationSeconds}s.` : result.message || "No se pudo guardar el preview generado.");
    setIsSaving(false);

    if (result.ok) {
      await createAdminChangeLog({
        blockTitle: "Preview actualizado",
        eventType: "preview_update",
        targetType: "beat",
        targetName: title,
        description: `Se actualizó el preview de ${title}. Inicio: ${startSecond}s · Duración: ${result.durationSeconds ?? durationSeconds}s.`,
        commandText: "PreviewEditorForm.updateBeatPreviewWithUpload",
        metadata: {
          beatId,
          slug,
          startSecond,
          previousDurationSeconds: initialDurationSeconds,
          nextDurationSeconds: result.durationSeconds ?? durationSeconds,
          changedFields: ["preview_url", "preview_duration_seconds", "preview_updated_at"],
        },
        temporary: true,
      });

      router.refresh();
    }
  }

  return (
    <section className="rounded-lg border border-white/10 bg-[#101317] p-3">
      <div className="mb-3 flex items-center gap-2 text-cyan-200">
        <Scissors className="h-4 w-4" aria-hidden="true" />
        <p className="text-sm font-bold uppercase">Recortar preview desde beat completo</p>
      </div>

      <div className="grid gap-3">
        <div className="rounded-md border border-cyan-300/20 bg-cyan-300/10 p-3">
          <p className="text-sm font-bold text-cyan-100">
            {hasRealPreview ? "Este beat ya tiene preview real separado." : "Este beat todavía usa preview temporal."}
          </p>
          <p className="mt-2 text-sm leading-6 text-cyan-100/80">
            Reproduce el beat completo, marca el segundo inicial, elige duración de 15 a 30 segundos y genera el preview desde el audio original. El archivo completo no se modifica.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-md bg-white/5 p-4">
            <p className="text-xs uppercase text-zinc-500">Preview actual</p>
            <audio className="mt-3 w-full" controls src={currentPreviewUrl}>
              Tu navegador no soporta audio.
            </audio>
          </div>

          <div className="rounded-md bg-white/5 p-4">
            <p className="text-xs uppercase text-zinc-500">Beat completo para recorte</p>
            <audio
              ref={fullAudioRef}
              className="mt-3 w-full"
              controls
              src={authorizedFullAudioUrl}
              onLoadedMetadata={(event) => {
                if (!audioDuration && Number.isFinite(event.currentTarget.duration)) {
                  setAudioDuration(event.currentTarget.duration);
                }
              }}
            >
              Tu navegador no soporta audio.
            </audio>
            <button
              type="button"
              onClick={setCurrentAudioTimeAsStart}
              className="mt-3 inline-flex h-10 items-center rounded-md border border-cyan-300/30 px-4 text-sm font-bold text-cyan-200 hover:border-cyan-300"
            >
              Usar segundo actual como inicio
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-emerald-300/20 bg-black/20 p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">Editor visual de onda</p>
              <p className="text-[11px] text-zinc-500">Click sobre la onda para marcar el inicio exacto del preview.</p>
            </div>
            <span className="rounded-full border border-cyan-300/20 px-2 py-1 text-[11px] font-bold text-cyan-100">
              {audioDuration ? `${Math.round(audioDuration)}s` : isWaveformLoading ? "Analizando..." : "Sin onda"}
            </span>
          </div>

          <div className="relative">
            <canvas
              ref={waveformCanvasRef}
              width={920}
              height={160}
              onClick={selectStartFromWaveform}
              className="h-32 w-full cursor-crosshair rounded-md border border-emerald-300/10 bg-[#05070a]"
              aria-label="Onda visual del beat completo"
            />
            {waveformMessage ? (
              <div className="absolute inset-0 grid place-items-center rounded-md bg-black/45 px-3 text-center text-xs font-bold text-cyan-100">
                {waveformMessage}
              </div>
            ) : null}
          </div>

          <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-zinc-500">
            <span>Inicio: <strong className="text-cyan-100">{startSecond}s</strong></span>
            <span>Duración: <strong className="text-cyan-100">{durationSeconds}s</strong></span>
            <span>Fin estimado: <strong className="text-cyan-100">{startSecond + durationSeconds}s</strong></span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-zinc-300">Segundo inicial del preview</span>
            <input
              type="number"
              min={0}
              value={startSecond}
              onChange={(event) => {
                const nextStart = clampStartSecond(Number(event.target.value));
                setStartSecond(nextStart);
                if (fullAudioRef.current) {
                  fullAudioRef.current.currentTime = nextStart;
                }
              }}
              className="h-12 rounded-md border border-white/10 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-cyan-300"
            />
            <span className="text-xs text-zinc-500">Ejemplo: 8 empieza el preview en el segundo 8 del beat completo.</span>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-zinc-300">Duración del preview</span>
            <select
              value={durationSeconds}
              onChange={(event) => setDurationSeconds(clampPreviewDuration(Number(event.target.value)))}
              className="h-12 rounded-md border border-white/10 bg-[#15181c] px-4 text-sm text-white outline-none focus:border-cyan-300"
            >
              <option value={15}>15 segundos</option>
              <option value={20}>20 segundos</option>
              <option value={25}>25 segundos</option>
              <option value={30}>30 segundos</option>
            </select>
            <span className="text-xs text-zinc-500">Máximo permitido: 30 segundos.</span>
          </label>
        </div>

        <div className="rounded-lg border border-cyan-300/20 bg-[#071012] p-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-4 w-4 text-emerald-300" aria-hidden="true" />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">AI Beat Analysis Lite</p>
                <p className="text-[11px] text-zinc-500">Análisis local con BPM, tonalidad estimada, preview sugerido, metadata, duración y onda real. No llama APIs externas.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-2 py-1 text-[11px] font-bold text-emerald-100">
                {persistedAnalysis ? "Persistido" : "Pendiente"}
              </span>
              <button
                type="button"
                disabled={isWaveformLoading}
                onClick={requestAudioAnalysis}
                className="h-8 rounded-md border border-cyan-300/30 px-2.5 text-[11px] font-bold text-cyan-100 hover:bg-cyan-300/10"
              >
                {isWaveformLoading ? "Procesando..." : "Procesar de nuevo"}
              </button>
            </div>
          </div>

          {analysisProcessMessage ? (
            <p className="mb-3 rounded-md border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs font-semibold text-cyan-100">
              {analysisProcessMessage}
            </p>
          ) : null}

          {persistedAnalysis ? (
            <div className="mb-3 grid gap-2 rounded-md border border-white/10 bg-black/20 p-3 text-[11px] text-zinc-400 sm:grid-cols-4">
              <span>Versión: <strong className="text-cyan-100">{persistedAnalysis.version}</strong></span>
              <span>Último análisis: <strong className="text-cyan-100">{new Date(persistedAnalysis.analyzedAt).toLocaleString("es-MX")}</strong></span>
              <span>Confianza general: <strong className="text-cyan-100">{persistedAnalysis.confidence === null ? "Sin evidencia suficiente" : `${Math.round(persistedAnalysis.confidence * 100)}%`}</strong></span>
              <span>Origen/revisión: <strong className="text-cyan-100">{persistedAnalysis.source} · {persistedAnalysis.reviewStatus}</strong></span>
            </div>
          ) : null}

          <div className="mb-3 grid gap-2 rounded-md border border-cyan-300/10 bg-cyan-300/5 p-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
            <span className="text-zinc-400">BPM detectado: <strong className="text-cyan-100">{(persistedAnalysis?.detectedBpm ?? analysisBpm) || "—"}</strong></span>
            <span className="text-zinc-400">Key detectada: <strong className="text-cyan-100">{(persistedAnalysis?.detectedKey ?? getTopRankedKey(analysisKey, analysisKeyCandidates)) || "—"}</strong></span>
            <span className="text-zinc-400">Género sugerido: <strong className="text-cyan-100">{persistedAnalysis?.detectedGenre && persistedAnalysis.detectedGenre !== "Unclassified" ? persistedAnalysis.detectedGenre : "Sin clasificación confiable"}</strong></span>
            <span className="text-zinc-400">Confianza de género: <strong className="text-cyan-100">{formatGenreConfidence(persistedAnalysis?.features?.classification.confidence)}</strong></span>
            <span className="text-zinc-400">Subgénero sugerido: <strong className="text-cyan-100">{persistedAnalysis?.detectedSubgenres.length ? persistedAnalysis.detectedSubgenres.join(", ") : "Sin inferencia suficiente"}</strong></span>
            <span className="text-zinc-400">Mood detectado: <strong className="text-cyan-100">{persistedAnalysis?.detectedMood ?? "—"}</strong></span>
            <span className="text-zinc-400">Quality Score: <strong className="text-cyan-100">{persistedAnalysis?.qualityScore ?? beatQuality?.score ?? "—"}/100</strong></span>
            <span className="text-zinc-400 sm:col-span-2">Preview recomendado: <strong className="text-cyan-100">{persistedAnalysis?.previewRecommendation ? `${persistedAnalysis.previewRecommendation.startSecond}s / ${persistedAnalysis.previewRecommendation.durationSeconds}s` : `${analysisPreviewStart}s / ${analysisPreviewDuration}s`}</strong></span>
            <span className="text-zinc-400 sm:col-span-2 lg:col-span-3">Metadata actual/manual: <strong className="text-emerald-100">{appliedBpm || "—"} BPM · {appliedMusicalKey || "key pendiente"} · {appliedGenre || "género pendiente"}</strong></span>
            <span className="text-zinc-500 sm:col-span-2 lg:col-span-3">Sugerencia conservadora basada en audio: las dudas quedan sin clasificar y nunca reemplazan metadata editorial sin una acción explícita.</span>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <label className="grid gap-1">
              <span className="text-xs uppercase text-zinc-500">BPM principal</span>
              <input type="number" min={40} max={240} value={analysisBpm} onChange={(event) => setAnalysisBpm(event.target.value)} className="h-9 rounded-md border border-white/10 bg-black/20 px-3 text-sm outline-none focus:border-cyan-300" />
            </label>
            <label className="grid gap-1">
              <span className="text-xs uppercase text-zinc-500">Tonalidad principal</span>
              <input value={getTopRankedKey(analysisKey, analysisKeyCandidates)} onChange={(event) => setAnalysisKey(event.target.value)} placeholder="F minor" className="h-9 rounded-md border border-white/10 bg-black/20 px-3 text-sm outline-none placeholder:text-zinc-600 focus:border-cyan-300" />
            </label>
            <label className="grid gap-1 lg:col-span-3">
              <span className="text-xs uppercase text-zinc-500">Géneros sugeridos</span>
              <input value={analysisGenres} onChange={(event) => setAnalysisGenres(event.target.value)} placeholder="Trap, Drill, Dark" className="h-9 rounded-md border border-white/10 bg-black/20 px-3 text-sm outline-none placeholder:text-zinc-600 focus:border-cyan-300" />
            </label>
            <label className="grid gap-1">
              <span className="text-xs uppercase text-zinc-500">preview_start recomendado</span>
              <input type="number" min={0} value={analysisPreviewStart} onChange={(event) => setAnalysisPreviewStart(event.target.value)} className="h-9 rounded-md border border-white/10 bg-black/20 px-3 text-sm outline-none focus:border-cyan-300" />
            </label>
            <label className="grid gap-1">
              <span className="text-xs uppercase text-zinc-500">preview_duration recomendado</span>
              <select value={analysisPreviewDuration} onChange={(event) => setAnalysisPreviewDuration(normalizePreviewDuration(Number(event.target.value)))} className="h-9 rounded-md border border-white/10 bg-[#101317] px-3 text-sm outline-none focus:border-cyan-300">
                <option value={15}>15 segundos</option>
                <option value={20}>20 segundos</option>
                <option value={25}>25 segundos</option>
                <option value={30}>30 segundos</option>
              </select>
            </label>
            <label className="grid gap-1 lg:col-span-3">
              <span className="text-xs uppercase text-zinc-500">Resumen / notas de análisis</span>
              <textarea value={analysisNotes} onChange={(event) => setAnalysisNotes(event.target.value)} className="min-h-16 rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none placeholder:text-zinc-600 focus:border-cyan-300" placeholder="Ej: energía alta en el hook, mejor entrada después del drop." />
            </label>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" disabled={Boolean(isApplyingAnalysis)} onClick={() => void applySuggestedPreview()} className="h-9 rounded-md border border-emerald-300/30 px-3 text-xs font-bold text-emerald-100 hover:bg-emerald-300/10 disabled:cursor-not-allowed disabled:opacity-60">
              {isApplyingAnalysis === "preview" ? "Aplicando..." : "Usar preview sugerido"}
            </button>
            <button type="button" disabled={Boolean(isApplyingAnalysis)} onClick={() => void applyFullAnalysis()} className="h-9 rounded-md border border-emerald-300/40 bg-emerald-300/10 px-3 text-xs font-bold text-emerald-100 hover:bg-emerald-300/20 disabled:cursor-not-allowed disabled:opacity-60">
              {isApplyingAnalysis === "full" ? "Aplicando..." : "Aplicar análisis completo"}
            </button>
            <button type="button" disabled={Boolean(isApplyingAnalysis)} onClick={clearAnalysis} className="h-9 rounded-md border border-white/10 px-3 text-xs font-bold text-zinc-300 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60">
              Limpiar análisis
            </button>
          </div>

          <details className="mt-3 rounded-md border border-white/10 bg-black/20 p-3">
            <summary className="cursor-pointer text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">
              Avanzado / ajustes manuales
            </summary>

            <div className="mt-3 rounded-md border border-emerald-300/10 bg-emerald-300/5 p-3">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-300">Diagnóstico IA del audio</p>
              {audioDiagnostics ? (
                <>
                  <div className="mt-3 grid gap-2 text-xs text-zinc-300 sm:grid-cols-2 lg:grid-cols-4">
                    <span>Duración: <strong className="text-cyan-100">{audioDiagnostics.durationSeconds}s</strong></span>
                    <span>Sample rate: <strong className="text-cyan-100">{audioDiagnostics.sampleRate} Hz</strong></span>
                    <span>Canales: <strong className="text-cyan-100">{audioDiagnostics.channels}</strong></span>
                    <span>RMS: <strong className="text-cyan-100">{audioDiagnostics.rms}</strong></span>
                    <span>Peak: <strong className="text-cyan-100">{audioDiagnostics.peak}</strong></span>
                    <span>Rango dinámico: <strong className="text-cyan-100">{audioDiagnostics.dynamicRange}</strong></span>
                    <span>Promedio onda: <strong className="text-cyan-100">{audioDiagnostics.waveformAverage}</strong></span>
                    <span>Picos de onda: <strong className="text-cyan-100">{Math.round(audioDiagnostics.waveformPeakRatio * 100)}%</strong></span>
                  </div>

                  {beatQuality ? (
                    <div className="mt-3 rounded-md border border-emerald-300/10 bg-black/20 p-2">
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-200">Beat Quality Score</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-300">
                        <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-2 py-1 font-bold text-emerald-100">
                          {beatQuality.score}/100 · {beatQuality.grade}
                        </span>
                        <span>Loudness: <strong className="text-cyan-100">{beatQuality.sections.loudness}</strong></span>
                        <span>Dynamics: <strong className="text-cyan-100">{beatQuality.sections.dynamics}</strong></span>
                        <span>Peak: <strong className="text-cyan-100">{beatQuality.sections.peakHealth}</strong></span>
                        <span>Musical: <strong className="text-cyan-100">{beatQuality.sections.musicalStability}</strong></span>
                      </div>
                      {beatQuality.warnings.length ? (
                        <p className="mt-2 text-xs text-amber-300">{beatQuality.warnings[0]}</p>
                      ) : (
                        <p className="mt-2 text-xs text-emerald-200">{beatQuality.strengths[0]}</p>
                      )}
                    </div>
                  ) : null}

                  {musicFeatures ? (
                    <div className="mt-3 rounded-md border border-purple-300/10 bg-black/20 p-2">
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-purple-200">Music Features Engine</p>
                      <div className="mt-2 grid gap-2 text-xs text-zinc-300 sm:grid-cols-2 lg:grid-cols-4">
                        <span>Energy: <strong className="text-cyan-100">{musicFeatures.energy.score}</strong> · {musicFeatures.energy.label}</span>
                        <span>Bass: <strong className="text-cyan-100">{musicFeatures.bass.score}</strong> · {musicFeatures.bass.label}</span>
                        <span>Drums: <strong className="text-cyan-100">{musicFeatures.drums.score}</strong> · {musicFeatures.drums.label}</span>
                        <span>Stereo: <strong className="text-cyan-100">{musicFeatures.stereo.score}</strong> · {musicFeatures.stereo.label}</span>
                        <span>Danceability: <strong className="text-cyan-100">{musicFeatures.danceability.score}</strong> · {musicFeatures.danceability.label}</span>
                        <span>Aggressive: <strong className="text-cyan-100">{musicFeatures.aggressiveness.score}</strong> · {musicFeatures.aggressiveness.label}</span>
                        <span>Musicality: <strong className="text-cyan-100">{musicFeatures.musicality.score}</strong> · {musicFeatures.musicality.label}</span>
                        <span>Vocals: <strong className="text-cyan-100">{Math.round(musicFeatures.vocals.vocalProbability * 100)}%</strong> · {musicFeatures.vocals.label}</span>
                      </div>
                      <p className="mt-2 text-xs text-zinc-500">
                        Frames analizados: {analysisFrameCount} · Brightness: {musicFeatures.brightness.label} · Dynamics: {musicFeatures.dynamics.label}
                      </p>
                    </div>
                  ) : null}

                  <div className="mt-3 rounded-md border border-cyan-300/10 bg-black/20 p-2">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-cyan-200">Ranking de tonalidad</p>
                    {analysisKeyStatus === "ambiguous_key" ? (
                      <p className="mt-2 text-xs font-semibold text-amber-300">
                        La IA encontró varias tonalidades con puntuaciones muy similares. Revisa las dos primeras opciones antes de aplicar la tonalidad.
                      </p>
                    ) : null}
                    {analysisKeyCandidates.length ? (
                      <div className="mt-2 grid gap-1 text-xs text-zinc-300 sm:grid-cols-2 lg:grid-cols-4">
                        {analysisKeyCandidates.map((candidate) => (
                          <span key={`${candidate.key}-${candidate.score}`}>
                            {candidate.key}: <strong className="text-cyan-100">{candidate.score.toFixed(3)}</strong>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-zinc-500">Sin ranking de tonalidad disponible{analysisKeyStatus ? ` (${analysisKeyStatus})` : ""}.</p>
                    )}
                  </div>
                </>
              ) : (
                <p className="mt-2 text-xs text-zinc-500">Sin diagnóstico disponible. Carga el beat completo para analizar el audio.</p>
              )}
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <label className="grid gap-1">
                <span className="text-xs uppercase text-zinc-500">BPM alternativos</span>
                <input value={analysisAlternativeBpms} onChange={(event) => setAnalysisAlternativeBpms(event.target.value)} placeholder="140, 70, 142" className="h-9 rounded-md border border-white/10 bg-black/20 px-3 text-sm outline-none placeholder:text-zinc-600 focus:border-cyan-300" />
              </label>
              <label className="grid gap-1">
                <span className="text-xs uppercase text-zinc-500">Tonalidades alternativas</span>
                <input value={analysisAlternativeKeys} onChange={(event) => setAnalysisAlternativeKeys(event.target.value)} placeholder="Ab major, C minor" className="h-9 rounded-md border border-white/10 bg-black/20 px-3 text-sm outline-none placeholder:text-zinc-600 focus:border-cyan-300" />
              </label>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" disabled={Boolean(isApplyingAnalysis)} onClick={() => void applyAnalysisBpm()} className="h-9 rounded-md border border-cyan-300/30 px-3 text-xs font-bold text-cyan-100 hover:bg-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-60">
                {isApplyingAnalysis === "bpm" ? "Aplicando..." : "Aplicar solo BPM"}
              </button>
              <button type="button" disabled={Boolean(isApplyingAnalysis)} onClick={() => void applyAnalysisKey()} className="h-9 rounded-md border border-cyan-300/30 px-3 text-xs font-bold text-cyan-100 hover:bg-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-60">
                {isApplyingAnalysis === "key" ? "Aplicando..." : "Aplicar tonalidad principal"}
              </button>
              <button type="button" disabled={Boolean(isApplyingAnalysis)} onClick={() => void applyAnalysisGenres()} className="h-9 rounded-md border border-cyan-300/30 px-3 text-xs font-bold text-cyan-100 hover:bg-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-60">
                {isApplyingAnalysis === "genre" ? "Aplicando..." : "Aplicar solo géneros"}
              </button>
            </div>
          </details>
        </div>

        <button
          type="button"
          disabled={isGenerating || isSaving}
          onClick={() => void generatePreviewFromFullBeat()}
          className="inline-flex h-11 w-fit items-center gap-2 rounded-md border border-cyan-300/30 px-5 text-sm font-bold text-cyan-200 hover:border-cyan-300 hover:bg-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Scissors className="h-4 w-4" aria-hidden="true" />
          {isGenerating ? "Generando preview..." : `Generar preview de ${durationSeconds}s`}
        </button>

        {generatedPreviewUrl ? (
          <div className="rounded-lg border border-cyan-300/20 bg-white/5 p-4">
            <p className="font-bold text-cyan-100">Preview generado</p>
            <p className="mt-2 text-sm text-zinc-400">
              Corte: desde {startSecond}s por {durationSeconds}s · Tamaño: {generatedPreviewFile ? formatFileSize(generatedPreviewFile.size) : "calculando"}
            </p>
            <audio className="mt-3 w-full" controls src={generatedPreviewUrl}>
              Tu navegador no soporta audio.
            </audio>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => void saveGeneratedPreview()}
              className="mt-4 inline-flex h-11 w-fit items-center gap-2 rounded-md bg-cyan-300 px-5 text-sm font-bold text-black hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              {isSaving ? "Guardando..." : "Guardar preview generado"}
            </button>
          </div>
        ) : null}

        {status ? <p className="text-sm font-semibold text-cyan-200">{status}</p> : null}

        <p className="text-xs leading-6 text-zinc-500">
          Beat: {title} · slug: {slug} · ID: {beatId}
        </p>
      </div>
    </section>
  );
}
