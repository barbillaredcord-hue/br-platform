import Link from "next/link";
import type { Beat } from "@/data/beats";
import { BeatCard } from "./BeatCard";

type BeatRowProps = {
  title: string;
  beats: Beat[];
  rowIndex: number;
};

export function BeatRow({ title, beats, rowIndex }: BeatRowProps) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">{title}</h2>
        <Link href="/explore" className="text-sm font-semibold text-cyan-200 hover:text-cyan-100">Ver todo</Link>
      </div>
      <div className="flex snap-x gap-4 overflow-x-auto pb-3">
        {beats.map((beat, beatIndex) => (
          <BeatCard key={beat.id} beat={beat} gradientIndex={rowIndex + beatIndex} queue={beats} />
        ))}
      </div>
    </section>
  );
}
