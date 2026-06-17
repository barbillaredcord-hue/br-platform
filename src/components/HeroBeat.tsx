import type { Beat } from "@/data/beats";
import { PlayButton } from "./PlayButton";

type HeroBeatProps = {
  beat: Beat;
};

function getPreviewSeconds(beat: Beat) {
  const previewMeta = beat as Beat & { previewDurationSeconds?: number | null };
  const seconds = previewMeta.previewDurationSeconds ?? 15;

  return Math.min(30, Math.max(15, Math.round(seconds)));
}

export function HeroBeat({ beat }: HeroBeatProps) {
  const previewSeconds = getPreviewSeconds(beat);

  return (
    <section className="relative overflow-hidden rounded-lg border border-cyan-300/20 bg-[radial-gradient(circle_at_20%_20%,rgba(103,232,249,0.28),transparent_30%),linear-gradient(135deg,#111827,#050607_70%)] p-6 md:p-10">
      <div className="max-w-2xl">
        <p className="mb-3 text-sm font-bold uppercase text-cyan-200">Beat destacado</p>
        <h1 className="text-4xl font-black leading-tight md:text-6xl">{beat.name}</h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-zinc-300">
          Preview público de {previewSeconds} segundos. Acceso privado para escuchar la versión completa y administrar beats premium.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <PlayButton beat={beat} mode="preview" queue={[beat]} showPauseState>
            Reproducir preview
          </PlayButton>
          <span className="rounded-md border border-white/10 px-4 py-3 text-sm text-zinc-300">
            {beat.genre} / {beat.bpm} BPM / Preview {previewSeconds}s
          </span>
        </div>
      </div>
    </section>
  );
}
