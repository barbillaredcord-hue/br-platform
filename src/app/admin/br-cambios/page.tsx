"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { deleteAdminChangeLog, getAdminChangeLogs, type AdminChangeLog } from "@/lib/supabase/queries";

export default function AdminBrCambiosPage() {
  const currentYear = new Date().getFullYear();
  const [logs, setLogs] = useState<AdminChangeLog[]>([]);
  const [years, setYears] = useState<number[]>([currentYear]);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState("");

  const loadLogs = useCallback(async (year?: number) => {
    const result = await getAdminChangeLogs(year ? { year } : {});

    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    setLogs(result.logs);
    if (!year) {
      setYears(result.years.length ? result.years : [currentYear]);
    }
    setMessage("");

    if (!year && result.years.length) {
      setSelectedYear(result.years[0]);
    }
  }, [currentYear]);

  useEffect(() => {
    const loadId = window.setTimeout(() => {
      void loadLogs();
    }, 0);

    return () => window.clearTimeout(loadId);
  }, [loadLogs]);

  useEffect(() => {
    const loadId = window.setTimeout(() => {
      void loadLogs(selectedYear);
    }, 0);

    return () => window.clearTimeout(loadId);
  }, [loadLogs, selectedYear]);

  const visibleLogs = useMemo(() => logs.filter((log) => log.year === selectedYear), [logs, selectedYear]);

  async function deleteBlock(logId: string) {
    setDeletingId(logId);
    setMessage("");

    const result = await deleteAdminChangeLog(logId);

    if (!result.ok) {
      setMessage(result.message);
    } else {
      setLogs((current) => current.filter((log) => log.id !== logId));
    }

    setDeletingId("");
  }

  return (
    <AdminShell
      title="B.R Cambios"
      subtitle="Historial administrativo real organizado por año."
    >
      <section className="rounded-lg border border-white/10 bg-[#101317] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-bold">Bloques por año</p>
            <p className="text-sm text-zinc-400">{visibleLogs.length} bloques en {selectedYear}.</p>
          </div>
          <label className="grid gap-1 text-sm font-semibold text-zinc-300">
            Año
            <select
              value={selectedYear}
              onChange={(event) => setSelectedYear(Number(event.target.value))}
              className="h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-cyan-300"
            >
              {years.map((year) => (
                <option key={year} value={year} className="bg-[#101317] text-white">
                  {year}
                </option>
              ))}
            </select>
          </label>
        </div>

        {message ? <p className="mt-4 rounded-md border border-red-300/20 bg-red-950/20 p-3 text-sm text-red-100">{message}</p> : null}

        <div className="mt-4 grid gap-3">
          {visibleLogs.length ? (
            visibleLogs.map((log) => (
              <article key={log.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-bold text-cyan-100">{log.block_title}</p>
                    <p className="mt-2 text-sm leading-6 text-zinc-300">{log.description}</p>
                  </div>
                  <button
                    type="button"
                    disabled={deletingId === log.id}
                    onClick={() => void deleteBlock(log.id)}
                    className="h-9 w-fit rounded-md border border-red-300/30 px-3 text-xs font-bold text-red-100 hover:bg-red-300/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deletingId === log.id ? "Borrando..." : "Borrar bloque"}
                  </button>
                </div>
                <div className="mt-4 grid gap-2 text-xs text-zinc-400 sm:grid-cols-2 lg:grid-cols-4">
                  <p><span className="font-bold text-zinc-200">Tipo:</span> {log.event_type}</p>
                  <p><span className="font-bold text-zinc-200">Objetivo:</span> {log.target_name ?? log.target_type ?? "Sin objetivo"}</p>
                  <p><span className="font-bold text-zinc-200">Fecha:</span> {new Date(log.created_at).toLocaleString()}</p>
                  <p><span className="font-bold text-zinc-200">Expira:</span> {log.expires_at ? new Date(log.expires_at).toLocaleDateString() : "No"}</p>
                </div>
                {log.command_text ? (
                  <p className="mt-3 rounded-md bg-black/20 px-3 py-2 text-xs text-zinc-300">
                    <span className="font-bold text-zinc-100">Movimiento:</span> {log.command_text}
                  </p>
                ) : null}
              </article>
            ))
          ) : (
            <p className="rounded-md border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-400">No hay bloques para este año.</p>
          )}
        </div>
      </section>
    </AdminShell>
  );
}
