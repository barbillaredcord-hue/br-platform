import Link from "next/link";
import { AccessStatusBadge } from "@/components/AccessStatusBadge";
import type { Beat } from "@/data/beats";
import { canAccessBeat } from "@/lib/access";
import { AccessBadge } from "./AccessBadge";
import { PlayButton } from "./PlayButton";

type BeatCardProps = {
  beat: Beat;
  gradientIndex: number;
  queue?: Beat[];
};

const coverGradients = [
  "bg-[linear-gradient(135deg,#67e8f9,#312e81)]",
  "bg-[linear-gradient(135deg,#155e75,#0f172a)]",
  "bg-[linear-gradient(135deg,#22d3ee,#18181b)]",
  "bg-[linear-gradient(135deg,#0f172a,#0891b2)]",
];

export function BeatCard({ beat, gradientIndex, queue }: BeatCardProps) {
  const hasAccess = canAccessBeat("demo-user", beat.id);

  return (
    <article className="w-56 shrink-0 snap-start rounded-lg bg-[#15181c] p-3 transition hover:bg-[#1c2127]">
      <Link href={`/beats/${beat.id}`} className="block">
        <div className={`mb-4 grid aspect-square place-items-center rounded-lg ${coverGradients[gradientIndex % coverGradients.length]}`}>
          <span className="text-4xl font-black text-white/85">B.R</span>
        </div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-semibold">{beat.name}</h3>
            <p className="mt-1 text-sm text-zinc-400">
              {beat.genre} · {beat.bpm} BPM
            </p>
          </div>
          {beat.locked ? <AccessBadge /> : null}
        </div>
        <div className="mt-3">
          <AccessStatusBadge hasAccess={hasAccess} />
        </div>
      </Link>
      <PlayButton variant="light" className="mt-4" beat={beat} mode={hasAccess ? "full" : "preview"} queue={queue} showPauseState>
        Play
      </PlayButton>
    </article>
  );
}
