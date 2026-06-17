"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { detectBeatMetadata } from "@/lib/beat-metadata";
import { createBeatWithUpload } from "@/lib/supabase/queries";

function formatFileSize(size: number) {
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function NewBeatForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [genre, setGenre] = useState("");
  const [bpm, setBpm] = useState("");
  const [key, setKey] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewStatus, setPreviewStatus] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [createdSlug, setCreatedSlug] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [metadataEdited, setMetadataEdited] = useState({ genre: false, bpm: false, key: false });

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

  function applySuggestedMetadata(nextName: string, nextFile: File | null) {
    if (!nextName.trim() && !nextFile?.name) {
      return;
    }

    const suggested = detectBeatMetadata({ title: nextName, fileName: nextFile?.name });

    if (!metadataEdited.genre) {
      setGenre(suggested.genre);
    }

    if (!metadataEdited.bpm && suggested.bpm) {
      setBpm(String(suggested.bpm));
    }

    if (!metadataEdited.key && suggested.key) {
      setKey(suggested.key);
    }
  }

  return (
    <form className="grid gap-6 rounded-lg border border-white/10 bg-[#101317] p-5 md:grid-cols-2" onSubmit={(event) => event.preventDefault()}>
      <label className="grid gap-2">
        <span className="text-sm font-semibold text-zinc-300">Título</span>
        <input
          value={name}
          onChange={(event) => {
            const nextName = event.target.value;
            setName(nextName);
            setSlug((current) => current || slugify(nextName));
            applySuggestedMetadata(nextName, file);
          }}
          placeholder="Ej. Metro Aqua"
          className="h-12 rounded-md border border-white/10 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-cyan-300"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold text-zinc-300">Slug</span>
        <input
          value={slug}
          onChange={(event) => setSlug(slugify(event.target.value))}
          placeholder="metro-aqua"
          className="h-12 rounded-md border border-white/10 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-cyan-300"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold text-zinc-300">Género</span>
        <input
          value={genre}
          onChange={(event) => {
            setMetadataEdited((current) => ({ ...current, genre: true }));
            setGenre(event.target.value);
          }}
          placeholder="Trap, Drill, Reggaeton..."
          className="h-12 rounded-md border border-white/10 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-cyan-300"
        />
        <span className="text-xs text-cyan-200">Metadatos sugeridos automáticamente. Puedes cambiarlos antes de guardar.</span>
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold text-zinc-300">BPM</span>
        <input
          value={bpm}
          onChange={(event) => {
            setMetadataEdited((current) => ({ ...current, bpm: true }));
            setBpm(event.target.value);
          }}
          type="number"
          placeholder="144"
          className="h-12 rounded-md border border-white/10 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-cyan-300"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold text-zinc-300">Tonalidad</span>
        <input
          value={key}
          onChange={(event) => {
            setMetadataEdited((current) => ({ ...current, key: true }));
            setKey(event.target.value);
          }}
          placeholder="F Minor"
          className="h-12 rounded-md border border-white/10 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-cyan-300"
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
              setSlug(slugify(beatName));
              applySuggestedMetadata(beatName, selectedFile);
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
        <p className="font-bold">Preview temporal</p>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Preview real separado se implementará en una fase posterior. Actualmente preview_url utiliza temporalmente el mismo MP3.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={async () => {
              if (!file) {
                setSaveStatus("Selecciona un MP3 antes de guardar.");
                return;
              }

              setIsSaving(true);
              setSaveStatus("Subiendo MP3...");
              const generatedSlug = slugify(name);
              const parsedBpm = Number(bpm);
              const metadata = detectBeatMetadata({
                title: name,
                fileName: file.name,
                currentGenre: genre,
                currentBpm: bpm && Number.isFinite(parsedBpm) ? parsedBpm : null,
                currentKey: key,
              });
              setSlug(generatedSlug);
              const result = await createBeatWithUpload({
                file,
                title: name,
                slug: generatedSlug,
                genre: genre || metadata.genre,
                bpm: bpm || (metadata.bpm ? String(metadata.bpm) : ""),
                musicalKey: key || metadata.key || "",
              });
              setSaveStatus(result.ok ? "Beat creado correctamente." : result.message || "No se pudo crear el beat.");
              setCreatedSlug(result.slug ?? "");
              router.refresh();
              setIsSaving(false);
            }}
            disabled={isSaving}
            className="inline-flex h-11 items-center gap-2 rounded-md border border-cyan-300/30 px-5 text-sm font-bold text-cyan-200 hover:border-cyan-300 hover:bg-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {isSaving ? "Guardando..." : "Guardar Beat"}
          </button>
          <Link href="/admin/beats" className="inline-flex h-11 items-center gap-2 rounded-md border border-white/10 px-5 text-sm font-bold text-zinc-200 hover:border-cyan-300 hover:text-cyan-200">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver a Beats
          </Link>
        </div>
        {previewStatus ? <p className="mt-4 text-sm font-semibold text-cyan-200">{previewStatus}</p> : null}
        {saveStatus ? <p className="mt-2 text-sm font-semibold text-cyan-200">{saveStatus}</p> : null}
        {createdSlug ? (
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/admin/beats" className="inline-flex h-10 items-center rounded-md bg-cyan-300 px-4 text-sm font-bold text-black hover:bg-cyan-200">Ir a catálogo admin</Link>
            <Link href={`/beats/${createdSlug}`} className="inline-flex h-10 items-center rounded-md border border-cyan-300/30 px-4 text-sm font-bold text-cyan-200 hover:border-cyan-300">Ver beat</Link>
          </div>
        ) : null}
      </div>
    </form>
  );
}
