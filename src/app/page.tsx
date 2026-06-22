import { Header } from "@/components/Header";
import { HomeDiscovery } from "@/components/HomeDiscovery";
import { Sidebar } from "@/components/Sidebar";
import { getBeats } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const { beats, rows: beatRows, usingFallback } = await getBeats();

  return (
    <main className="min-h-screen bg-[#050607] text-white">
      <div className="flex min-h-screen w-full overflow-x-hidden pb-24 md:pb-28">
        <Sidebar />

        <section className="min-w-0 flex-1">
          <Header />
          <HomeDiscovery beats={beats} beatRows={beatRows} usingFallback={usingFallback} />
        </section>
      </div>
    </main>
  );
}
