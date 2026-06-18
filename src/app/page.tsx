import { AdminPreview } from "@/components/AdminPreview";
import { BeatRow } from "@/components/BeatRow";
import { Header } from "@/components/Header";
import { HeroBeat } from "@/components/HeroBeat";
import { Sidebar } from "@/components/Sidebar";
import { SupabaseFallbackNotice } from "@/components/SupabaseFallbackNotice";
import { getBeats } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const { beats, rows: beatRows, usingFallback } = await getBeats();
  const featuredBeat = beats[0];

  return (
    <main className="min-h-screen bg-[#050607] text-white">
      <div className="flex min-h-screen w-full overflow-x-hidden pb-24 md:pb-28">
        <Sidebar />

        <section className="min-w-0 flex-1">
          <Header />

          <div className="min-w-0 space-y-8 px-3 py-5 sm:px-4 md:space-y-10 md:px-8 md:py-6">
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
