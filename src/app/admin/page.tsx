import { Inbox, KeyRound, ListMusic, Plus, Users } from "lucide-react";
import { AdminQuickLink } from "@/components/admin/AdminQuickLink";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { accessRequests } from "@/data/accessRequests";
import { allBeats } from "@/data/beats";

const exclusiveBeats = allBeats.filter((beat) => beat.status === "Exclusivo");
const mostPlayedBeat = allBeats[0];
const pendingRequests = accessRequests.filter((request) => request.status === "pending");

export default function AdminPage() {
  return (
    <AdminShell
      title="Dashboard Admin"
      subtitle="Vista demo para operar el catálogo privado, revisar solicitudes y preparar previews antes de liberar accesos."
    >
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <AdminStatCard label="Total de beats" value={String(allBeats.length)} detail="Catálogo demo activo" />
        <AdminStatCard label="Beats exclusivos" value={String(exclusiveBeats.length)} detail="Bloqueados por acceso" />
        <AdminStatCard label="Usuarios con acceso" value="128" detail="Demo visual" />
        <AdminStatCard label="Solicitudes pendientes" value={String(pendingRequests.length)} detail="Por revisar" />
        <AdminStatCard label="Beat más escuchado" value={mostPlayedBeat.name} detail={`${mostPlayedBeat.genre} · ${mostPlayedBeat.bpm} BPM`} />
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">Accesos rápidos</h2>
        <div className="grid gap-4 md:grid-cols-5">
          <AdminQuickLink href="/admin/beats/new" label="Subir Beat" detail="Crear ficha visual y preparar archivos demo." icon={Plus} />
          <AdminQuickLink href="/admin/beats" label="Gestionar Beats" detail="Revisar catálogo, estados y edición de preview." icon={ListMusic} />
          <AdminQuickLink href="/admin/users" label="Usuarios" detail="Ver usuarios demo y sus beats autorizados." icon={Users} />
          <AdminQuickLink href="/admin/access" label="Gestionar accesos" detail="Dar o quitar acceso completo manualmente." icon={KeyRound} />
          <AdminQuickLink href="/admin/access-requests" label="Solicitudes" detail="Aprobar o rechazar accesos pendientes." icon={Inbox} />
        </div>
      </section>
    </AdminShell>
  );
}
