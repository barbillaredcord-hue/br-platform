import { BeatCard } from "@/components/BeatCard";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { SupabaseFallbackNotice } from "@/components/SupabaseFallbackNotice";
import { getBeats } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ExplorePage() {
  const { beats, usingFallback } = await getBeats();

  return (
    <main className="min-h-screen bg-[#050607] text-white">
      <div className="flex min-h-screen w-full overflow-x-hidden pb-24 md:pb-28">
        <Sidebar />
        <section className="min-w-0 flex-1">
          <Header />
          <div className="min-w-0 px-3 py-5 sm:px-4 md:px-8 md:py-6">
            {usingFallback ? <SupabaseFallbackNotice /> : null}
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-bold uppercase text-cyan-200">Explorar</p>
                <h1 className="mt-2 text-3xl font-black md:text-5xl">Todos los beats</h1>
              </div>
              <span className="text-sm font-semibold text-cyan-200">{beats.length} activos</span>
            </div>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {beats.map((beat, index) => (
                <BeatCard key={beat.id} beat={beat} gradientIndex={index} queue={beats} />
              ))}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
