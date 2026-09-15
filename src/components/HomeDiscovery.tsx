"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AdminPreview } from "@/components/AdminPreview";
import { BeatRow } from "@/components/BeatRow";
import { HeroBeat } from "@/components/HeroBeat";
import { SupabaseFallbackNotice } from "@/components/SupabaseFallbackNotice";
import { useUser } from "@/context/UserContext";
import type { Beat, BeatRow as BeatRowType } from "@/data/beats";
import { getSavedBeatIds, SAVED_BEATS_EVENT } from "@/lib/saved-beats";
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

function makeRow(title: string, beats: Beat[]): BeatRowType | null {
  return beats.length > 0 ? { title, beats } : null;
}

function normalizeGenres(genre: string) {
  return genre
    .toLowerCase()
    .split(/[,/;|]+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function buildPersonalizedBeats(beats: Beat[], savedBeatIds: string[]) {
  if (savedBeatIds.length === 0) {
    return [];
  }

  const savedIds = new Set(savedBeatIds);
  const savedBeats = beats.filter((beat) => savedIds.has(beat.dbId ?? beat.id));

  if (savedBeats.length === 0) {
    return [];
  }

  return beats
    .filter((beat) => !savedIds.has(beat.dbId ?? beat.id))
    .map((beat, index) => {
      const beatGenres = normalizeGenres(beat.genre || "");
      let score = 0;

      savedBeats.forEach((savedBeat) => {
        const savedGenres = normalizeGenres(savedBeat.genre || "");

        if (beatGenres.some((genre) => savedGenres.includes(genre))) {
          score += 3;
        }

        if (Math.abs(beat.bpm - savedBeat.bpm) <= 10) {
          score += 2;
        }

        if (beat.key && savedBeat.key && beat.key.toLowerCase() === savedBeat.key.toLowerCase()) {
          score += 1;
        }
      });

      return { beat, score, index };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 8)
    .map((item) => item.beat);
}

function buildDiscoveryRows(beats: Beat[], genreRows: BeatRowType[], personalizedBeats: Beat[]) {
  const rows: BeatRowType[] = [];
  const pushRow = (row: BeatRowType | null) => {
    if (row && !rows.some((item) => item.title === row.title)) {
      rows.push(row);
    }
  };

  pushRow(makeRow("Para ti", personalizedBeats));
  pushRow(makeRow("Nuevos", beats.slice(0, 8)));

  const fullBeats = genreRows.find((row) => row.title === "Full Beats");
  pushRow(fullBeats ?? null);

  pushRow(makeRow("90–110 BPM", beats.filter((beat) => beat.bpm >= 90 && beat.bpm <= 110)));
  pushRow(makeRow("111–130 BPM", beats.filter((beat) => beat.bpm >= 111 && beat.bpm <= 130)));
  pushRow(makeRow("131+ BPM", beats.filter((beat) => beat.bpm >= 131)));

  genreRows
    .filter((row) => row.title !== "Full Beats")
    .forEach((row) => pushRow(row));

  return rows;
}

function getRowSubtitle(title: string) {
  if (title === "Para ti") {
    return "Basado en tus beats guardados";
  }

  if (title === "Nuevos") {
    return "Lo más reciente en Beat Room";
  }

  if (title === "Full Beats") {
    return "Reproducción completa pública";
  }

  if (title.includes("BPM")) {
    return "Explora por ritmo";
  }

  return undefined;
}

export function HomeDiscovery({ beats, beatRows, usingFallback }: HomeDiscoveryProps) {
  const { currentUser } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [savedBeatIds, setSavedBeatIds] = useState<string[]>([]);
  const newestBeat = beats[0];
  const hasSearch = Boolean(searchQuery.trim());

  useEffect(() => {
    const syncSavedBeats = () => {
      setSavedBeatIds(getSavedBeatIds(currentUser?.id));
    };

    syncSavedBeats();
    window.addEventListener(SAVED_BEATS_EVENT, syncSavedBeats);
    window.addEventListener("storage", syncSavedBeats);

    return () => {
      window.removeEventListener(SAVED_BEATS_EVENT, syncSavedBeats);
      window.removeEventListener("storage", syncSavedBeats);
    };
  }, [currentUser?.id]);

  const personalizedBeats = useMemo(
    () => buildPersonalizedBeats(beats, savedBeatIds),
    [beats, savedBeatIds],
  );

  const visibleRows = useMemo(() => {
    const query = searchQuery.trim();

    if (!query) {
      return buildDiscoveryRows(beats, beatRows, personalizedBeats);
    }

    return buildBeatRows(beats.filter((beat) => beatMatchesSearch(beat, query)));
  }, [beatRows, beats, personalizedBeats, searchQuery]);

  return (
    <div className="min-w-0 space-y-5 px-3 py-4 sm:px-4 md:space-y-8 md:px-8 md:py-6">
      {usingFallback ? <SupabaseFallbackNotice /> : null}
      {newestBeat ? <HeroBeat beat={newestBeat} label="Beat más nuevo" /> : null}

      <section aria-labelledby="beat-room-search-title" className="rounded-xl border border-white/10 bg-white/[0.035] p-3 sm:p-4">
        <div className="mb-3">
          <p id="beat-room-search-title" className="text-sm font-black text-white sm:text-base">
            Encuentra tu próximo beat
          </p>
          <p className="mt-1 text-xs font-medium text-zinc-500 sm:text-sm">
            Busca por nombre, género, BPM o tonalidad.
          </p>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
          <input
            id="beat-room-search"
            aria-labelledby="beat-room-search-title"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Buscar beat, género, BPM o tonalidad..."
            className="h-11 w-full rounded-lg border border-white/10 bg-black/20 pl-11 pr-4 text-sm font-semibold text-white outline-none transition placeholder:text-zinc-500 focus:border-cyan-300 focus:bg-white/[0.05] sm:h-12"
          />
        </div>
      </section>

      {visibleRows.length > 0 ? (
        <section aria-label={hasSearch ? "Resultados de búsqueda" : "Descubrir beats"} className="space-y-6 md:space-y-8">
          {!hasSearch ? (
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">Descubrir</p>
              <h2 className="mt-1 text-xl font-black text-white sm:text-2xl">Explora Beat Room</h2>
              <p className="mt-1 text-sm text-zinc-500">
                {personalizedBeats.length > 0
                  ? "Recomendaciones según tus guardados, nuevos lanzamientos, full disponibles, ritmo y géneros."
                  : "Nuevos lanzamientos, full disponibles, ritmo y géneros."}
              </p>
            </div>
          ) : null}

          {visibleRows.map((row, rowIndex) => (
            <BeatRow key={row.title} title={row.title} subtitle={getRowSubtitle(row.title)} beats={row.beats} rowIndex={rowIndex} />
          ))}
        </section>
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
