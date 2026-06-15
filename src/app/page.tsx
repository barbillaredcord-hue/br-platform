import { AdminPreview } from "@/components/AdminPreview";
import { BeatRow } from "@/components/BeatRow";
import { Header } from "@/components/Header";
import { HeroBeat } from "@/components/HeroBeat";
import { Sidebar } from "@/components/Sidebar";
import { SupabaseFallbackNotice } from "@/components/SupabaseFallbackNotice";
import { getBeats } from "@/lib/supabase/queries";

export default async function Home() {
  const { beats, rows: beatRows, usingFallback } = await getBeats();
  const featuredBeat = beats[0];

  return (
    <main className="min-h-screen bg-[#050607] text-white">
      <div className="flex min-h-screen pb-28">
        <Sidebar />

        <section className="min-w-0 flex-1">
          <Header />

          <div className="space-y-10 px-4 py-6 md:px-8">
            {usingFallback ? <SupabaseFallbackNotice /> : null}
            {featuredBeat ? <HeroBeat beat={featuredBeat} /> : null}

            {beatRows.map((row, rowIndex) => (
              <BeatRow key={row.title} title={row.title} beats={row.beats} rowIndex={rowIndex} />
            ))}

            <AdminPreview />
          </div>
        </section>
      </div>
    </main>
  );
}
