import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminBeatList } from "@/components/admin/AdminBeatList";
import { AdminShell } from "@/components/admin/AdminShell";
import { getBeats } from "@/lib/supabase/queries";

export default async function AdminBeatsPage() {
  const { beats, usingFallback } = await getBeats();

  return (
    <AdminShell
      title="Gestión de Beats"
      subtitle="Catálogo operativo conectado a Supabase con fallback local temporal."
    >
      <div className="flex flex-col gap-3 rounded-lg border border-white/10 bg-[#101317] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-bold">Catálogo B.R</p>
          <p className="text-sm text-zinc-400">{beats.length} beats cargados {usingFallback ? "desde fallback local" : "desde Supabase"}.</p>
        </div>
        <Link href="/admin/beats/new" className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-cyan-300 px-4 text-sm font-bold text-black hover:bg-cyan-200">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nuevo Beat
        </Link>
      </div>

      <AdminBeatList beats={beats} />
    </AdminShell>
  );
}
