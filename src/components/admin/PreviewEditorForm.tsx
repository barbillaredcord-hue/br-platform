"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Scissors } from "lucide-react";
import { updateBeatPreviewWithUpload } from "@/lib/supabase/queries";

function formatFileSize(size: number) {
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

function clampPreviewDuration(value: number) {
  return Math.min(30, Math.max(15, Math.round(value || 15)));
}

function clampStartSecond(value: number) {
  return Math.max(0, Math.round(value || 0));
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
  const generatedPreviewUrlRef = useRef<string | null>(null);
  const [startSecond, setStartSecond] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(clampPreviewDuration(initialDurationSeconds));
  const [generatedPreviewFile, setGeneratedPreviewFile] = useState<File | null>(null);
  const [generatedPreviewUrl, setGeneratedPreviewUrl] = useState("");
  const [status, setStatus] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const hasRealPreview = Boolean(currentPreviewUrl && currentPreviewUrl !== fullAudioUrl);

  function setCurrentAudioTimeAsStart() {
    const nextStart = clampStartSecond(fullAudioRef.current?.currentTime ?? 0);
    setStartSecond(nextStart);
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
      await ffmpeg.exec(["-ss", String(safeStart), "-i", "input.mp3", "-t", String(safeDuration), "-c", "copy", "preview.mp3"]);

      const output = await ffmpeg.readFile("preview.mp3");
      const outputBytes = typeof output === "string" ? new TextEncoder().encode(output) : output;
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

    setStatus(result.ok ? "Preview generado guardado correctamente." : result.message || "No se pudo guardar el preview generado.");
    setIsSaving(false);

    if (result.ok) {
      router.refresh();
    }
  }

  return (
    <section className="rounded-lg border border-white/10 bg-[#101317] p-5">
      <div className="mb-5 flex items-center gap-2 text-cyan-200">
        <Scissors className="h-4 w-4" aria-hidden="true" />
        <p className="text-sm font-bold uppercase">Recortar preview desde beat completo</p>
      </div>

      <div className="grid gap-5">
        <div className="rounded-md border border-cyan-300/20 bg-cyan-300/10 p-4">
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

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-zinc-300">Segundo inicial del preview</span>
            <input
              type="number"
              min={0}
              value={startSecond}
              onChange={(event) => setStartSecond(clampStartSecond(Number(event.target.value)))}
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