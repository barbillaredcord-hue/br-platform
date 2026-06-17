"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, UploadCloud } from "lucide-react";
import { updateBeatPreviewWithUpload } from "@/lib/supabase/queries";

function formatFileSize(size: number) {
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
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
  const [durationSeconds, setDurationSeconds] = useState(Math.min(30, Math.max(15, initialDurationSeconds || 15)));
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fileInfo = useMemo(() => {
    if (!file) {
      return null;
    }

    return {
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type || "audio/mpeg",
    };
  }, [file]);

  const hasRealPreview = Boolean(currentPreviewUrl && currentPreviewUrl !== fullAudioUrl);

  async function savePreview() {
    if (!file) {
      setStatus("Selecciona un MP3 de preview antes de guardar.");
      return;
    }

    if (durationSeconds < 15 || durationSeconds > 30) {
      setStatus("La duración del preview debe estar entre 15 y 30 segundos.");
      return;
    }

    setIsSaving(true);
    setStatus("Subiendo preview real...");

    const result = await updateBeatPreviewWithUpload({
      beatId,
      slug,
      file,
      durationSeconds,
    });

    setStatus(result.ok ? "Preview actualizado correctamente." : result.message || "No se pudo actualizar el preview.");
    setIsSaving(false);

    if (result.ok) {
      router.refresh();
    }
  }

  return (
    <section className="rounded-lg border border-white/10 bg-[#101317] p-5">
      <div className="mb-5 flex items-center gap-2 text-cyan-200">
        <UploadCloud className="h-4 w-4" aria-hidden="true" />
        <p className="text-sm font-bold uppercase">Preview real</p>
      </div>

      <div className="grid gap-5">
        <div className="rounded-md border border-cyan-300/20 bg-cyan-300/10 p-4">
          <p className="text-sm font-bold text-cyan-100">
            {hasRealPreview ? "Este beat ya tiene preview real separado." : "Este beat todavía usa preview temporal."}
          </p>
          <p className="mt-2 text-sm leading-6 text-cyan-100/80">
            Sube aquí un MP3 ya cortado entre 15 y 30 segundos. El archivo completo no se modifica.
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
            <p className="text-xs uppercase text-zinc-500">Beat completo</p>
            <audio className="mt-3 w-full" controls src={fullAudioUrl}>
              Tu navegador no soporta audio.
            </audio>
          </div>
        </div>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-zinc-300">Nuevo archivo preview MP3</span>
          <input
            type="file"
            accept=".mp3,audio/mpeg"
            onChange={(event) => {
              const selectedFile = event.target.files?.[0] ?? null;
              setFile(selectedFile);
              setStatus("");
            }}
            className="rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300 file:mr-4 file:rounded-md file:border-0 file:bg-cyan-300 file:px-3 file:py-2 file:text-sm file:font-bold file:text-black"
          />
        </label>

        {fileInfo ? (
          <div className="grid gap-3 rounded-lg border border-cyan-300/20 bg-white/5 p-4 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase text-zinc-500">Archivo</p>
              <p className="mt-1 truncate text-sm font-semibold">{fileInfo.name}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-zinc-500">Tamaño</p>
              <p className="mt-1 text-sm font-semibold">{fileInfo.size}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-zinc-500">Tipo</p>
              <p className="mt-1 text-sm font-semibold">{fileInfo.type}</p>
            </div>
          </div>
        ) : null}

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-zinc-300">Duración declarada del preview</span>
          <select
            value={durationSeconds}
            onChange={(event) => setDurationSeconds(Number(event.target.value))}
            className="h-12 rounded-md border border-white/10 bg-[#15181c] px-4 text-sm text-white outline-none focus:border-cyan-300"
          >
            <option value={15}>15 segundos</option>
            <option value={20}>20 segundos</option>
            <option value={25}>25 segundos</option>
            <option value={30}>30 segundos</option>
          </select>
          <span className="text-xs text-zinc-500">
            Máximo permitido: 30 segundos. Recomendado: 15 segundos para catálogo público.
          </span>
        </label>

        <button
          type="button"
          disabled={isSaving}
          onClick={() => void savePreview()}
          className="inline-flex h-11 w-fit items-center gap-2 rounded-md bg-cyan-300 px-5 text-sm font-bold text-black hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          {isSaving ? "Guardando..." : `Guardar preview de ${durationSeconds}s`}
        </button>

        {status ? <p className="text-sm font-semibold text-cyan-200">{status}</p> : null}

        <p className="text-xs leading-6 text-zinc-500">
          Beat: {title} · slug: {slug} · ID: {beatId}
        </p>
      </div>
    </section>
  );
}
