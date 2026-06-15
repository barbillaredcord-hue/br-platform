"use client";

import { useState } from "react";

export function RequestAccessButton() {
  const [message, setMessage] = useState("");

  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={() => setMessage("Solicitud enviada al admin")}
        className="rounded-md border border-cyan-300/30 px-5 py-3 text-sm font-bold text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-300/10"
      >
        Solicitar acceso
      </button>
      {message ? <p className="text-sm font-semibold text-cyan-200">{message}. El pago se coordina directamente con B.R.</p> : null}
    </div>
  );
}
