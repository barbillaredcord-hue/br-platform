"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BrainCircuit, Save, Scissors } from "lucide-react";
import { analyze } from "web-audio-beat-detector";
import { classifyBeatFromRealData } from "@/lib/beat-metadata";
import { normalizeDetectedBpm } from "@/lib/music-analysis/bpm";
import { analyzeAudioDiagnostics } from "@/lib/music-analysis/diagnostics";
import { buildWaveformSamples } from "@/lib/music-analysis/engine";
import { detectKeyFromAudioBuffer } from "@/lib/music-analysis/key";
import type { KeyCandidate } from "@/lib/music-analysis/key";
import type { AudioDiagnostics } from "@/lib/music-analysis/types";
import { createAdminChangeLog, updateBeatMetadataAsAdmin, updateBeatPreviewWithUpload } from "@/lib/supabase/queries";

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
  fullAudioUrl: string;
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
  fullAudioUrl,
  currentBpm,
  currentGenre,
  currentMusicalKey = "",
  initialDurationSeconds = 15,
}: PreviewEditorFormProps) {
  const router = useRouter();
  const fullAudioRef = useRef<HTMLAudioElement | null>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const generatedPreviewUrlRef = useRef<string | null>(null);
  const [startSecond, setStartSecond] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(clampPreviewDuration(initialDurationSeconds));
  const [generatedPreviewFile, setGeneratedPreviewFile] = useState<File | null>(null);
  const [generatedPreviewUrl, setGeneratedPreviewUrl] = useState("");
  const [waveformSamples, setWaveformSamples] = useState<number[]>([]);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isWaveformLoading, setIsWaveformLoading] = useState(false);
  const [waveformMessage, setWaveformMessage] = useState("");
  const [audioDiagnostics, setAudioDiagnostics] = useState<AudioDiagnostics | null>(null);
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
  const [analysisProcessCount, setAnalysisProcessCount] = useState(0);
  const [lastAnalysisSignature, setLastAnalysisSignature] = useState("");
  const [analysisProcessMessage, setAnalysisProcessMessage] = useState("");

  const hasRealPreview = Boolean(currentPreviewUrl && currentPreviewUrl !== fullAudioUrl);

  useEffect(() => {
    let isMounted = true;

    async function loadWaveform() {
      setIsWaveformLoading(true);
      setWaveformMessage("");

      try {
        const response = await fetch(fullAudioUrl);
        if (!response.ok) {
          throw new Error(`Waveform fetch failed: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const audioContext = new AudioContext();
        const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
        const samples = buildWaveformSamples(decodedBuffer);
        const diagnostics = analyzeAudioDiagnostics(decodedBuffer, samples);
        let detectedBpm = 0;
        let detectedAlternativeBpms: number[] = [];
        let detectedBpmReason = "";
        let detectedKey = "";
        let detectedAlternativeKeys: string[] = [];
        let detectedKeyConfidence = 0;
        let detectedKeyCandidates: KeyCandidate[] = [];
        let detectedKeyStatus = "";

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
          detectedKey = keyAnalysis.primary;
          detectedAlternativeKeys = keyAnalysis.alternatives;
          detectedKeyConfidence = keyAnalysis.confidence;
          detectedKeyCandidates = keyAnalysis.candidates;
          detectedKeyStatus = keyAnalysis.reason ?? "ok";
        } catch (keyError) {
          detectedKeyStatus = "key_detection_error";
          console.warn("B.R key detection unavailable", { title, keyError });
        }

        await audioContext.close();

        if (!isMounted) {
          return;
        }

        setWaveformSamples(samples);
        setAudioDuration(decodedBuffer.duration);
        setAudioDiagnostics(diagnostics);
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

        const bpmText = detectedAlternativeBpms.length
          ? `${detectedBpm} BPM · alternativo ${detectedAlternativeBpms.join(", ")} (${detectedBpmReason})`
          : `${detectedBpm} BPM`;

        const keyText = detectedKey
          ? `${detectedKey} (${Math.round(detectedKeyConfidence * 100)}%)${detectedAlternativeKeys.length ? ` · alternativas ${detectedAlternativeKeys.join(", ")}` : ""}`
          : "";

        if (detectedBpm >= 40 && detectedBpm <= 240 && detectedKey) {
          setAnalysisProcessMessage(`BPM y tonalidad detectados desde audio: ${bpmText} · ${keyText}. Revisa antes de aplicar.`);
        } else if (detectedBpm >= 40 && detectedBpm <= 240) {
          setAnalysisProcessMessage(`BPM detectado desde audio: ${bpmText}. Revisa antes de aplicar.`);
        } else if (detectedKey) {
          setAnalysisProcessMessage(`Tonalidad detectada desde audio: ${keyText}. Revisa antes de aplicar.`);
        }
      } catch (error) {
        console.warn("B.R waveform unavailable", { title, fullAudioUrl, error });
        if (isMounted) {
          setWaveformSamples([]);
          setAudioDiagnostics(null);
          setAnalysisKeyCandidates([]);
          setAnalysisKeyStatus("waveform_load_error");
          setWaveformMessage("No se pudo leer onda; usa recorte manual.");
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
  }, [fullAudioUrl, title]);

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
    const nextKey = analysisKey.trim();

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
    const nextKey = analysisKey.trim();
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
    const result = await updateBeatMetadataAsAdmin(beatId, {
      bpm: roundedBpm,
      musicalKey: nextKey,
      genre: nextGenre,
    });

    if (result.ok) {
      setAppliedBpm(roundedBpm);
      setAppliedMusicalKey(nextKey);
      setAppliedGenre(nextGenre);
      setStartSecond(nextStart);
      setDurationSeconds(nextDuration);

      if (fullAudioRef.current) {
        fullAudioRef.current.currentTime = nextStart;
      }

      await logAnalysisChange({
        blockTitle: "AI Lite: análisis completo aplicado",
        eventType: "ai_full_apply",
        description: `Se aplicó análisis completo para ${title}: ${roundedBpm} BPM · ${nextKey} · ${nextGenre} · preview ${nextStart}s/${nextDuration}s.`,
        previousValue,
        nextValue,
      });

      setStatus("Análisis completo aplicado al metadata del beat. Genera y guarda el preview si quieres publicar el corte sugerido.");
      router.refresh();
    } else {
      setStatus(result.message ?? "No se pudo aplicar el análisis completo.");
    }

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
    setAnalysisProcessCount(0);
    setLastAnalysisSignature("");
    setAnalysisProcessMessage("");
    setAudioDiagnostics(null);
    setStatus("AI Beat Analysis Lite limpiado.");
  }

  function reprocessAnalysis() {
    const classification = classifyBeatFromRealData({
      title,
      audioUrl: fullAudioUrl,
      currentGenre: "",
      currentBpm: Number(analysisBpm) || currentBpm || null,
      currentKey: analysisKey || currentMusicalKey || null,
      durationSeconds: audioDuration || initialDurationSeconds,
      waveformSamples,
      notes: analysisNotes,
    });
    const nextGenres = [classification.primaryGenre, ...classification.subgenres].filter((value, index, values) => value && values.indexOf(value) === index).join(", ");
    const nextCount = analysisProcessCount + 1;
    const nextSignature = [
      analysisBpm,
      analysisKey.toLowerCase(),
      nextGenres.toLowerCase(),
      classification.mood.toLowerCase(),
      classification.energy.toLowerCase(),
      classification.useCase.toLowerCase(),
      String(audioDuration || initialDurationSeconds),
      String(waveformSamples.length),
      analysisNotes.trim().toLowerCase(),
    ].join("|");
    const isStable = Boolean(lastAnalysisSignature) && lastAnalysisSignature === nextSignature;

    setAnalysisProcessCount(nextCount);
    setLastAnalysisSignature(nextSignature);
    setAnalysisGenres(nextGenres);
    setAnalysisPreviewStart(String(clampStartSecond(classification.recommendedPreviewStart)));
    setAnalysisPreviewDuration(normalizePreviewDuration(classification.recommendedPreviewDuration));
    setAnalysisNotes(classification.reasoning);
    setAnalysisProcessMessage(
      isStable
        ? `Coincidencia estable: ${classification.primaryGenre} · ${classification.mood} · ${classification.energy} · ${classification.useCase} · preview ${classification.recommendedPreviewStart}s/${classification.recommendedPreviewDuration}s · confianza ${Math.round(classification.confidence * 100)}%`
        : nextCount === 1
          ? `Análisis real generado: ${classification.primaryGenre} · ${classification.mood} · ${classification.energy} · ${classification.useCase} · preview ${classification.recommendedPreviewStart}s/${classification.recommendedPreviewDuration}s · fuente ${classification.source} · confianza ${Math.round(classification.confidence * 100)}%`
          : `Datos reales reprocesados: ${classification.primaryGenre} · ${classification.mood} · ${classification.energy} · ${classification.useCase} · preview ${classification.recommendedPreviewStart}s/${classification.recommendedPreviewDuration}s · confianza ${Math.round(classification.confidence * 100)}%`,
    );
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
      const [{ FFmpeg }, { fetchFile, toBlobURL }] = await Promise.all([import("@ffmpeg/ffmpeg"), import("@ffmpeg/util")]);
      const ffmpeg = new FFmpeg();
      const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";

      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
      });

      setStatus("Validando archivo de audio...");
      const isAudioMissing = await audioUrlLooksMissing(fullAudioUrl);

      if (isAudioMissing) {
        setStatus("Archivo de audio no encontrado. Revisa el MP3 del beat.");
        return;
      }

      setStatus("Descargando beat completo para recortar preview...");
      await ffmpeg.writeFile("input.mp3", await fetchFile(fullAudioUrl));

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
      console.warn("B.R preview generation warning", { title, fullAudioUrl, error });
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
              src={fullAudioUrl}
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
                {analysisProcessMessage ? "Analizado" : "Pendiente"}
              </span>
              <button
                type="button"
                onClick={reprocessAnalysis}
                className="h-8 rounded-md border border-cyan-300/30 px-2.5 text-[11px] font-bold text-cyan-100 hover:bg-cyan-300/10"
              >
                Analizar Beat
              </button>
            </div>
          </div>

          {analysisProcessMessage ? (
            <p className="mb-3 rounded-md border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs font-semibold text-cyan-100">
              {analysisProcessMessage}
            </p>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <label className="grid gap-1">
              <span className="text-xs uppercase text-zinc-500">BPM principal</span>
              <input type="number" min={40} max={240} value={analysisBpm} onChange={(event) => setAnalysisBpm(event.target.value)} className="h-9 rounded-md border border-white/10 bg-black/20 px-3 text-sm outline-none focus:border-cyan-300" />
            </label>
            <label className="grid gap-1">
              <span className="text-xs uppercase text-zinc-500">Tonalidad principal</span>
              <input value={analysisKey} onChange={(event) => setAnalysisKey(event.target.value)} placeholder="F minor" className="h-9 rounded-md border border-white/10 bg-black/20 px-3 text-sm outline-none placeholder:text-zinc-600 focus:border-cyan-300" />
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
                {isApplyingAnalysis === "key" ? "Aplicando..." : "Aplicar solo tonalidad"}
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
