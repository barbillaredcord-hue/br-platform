import { AccessRequestsTable } from "@/components/admin/AccessRequestsTable";
import { AdminShell } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default function AdminAccessRequestsPage() {
  return (
    <AdminShell
      title="Solicitudes de acceso"
      subtitle="Bandeja real para aprobar o rechazar solicitudes guardadas en Supabase."
    >
      <AccessRequestsTable />
    </AdminShell>
  );
}
