import { AccessRequestsTable } from "@/components/admin/AccessRequestsTable";
import { AdminShell } from "@/components/admin/AdminShell";
import { accessRequests } from "@/data/accessRequests";

export default function AdminAccessRequestsPage() {
  return (
    <AdminShell
      title="Solicitudes de acceso"
      subtitle="Bandeja demo para aprobar o rechazar solicitudes sin persistencia ni backend."
    >
      <AccessRequestsTable requests={accessRequests} />
    </AdminShell>
  );
}
