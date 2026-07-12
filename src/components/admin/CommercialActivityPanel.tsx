"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

  const activityStats = useMemo(() => {
    const mp3Downloads = activity.filter((item) => item.event_type === "mp3_download").length;
    const licenseDownloads = activity.filter((item) => item.event_type === "license_download").length;
    const manualPayments = activity.filter((item) => item.event_type === "manual_payment").length;

    return {
      total: activity.length,
      mp3Downloads,
      licenseDownloads,
      manualPayments,
    };
  }, [activity]);

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
    <section className="rounded-xl border border-cyan-300/20 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.10),transparent_45%),rgba(16,19,23,0.96)] p-4 shadow-[0_18px_45px_rgba(0,0,0,0.30)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-200">Actividad comercial</p>
          <h2 className="mt-1 text-base font-bold">Últimos eventos admin</h2>
        </div>
        <button type="button" onClick={() => void loadActivity()} className="inline-flex h-8 items-center gap-2 rounded-md border border-white/10 px-2.5 text-[11px] font-bold text-zinc-200 hover:border-cyan-300 hover:text-cyan-200">
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} aria-hidden="true" />
          Actualizar
        </button>
      </div>

      {message ? <p className="mt-3 rounded-md border border-red-300/20 bg-red-950/20 p-2.5 text-xs text-red-100">{message}</p> : null}

      <div className="mt-4 grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-cyan-300/20 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.08),transparent_45%),rgba(255,255,255,0.03)] p-3 shadow-[0_10px_25px_rgba(0,0,0,0.25)] transition duration-200 hover:-translate-y-1 hover:border-cyan-300/40">
          <p className="text-[10px] font-bold uppercase text-zinc-500">MP3</p>
          <p className="mt-1 text-lg font-black text-cyan-100">{activityStats.mp3Downloads}</p>
        </div>
        <div className="rounded-xl border border-cyan-300/20 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.08),transparent_45%),rgba(255,255,255,0.03)] p-3 shadow-[0_10px_25px_rgba(0,0,0,0.25)] transition duration-200 hover:-translate-y-1 hover:border-cyan-300/40">
          <p className="text-[10px] font-bold uppercase text-zinc-500">Licencias</p>
          <p className="mt-1 text-lg font-black text-cyan-100">{activityStats.licenseDownloads}</p>
        </div>
        <div className="rounded-xl border border-cyan-300/20 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.08),transparent_45%),rgba(255,255,255,0.03)] p-3 shadow-[0_10px_25px_rgba(0,0,0,0.25)] transition duration-200 hover:-translate-y-1 hover:border-cyan-300/40">
          <p className="text-[10px] font-bold uppercase text-zinc-500">Pagos</p>
          <p className="mt-1 text-lg font-black text-emerald-100">{activityStats.manualPayments}</p>
        </div>
        <div className="rounded-xl border border-cyan-300/20 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.08),transparent_45%),rgba(255,255,255,0.03)] p-3 shadow-[0_10px_25px_rgba(0,0,0,0.25)] transition duration-200 hover:-translate-y-1 hover:border-cyan-300/40">
          <p className="text-[10px] font-bold uppercase text-zinc-500">Eventos</p>
          <p className="mt-1 text-lg font-black text-zinc-100">{activityStats.total}</p>
        </div>
      </div>

      <div className="mt-2 max-h-36 overflow-auto rounded-md border border-white/10 bg-black/10">
        <div className="hidden min-w-205 grid-cols-[1.1fr_0.8fr_1.2fr_1.3fr] bg-white/5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500 md:grid">
          <span>Fecha</span>
          <span>Evento</span>
          <span>Beat</span>
          <span>Usuario</span>
        </div>
        {activity.length === 0 ? (
          <p className="p-2.5 text-xs text-zinc-400">Sin actividad registrada.</p>
        ) : (
          activity.map((item) => (
            <article key={item.id} className="grid min-w-205 gap-1.5 border-t border-white/10 px-2.5 py-1.5 text-[11px] md:grid-cols-[1.1fr_0.8fr_1.2fr_1.3fr] md:gap-3">
              <p className="text-zinc-400">{formatDate(item.created_at)}</p>
              <p className="font-bold text-cyan-100">{eventLabels[item.event_type] ?? item.event_type}</p>
              <p className="truncate text-zinc-200">{item.beat_title || item.beat_slug || "Beat sin título"}</p>
              <p className="truncate text-zinc-400">{item.user_email || "Sin email"}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
