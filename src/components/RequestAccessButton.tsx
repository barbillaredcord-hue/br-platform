"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AccessRequestStatus } from "@/data/accessRequests";
import { useUser } from "@/context/UserContext";
import { isBlockingAccessRequest, resolveBeatPermissions } from "@/lib/beat-permissions";
import { createAccessRequestWithPhone, getAccessRequestForBeat, getUserAccessRevocations, type AccessRequestRow, type AccessRevocationRow } from "@/lib/supabase/queries";

const retryStatuses: AccessRequestStatus[] = ["rejected"];

const statusLabels: Record<AccessRequestStatus, string> = {
  pending: "Pendiente",
  contacted: "Contactado",
  payment_pending: "Pago pendiente",
  paid: "Pagado",
  fulfilled: "Completada",
  approved: "Aprobada",
  rejected: "Rechazada",
  review_pending: "Revisión pendiente",
  review_approved: "Revisión aceptada",
  review_rejected: "Revisión rechazada",
  cancelled: "Cancelada",
};

function getRequestMessage(request: AccessRequestRow | null) {
  if (!request) {
    return "";
  }

  if (isBlockingAccessRequest(request.status)) {
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

function revocationMatchesBeat(revocation: AccessRevocationRow, userId: string, beatId: string) {
  const beat = Array.isArray(revocation.beats) ? revocation.beats[0] : revocation.beats;

  return revocation.user_id === userId && (revocation.beat_id === beatId || beat?.slug === beatId);
}

export function RequestAccessButton({ beatId, hasBeatAccess, isPublicPlayback }: { beatId: string; hasBeatAccess: boolean; isPublicPlayback: boolean }) {
  const router = useRouter();
  const { currentUser, refreshCurrentUser } = useUser();
  const [existingRequest, setExistingRequest] = useState<AccessRequestRow | null>(null);
  const [revocation, setRevocation] = useState<AccessRevocationRow | null>(null);
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingRequest, setIsLoadingRequest] = useState(false);

  const refreshRequest = useCallback(async () => {
    const userId = currentUser?.id;

    if (!userId) {
      setExistingRequest(null);
      setRevocation(null);
      return;
    }

    setIsLoadingRequest(true);
    const [directRequest, userRevocations] = await Promise.all([
      getAccessRequestForBeat(userId, beatId),
      getUserAccessRevocations(userId),
    ]);
    const foundRevocation = userRevocations.find((item) => revocationMatchesBeat(item, userId, beatId)) ?? null;

    setExistingRequest(directRequest);
    setRevocation(foundRevocation);
    setIsLoadingRequest(false);
  }, [beatId, currentUser?.id]);

  useEffect(() => {
    const loadId = window.setTimeout(() => {
      void refreshRequest();
    }, 0);

    return () => window.clearTimeout(loadId);
  }, [refreshRequest]);

  useEffect(() => {
    const refresh = () => {
      void refreshRequest();
    };

    window.addEventListener("br-access-state-changed", refresh);
    window.addEventListener("br-access-requests-refresh", refresh);

    return () => {
      window.removeEventListener("br-access-state-changed", refresh);
      window.removeEventListener("br-access-requests-refresh", refresh);
    };
  }, [refreshRequest]);

  async function handleRequest() {
    if (!currentUser) {
      router.push("/login");
      return;
    }

    if (isBlockingAccessRequest(existingRequest?.status)) {
      setMessage(getRequestMessage(existingRequest));
      return;
    }

    if (existingRequest && retryStatuses.includes(existingRequest.status)) {
      setMessage("Reenviando solicitud...");
    }
    if (revocation) {
      setMessage("Enviando nueva solicitud de acceso...");
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
      await refreshCurrentUser();
    }

    setIsSubmitting(false);
  }

  const requestMessage = getRequestMessage(existingRequest);
  const permissions = resolveBeatPermissions({
    isAuthenticated: Boolean(currentUser),
    isAdmin: currentUser?.role === "admin",
    hasBeatAccess,
    isPublicPlayback,
    requestStatus: existingRequest?.status,
  });
  const isBlockedByActiveRequest = isBlockingAccessRequest(existingRequest?.status);
  const hasSubmittedReview = existingRequest?.status === "review_pending";
  const canRetry = Boolean(existingRequest && permissions.canRequestAccess);

  if (isLoadingRequest) {
    return (
      <div className="rounded-md border border-white/10 bg-white/5 p-3">
        <p className="text-sm font-semibold text-zinc-400">Revisando solicitud...</p>
      </div>
    );
  }

  if (isBlockedByActiveRequest || !permissions.canRequestAccess) {
    return (
      <div className="grid gap-3 rounded-md border border-cyan-300/20 bg-cyan-300/10 p-3">
        {hasSubmittedReview ? (
          <p className="text-sm font-semibold text-amber-100">
            Solicitud de revisión enviada
          </p>
        ) : null}
        <p className="text-sm font-semibold text-cyan-100">{requestMessage}</p>
        <p className="mt-2 text-xs leading-5 text-zinc-400">Puedes revisar el avance en tu cuenta, sección de solicitudes.</p>
        <button
          type="button"
          disabled
          className="rounded-md border border-cyan-300/30 px-5 py-3 text-sm font-bold text-cyan-200 opacity-60"
        >
          Solicitar acceso
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-3 rounded-md border border-white/10 bg-white/5 p-3">
      {canRetry ? (
        <div className="rounded-md border border-amber-300/20 bg-amber-300/10 p-3">
          <p className="text-sm font-bold text-amber-100">Puedes solicitar acceso comercial nuevamente</p>
          {existingRequest?.rejection_reason ? <p className="mt-1 text-sm text-zinc-300">Último rechazo: {existingRequest.rejection_reason}</p> : null}
          {revocation ? <p className="mt-1 text-sm text-zinc-300">Última revocación: {revocation.reason}</p> : null}
          <p className="mt-1 text-xs leading-5 text-zinc-400">El historial no bloquea una nueva solicitud cuando no existe acceso ni solicitud activa.</p>
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
        {isSubmitting ? "Enviando..." : "Solicitar acceso"}
      </button>

      <p className="text-xs leading-5 text-zinc-400">
        B.R se pondrá en contacto contigo para coordinar el pago. Solicitar acceso no libera descarga ni licencia. El acceso completo se habilita manualmente por B.R.
      </p>

      {message ? <p className="text-sm font-semibold text-cyan-200">{message}</p> : null}
    </div>
  );
}
