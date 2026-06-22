import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, KeyRound, Lock, ShieldCheck, Unlock } from "lucide-react";
import { AccessBadge } from "@/components/AccessBadge";
import { BeatCard } from "@/components/BeatCard";
import { BeatAccessActions } from "@/components/BeatAccessActions";
import { BeatAccessSummary } from "@/components/BeatAccessSummary";
import { getRelatedBeats } from "@/data/beats";
import { getBeatBySlug, getBeats, getUsersWithAccessToBeat, getAccessRevocationsForBeat } from "@/lib/supabase/queries";

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

function getPreviewSeconds(beat: NonNullable<Awaited<ReturnType<typeof getBeatBySlug>>>) {
  const previewMeta = beat as typeof beat & { previewDurationSeconds?: number | null };
  const seconds = previewMeta.previewDurationSeconds ?? 15;

  return Math.min(30, Math.max(15, Math.round(seconds)));
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BeatPage({ params }: BeatPageProps) {
  const { id } = await params;
  const beat = await getBeatBySlug(id);

  if (!beat) {
    notFound();
  }

  const { beats } = await getBeats();
  const relatedBeats = beats.length > 0 ? beats.filter((item) => item.genre === beat.genre && item.id !== beat.id).slice(0, 4) : getRelatedBeats(beat);
  const detailQueue = [beat, ...relatedBeats];
  const usersWithAccess = await getUsersWithAccessToBeat(beat.dbId ?? beat.id);
  const accessRevocations = await getAccessRevocationsForBeat(beat.dbId ?? beat.id);
  const previewSeconds = getPreviewSeconds(beat);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050607] px-3 py-4 pb-24 text-white sm:px-4 md:px-8 md:py-6 md:pb-32">
      <div className="mx-auto max-w-7xl min-w-0 space-y-5 md:space-y-7">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:border-cyan-300 hover:text-cyan-200 sm:text-sm"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver
        </Link>

        <section className="grid min-w-0 gap-4 lg:grid-cols-[minmax(240px,360px)_1fr] lg:gap-6">
          <div className="mx-auto grid aspect-square w-full max-w-[240px] place-items-center rounded-lg border border-cyan-300/20 bg-[radial-gradient(circle_at_25%_20%,rgba(103,232,249,0.35),transparent_30%),linear-gradient(135deg,#155e75,#0f172a_70%)] sm:max-w-[320px] lg:max-w-none">
            <span className="text-5xl font-black text-white/85 md:text-6xl">B.R</span>
          </div>

          <div className="min-w-0 rounded-lg border border-white/10 bg-[#101317] p-4 md:p-6">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {beat.locked ? <AccessBadge /> : (
                <span className="inline-flex items-center gap-1 rounded-md border border-cyan-300/30 px-2 py-1 text-xs text-cyan-200">
                  <Unlock className="h-3 w-3" aria-hidden="true" />
                  DESBLOQUEADO
                </span>
              )}
            </div>

            <h1 className="break-words text-3xl font-black leading-tight sm:text-4xl md:text-5xl">{beat.name}</h1>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <div className="rounded-md border border-white/10 bg-white/5 p-3">
                <p className="text-xs uppercase text-zinc-500">Género</p>
                <p className="mt-1 text-sm font-semibold sm:text-base">{beat.genre}</p>
              </div>
              <div className="rounded-md border border-white/10 bg-white/5 p-3">
                <p className="text-xs uppercase text-zinc-500">BPM</p>
                <p className="mt-1 text-sm font-semibold sm:text-base">{beat.bpm}</p>
              </div>
              {beat.key ? (
                <div className="rounded-md border border-white/10 bg-white/5 p-3">
                  <p className="flex items-center gap-1 text-xs uppercase text-zinc-500">
                    <KeyRound className="h-3 w-3" aria-hidden="true" />
                    Key
                  </p>
                  <p className="mt-1 text-sm font-semibold sm:text-base">{beat.key}</p>
                </div>
              ) : null}
            </div>

            <div className="mt-5 flex flex-wrap gap-2 sm:gap-3">
              <BeatAccessActions beat={beat} queue={detailQueue} />
            </div>

            {accessRevocations.length > 0 ? (
              <div className="mt-4 rounded-md border border-amber-300/20 bg-amber-300/10 p-3">
                <p className="text-xs font-bold uppercase text-amber-200">Revocaciones registradas</p>
                <p className="mt-2 text-sm leading-5 text-zinc-300">
                  Este beat tiene acceso(s) revocado(s) registrados por B.R. Los usuarios afectados solo conservan reproducción preview y las descargas protegidas quedan bloqueadas.
                </p>
              </div>
            ) : null}
          </div>
        </section>

        <BeatAccessSummary beat={beat} />

        <section className="rounded-lg border border-white/10 bg-[#101317] p-4 md:p-5">
          <h2 className="text-lg font-bold md:text-xl">Acceso adquirido por</h2>
          {usersWithAccess.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {usersWithAccess.map((user) => (
                <span key={user.id} className="rounded-md border border-cyan-300/30 px-3 py-1.5 text-xs font-semibold text-cyan-200 sm:text-sm">
                  @{user.username}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm font-semibold text-cyan-200">Disponible</p>
          )}
        </section>

        <section className="rounded-lg border border-white/10 bg-[#101317] p-4 md:p-5">
          <h2 className="mb-3 text-lg font-bold md:text-xl">Licencias disponibles</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {licenses.map((license) => (
              <article key={license.name} className="rounded-lg border border-white/10 bg-[#15181c] p-3">
                <p className="text-base font-bold text-white sm:text-lg">{license.name}</p>
                <p className="mt-2 text-sm leading-5 text-zinc-400">{license.detail}</p>
                <span className="mt-3 inline-block rounded-md bg-white/5 px-3 py-1.5 text-xs font-semibold text-cyan-200">
                  Demo
                </span>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-white/10 bg-[#101317] p-4 md:p-5">
          <h2 className="text-lg font-bold md:text-xl">Próximamente: WAV, stems y trackouts</h2>
          <p className="mt-2 text-sm leading-5 text-zinc-400">
            Por ahora la descarga habilitada es únicamente MP3 para usuarios autorizados.
          </p>
        </section>

        <section className="rounded-lg border border-cyan-300/20 bg-[#101317] p-4 md:p-5">
          <div className="flex items-start gap-3">
            {beat.locked ? (
              <Lock className="mt-1 h-5 w-5 shrink-0 text-cyan-200" aria-hidden="true" />
            ) : (
              <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-cyan-200" aria-hidden="true" />
            )}
            <div>
              <h2 className="text-lg font-bold md:text-xl">Acceso privado</h2>
              <p className="mt-2 max-w-3xl text-sm leading-5 text-zinc-400">
                Pagos coordinados directamente con B.R. El acceso completo se habilita manualmente después de confirmar la compra,
                manteniendo previews cortos de {previewSeconds} segundos para exploración inicial.
              </p>
            </div>
          </div>
        </section>

        {relatedBeats.length > 0 ? (
          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold md:text-xl">Beats relacionados</h2>
              <span className="truncate text-xs text-cyan-200 sm:text-sm">{beat.genre}</span>
            </div>
            <div className="flex snap-x gap-3 overflow-x-auto pb-3 [-webkit-overflow-scrolling:touch] sm:gap-4">
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
