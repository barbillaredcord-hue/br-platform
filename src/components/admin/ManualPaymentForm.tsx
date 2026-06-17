"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const initialForm = {
  user_id: "",
  beat_id: "",
  amount: "",
  currency: "MXN",
  payment_method: "",
  note: "",
};

export function ManualPaymentForm() {
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function updateField(field: keyof typeof initialForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submitPayment() {
    if (isSaving) {
      return;
    }

    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      setMessage("Supabase no está configurado.");
      return;
    }

    setIsSaving(true);
    setMessage("Registrando pago...");

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        setMessage("Sesión no válida.");
        return;
      }

      const response = await fetch("/api/admin/manual-payment", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        setMessage(payload?.message ?? "No se pudo registrar el pago.");
        return;
      }

      setMessage(payload.message ?? "Pago registrado.");
      setForm(initialForm);
      window.dispatchEvent(new Event("br-commercial-activity-refresh"));
    } catch {
      setMessage("No se pudo registrar el pago.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-lg border border-white/10 bg-[#101317] p-5">
      <div>
        <p className="text-xs font-bold uppercase text-cyan-200">Pago manual</p>
        <h2 className="mt-2 text-xl font-bold">Registrar comprobante interno</h2>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-zinc-300">User ID</span>
          <input value={form.user_id} onChange={(event) => updateField("user_id", event.target.value)} className="h-11 rounded-md border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-cyan-300" placeholder="uuid del usuario" />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-zinc-300">Beat ID o slug</span>
          <input value={form.beat_id} onChange={(event) => updateField("beat_id", event.target.value)} className="h-11 rounded-md border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-cyan-300" placeholder="uuid o slug del beat" />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-zinc-300">Monto</span>
          <input value={form.amount} onChange={(event) => updateField("amount", event.target.value)} type="number" min="0" step="0.01" className="h-11 rounded-md border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-cyan-300" placeholder="1500.00" />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-zinc-300">Moneda</span>
          <input value={form.currency} onChange={(event) => updateField("currency", event.target.value.toUpperCase())} className="h-11 rounded-md border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-cyan-300" placeholder="MXN" />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-zinc-300">Método</span>
          <input value={form.payment_method} onChange={(event) => updateField("payment_method", event.target.value)} className="h-11 rounded-md border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-cyan-300" placeholder="Transferencia, efectivo..." />
        </label>
        <label className="grid gap-2 md:col-span-2">
          <span className="text-sm font-semibold text-zinc-300">Nota</span>
          <textarea value={form.note} onChange={(event) => updateField("note", event.target.value)} className="min-h-24 rounded-md border border-white/10 bg-white/5 px-3 py-3 text-sm outline-none focus:border-cyan-300" placeholder="Referencia o nota interna" />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => void submitPayment()} disabled={isSaving} className="inline-flex h-11 items-center gap-2 rounded-md bg-cyan-300 px-5 text-sm font-bold text-black hover:bg-cyan-200 disabled:opacity-60">
          <Save className="h-4 w-4" aria-hidden="true" />
          {isSaving ? "Guardando..." : "Registrar pago"}
        </button>
        {message ? <p className="text-sm font-semibold text-cyan-200">{message}</p> : null}
      </div>
    </section>
  );
}
