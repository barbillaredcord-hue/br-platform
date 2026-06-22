"use client";

import Link from "next/link";
import { useRef } from "react";
import type { Beat } from "@/data/beats";
import { BeatCard } from "./BeatCard";

type BeatRowProps = {
  title: string;
  subtitle?: string;
  beats: Beat[];
  rowIndex: number;
};

export function BeatRow({ title, subtitle, beats, rowIndex }: BeatRowProps) {
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
      <div className="mb-3 flex min-w-0 items-end justify-between gap-3 md:mb-4">
        <div className="min-w-0">
          <h2 className="min-w-0 truncate text-lg font-bold md:text-xl">{title}</h2>
          {subtitle ? <p className="mt-0.5 truncate text-xs font-semibold text-cyan-200/80">{subtitle}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={`Deslizar ${title} hacia la izquierda`}
            onClick={() => scrollRow("left")}
            className="hidden h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/5 text-sm font-black text-cyan-100 transition hover:border-cyan-300/50 hover:bg-cyan-300/10 sm:grid"
          >
            ←
          </button>
          <button
            type="button"
            aria-label={`Deslizar ${title} hacia la derecha`}
            onClick={() => scrollRow("right")}
            className="hidden h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/5 text-sm font-black text-cyan-100 transition hover:border-cyan-300/50 hover:bg-cyan-300/10 sm:grid"
          >
            →
          </button>
          <Link href="/explore" className="whitespace-nowrap text-xs font-semibold text-cyan-200 hover:text-cyan-100 sm:text-sm">Ver todo</Link>
        </div>
      </div>
      <div ref={scrollRef} className="flex snap-x gap-2 overflow-x-auto scroll-smooth pb-2 [-webkit-overflow-scrolling:touch] sm:gap-4 sm:pb-3">
        {beats.map((beat, beatIndex) => (
          <BeatCard key={beat.id} beat={beat} gradientIndex={rowIndex + beatIndex} queue={beats} />
        ))}
      </div>
    </section>
  );
}
