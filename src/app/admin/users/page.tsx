import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { AdminShell } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default function AdminUsersPage() {
  return (
    <AdminShell
      title="Usuarios"
      subtitle="Listado real de profiles, roles y beats autorizados en Supabase."
    >
      <AdminUsersTable />
    </AdminShell>
  );
}
