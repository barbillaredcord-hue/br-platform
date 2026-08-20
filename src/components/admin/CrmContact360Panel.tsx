"use client";

import { useCallback, useEffect, useState } from "react";
import { formatLocalDateTime } from "@/lib/formatLocalDateTime";

type RelationshipType = "lead" | "client" | "artist" | "producer" | "collaborator";

type Contact360 = {
  identity: {
    id: string;
    email: string | null;
    username: string | null;
    displayName: string | null;
    phone: string | null;
    createdAt: string | null;
  };
  relationships: Array<{
    id: string;
    relationshipType: RelationshipType;
    isActive: boolean;
  }>;
  relationshipTypes: string[];
  state: {
    isLead: boolean;
    isClient: boolean;
    hasActiveAccess: boolean;
    hasPendingPayment: boolean;
    isCommerciallyActive: boolean;
    lastActivityAt: string | null;
  };
  metrics: {
    requestCount: number;
    openRequestCount: number;
    pendingPaymentCount: number;
    rejectedRequestCount: number;
    fulfilledRequestCount: number;
    paymentCount: number;
    activeAccessCount: number;
    revocationCount: number;
    activityCount: number;
    mp3DownloadCount: number;
    licenseDownloadCount: number;
    historicalValueByCurrency: Record<string, number>;
    licenseTypes: string[];
  };
  beats: Record<"requested" | "paid" | "activeAccess" | "revoked", Array<{ id: string; title: string | null; slug: string | null }>>;
};

type TokenResult = { token: string; message: string };

const relationshipLabels: Record<RelationshipType, string> = {
  lead: "Lead",
  client: "Cliente",
  artist: "Artista",
  producer: "Productor",
  collaborator: "Colaborador",
};

function beatLabel(beat: { id: string; title: string | null; slug: string | null }) {
  return beat.title || beat.slug || beat.id;
}

export function CrmContact360Panel({
  profileId,
  getToken,
  onChanged,
}: {
  profileId: string;
  getToken: () => Promise<TokenResult>;
  onChanged: () => Promise<void>;
}) {
  const [contact, setContact] = useState<Contact360 | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [relationshipType, setRelationshipType] = useState<RelationshipType>("artist");

  const loadContact = useCallback(async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const { token, message: tokenMessage } = await getToken();

      if (!token) {
        setMessage(tokenMessage);
        return;
      }

      const response = await fetch(`/api/admin/crm/contacts/${encodeURIComponent(profileId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        setMessage(payload?.message ?? "No se pudo cargar Contact 360.");
        return;
      }

      setContact(payload.contact as Contact360);
    } catch {
      setMessage("No se pudo cargar Contact 360.");
    } finally {
      setIsLoading(false);
    }
  }, [getToken, profileId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadContact();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadContact]);

  async function setRelationship(
    nextIsActive: boolean,
    type = relationshipType,
  ) {
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      const { token, message: tokenMessage } = await getToken();

      if (!token) {
        setMessage(tokenMessage);
        return;
      }

      const response = await fetch("/api/admin/crm/relationships", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile_id: profileId,
          relationship_type: type,
          is_active: nextIsActive,
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        setMessage(payload?.message ?? "No se pudo guardar la relación.");
        return;
      }

      await Promise.all([loadContact(), onChanged()]);
      setMessage(nextIsActive ? "Relación guardada." : "Relación desactivada.");
    } catch {
      setMessage("No se pudo guardar la relación.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading && !contact) {
    return <p className="text-xs text-zinc-400">Cargando Contact 360...</p>;
  }

  if (!contact) {
    return <p className="text-xs text-amber-200">{message || "Contact 360 no disponible."}</p>;
  }

  const beatGroups: Array<[keyof Contact360["beats"], string]> = [
    ["requested", "Solicitados"],
    ["paid", "Pagados"],
    ["activeAccess", "Con acceso"],
    ["revoked", "Revocados"],
  ];

  return (
    <section className="space-y-3 rounded-md border border-cyan-300/20 bg-cyan-300/5 p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase text-cyan-200">Contact 360</p>
          <p className="text-xs text-zinc-300">{contact.identity.displayName || contact.identity.username || "Sin nombre"} · {contact.identity.email || "Sin email"}</p>
          <p className="text-xs text-zinc-400">{contact.identity.phone || "Sin teléfono"} · Alta {formatLocalDateTime(contact.identity.createdAt)}</p>
        </div>
        <button type="button" onClick={() => void loadContact()} className="text-xs font-bold text-cyan-200 hover:text-cyan-100">Actualizar</button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {contact.relationshipTypes.map((relationship) => (
          <span key={relationship} className="rounded bg-cyan-300/15 px-2 py-1 text-xs font-bold text-cyan-100">{relationshipLabels[relationship as RelationshipType] || relationship}</span>
        ))}
        {contact.state.isCommerciallyActive ? <span className="rounded bg-emerald-300/15 px-2 py-1 text-xs font-bold text-emerald-100">Activo comercial</span> : <span className="rounded bg-zinc-500/15 px-2 py-1 text-xs font-bold text-zinc-300">Sin workflow activo</span>}
        {contact.state.hasPendingPayment ? <span className="rounded bg-amber-300/15 px-2 py-1 text-xs font-bold text-amber-100">Pago pendiente</span> : null}
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3 text-xs text-zinc-300">
        <p>Solicitudes: <strong>{contact.metrics.requestCount}</strong> ({contact.metrics.openRequestCount} abiertas)</p>
        <p>Rechazadas / completadas: <strong>{contact.metrics.rejectedRequestCount} / {contact.metrics.fulfilledRequestCount}</strong></p>
        <p>Pagos: <strong>{contact.metrics.paymentCount}</strong></p>
        <p>Accesos vigentes: <strong>{contact.metrics.activeAccessCount}</strong></p>
        <p>Revocaciones: <strong>{contact.metrics.revocationCount}</strong></p>
        <p>Descargas: <strong>{contact.metrics.mp3DownloadCount + contact.metrics.licenseDownloadCount}</strong></p>
        <p>Última actividad: <strong>{formatLocalDateTime(contact.state.lastActivityAt)}</strong></p>
      </div>

      <div className="flex flex-wrap gap-1.5 text-xs">
        {Object.entries(contact.metrics.historicalValueByCurrency).map(([currency, amount]) => <span key={currency} className="rounded bg-white/5 px-2 py-1 text-zinc-200">{currency} {amount}</span>)}
        {contact.metrics.licenseTypes.map((licenseType) => <span key={licenseType} className="rounded bg-white/5 px-2 py-1 text-zinc-200">Licencia: {licenseType}</span>)}
      </div>

      <div className="grid gap-2 sm:grid-cols-2 text-xs">
        {beatGroups.map(([key, label]) => (
          <div key={key} className="rounded border border-white/10 p-2">
            <p className="font-bold text-zinc-300">{label} ({contact.beats[key].length})</p>
            <p className="mt-1 text-zinc-500">{contact.beats[key].map(beatLabel).join(" · ") || "—"}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
        <select value={relationshipType} onChange={(event) => setRelationshipType(event.target.value as RelationshipType)} className="rounded border border-white/15 bg-black/20 px-2 py-1 text-xs text-zinc-100">
          {Object.entries(relationshipLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <button type="button" disabled={isSaving} onClick={() => void setRelationship(true)} className="rounded bg-cyan-300/20 px-2 py-1 text-xs font-bold text-cyan-100 disabled:opacity-50">Agregar relación</button>
        {contact.relationships.filter((relationship) => relationship.isActive).map((relationship) => (
          <button key={relationship.id} type="button" disabled={isSaving} onClick={() => void setRelationship(false, relationship.relationshipType)} className="rounded border border-white/10 px-2 py-1 text-xs text-zinc-300 disabled:opacity-50">Desactivar {relationshipLabels[relationship.relationshipType]}</button>
        ))}
      </div>
      {message ? <p className="text-xs text-cyan-100">{message}</p> : null}
    </section>
  );
}
