import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminBeatList } from "@/components/admin/AdminBeatList";
import { AdminShell } from "@/components/admin/AdminShell";
import { allBeats } from "@/data/beats";

export default function AdminBeatsPage() {
  return (
    <AdminShell
      title="Gestión de Beats"
      subtitle="Catálogo operativo en modo demo. Cada beat puede enviarse al editor visual de preview."
    >
      <div className="flex flex-col gap-3 rounded-lg border border-white/10 bg-[#101317] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-bold">Catálogo B.R</p>
          <p className="text-sm text-zinc-400">{allBeats.length} beats cargados desde datos mock.</p>
        </div>
        <Link href="/admin/beats/new" className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-cyan-300 px-4 text-sm font-bold text-black hover:bg-cyan-200">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nuevo Beat
        </Link>
      </div>

      <AdminBeatList beats={allBeats} />
    </AdminShell>
  );
}
