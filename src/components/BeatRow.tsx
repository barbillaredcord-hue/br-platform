"use client";

import Link from "next/link";
import { useRef } from "react";
import type { Beat } from "@/data/beats";
import { BeatCard } from "./BeatCard";

type BeatRowProps = {
  title: string;
  beats: Beat[];
  rowIndex: number;
};

export function BeatRow({ title, beats, rowIndex }: BeatRowProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const scrollRow = (direction: "left" | "right") => {
    const row = scrollRef.current;

    if (!row) {
      return;
    }

    row.scrollBy({
      left: direction === "left" ? -320 : 320,
      behavior: "smooth",
    });
  };

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold">{title}</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={`Deslizar ${title} hacia la izquierda`}
            onClick={() => scrollRow("left")}
            className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/5 text-sm font-black text-cyan-100 transition hover:border-cyan-300/50 hover:bg-cyan-300/10"
          >
            ←
          </button>
          <button
            type="button"
            aria-label={`Deslizar ${title} hacia la derecha`}
            onClick={() => scrollRow("right")}
            className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/5 text-sm font-black text-cyan-100 transition hover:border-cyan-300/50 hover:bg-cyan-300/10"
          >
            →
          </button>
          <Link href="/explore" className="text-sm font-semibold text-cyan-200 hover:text-cyan-100">Ver todo</Link>
        </div>
      </div>
      <div ref={scrollRef} className="flex snap-x gap-4 overflow-x-auto scroll-smooth pb-3 [-webkit-overflow-scrolling:touch]">
        {beats.map((beat, beatIndex) => (
          <BeatCard key={beat.id} beat={beat} gradientIndex={rowIndex + beatIndex} queue={beats} />
        ))}
      </div>
    </section>
  );
}
