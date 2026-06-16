"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check, MessageCircle, X } from "lucide-react";
import type { AccessRequestStatus } from "@/data/accessRequests";
import { approveAccessRequest, getAccessRequests, isRecentAnsweredRequest, markAccessRequestContacted, rejectAccessRequest, type AccessRequestRow } from "@/lib/supabase/queries";

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
  const profile = getRequestProfile(request);
  if (profile?.phone) {
    return profile.phone;
  }

  const match = request.message?.match(/Tel[eé]fono:\s*([^\n]+)/i);
  return match?.[1]?.trim() || "Sin teléfono";
}

function getWhatsAppPhone(request: AccessRequestRow) {
  const rawPhone = getRequestPhone(request);

  if (!rawPhone || rawPhone === "Sin teléfono") {
    return "";
  }

  return rawPhone.replace(/[+\s()-]/g, "").replace(/\D/g, "");
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
  const pathname = usePathname();
  const router = useRouter();
  const [items, setItems] = useState<AccessRequestRow[]>([]);
  const [message, setMessage] = useState("");

  async function refresh() {
    setItems(await getAccessRequests());
  }

  async function updateStatus(id: string, status: AccessRequestStatus) {
    const result = status === "approved" ? await approveAccessRequest(id) : await rejectAccessRequest(id);
    if (result.ok) {
      setItems((current) => current.map((item) => (item.id === id ? { ...item, status, updated_at: new Date().toISOString() } : item)).filter(isRecentAnsweredRequest));
    }
    setMessage(result.ok ? (status === "approved" ? "Acceso concedido." : "Solicitud rechazada.") : result.message ?? "No se pudo actualizar la información. Intenta de nuevo.");
    await refresh();
    router.refresh();
  }

  async function contactRequest(request: AccessRequestRow) {
    const phone = getWhatsAppPhone(request);

    if (!phone) {
      setMessage("Este usuario no tiene teléfono registrado.");
      return;
    }

    const result = await markAccessRequestContacted(request.id, request.message);

    if (!result.ok) {
      setMessage(result.message ?? "No se pudo actualizar la información. Intenta de nuevo.");
      return;
    }

    setItems((current) => current.map((item) => (item.id === request.id ? { ...item, message: `${item.message || ""}\n[contactado]`.trim() } : item)));
    const text = encodeURIComponent("Hola, te contacto de B.R por tu solicitud de acceso a este beat.");
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank", "noopener,noreferrer");
    setMessage("Usuario contactado por WhatsApp.");
    await refresh();
    router.refresh();
  }

  useEffect(() => {
    const loadId = window.setTimeout(() => {
      void refresh();
    }, 0);

    return () => {
      window.clearTimeout(loadId);
    };
  }, [pathname]);

  const pendingItems = items.filter((request) => request.status === "pending");
  const recentAnsweredItems = items.filter((request) => request.status !== "pending" && isRecentAnsweredRequest(request));

  function renderTable(requests: AccessRequestRow[]) {
    if (requests.length === 0) {
      return <p className="rounded-md border border-white/10 bg-white/5 p-4 text-sm text-zinc-400">Sin solicitudes en esta sección.</p>;
    }

    return (
      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="min-w-[1040px] w-full border-collapse text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Email / Username</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Beat solicitado</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Estado</th>
              <th className="sticky right-0 bg-[#15181c] px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => {
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
                  <td className="sticky right-0 bg-[#15181c] px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      {request.status === "pending" ? (
                        <button type="button" onClick={() => void updateStatus(request.id, "approved")} className="inline-flex items-center gap-1 rounded-full bg-cyan-300 px-2.5 py-1.5 text-xs font-bold text-black hover:bg-cyan-200">
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          Aprobar
                        </button>
                      ) : null}
                      <button type="button" onClick={() => void contactRequest(request)} className="inline-flex items-center gap-1 rounded-full border border-emerald-300/40 px-2.5 py-1.5 text-xs font-bold text-emerald-200 hover:bg-emerald-300/10">
                        <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                        Contactar
                      </button>
                      {request.status === "pending" ? (
                        <button type="button" onClick={() => void updateStatus(request.id, "rejected")} className="inline-flex items-center gap-1 rounded-full border border-red-300/30 px-2.5 py-1.5 text-xs font-bold text-red-100 hover:bg-red-300/10">
                          <X className="h-3.5 w-3.5" aria-hidden="true" />
                          Rechazar
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <section className="rounded-lg border border-white/10 bg-[#101317] p-4">
      {message ? <p className="mb-4 rounded-md border border-white/10 bg-white/5 p-3 text-sm font-semibold text-cyan-200">{message}</p> : null}
      <div className="hidden space-y-6 md:block">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Pendientes</h2>
            <span className="text-xs font-semibold text-cyan-200">{pendingItems.length}</span>
          </div>
          {renderTable(pendingItems)}
        </div>
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Historial reciente</h2>
            <span className="text-xs font-semibold text-zinc-400">3 días</span>
          </div>
          {renderTable(recentAnsweredItems)}
        </div>
      </div>

      <div className="grid gap-3 md:hidden">
        {[...pendingItems, ...recentAnsweredItems].map((request) => (
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
            <div className="mt-4 flex flex-wrap gap-2">
              {request.status === "pending" ? (
                <button type="button" onClick={() => void updateStatus(request.id, "approved")} className="inline-flex items-center gap-1 rounded-full bg-cyan-300 px-3 py-2 text-xs font-bold text-black hover:bg-cyan-200">
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  Aprobar
                </button>
              ) : null}
              <button type="button" onClick={() => void contactRequest(request)} className="inline-flex items-center gap-1 rounded-full border border-emerald-300/40 px-3 py-2 text-xs font-bold text-emerald-200">
                <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                Contactar
              </button>
              {request.status === "pending" ? (
                <button type="button" onClick={() => void updateStatus(request.id, "rejected")} className="inline-flex items-center gap-1 rounded-full border border-red-300/30 px-3 py-2 text-xs font-bold text-red-100 hover:bg-red-300/10">
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  Rechazar
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
