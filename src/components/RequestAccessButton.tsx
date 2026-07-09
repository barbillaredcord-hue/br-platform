"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AccessRequestStatus } from "@/data/accessRequests";
import { useUser } from "@/context/UserContext";
import { createAccessRequestWithPhone, getAccessRequestForBeat, getAccessRequestsForUser, getUserAccessRevocations, type AccessRequestRow, type AccessRevocationRow } from "@/lib/supabase/queries";

const activeStatuses: AccessRequestStatus[] = ["pending", "contacted", "payment_pending", "paid"];
const retryStatuses: AccessRequestStatus[] = ["rejected", "cancelled"];

const statusLabels: Record<AccessRequestStatus, string> = {
  pending: "Pendiente",
  contacted: "Contactado",
  payment_pending: "Pago pendiente",
  paid: "Pagado",
  fulfilled: "Completada",
  approved: "Aprobada",
  rejected: "Rechazada",
  cancelled: "Cancelada",
};

function getRequestMessage(request: AccessRequestRow | null) {
  if (!request) {
    return "";
  }

  if (activeStatuses.includes(request.status)) {
    return `Tu solicitud está en proceso: ${statusLabels[request.status]}. B.R te responderá pronto.`;
  }

  if (request.status === "fulfilled" || request.status === "approved") {
    return "Tu solicitud ya fue aprobada. El acceso completo depende de que B.R haya liberado tu acceso manualmente.";
  }

  if (retryStatuses.includes(request.status)) {
    return `Tu solicitud anterior fue ${statusLabels[request.status].toLowerCase()}. Puedes solicitar nuevamente.`;
  }

  return "";
}

function revocationMatchesBeat(revocation: AccessRevocationRow, beatId: string) {
  const beat = Array.isArray(revocation.beats) ? revocation.beats[0] : revocation.beats;

  return revocation.beat_id === beatId || beat?.slug === beatId;
}

function dismissedRequestRevocationKey(userId?: string | null) {
  return `br:dismissed-request-revocation:${userId || "guest"}`;
}

function getDismissedRequestRevocations(userId?: string | null) {
  if (typeof window === "undefined") {
    return [] as string[];
  }

  try {
    const rawValue = window.localStorage.getItem(dismissedRequestRevocationKey(userId));
    const parsedValue = rawValue ? JSON.parse(rawValue) : [];

    return Array.isArray(parsedValue) ? parsedValue.map(String) : [];
  } catch {
    return [] as string[];
  }
}

function saveDismissedRequestRevocations(userId: string | null | undefined, revocationIds: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(dismissedRequestRevocationKey(userId), JSON.stringify(Array.from(new Set(revocationIds))));
}

export function RequestAccessButton({ beatId }: { beatId: string }) {
  const router = useRouter();
  const { currentUser, refreshCurrentUser } = useUser();
  const [existingRequest, setExistingRequest] = useState<AccessRequestRow | null>(null);
  const [revocation, setRevocation] = useState<AccessRevocationRow | null>(null);
  const [dismissedRevocationIds, setDismissedRevocationIds] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingRequest, setIsLoadingRequest] = useState(false);

  const refreshRequest = useCallback(async () => {
    if (!currentUser) {
      setExistingRequest(null);
      setRevocation(null);
      return;
    }

    if (!existingRequest) {
      setIsLoadingRequest(true);
    }

    const userRevocations = await getUserAccessRevocations(currentUser.id);
    const foundRevocation = userRevocations.find((item) => revocationMatchesBeat(item, beatId)) ?? null;
    setRevocation(foundRevocation);

    const directRequest = await getAccessRequestForBeat(currentUser.id, beatId);

    if (directRequest) {
      setExistingRequest(directRequest);
      setIsLoadingRequest(false);
      return;
    }

    const userRequests = await getAccessRequestsForUser(currentUser.id);
    const fallbackRequest = userRequests.find((request) => request.beat_id === beatId) ?? null;

    setExistingRequest(fallbackRequest);
    setIsLoadingRequest(false);
  }, [beatId, currentUser, existingRequest]);

  useEffect(() => {
    const loadId = window.setTimeout(() => {
      void refreshRequest();
    }, 0);

    return () => window.clearTimeout(loadId);
  }, [refreshRequest]);

  useEffect(() => {
    const syncId = window.setTimeout(() => {
      setDismissedRevocationIds(getDismissedRequestRevocations(currentUser?.id));
    }, 0);

    return () => window.clearTimeout(syncId);
  }, [currentUser?.id]);

  function dismissRevocationNotice(revocationId: string) {
    const nextIds = Array.from(new Set([...dismissedRevocationIds, revocationId]));
    setDismissedRevocationIds(nextIds);
    saveDismissedRequestRevocations(currentUser?.id, nextIds);
  }

  async function handleRequest() {
    if (!currentUser) {
      router.push("/login");
      return;
    }

    if (existingRequest && activeStatuses.includes(existingRequest.status)) {
      setMessage(getRequestMessage(existingRequest));
      return;
    }

    if (existingRequest && retryStatuses.includes(existingRequest.status)) {
      setMessage("Reenviando solicitud...");
    }
    if (revocation) {
      setMessage("Solicitando revisión del acceso revocado...");
    }

    setIsSubmitting(true);

    const result = await createAccessRequestWithPhone(currentUser.id, beatId, {
      phone,
      currentPhone: currentUser.phone,
      message: note,
    });

    setMessage(result.message);

    if (result.ok) {
      setExistingRequest({
        id: existingRequest?.id ?? "local-pending",
        user_id: currentUser.id,
        beat_id: beatId,
        status: "pending",
        message: note || null,
        created_at: existingRequest?.created_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      setPhone("");
      setNote("");
      setMessage(result.message || "Solicitud reenviada al admin.");
      setRevocation(null);

      await refreshCurrentUser();
    }

    setIsSubmitting(false);
  }

  const requestMessage = getRequestMessage(existingRequest);
  const hasRevocation = Boolean(revocation);
  const showRevocationNotice = Boolean(revocation && !dismissedRevocationIds.includes(String(revocation.id)));
  const isBlockedByActiveRequest = Boolean(!hasRevocation && existingRequest && activeStatuses.includes(existingRequest.status));
  const canRetry = Boolean(hasRevocation || (existingRequest && retryStatuses.includes(existingRequest.status)));

  if (isLoadingRequest) {
    return (
      <div className="rounded-md border border-white/10 bg-white/5 p-3">
        <p className="text-sm font-semibold text-zinc-400">Revisando solicitud...</p>
      </div>
    );
  }

  if (showRevocationNotice && revocation) {
    return (
      <div className="grid gap-3 rounded-md border border-amber-300/20 bg-amber-300/10 p-3">
        <p className="text-sm font-bold text-amber-100">Acceso revocado</p>
        <p className="text-xs leading-5 text-zinc-300">Motivo: {revocation.reason}</p>
        <p className="text-xs leading-5 text-zinc-400">Puedes volver a solicitar acceso o pedir una revisión con B.R.</p>
        <button type="button" onClick={() => dismissRevocationNotice(String(revocation.id))} className="h-9 w-fit rounded-md border border-amber-300/30 px-3 text-xs font-bold text-amber-100 hover:bg-amber-300/10">
          Ya lo vi
        </button>

        {currentUser?.phone ? (
          <p className="text-xs font-semibold text-amber-100">Teléfono: {currentUser.phone}</p>
        ) : (
          <label className="grid gap-2">
            <span className="text-xs font-bold uppercase text-zinc-400">Teléfono obligatorio</span>
            <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+52..." className="h-10 rounded-md border border-white/10 bg-black/20 px-3 text-sm outline-none focus:border-amber-300" />
          </label>
        )}

        <label className="grid gap-2">
          <span className="text-xs font-bold uppercase text-zinc-400">Mensaje para revisión</span>
          <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Explica por qué quieres que B.R revise esta revocación" className="min-h-20 rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-amber-300" />
        </label>

        <button
          type="button"
          onClick={() => void handleRequest()}
          disabled={isSubmitting}
          className="rounded-md border border-amber-300/30 px-5 py-3 text-sm font-bold text-amber-100 transition hover:border-amber-300 hover:bg-amber-300/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Enviando..." : "Pedir revisión"}
        </button>

        <a href="/account/requests" className="inline-flex h-10 items-center justify-center rounded-md border border-white/10 px-4 text-xs font-bold text-zinc-200 hover:border-amber-300 hover:text-amber-100">
          Ver mis solicitudes
        </a>

        {message ? <p className="text-sm font-semibold text-amber-100">{message}</p> : null}
      </div>
    );
  }

  if (!hasRevocation && (isBlockedByActiveRequest || existingRequest?.status === "fulfilled" || existingRequest?.status === "approved")) {
    return (
      <div className="rounded-md border border-cyan-300/20 bg-cyan-300/10 p-3">
        <p className="text-sm font-semibold text-cyan-100">{requestMessage}</p>
        <p className="mt-2 text-xs leading-5 text-zinc-400">Puedes revisar el avance en tu cuenta, sección de solicitudes.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 rounded-md border border-white/10 bg-white/5 p-3">
      {canRetry ? (
        <div className="rounded-md border border-amber-300/20 bg-amber-300/10 p-3">
          <p className="text-sm font-semibold text-amber-100">{requestMessage}</p>
          <p className="mt-1 text-xs leading-5 text-zinc-400">Puedes enviar una nueva solicitud para que B.R la revise otra vez.</p>
        </div>
      ) : null}

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
        className="rounded-md border border-cyan-300/30 px-5 py-3 text-sm font-bold text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Enviando..." : hasRevocation ? "Pedir revisión" : canRetry ? "Solicitar nuevamente" : "Solicitar acceso"}
      </button>

      <p className="text-xs leading-5 text-zinc-400">
        B.R se pondrá en contacto contigo para coordinar el pago. Solicitar acceso no libera descarga ni licencia. El acceso completo se habilita manualmente por B.R.
      </p>

      {message ? <p className="text-sm font-semibold text-cyan-200">{message}</p> : null}
    </div>
  );
}
