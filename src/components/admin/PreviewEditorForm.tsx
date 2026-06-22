"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Scissors } from "lucide-react";
import { createAdminChangeLog, updateBeatPreviewWithUpload } from "@/lib/supabase/queries";

function formatFileSize(size: number) {
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

function clampPreviewDuration(value: number) {
  return Math.min(30, Math.max(15, Math.round(value || 15)));
}

function clampStartSecond(value: number) {
  return Math.max(0, Math.round(value || 0));
}

function buildWaveformSamples(buffer: AudioBuffer, sampleCount = 180) {
  const channelData = buffer.getChannelData(0);
  const blockSize = Math.max(1, Math.floor(channelData.length / sampleCount));
  const samples: number[] = [];

  for (let index = 0; index < sampleCount; index += 1) {
    const start = index * blockSize;
    let sum = 0;

    for (let sampleIndex = 0; sampleIndex < blockSize && start + sampleIndex < channelData.length; sampleIndex += 1) {
      sum += Math.abs(channelData[start + sampleIndex]);
    }

    samples.push(Math.min(1, sum / blockSize));
  }

  const maxSample = Math.max(...samples, 0.01);
  return samples.map((sample) => sample / maxSample);
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

type PreviewEditorFormProps = {
  beatId: string;
  slug: string;
  title: string;
  currentPreviewUrl: string;
  fullAudioUrl: string;
  initialDurationSeconds?: number;
};

export function PreviewEditorForm({
  beatId,
  slug,
  title,
  currentPreviewUrl,
  fullAudioUrl,
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
  const [status, setStatus] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const hasRealPreview = Boolean(currentPreviewUrl && currentPreviewUrl !== fullAudioUrl);

  useEffect(() => {
    let isMounted = true;

    async function loadWaveform() {
      setIsWaveformLoading(true);

      try {
        const response = await fetch(fullAudioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioContext = new AudioContext();
        const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
        const samples = buildWaveformSamples(decodedBuffer);
        await audioContext.close();

        if (!isMounted) {
          return;
        }

        setWaveformSamples(samples);
        setAudioDuration(decodedBuffer.duration);
      } catch (error) {
        console.error("B.R waveform analysis error", error);
        if (isMounted) {
          setStatus("No se pudo leer la onda del beat. Puedes seguir usando el recorte manual.");
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
  }, [fullAudioUrl]);

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
      console.error("B.R preview generation error", error);
      setStatus("No se pudo generar el preview desde el beat completo. Revisa conexión, CORS del audio o dependencias de FFmpeg.");
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
            <audio ref={fullAudioRef} className="mt-3 w-full" controls src={fullAudioUrl}>
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

          <canvas
            ref={waveformCanvasRef}
            width={920}
            height={160}
            onClick={selectStartFromWaveform}
            className="h-32 w-full cursor-crosshair rounded-md border border-emerald-300/10 bg-[#05070a]"
            aria-label="Onda visual del beat completo"
          />

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
