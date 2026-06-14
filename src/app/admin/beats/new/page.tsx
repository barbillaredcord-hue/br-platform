import Link from "next/link";
import { ArrowLeft, Wand2 } from "lucide-react";
import { AdminFormField } from "@/components/admin/AdminFormField";
import { AdminShell } from "@/components/admin/AdminShell";

export default function NewBeatPage() {
  return (
    <AdminShell
      title="Subir Beat"
      subtitle="Formulario visual para preparar un beat nuevo. En esta fase no guarda archivos ni datos."
    >
      <form className="grid gap-6 rounded-lg border border-white/10 bg-[#101317] p-5 md:grid-cols-2">
        <AdminFormField label="Nombre" placeholder="Ej. Metro Aqua" />
        <AdminFormField label="Género" placeholder="Trap, Drill, Reggaeton..." />
        <AdminFormField label="BPM" placeholder="144" type="number" />
        <AdminFormField label="Tonalidad" placeholder="F minor" />
        <AdminFormField label="Portada" type="file" />
        <AdminFormField label="Archivo Beat Completo" type="file" />

        <div className="md:col-span-2 rounded-lg border border-cyan-300/20 bg-white/5 p-4">
          <p className="font-bold">Generar Preview</p>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Demo visual para crear un preview de 15 segundos a partir del beat completo.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" className="inline-flex h-11 items-center gap-2 rounded-md bg-cyan-300 px-5 text-sm font-bold text-black hover:bg-cyan-200">
              <Wand2 className="h-4 w-4" aria-hidden="true" />
              Generar Preview
            </button>
            <Link href="/admin/beats" className="inline-flex h-11 items-center gap-2 rounded-md border border-white/10 px-5 text-sm font-bold text-zinc-200 hover:border-cyan-300 hover:text-cyan-200">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Volver a Beats
            </Link>
          </div>
        </div>
      </form>
    </AdminShell>
  );
}
