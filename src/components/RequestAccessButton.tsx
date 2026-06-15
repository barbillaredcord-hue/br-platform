"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useUser } from "@/context/UserContext";
import { createAccessRequestWithPhone } from "@/lib/supabase/queries";

export function RequestAccessButton({ beatId }: { beatId: string }) {
  const router = useRouter();
  const { currentUser, refreshCurrentUser } = useUser();
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRequest() {
    if (!currentUser) {
      router.push("/login");
      return;
    }

    setIsSubmitting(true);
    const result = await createAccessRequestWithPhone(currentUser.id, beatId, { phone, currentPhone: currentUser.phone, message: note });
    setMessage(result.message);
    if (result.ok) {
      await refreshCurrentUser();
      router.refresh();
    }
    setIsSubmitting(false);
  }

  return (
    <div className="grid gap-3 rounded-md border border-white/10 bg-white/5 p-3">
      {currentUser?.phone ? (
        <p className="text-xs font-semibold text-cyan-200">Teléfono: {currentUser.phone}</p>
      ) : (
        <label className="grid gap-2">
          <span className="text-xs font-bold uppercase text-zinc-400">Teléfono obligatorio</span>
          <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+52..." className="h-10 rounded-md border border-white/10 bg-black/20 px-3 text-sm outline-none focus:border-cyan-300" />
        </label>
      )}
      <label className="grid gap-2">
        <span className="text-xs font-bold uppercase text-zinc-400">Mensaje opcional</span>
        <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Cuéntale a B.R cómo quieres coordinar el pago" className="min-h-20 rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-cyan-300" />
      </label>
      <button
        type="button"
        onClick={() => void handleRequest()}
        disabled={isSubmitting}
        className="rounded-md border border-cyan-300/30 px-5 py-3 text-sm font-bold text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-300/10"
      >
        {isSubmitting ? "Enviando..." : "Solicitar acceso"}
      </button>
      <p className="text-xs leading-5 text-zinc-400">
        B.R se pondrá en contacto contigo para coordinar el pago. Una vez confirmado el pago, B.RCEO habilitará el acceso al beat.
      </p>
      <p className="text-xs leading-5 text-cyan-200">
        Próximamente: Solicitar acceso → Página de pago → Pago confirmado → Acceso automático. Por ahora: Pago coordinado directamente con B.R.
      </p>
      {message ? <p className="text-sm font-semibold text-cyan-200">{message}</p> : null}
    </div>
  );
}
