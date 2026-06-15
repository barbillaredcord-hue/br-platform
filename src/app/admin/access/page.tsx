import { AccessManager } from "@/components/admin/AccessManager";
import { AdminShell } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default function AdminAccessPage() {
  return (
    <AdminShell
      title="Gestión manual de accesos"
      subtitle="Asigna o retira acceso completo usando beat_access real en Supabase."
    >
      <AccessManager />
    </AdminShell>
  );
}
