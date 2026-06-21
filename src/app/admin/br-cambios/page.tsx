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

  function downloadYearPdf() {
    const printWindow = window.open("", "_blank", "width=1000,height=800");

    if (!printWindow) {
      setMessage("No se pudo abrir la ventana PDF.");
      return;
    }

    const rows = visibleLogs.length
      ? visibleLogs
          .map(
            (log) => `
              <tr>
                <td>${log.block_title}</td>
                <td>${log.event_type}</td>
                <td>${log.target_name ?? log.target_type ?? "Sin objetivo"}</td>
                <td>${new Date(log.created_at).toLocaleString()}</td>
              </tr>
            `,
          )
          .join("")
      : `<tr><td colspan="4">No existen registros.</td></tr>`;

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>B.R Cambios ${selectedYear}</title>
          <style>
            *{box-sizing:border-box;}
            body{
              margin:0;
              background:#f5f7fb;
              color:#101317;
              font-family:Inter,Arial,sans-serif;
              padding:42px;
            }
            .sheet{
              background:#ffffff;
              border:1px solid #e5e7eb;
              border-radius:22px;
              padding:34px;
              box-shadow:0 24px 80px rgba(15,23,42,.12);
            }
            .header{
              display:flex;
              align-items:flex-start;
              justify-content:space-between;
              gap:24px;
              border-bottom:1px solid #e5e7eb;
              padding-bottom:22px;
              margin-bottom:24px;
            }
            .brand{
              color:#0f172a;
              margin:0;
              font-size:34px;
              letter-spacing:5px;
              font-weight:900;
            }
            .subtitle{
              color:#64748b;
              margin:8px 0 0;
              font-size:12px;
              letter-spacing:1.4px;
              text-transform:uppercase;
            }
            .badge{
              border:1px solid #67e8f9;
              background:linear-gradient(135deg,#ecfeff,#ffffff);
              color:#0891b2;
              border-radius:999px;
              padding:10px 14px;
              font-size:11px;
              font-weight:800;
              letter-spacing:1.2px;
              text-transform:uppercase;
              white-space:nowrap;
            }
            .stats{
              display:grid;
              grid-template-columns:repeat(3,1fr);
              gap:12px;
              margin-bottom:24px;
            }
            .stat{
              border:1px solid #e5e7eb;
              border-radius:16px;
              padding:14px;
              background:#f8fafc;
            }
            .stat span{
              display:block;
              color:#64748b;
              font-size:10px;
              font-weight:800;
              letter-spacing:1.2px;
              text-transform:uppercase;
            }
            .stat strong{
              display:block;
              margin-top:6px;
              color:#0f172a;
              font-size:18px;
            }
            table{
              width:100%;
              border-collapse:separate;
              border-spacing:0;
              overflow:hidden;
              border:1px solid #e5e7eb;
              border-radius:16px;
              font-size:11px;
            }
            th,td{
              padding:12px 14px;
              text-align:left;
              border-bottom:1px solid #e5e7eb;
              vertical-align:top;
            }
            th{
              background:#0f172a;
              color:#67e8f9;
              text-transform:uppercase;
              letter-spacing:1.4px;
              font-size:10px;
            }
            td{color:#334155;}
            tr:last-child td{border-bottom:0;}
            .footer{
              margin-top:24px;
              color:#94a3b8;
              font-size:10px;
              letter-spacing:1px;
              text-transform:uppercase;
            }
          </style>
        </head>
        <body>
          <main class="sheet">
            <section class="header">
              <div>
                <h1 class="brand">B.R</h1>
                <p class="subtitle">Cambios administrativos · Reporte premium</p>
              </div>
              <div class="badge">Official Admin Export</div>
            </section>
            <section class="stats">
              <div class="stat"><span>Año</span><strong>${selectedYear}</strong></div>
              <div class="stat"><span>Registros</span><strong>${visibleLogs.length}</strong></div>
              <div class="stat"><span>Generado</span><strong>${new Date().toLocaleDateString()}</strong></div>
            </section>
          <table>
            <thead>
              <tr>
                <th>Bloque</th>
                <th>Tipo</th>
                <th>Objetivo</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
            <p class="footer">B.R System · Read Only · Export generated from admin change logs</p>
          </main>
          <script>window.onload=()=>window.print();</script>
        </body>
      </html>
    `);

    printWindow.document.close();
  }

  return (
    <AdminShell
      title="B.R Cambios"
      subtitle="Historial administrativo real organizado por año."
    >
      <section className="rounded-lg border border-emerald-400/20 bg-[#05070a] p-3 shadow-[0_0_34px_rgba(34,197,94,0.08)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">BR://ADMIN_CHANGE_LOGS</p>
            <p className="font-mono text-xs text-emerald-500/80">{visibleLogs.length} bloques detectados en {selectedYear}.</p>
          </div>
          <div className="flex items-end gap-2">
            <label className="grid gap-1 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
              Año
              <select
                value={selectedYear}
                onChange={(event) => setSelectedYear(Number(event.target.value))}
                className="h-10 rounded-md border border-emerald-400/20 bg-black/40 px-3 font-mono text-sm text-emerald-100 outline-none focus:border-emerald-300"
              >
                {years.map((year) => (
                  <option key={year} value={year} className="bg-[#05070a] text-emerald-100">
                    {year}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={downloadYearPdf}
              className="h-10 rounded-md border border-cyan-300/30 bg-cyan-300/10 px-3 font-mono text-xs font-bold uppercase tracking-[0.16em] text-cyan-100 hover:bg-cyan-300/20"
            >
              PDF
            </button>
          </div>
        </div>

        {message ? <p className="mt-4 rounded-md border border-red-300/20 bg-red-950/20 p-3 font-mono text-xs text-red-100">{message}</p> : null}

        <div className="mt-3 grid max-h-[520px] gap-2 overflow-y-auto pr-1">
          {visibleLogs.length ? (
            visibleLogs.map((log) => (
              <article key={log.id} className="rounded-lg border border-emerald-400/15 bg-black/30 p-3 font-mono shadow-[inset_0_0_18px_rgba(34,197,94,0.03)]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-cyan-100">{log.block_title}</p>
                    <p className="mt-1 text-[11px] leading-5 text-emerald-100/80">{log.description}</p>
                  </div>
                  <button
                    type="button"
                    disabled={deletingId === log.id}
                    onClick={() => void deleteBlock(log.id)}
                    className="h-8 w-fit rounded-md border border-red-300/30 bg-red-300/5 px-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-red-100 hover:bg-red-300/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deletingId === log.id ? "Borrando..." : "Borrar bloque"}
                  </button>
                </div>
                <div className="mt-2 grid gap-1 text-[10px] text-emerald-500/80 sm:grid-cols-2 lg:grid-cols-4">
                  <p><span className="font-bold text-emerald-300">Tipo:</span> {log.event_type}</p>
                  <p><span className="font-bold text-emerald-300">Objetivo:</span> {log.target_name ?? log.target_type ?? "Sin objetivo"}</p>
                  <p><span className="font-bold text-emerald-300">Fecha:</span> {new Date(log.created_at).toLocaleString()}</p>
                  <p><span className="font-bold text-emerald-300">Expira:</span> {log.expires_at ? new Date(log.expires_at).toLocaleDateString() : "No"}</p>
                </div>
                {log.command_text ? (
                  <p className="mt-2 rounded-md border border-emerald-400/10 bg-black/40 px-2 py-1.5 font-mono text-[10px] text-emerald-100/80">
                    <span className="font-bold text-cyan-100">Movimiento:</span> {log.command_text}
                  </p>
                ) : null}
              </article>
            ))
          ) : (
            <p className="rounded-md border border-emerald-400/15 bg-black/30 p-3 font-mono text-xs text-emerald-500/80">No hay bloques para este año.</p>
          )}
        </div>
      </section>
    </AdminShell>
  );
}
