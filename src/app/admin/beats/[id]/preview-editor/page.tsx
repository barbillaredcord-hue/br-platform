import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, SlidersHorizontal } from "lucide-react";
import { AdminBeatStatus } from "@/components/admin/AdminBeatStatus";
import { AdminShell } from "@/components/admin/AdminShell";
import { PreviewEditorForm } from "@/components/admin/PreviewEditorForm";
import { PlayButton } from "@/components/PlayButton";
import { getBeatBySlug } from "@/lib/supabase/queries";

type BeatWithPreviewMeta = Awaited<ReturnType<typeof getBeatBySlug>> & {
  previewDurationSeconds?: number;
  previewUpdatedAt?: string | null;
};

type PreviewEditorPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PreviewEditorPage({ params }: PreviewEditorPageProps) {
  const { id } = await params;
  const beat = (await getBeatBySlug(id)) as BeatWithPreviewMeta;

  if (!beat) {
    notFound();
  }

  const previewDurationSeconds = typeof beat.previewDurationSeconds === "number" ? beat.previewDurationSeconds : 15;
  const hasRealPreview = beat.previewUrl !== beat.fullAudioUrl;

  return (
    <AdminShell
      title="Editor de Preview"
      subtitle="Sube y administra el preview público real del beat. Duración permitida: 15 a 30 segundos."
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <section className="space-y-5">
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
          <div className="mb-5 grid aspect-square place-items-center rounded-lg bg-[linear-gradient(135deg,#67e8f9,#0f172a)]">
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
              <p className="text-xs uppercase text-zinc-500">Preview</p>
              <p className="mt-1 font-bold">{previewDurationSeconds} segundos</p>
              <p className="mt-1 text-xs text-zinc-500">{hasRealPreview ? "Preview real" : "Temporal: usa el MP3 completo"}</p>
            </div>
            <div className="rounded-md bg-white/5 p-3">
              <p className="mb-2 text-xs uppercase text-zinc-500">Estado</p>
              <AdminBeatStatus status={beat.status} />
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
