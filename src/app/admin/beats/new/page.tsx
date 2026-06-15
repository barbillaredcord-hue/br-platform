import { AdminShell } from "@/components/admin/AdminShell";
import { NewBeatForm } from "@/components/admin/NewBeatForm";

export default function NewBeatPage() {
  return (
    <AdminShell
      title="Subir Beat"
      subtitle="Sube un MP3 al bucket beats y crea el registro real en public.beats."
    >
      <NewBeatForm />
    </AdminShell>
  );
}
