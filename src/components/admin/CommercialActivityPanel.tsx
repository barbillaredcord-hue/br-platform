"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type CommercialActivity = {
  id: string;
  event_type: "mp3_download" | "license_download" | "manual_payment";
  user_email: string | null;
  beat_title: string | null;
  beat_slug: string | null;
  created_at: string | null;
};

const eventLabels: Record<CommercialActivity["event_type"], string> = {
  mp3_download: "Descarga MP3",
  license_download: "Licencia",
  manual_payment: "Pago manual",
};

function formatDate(value: string | null) {
  if (!value) {
    return "Sin fecha";
  }

  return new Date(value).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function CommercialActivityPanel() {
  const [activity, setActivity] = useState<CommercialActivity[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loadActivity = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();

    if (!supabase) {
      setMessage("Supabase no está configurado.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        setMessage("Sesión no válida.");
        return;
      }

      const response = await fetch("/api/admin/commercial-activity", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        setMessage(payload?.message ?? "No se pudo cargar la actividad comercial.");
        return;
      }

      setActivity(payload.activity ?? []);
    } catch {
      setMessage("No se pudo cargar la actividad comercial.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadId = window.setTimeout(() => {
      void loadActivity();
    }, 0);
    window.addEventListener("br-commercial-activity-refresh", loadActivity);

    return () => {
      window.clearTimeout(loadId);
      window.removeEventListener("br-commercial-activity-refresh", loadActivity);
    };
  }, [loadActivity]);

  return (
    <section className="rounded-lg border border-white/10 bg-[#101317] p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-cyan-200">Actividad comercial</p>
          <h2 className="mt-2 text-xl font-bold">Últimos eventos</h2>
        </div>
        <button type="button" onClick={() => void loadActivity()} className="inline-flex h-10 items-center gap-2 rounded-md border border-white/10 px-4 text-sm font-bold text-zinc-200 hover:border-cyan-300 hover:text-cyan-200">
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} aria-hidden="true" />
          Actualizar
        </button>
      </div>

      {message ? <p className="mt-4 rounded-md border border-red-300/20 bg-red-950/20 p-3 text-sm text-red-100">{message}</p> : null}

      <div className="mt-5 overflow-hidden rounded-md border border-white/10">
        <div className="hidden grid-cols-4 bg-white/5 px-4 py-3 text-xs font-bold uppercase text-zinc-500 md:grid">
          <span>Fecha</span>
          <span>Evento</span>
          <span>Beat</span>
          <span>Usuario</span>
        </div>
        {activity.length === 0 ? (
          <p className="p-4 text-sm text-zinc-400">Sin actividad registrada.</p>
        ) : (
          activity.map((item) => (
            <article key={item.id} className="grid gap-2 border-t border-white/10 px-4 py-4 text-sm md:grid-cols-4 md:gap-4">
              <p className="text-zinc-400">{formatDate(item.created_at)}</p>
              <p className="font-bold text-cyan-100">{eventLabels[item.event_type] ?? item.event_type}</p>
              <p className="text-zinc-200">{item.beat_title || item.beat_slug || "Beat sin título"}</p>
              <p className="text-zinc-400">{item.user_email || "Sin email"}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
