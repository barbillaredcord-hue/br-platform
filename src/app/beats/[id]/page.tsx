import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, KeyRound, Lock, ShieldCheck, Unlock } from "lucide-react";
import { AccessBadge } from "@/components/AccessBadge";
import { AccessStatusBadge } from "@/components/AccessStatusBadge";
import { BeatCard } from "@/components/BeatCard";
import { PlayButton } from "@/components/PlayButton";
import { RequestAccessButton } from "@/components/RequestAccessButton";
import { getBeatById, getRelatedBeats } from "@/data/beats";
import { canAccessBeat } from "@/lib/access";

type BeatPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const licenses = [
  { name: "Basic", detail: "Preview demo, uso limitado y descarga pendiente." },
  { name: "Premium", detail: "Más permisos, prioridad de acceso y archivos premium." },
  { name: "Exclusive", detail: "Reserva privada y retiro del catálogo público." },
];

export default async function BeatPage({ params }: BeatPageProps) {
  const { id } = await params;
  const beat = getBeatById(id);

  if (!beat) {
    notFound();
  }

  const relatedBeats = getRelatedBeats(beat);
  const detailQueue = [beat, ...relatedBeats];
  const hasAccess = canAccessBeat("demo-user", beat.id);

  return (
    <main className="min-h-screen bg-[#050607] px-4 py-6 pb-32 text-white md:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-cyan-300 hover:text-cyan-200"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver
        </Link>

        <section className="grid gap-8 lg:grid-cols-[minmax(280px,420px)_1fr]">
          <div className="grid aspect-square place-items-center rounded-lg border border-cyan-300/20 bg-[radial-gradient(circle_at_25%_20%,rgba(103,232,249,0.35),transparent_30%),linear-gradient(135deg,#155e75,#0f172a_70%)]">
            <span className="text-6xl font-black text-white/85 md:text-7xl">B.R</span>
          </div>

          <div className="flex flex-col justify-center rounded-lg border border-white/10 bg-[#101317] p-6 md:p-8">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              {beat.locked ? <AccessBadge /> : (
                <span className="inline-flex items-center gap-1 rounded-md border border-cyan-300/30 px-2 py-1 text-xs text-cyan-200">
                  <Unlock className="h-3 w-3" aria-hidden="true" />
                  DESBLOQUEADO
                </span>
              )}
              <AccessStatusBadge hasAccess={hasAccess} />
            </div>

            <h1 className="text-4xl font-black leading-tight md:text-6xl">{beat.name}</h1>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase text-zinc-500">Género</p>
                <p className="mt-1 font-semibold">{beat.genre}</p>
              </div>
              <div className="rounded-md border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase text-zinc-500">BPM</p>
                <p className="mt-1 font-semibold">{beat.bpm}</p>
              </div>
              {beat.key ? (
                <div className="rounded-md border border-white/10 bg-white/5 p-4">
                  <p className="flex items-center gap-1 text-xs uppercase text-zinc-500">
                    <KeyRound className="h-3 w-3" aria-hidden="true" />
                    Key
                  </p>
                  <p className="mt-1 font-semibold">{beat.key}</p>
                </div>
              ) : null}
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <PlayButton beat={beat} mode={hasAccess ? "full" : "preview"} queue={detailQueue} showPauseState>
                {hasAccess ? "Escuchar Beat Completo" : "Escuchar Preview 15s"}
              </PlayButton>
              {!hasAccess ? (
                <RequestAccessButton />
              ) : null}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-cyan-300/20 bg-[#101317] p-5">
          <h2 className="text-xl font-bold">
            {hasAccess ? "Acceso completo autorizado" : "Acceso restringido"}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
            {hasAccess
              ? "Demo User tiene permiso para escuchar este beat en modo completo dentro de la simulación."
              : "Demo User solo puede escuchar el preview público de 15 segundos para este beat."}
          </p>
        </section>

        <section className="rounded-lg border border-white/10 bg-[#101317] p-5">
          <h2 className="mb-4 text-xl font-bold">Licencias disponibles</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {licenses.map((license) => (
              <article key={license.name} className="rounded-lg border border-white/10 bg-[#15181c] p-4">
                <p className="text-lg font-bold text-white">{license.name}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{license.detail}</p>
                <span className="mt-4 inline-block rounded-md bg-white/5 px-3 py-2 text-xs font-semibold text-cyan-200">
                  Demo
                </span>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-cyan-300/20 bg-[#101317] p-5">
          <div className="flex items-start gap-3">
            {beat.locked ? (
              <Lock className="mt-1 h-5 w-5 shrink-0 text-cyan-200" aria-hidden="true" />
            ) : (
              <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-cyan-200" aria-hidden="true" />
            )}
            <div>
              <h2 className="text-xl font-bold">Acceso privado</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
                El audio completo no está disponible en esta demo pública. B.R libera el beat completo solo a usuarios autorizados,
                manteniendo previews cortos de 15 segundos para exploración inicial.
              </p>
            </div>
          </div>
        </section>

        {relatedBeats.length > 0 ? (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Beats relacionados</h2>
              <span className="text-sm text-cyan-200">{beat.genre}</span>
            </div>
            <div className="flex snap-x gap-4 overflow-x-auto pb-3">
              {relatedBeats.map((relatedBeat, index) => (
                <BeatCard key={relatedBeat.id} beat={relatedBeat} gradientIndex={index} queue={detailQueue} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
