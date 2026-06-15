"use client";

import { useEffect, useState } from "react";
import type { AccessRequestStatus } from "@/data/accessRequests";
import { approveAccessRequest, getAccessRequests, markAccessRequestContacted, rejectAccessRequest, type AccessRequestRow } from "@/lib/supabase/queries";

const statusLabels: Record<AccessRequestStatus, string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
};

const statusStyles: Record<AccessRequestStatus, string> = {
  pending: "border-cyan-300/30 text-cyan-200",
  approved: "border-emerald-300/30 text-emerald-200",
  rejected: "border-red-300/30 text-red-200",
};

function getRequestUser(request: AccessRequestRow) {
  const profile = Array.isArray(request.profiles) ? request.profiles[0] : request.profiles;
  return profile?.display_name || profile?.username || profile?.email || request.user_id;
}

function getRequestProfile(request: AccessRequestRow) {
  return Array.isArray(request.profiles) ? request.profiles[0] : request.profiles;
}

function getRequestPhone(request: AccessRequestRow) {
  const match = request.message?.match(/Tel[eé]fono:\s*([^\n]+)/i);
  return match?.[1]?.trim() || "Sin teléfono";
}

function isContacted(request: AccessRequestRow) {
  return Boolean(request.message?.includes("[contactado]"));
}

function getRequestBeat(request: AccessRequestRow) {
  const beat = Array.isArray(request.beats) ? request.beats[0] : request.beats;
  return beat?.title || beat?.slug || request.beat_id;
}

function getRequestDate(request: AccessRequestRow) {
  return request.created_at ? new Date(request.created_at).toLocaleDateString("es-MX") : "Sin fecha";
}

export function AccessRequestsTable() {
  const [items, setItems] = useState<AccessRequestRow[]>([]);
  const [message, setMessage] = useState("");

  async function refresh() {
    setItems(await getAccessRequests());
  }

  async function updateStatus(id: string, status: AccessRequestStatus) {
    const result = status === "approved" ? await approveAccessRequest(id) : await rejectAccessRequest(id);
    setMessage(result.ok ? "Solicitud actualizada." : result.message ?? "No se pudo actualizar.");
    await refresh();
  }

  async function markContacted(request: AccessRequestRow) {
    const result = await markAccessRequestContacted(request.id, request.message);
    setMessage(result.ok ? "Solicitud marcada como contactada." : result.message ?? "No se pudo marcar.");
    await refresh();
  }

  useEffect(() => {
    const loadId = window.setTimeout(() => {
      void refresh();
    }, 0);

    return () => {
      window.clearTimeout(loadId);
    };
  }, []);

  return (
    <section className="rounded-lg border border-white/10 bg-[#101317] p-4">
      {message ? <p className="mb-4 rounded-md border border-white/10 bg-white/5 p-3 text-sm font-semibold text-cyan-200">{message}</p> : null}
      <div className="hidden overflow-hidden rounded-lg border border-white/10 md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Email / Username</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Beat solicitado</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((request) => {
              const profile = getRequestProfile(request);
              return (
              <tr key={request.id} className="border-t border-white/10">
                <td className="px-4 py-3 font-semibold">{getRequestUser(request)} {isContacted(request) ? <span className="ml-2 text-xs text-emerald-200">Contactado</span> : null}</td>
                <td className="px-4 py-3 text-zinc-400">{profile?.email || "Sin email"}<br /><span className="text-cyan-200">@{profile?.username || "sin-username"}</span></td>
                <td className="px-4 py-3 text-zinc-400">{getRequestPhone(request)}</td>
                <td className="px-4 py-3 text-zinc-400">{getRequestBeat(request)}</td>
                <td className="px-4 py-3 text-zinc-400">{getRequestDate(request)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${statusStyles[request.status]}`}>
                    {statusLabels[request.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => void updateStatus(request.id, "approved")} className="rounded-md bg-cyan-300 px-3 py-2 text-xs font-bold text-black hover:bg-cyan-200">
                      Aprobar y dar acceso
                    </button>
                    <button type="button" onClick={() => void markContacted(request)} className="rounded-md border border-emerald-300/30 px-3 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-300/10">
                      Contactado
                    </button>
                    <button type="button" onClick={() => void updateStatus(request.id, "rejected")} className="rounded-md border border-white/10 px-3 py-2 text-xs font-bold text-zinc-200 hover:border-red-300 hover:text-red-200">
                      Rechazar
                    </button>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 md:hidden">
        {items.map((request) => (
          <article key={request.id} className="rounded-lg border border-white/10 bg-[#15181c] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{getRequestUser(request)}</p>
                <p className="mt-1 text-sm text-zinc-400">{getRequestBeat(request)}</p>
                <p className="mt-1 text-sm text-zinc-400">{getRequestPhone(request)}</p>
                <p className="mt-1 text-xs text-zinc-500">{getRequestDate(request)}</p>
                {isContacted(request) ? <p className="mt-1 text-xs font-bold text-emerald-200">Contactado</p> : null}
              </div>
              <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${statusStyles[request.status]}`}>
                {statusLabels[request.status]}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => void updateStatus(request.id, "approved")} className="rounded-md bg-cyan-300 px-3 py-2 text-xs font-bold text-black hover:bg-cyan-200">
                Aprobar
              </button>
              <button type="button" onClick={() => void markContacted(request)} className="rounded-md border border-emerald-300/30 px-3 py-2 text-xs font-bold text-emerald-200">
                Contactado
              </button>
              <button type="button" onClick={() => void updateStatus(request.id, "rejected")} className="rounded-md border border-white/10 px-3 py-2 text-xs font-bold text-zinc-200 hover:border-red-300 hover:text-red-200">
                Rechazar
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
