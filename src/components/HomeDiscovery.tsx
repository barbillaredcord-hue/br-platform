"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { AdminPreview } from "@/components/AdminPreview";
import { BeatRow } from "@/components/BeatRow";
import { HeroBeat } from "@/components/HeroBeat";
import { SupabaseFallbackNotice } from "@/components/SupabaseFallbackNotice";
import type { Beat, BeatRow as BeatRowType } from "@/data/beats";
import { buildBeatRows } from "@/lib/supabase/queries";

type HomeDiscoveryProps = {
  beats: Beat[];
  beatRows: BeatRowType[];
  usingFallback: boolean;
};

function beatMatchesSearch(beat: Beat, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return [beat.name, beat.genre, String(beat.bpm), beat.key ?? ""].some((value) => value.toLowerCase().includes(normalizedQuery));
}

function getRowSubtitle(title: string) {
  return title === "Full Beats" ? "Reproducción completa pública" : undefined;
}

export function HomeDiscovery({ beats, beatRows, usingFallback }: HomeDiscoveryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const newestBeat = beats[0];
  const visibleRows = useMemo(() => {
    const query = searchQuery.trim();

    if (!query) {
      return beatRows;
    }

    return buildBeatRows(beats.filter((beat) => beatMatchesSearch(beat, query)));
  }, [beatRows, beats, searchQuery]);
  const hasSearch = Boolean(searchQuery.trim());

  return (
    <div className="min-w-0 space-y-5 px-3 py-4 sm:px-4 md:space-y-8 md:px-8 md:py-6">
      {usingFallback ? <SupabaseFallbackNotice /> : null}
      {newestBeat ? <HeroBeat beat={newestBeat} label="Beat más nuevo" /> : null}

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden="true" />
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Buscar beats, género, BPM o tonalidad"
          className="h-10 w-full rounded-md border border-white/10 bg-white/5 pl-9 pr-3 text-sm font-semibold text-white outline-none transition placeholder:text-zinc-500 focus:border-cyan-300 focus:bg-white/[0.07] sm:h-11"
        />
      </div>

      {visibleRows.length > 0 ? (
        visibleRows.map((row, rowIndex) => (
          <BeatRow key={row.title} title={row.title} subtitle={getRowSubtitle(row.title)} beats={row.beats} rowIndex={rowIndex} />
        ))
      ) : (
        <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm font-semibold text-zinc-300">
          No encontramos beats con esa búsqueda.
        </div>
      )}

      {hasSearch ? (
        <p className="text-xs font-semibold text-zinc-500">
          Mostrando resultados filtrados por beat, género, BPM o tonalidad.
        </p>
      ) : null}

      <AdminPreview />
    </div>
  );
}
