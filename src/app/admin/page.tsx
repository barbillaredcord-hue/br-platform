import { Inbox, KeyRound, ListMusic, PlugZap, Plus, Users } from "lucide-react";
import { AdminDashboardStats } from "@/components/admin/AdminDashboardStats";
import { AdminQuickLink } from "@/components/admin/AdminQuickLink";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProductUpdatesPanel } from "@/components/ProductUpdatesPanel";
import { getAccessRequests, getBeats, getProfiles } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminPage() {
  const [{ beats }, users, requests] = await Promise.all([getBeats(), getProfiles(), getAccessRequests()]);

  return (
    <AdminShell
      title="Dashboard Admin"
      subtitle="Vista demo para operar el catálogo privado, revisar solicitudes y preparar previews antes de liberar accesos."
    >
      <AdminDashboardStats initialBeats={beats} initialUsers={users} initialRequests={requests} />
      <ProductUpdatesPanel audience="admin" />

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
