import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminBeatList } from "@/components/admin/AdminBeatList";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminBeats, getProfiles } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function AdminBeatsPage() {
  const [{ beats, usingFallback }, users] = await Promise.all([getAdminBeats(), getProfiles()]);

  return (
    <AdminShell
      title="Gestión de Beats"
      subtitle="Catálogo admin conectado a Supabase con fallback local temporal."
      compact
    >
      <div className="flex flex-col gap-2 rounded-lg border border-white/10 bg-[#101317] p-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold">Catálogo admin</p>
          <p className="text-xs text-zinc-400">{beats.length} beats cargados {usingFallback ? "desde fallback local" : "desde Supabase"}.</p>
        </div>
        <Link href="/admin/beats/new" className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-cyan-300 px-3 text-xs font-bold text-black hover:bg-cyan-200">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nuevo Beat
        </Link>
      </div>

      <AdminBeatList beats={beats} users={users} />
    </AdminShell>
  );
}
