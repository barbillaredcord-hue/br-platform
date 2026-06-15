import { AdminShell } from "@/components/admin/AdminShell";
import { NewBeatForm } from "@/components/admin/NewBeatForm";

export default function NewBeatPage() {
  return (
    <AdminShell
      title="Subir Beat"
      subtitle="Formulario visual para preparar un beat nuevo. En esta fase no guarda archivos ni datos."
    >
      <NewBeatForm />
    </AdminShell>
  );
}
