import Link from "next/link";
import type { Beat } from "@/data/beats";
import { AccessBadge } from "./AccessBadge";
import { Play } from "lucide-react";

type BeatCardProps = {
  beat: Beat;
  gradientIndex: number;
};

const coverGradients = [
  "bg-[linear-gradient(135deg,#67e8f9,#312e81)]",
  "bg-[linear-gradient(135deg,#155e75,#0f172a)]",
  "bg-[linear-gradient(135deg,#22d3ee,#18181b)]",
  "bg-[linear-gradient(135deg,#0f172a,#0891b2)]",
];

export function BeatCard({ beat, gradientIndex }: BeatCardProps) {
  return (
    <Link
      href={`/beats/${beat.id}`}
      className="block w-56 shrink-0 snap-start rounded-lg bg-[#15181c] p-3 transition hover:bg-[#1c2127]"
    >
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
      <span className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-md bg-white text-sm font-bold text-black transition hover:bg-cyan-200">
        <Play className="h-4 w-4 fill-current" aria-hidden="true" />
        Play
      </span>
    </Link>
  );
}
