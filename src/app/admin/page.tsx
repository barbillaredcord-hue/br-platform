import { Inbox, KeyRound, ListMusic, PlugZap, Plus, Users } from "lucide-react";
import { AdminQuickLink } from "@/components/admin/AdminQuickLink";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { getAccessRequests, getBeats, getProfiles } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [{ beats }, users, requests] = await Promise.all([getBeats(), getProfiles(), getAccessRequests()]);
  const exclusiveBeats = beats.filter((beat) => beat.status === "Exclusivo");
  const mostPlayedBeat = beats[0];
  const pendingRequests = requests.filter((request) => request.status === "pending");

  return (
    <AdminShell
      title="Dashboard Admin"
      subtitle="Vista demo para operar el catálogo privado, revisar solicitudes y preparar previews antes de liberar accesos."
    >
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <AdminStatCard label="Total de beats" value={String(beats.length)} detail="Catálogo activo" href="/admin/beats" />
        <AdminStatCard label="Accesos" value={String(exclusiveBeats.length)} detail="Gestionar accesos" href="/admin/access" />
        <AdminStatCard label="Usuarios" value={String(users.length)} detail="Profiles reales" href="/admin/users" />
        <AdminStatCard label="Solicitudes pendientes" value={String(pendingRequests.length)} detail="Por revisar" href="/admin/access-requests" />
        <AdminStatCard label="Beat destacado" value={mostPlayedBeat?.name ?? "Sin beats"} detail={mostPlayedBeat ? `${mostPlayedBeat.genre} · ${mostPlayedBeat.bpm} BPM` : "Pendiente"} href={mostPlayedBeat ? `/beats/${mostPlayedBeat.id}` : undefined} />
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">Accesos rápidos</h2>
        <div className="grid gap-4 md:grid-cols-6">
          <AdminQuickLink href="/admin/beats/new" label="Subir Beat" detail="Crear ficha visual y preparar archivos demo." icon={Plus} />
          <AdminQuickLink href="/admin/beats" label="Gestionar Beats" detail="Revisar catálogo, estados y edición de preview." icon={ListMusic} />
          <AdminQuickLink href="/admin/users" label="Usuarios" detail="Ver profiles y beats autorizados." icon={Users} />
          <AdminQuickLink href="/admin/access" label="Gestionar accesos" detail="Dar o quitar acceso completo manualmente." icon={KeyRound} />
          <AdminQuickLink href="/admin/access-requests" label="Solicitudes" detail="Aprobar o rechazar accesos pendientes." icon={Inbox} />
          <AdminQuickLink href="/admin/setup" label="Estado Supabase" detail="Verificar URL, anon key, email B.RCEO y conexión Auth." icon={PlugZap} />
        </div>
      </section>
    </AdminShell>
  );
}
