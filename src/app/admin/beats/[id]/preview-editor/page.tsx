import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Save, SlidersHorizontal, Sparkles } from "lucide-react";
import { AdminBeatStatus } from "@/components/admin/AdminBeatStatus";
import { AdminShell } from "@/components/admin/AdminShell";
import { WaveformPreview } from "@/components/admin/WaveformPreview";
import { PlayButton } from "@/components/PlayButton";
import { getBeatById } from "@/data/beats";

type PreviewEditorPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PreviewEditorPage({ params }: PreviewEditorPageProps) {
  const { id } = await params;
  const beat = getBeatById(id);

  if (!beat) {
    notFound();
  }

  return (
    <AdminShell
      title="Editor de Preview"
      subtitle="Simulación profesional para definir corte público, duración y fades del preview."
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <section className="space-y-5">
          <WaveformPreview />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <PlayButton beat={beat} mode="preview" showPauseState className="justify-center">
              Play Preview
            </PlayButton>
            <button type="button" className="rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-zinc-200 hover:border-cyan-300 hover:text-cyan-200">
              Cambiar inicio
            </button>
            <button type="button" className="rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-zinc-200 hover:border-cyan-300 hover:text-cyan-200">
              Fade In
            </button>
            <button type="button" className="rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-zinc-200 hover:border-cyan-300 hover:text-cyan-200">
              Fade Out
            </button>
            <button type="button" className="inline-flex items-center justify-center gap-2 rounded-md bg-cyan-300 px-4 py-3 text-sm font-bold text-black hover:bg-cyan-200">
              <Save className="h-4 w-4" aria-hidden="true" />
              Guardar Preview
            </button>
          </div>

          <div className="rounded-lg border border-white/10 bg-[#101317] p-5">
            <div className="mb-4 flex items-center gap-2 text-cyan-200">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              <p className="text-sm font-bold uppercase">Configuración demo</p>
            </div>
            <p className="mb-4 rounded-md border border-cyan-300/20 bg-cyan-300/10 p-3 text-sm leading-6 text-cyan-100">
              Preview real se implementará en Fase 12. Actualmente preview_url utiliza temporalmente el mismo MP3.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-md bg-white/5 p-4">
                <p className="text-xs text-zinc-500">Marcador inicio</p>
                <p className="mt-1 font-bold">0:08</p>
              </div>
              <div className="rounded-md bg-white/5 p-4">
                <p className="text-xs text-zinc-500">Marcador fin</p>
                <p className="mt-1 font-bold">0:23</p>
              </div>
              <div className="rounded-md bg-white/5 p-4">
                <p className="text-xs text-zinc-500">Duración preview</p>
                <p className="mt-1 font-bold">15 segundos</p>
              </div>
            </div>
          </div>
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
