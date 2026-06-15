import { AccessManager } from "@/components/admin/AccessManager";
import { AdminShell } from "@/components/admin/AdminShell";
import { allBeats } from "@/data/beats";
import { demoUsers } from "@/data/users";

export default function AdminAccessPage() {
  return (
    <AdminShell
      title="Gestión manual de accesos"
      subtitle="Asigna o retira acceso completo en modo demo. Los cambios viven localmente hasta recargar."
    >
      <AccessManager beats={allBeats} users={demoUsers} />
    </AdminShell>
  );
}
