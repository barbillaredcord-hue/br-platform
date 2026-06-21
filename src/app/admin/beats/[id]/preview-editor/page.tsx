"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { ArrowLeft, SlidersHorizontal } from "lucide-react";
import { AdminBeatStatus } from "@/components/admin/AdminBeatStatus";
import { AdminShell } from "@/components/admin/AdminShell";
import { PreviewEditorForm } from "@/components/admin/PreviewEditorForm";
import { PlayButton } from "@/components/PlayButton";
import { getBeatBySlug, updateBeatMetadataAsAdmin } from "@/lib/supabase/queries";

type BeatWithPreviewMeta = NonNullable<Awaited<ReturnType<typeof getBeatBySlug>>> & {
  previewDurationSeconds?: number;
  previewUpdatedAt?: string | null;
  isActive?: boolean | null;
};

type PreviewEditorPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function MetadataEditor({ beat }: { beat: BeatWithPreviewMeta }) {
  const router = useRouter();
  const [genre, setGenre] = useState(beat.genre);
  const [bpm, setBpm] = useState(String(beat.bpm || ""));
  const [musicalKey, setMusicalKey] = useState(beat.key ?? "");
  const [isActive, setIsActive] = useState(beat.isActive ?? true);
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function saveMetadata() {
    setIsSaving(true);
    setStatus("");

    const result = await updateBeatMetadataAsAdmin(beat.dbId ?? beat.id, {
      genre,
      bpm,
      musicalKey,
      isActive,
    });

    setStatus(result.message ?? (result.ok ? "Metadata actualizada." : "No se pudo guardar."));
    setIsSaving(false);

    if (result.ok) {
      router.refresh();
    }
  }

  return (
    <section className="rounded-lg border border-white/10 bg-[#101317] p-5">
      <p className="text-sm font-bold uppercase text-cyan-200">Metadata rápida</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="grid gap-1">
          <span className="text-xs uppercase text-zinc-500">Género</span>
          <input value={genre} onChange={(event) => setGenre(event.target.value)} className="h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-cyan-300" />
        </label>
        <label className="grid gap-1">
          <span className="text-xs uppercase text-zinc-500">BPM</span>
          <input type="number" min={40} max={240} value={bpm} onChange={(event) => setBpm(event.target.value)} className="h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-cyan-300" />
        </label>
        <label className="grid gap-1">
          <span className="text-xs uppercase text-zinc-500">Tonalidad</span>
          <input value={musicalKey} onChange={(event) => setMusicalKey(event.target.value)} className="h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-cyan-300" />
        </label>
        <label className="grid gap-1">
          <span className="text-xs uppercase text-zinc-500">Estado</span>
          <select value={isActive ? "active" : "inactive"} onChange={(event) => setIsActive(event.target.value === "active")} className="h-10 rounded-md border border-white/10 bg-[#15181c] px-3 text-sm outline-none focus:border-cyan-300">
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
          </select>
        </label>
      </div>
      <button type="button" disabled={isSaving} onClick={() => void saveMetadata()} className="mt-4 inline-flex h-10 items-center rounded-md bg-cyan-300 px-4 text-sm font-bold text-black hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60">
        {isSaving ? "Guardando..." : "Guardar metadata"}
      </button>
      {status ? <p className="mt-3 text-sm font-semibold text-cyan-200">{status}</p> : null}
    </section>
  );
}

export default function PreviewEditorPage({ params }: PreviewEditorPageProps) {
  const { id } = use(params);
  const [beat, setBeat] = useState<BeatWithPreviewMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    void getBeatBySlug(id).then((result) => {
      if (isMounted) {
        setBeat(result as BeatWithPreviewMeta);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <AdminShell title="Editor de Preview" subtitle="Sube y administra el preview público real del beat. Duración permitida: 15 a 30 segundos.">
        <section className="rounded-lg border border-white/10 bg-[#101317] p-5 text-sm font-semibold text-cyan-200">Cargando beat...</section>
      </AdminShell>
    );
  }

  if (!beat) {
    return (
      <AdminShell title="Editor de Preview" subtitle="Sube y administra el preview público real del beat. Duración permitida: 15 a 30 segundos.">
        <section className="rounded-lg border border-white/10 bg-[#101317] p-5 text-sm font-semibold text-zinc-300">Beat no encontrado.</section>
      </AdminShell>
    );
  }

  const previewDurationSeconds = typeof beat.previewDurationSeconds === "number" ? beat.previewDurationSeconds : 15;
  const hasRealPreview = beat.previewUrl !== beat.fullAudioUrl;

  return (
    <AdminShell title="Editor de Preview" subtitle="Sube y administra el preview público real del beat. Duración permitida: 15 a 30 segundos.">
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <section className="space-y-5">
          <MetadataEditor beat={beat} />

          <div className="rounded-lg border border-white/10 bg-[#101317] p-5">
            <p className="text-sm font-bold uppercase text-cyan-200">Prueba rápida</p>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Este botón reproduce el preview actual que escuchan visitantes y usuarios sin acceso. El beat completo se mantiene separado para usuarios con acceso.
            </p>
            <div className="mt-4 max-w-xs">
              <PlayButton beat={beat} mode="preview" showPauseState className="justify-center">
                Play Preview Actual
              </PlayButton>
            </div>
          </div>

          <PreviewEditorForm
            beatId={beat.dbId ?? beat.id}
            slug={beat.id}
            title={beat.name}
            currentPreviewUrl={beat.previewUrl}
            fullAudioUrl={beat.fullAudioUrl}
            initialDurationSeconds={previewDurationSeconds}
          />
        </section>

        <aside className="rounded-lg border border-white/10 bg-[#101317] p-5">
          <div className={`mb-5 grid aspect-square place-items-center rounded-lg bg-[linear-gradient(135deg,#67e8f9,#0f172a)] ${beat.isActive === false ? "opacity-60" : ""}`}>
            <span className="text-5xl font-black">B.R</span>
          </div>
          <h2 className="text-2xl font-black">{beat.name}</h2>
          <div className="mt-4 grid gap-3">
            <div className="rounded-md bg-white/5 p-3">
              <p className="text-xs uppercase text-zinc-500">BPM</p>
              <p className="mt-1 font-bold">{beat.bpm}</p>
            </div>
            <div className="rounded-md bg-white/5 p-3">
              <p className="text-xs uppercase text-zinc-500">Género</p>
              <p className="mt-1 font-bold">{beat.genre}</p>
            </div>
            <div className="rounded-md bg-white/5 p-3">
              <p className="text-xs uppercase text-zinc-500">Tonalidad</p>
              <p className="mt-1 font-bold">{beat.key || "Sin dato"}</p>
            </div>
            <div className="rounded-md bg-white/5 p-3">
              <p className="text-xs uppercase text-zinc-500">Preview</p>
              <p className="mt-1 font-bold">{previewDurationSeconds} segundos</p>
              <p className="mt-1 text-xs text-zinc-500">{hasRealPreview ? "Preview real" : "Temporal: usa el MP3 completo"}</p>
            </div>
            <div className="rounded-md bg-white/5 p-3">
              <p className="mb-2 text-xs uppercase text-zinc-500">Estado</p>
              <div className="flex flex-wrap gap-2">
                <AdminBeatStatus status={beat.status} />
                <span className={`rounded-full border px-2 py-1 text-xs font-bold ${beat.isActive === false ? "border-red-300/30 bg-red-300/10 text-red-100" : "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"}`}>
                  {beat.isActive === false ? "Inactivo" : "Activo"}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-5 grid gap-3">
            <Link href="/admin/beats" className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-white/10 text-sm font-bold text-zinc-200 hover:border-cyan-300 hover:text-cyan-200">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Volver a Beats
            </Link>
            <Link href={`/beats/${beat.id}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-cyan-300/20 text-sm font-bold text-cyan-200 hover:border-cyan-300">
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              Ver página pública
            </Link>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}
