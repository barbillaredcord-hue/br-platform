"use client";

import { useState } from "react";
import { useUser } from "@/context/UserContext";
import { createAccessRequest } from "@/lib/supabase/queries";

export function RequestAccessButton({ beatId }: { beatId: string }) {
  const { currentUser } = useUser();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRequest() {
    if (!currentUser) {
      setMessage("Inicia sesión para solicitar acceso.");
      return;
    }

    setIsSubmitting(true);
    const result = await createAccessRequest(currentUser.id, beatId);
    setMessage(result.message);
    setIsSubmitting(false);
  }

  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={() => void handleRequest()}
        disabled={isSubmitting}
        className="rounded-md border border-cyan-300/30 px-5 py-3 text-sm font-bold text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-300/10"
      >
        {isSubmitting ? "Enviando..." : "Solicitar acceso"}
      </button>
      {message ? <p className="text-sm font-semibold text-cyan-200">{message} El pago se coordina directamente con B.R.</p> : null}
    </div>
  );
}
