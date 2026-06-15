"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Wand2 } from "lucide-react";

const keys = [
  "C Minor",
  "D Minor",
  "E Minor",
  "F Minor",
  "G Minor",
  "A Minor",
  "B Minor",
  "C Major",
  "D Major",
  "E Major",
  "F Major",
  "G Major",
  "A Major",
  "B Major",
];

function estimateBpm(filename: string) {
  const total = Array.from(filename).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return 80 + (total % 81);
}

function estimateKey(filename: string) {
  const total = Array.from(filename).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return keys[total % keys.length];
}

function formatFileSize(size: number) {
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

export function NewBeatForm() {
  const [name, setName] = useState("");
  const [genre, setGenre] = useState("");
  const [bpm, setBpm] = useState("");
  const [key, setKey] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewStatus, setPreviewStatus] = useState("");
  const [saveStatus, setSaveStatus] = useState("");

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

  return (
    <form className="grid gap-6 rounded-lg border border-white/10 bg-[#101317] p-5 md:grid-cols-2">
      <label className="grid gap-2">
        <span className="text-sm font-semibold text-zinc-300">Nombre</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ej. Metro Aqua"
          className="h-12 rounded-md border border-white/10 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-cyan-300"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold text-zinc-300">Género</span>
        <input
          value={genre}
          onChange={(event) => setGenre(event.target.value)}
          placeholder="Trap, Drill, Reggaeton..."
          className="h-12 rounded-md border border-white/10 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-cyan-300"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold text-zinc-300">BPM</span>
        <input
          value={bpm}
          onChange={(event) => setBpm(event.target.value)}
          type="number"
          placeholder="144"
          className="h-12 rounded-md border border-white/10 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-cyan-300"
        />
        {file ? <span className="text-xs text-cyan-200">BPM detectado automáticamente (demo)</span> : null}
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold text-zinc-300">Tonalidad</span>
        <input
          value={key}
          onChange={(event) => setKey(event.target.value)}
          placeholder="F Minor"
          className="h-12 rounded-md border border-white/10 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-cyan-300"
        />
        {file ? <span className="text-xs text-cyan-200">Tonalidad detectada automáticamente (demo)</span> : null}
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold text-zinc-300">Portada</span>
        <input
          type="file"
          className="rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300 file:mr-4 file:rounded-md file:border-0 file:bg-cyan-300 file:px-3 file:py-2 file:text-sm file:font-bold file:text-black"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold text-zinc-300">Archivo Beat Completo</span>
        <input
          type="file"
          accept=".mp3,audio/mpeg"
          onChange={(event) => {
            const selectedFile = event.target.files?.[0] ?? null;
            setFile(selectedFile);
            setPreviewStatus("");
            setSaveStatus("");

            if (selectedFile) {
              const beatName = selectedFile.name.replace(/\.mp3$/i, "");
              setName(beatName);
              setBpm(String(estimateBpm(selectedFile.name)));
              setKey(estimateKey(selectedFile.name));
            }
          }}
          className="rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300 file:mr-4 file:rounded-md file:border-0 file:bg-cyan-300 file:px-3 file:py-2 file:text-sm file:font-bold file:text-black"
        />
      </label>

      {fileInfo ? (
        <section className="rounded-lg border border-cyan-300/20 bg-white/5 p-4 md:col-span-2">
          <p className="font-bold">Vista previa del archivo</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <div>
              <p className="text-xs uppercase text-zinc-500">Nombre original</p>
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
            <div>
              <p className="text-xs uppercase text-zinc-500">Estado</p>
              <p className="mt-1 text-sm font-semibold text-cyan-200">Listo para procesar</p>
            </div>
          </div>
        </section>
      ) : null}

      <div className="rounded-lg border border-cyan-300/20 bg-white/5 p-4 md:col-span-2">
        <p className="font-bold">Generar Preview</p>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Demo visual para crear un preview de 15 segundos a partir del beat completo.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setPreviewStatus("Preview generado en modo demo")}
            className="inline-flex h-11 items-center gap-2 rounded-md bg-cyan-300 px-5 text-sm font-bold text-black hover:bg-cyan-200"
          >
            <Wand2 className="h-4 w-4" aria-hidden="true" />
            Generar Preview 15s
          </button>
          <button
            type="button"
            onClick={() => setSaveStatus("Beat preparado. En la siguiente fase se conectará con base de datos/storage.")}
            className="inline-flex h-11 items-center gap-2 rounded-md border border-cyan-300/30 px-5 text-sm font-bold text-cyan-200 hover:border-cyan-300 hover:bg-cyan-300/10"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            Guardar Beat
          </button>
          <Link href="/admin/beats" className="inline-flex h-11 items-center gap-2 rounded-md border border-white/10 px-5 text-sm font-bold text-zinc-200 hover:border-cyan-300 hover:text-cyan-200">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver a Beats
          </Link>
        </div>
        {previewStatus ? <p className="mt-4 text-sm font-semibold text-cyan-200">{previewStatus}</p> : null}
        {saveStatus ? <p className="mt-2 text-sm font-semibold text-cyan-200">{saveStatus}</p> : null}
      </div>
    </form>
  );
}
