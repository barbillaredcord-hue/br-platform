"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check, ChevronDown, MessageCircle, Save, X } from "lucide-react";
import type { AccessRequestStatus } from "@/data/accessRequests";
import { getAccessRequestPaymentState, summarizeAccessRequests } from "@/lib/access-request-admin";
import { getCurrentAccessLabel, resolveAccessDomainState } from "@/lib/access-domain";
import { notifyDomainChange } from "@/lib/domain-events";
import { formatLocalDateTime } from "@/lib/formatLocalDateTime";
import { acceptAccessReview, approveAccessRequest, getAccessRequests, getAccessRevocations, getManualPayments, getUserBeatAccess, markAccessRequestContacted, rejectAccessRequest, rejectAccessReview, type AccessRequestRow, type AccessRevocationRow, type ManualPaymentRow } from "@/lib/supabase/queries";

const statusLabels: Record<AccessRequestStatus, string> = {
  pending: "Pendiente",
  contacted: "Contactado",
  payment_pending: "Pago pendiente",
  paid: "Pagado",
  review_pending: "Revisión pendiente",
  review_approved: "Revisión aceptada",
  review_rejected: "Revisión rechazada",
  fulfilled: "Completada",
  approved: "Aprobada",
  rejected: "Rechazada",
  cancelled: "Cancelada",
};

const statusStyles: Record<AccessRequestStatus, string> = {
  pending: "border-cyan-300/30 text-cyan-200",
  contacted: "border-sky-300/30 text-sky-200",
  payment_pending: "border-amber-300/30 text-amber-200",
  paid: "border-emerald-300/30 text-emerald-200",
  review_pending: "border-violet-300/30 text-violet-200",
  review_approved: "border-cyan-300/30 text-cyan-100",
  review_rejected: "border-red-300/30 text-red-200",
  fulfilled: "border-emerald-300/30 text-emerald-200",
  approved: "border-emerald-300/30 text-emerald-200",
  rejected: "border-red-300/30 text-red-200",
  cancelled: "border-zinc-400/30 text-zinc-300",
};

const revokedStatusStyle = "border-amber-300/30 text-amber-200";

type PaymentDraft = {
  amount: string;
  currency: string;
  payment_method: string;
  note: string;
  license_type: "basic" | "premium" | "exclusive";
};


const defaultPaymentDraft: PaymentDraft = {
  amount: "",
  currency: "MXN",
  payment_method: "",
  note: "",
  license_type: "basic",
};

const statusNotesStorageKey = "br-access-request-status-notes";

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
  return request.status === "contacted" || request.status === "payment_pending" || Boolean(request.message?.includes("[contactado]"));
}

function getRequestBeat(request: AccessRequestRow) {
  const beat = Array.isArray(request.beats) ? request.beats[0] : request.beats;
  return beat?.title || beat?.slug || request.beat_id;
}

function getRequestDate(request: AccessRequestRow) {
  return formatLocalDateTime(
    request.review_rejected_at ??
      request.review_requested_at ??
      request.rejected_at ??
      request.contacted_at ??
      request.created_at,
  );
}

function getRequestUpdatedDate(request: AccessRequestRow) {
  return formatLocalDateTime(
    request.review_rejected_at ??
      request.rejected_at ??
      request.responded_at ??
      request.updated_at ??
      request.created_at,
  );
}

function isClosedRequest(request: AccessRequestRow, revocation?: AccessRevocationRow | null) {
  return Boolean(revocation) || request.status === "fulfilled" || request.status === "approved" || request.status === "rejected" || request.status === "cancelled";
}

function getRequestMessage(request: AccessRequestRow) {
  const rawMessage = request.message || "Sin mensaje";
  return rawMessage.replace("[contactado]", "").trim() || "Sin mensaje";
}

function revocationMatchesRequest(revocation: AccessRevocationRow, request: AccessRequestRow) {
  return revocation.user_id === request.user_id && revocation.beat_id === request.beat_id;
}


function getRevocationDate(revocation: AccessRevocationRow) {
  return formatLocalDateTime(revocation.revoked_at);
}

function getRevocationProfile(revocation: AccessRevocationRow) {
  return Array.isArray(revocation.profiles) ? revocation.profiles[0] : revocation.profiles;
}

function getRevocationAdmin(revocation: AccessRevocationRow) {
  return Array.isArray(revocation.revoked_by_profile) ? revocation.revoked_by_profile[0] : revocation.revoked_by_profile;
}

function getRevocationBeat(revocation: AccessRevocationRow) {
  const beat = Array.isArray(revocation.beats) ? revocation.beats[0] : revocation.beats;
  return beat?.title || beat?.slug || revocation.beat_id;
}

function loadStoredStatusNotes() {
  if (typeof window === "undefined") {
    return {} as Record<string, string>;
  }

  try {
    const rawNotes = window.localStorage.getItem(statusNotesStorageKey);
    const parsedNotes = rawNotes ? JSON.parse(rawNotes) : {};

    if (!parsedNotes || typeof parsedNotes !== "object" || Array.isArray(parsedNotes)) {
      return {} as Record<string, string>;
    }

    return parsedNotes as Record<string, string>;
  } catch {
    return {} as Record<string, string>;
  }
}

function saveStoredStatusNotes(notes: Record<string, string>) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(statusNotesStorageKey, JSON.stringify(notes));
}

export function AccessRequestsTable() {
  const pathname = usePathname();
  const router = useRouter();
  const [items, setItems] = useState<AccessRequestRow[]>([]);
  const [revocations, setRevocations] = useState<AccessRevocationRow[]>([]);
  const [payments, setPayments] = useState<ManualPaymentRow[]>([]);
  const [activeAccessKeys, setActiveAccessKeys] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [paymentDrafts, setPaymentDrafts] = useState<Record<string, PaymentDraft>>({});
  const [processingPaymentId, setProcessingPaymentId] = useState("");
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [paymentOpenIds, setPaymentOpenIds] = useState<string[]>([]);
  const [statusNotes, setStatusNotes] = useState<Record<string, string>>({});
  const [rejectionOpenIds, setRejectionOpenIds] = useState<string[]>([]);
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [reviewRejectionOpenIds, setReviewRejectionOpenIds] = useState<string[]>([]);
  const [reviewRejectionReasons, setReviewRejectionReasons] = useState<Record<string, string>>({});
  const [pendingActionId, setPendingActionId] = useState("");
  const [savedStatusNoteId, setSavedStatusNoteId] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [isRevokedOpen, setIsRevokedOpen] = useState(false);

  async function refresh() {
    const [requests, allRevocations, allPayments] = await Promise.all([
      getAccessRequests(),
      getAccessRevocations(),
      getManualPayments(),
    ]);
    const userIds = Array.from(new Set([
      ...requests.map((request) => request.user_id),
      ...allRevocations.map((revocation) => revocation.user_id),
    ].filter(Boolean)));
    const accessGroups = await Promise.all(
      userIds.map(async (userId) => ({ userId, beatIds: await getUserBeatAccess(userId) })),
    );

    setItems(requests);
    setRevocations(allRevocations);
    setPayments(allPayments);
    setActiveAccessKeys(new Set(accessGroups.flatMap(({ userId, beatIds }) => beatIds.map((beatId) => `${userId}:${beatId}`))));
  }

  function updateStatusNote(requestId: string, note: string) {
    setStatusNotes((current) => ({
      ...current,
      [requestId]: note,
    }));
  }

  function saveStatusNote(request: AccessRequestRow) {
    const nextNotes = {
      ...statusNotes,
      [request.id]: statusNotes[request.id]?.trim() ?? "",
    };

    setStatusNotes(nextNotes);
    saveStoredStatusNotes(nextNotes);
    setSavedStatusNoteId(request.id);
    setMessage(`Nota de estado guardada para ${getRequestUser(request)}.`);

    window.setTimeout(() => {
      setSavedStatusNoteId((current) => (current === request.id ? "" : current));
    }, 1800);
  }

  async function rejectRequest(id: string) {
    const reason = rejectionReasons[id]?.trim() ?? "";
    setPendingActionId(`reject-${id}`);
    const result = await rejectAccessRequest(id, reason);
    setMessage(result.ok ? (result.message ?? "Solicitud rechazada.") : result.message ?? "No se pudo actualizar la información. Intenta de nuevo.");

    if (result.ok) {
      setRejectionOpenIds((current) => current.filter((requestId) => requestId !== id));
      setRejectionReasons((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      await refresh();
      router.refresh();
    }

    setPendingActionId("");
  }

  async function rejectReview(id: string) {
    const reason = reviewRejectionReasons[id]?.trim() ?? "";
    setPendingActionId(`reject-review-${id}`);
    const result = await rejectAccessReview(id, reason);

    setMessage(result.message ?? (result.ok ? "Revisión rechazada." : "No se pudo rechazar la revisión."));

    if (result.ok) {
      setReviewRejectionOpenIds((current) => current.filter((requestId) => requestId !== id));
      setReviewRejectionReasons((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      await refresh();
      router.refresh();
    }

    setPendingActionId("");
  }

  async function approveRequest(id: string, successMessage: string) {
    setPendingActionId(`approve-${id}`);
    const result = await approveAccessRequest(id);
    setMessage(result.ok ? successMessage : result.message ?? "No se pudo aprobar la solicitud.");

    if (result.ok) {
      await refresh();
      router.refresh();
    }

    setPendingActionId("");
  }

  async function acceptReview(id: string) {
    setPendingActionId(`accept-review-${id}`);
    const result = await acceptAccessReview(id);
    setMessage(result.message ?? (result.ok ? "Revisión aceptada" : "No se pudo aceptar la revisión."));

    if (result.ok) {
      await refresh();
      router.refresh();
    }

    setPendingActionId("");
  }

  function getPaymentDraft(requestId: string) {
    return paymentDrafts[requestId] ?? defaultPaymentDraft;
  }

  function updatePaymentDraft(requestId: string, patch: Partial<PaymentDraft>) {
    setPaymentDrafts((current) => ({
      ...current,
      [requestId]: {
        ...(current[requestId] ?? defaultPaymentDraft),
        ...patch,
      },
    }));
  }

  async function confirmPaymentAndGrantAccess(request: AccessRequestRow) {
    if (processingPaymentId) {
      return;
    }

    const draft = getPaymentDraft(request.id);
    const amount = Number(draft.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage("Agrega un monto válido antes de confirmar el pago.");
      return;
    }

    setProcessingPaymentId(request.id);
    setMessage("Confirmando pago y liberando acceso...");

    try {
      const supabaseModule = await import("@/lib/supabase/client");
      const supabase = supabaseModule.createSupabaseBrowserClient();

      if (!supabase) {
        setMessage("Supabase no está configurado.");
        return;
      }

      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        setMessage("Sesión no válida.");
        return;
      }

      const response = await fetch("/api/admin/manual-payment", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: request.user_id,
          beat_id: request.beat_id,
          amount: draft.amount,
          currency: draft.currency.trim().toUpperCase() || "MXN",
          payment_method: draft.payment_method,
          note: draft.note,
          license_type: draft.license_type,
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        const duplicatePaymentMessage = typeof payload?.message === "string" ? payload.message.toLowerCase() : "";
        const isDuplicatePayment = response.status === 409 ||
          duplicatePaymentMessage.includes("ya tiene pago") ||
          duplicatePaymentMessage.includes("pago registrado") ||
          duplicatePaymentMessage.includes("ya se realizo pago") ||
          duplicatePaymentMessage.includes("ya se realizó pago");

        if (isDuplicatePayment) {
          setItems((current) => current.map((item): AccessRequestRow => (item.id === request.id ? { ...item, status: "fulfilled", updated_at: new Date().toISOString() } : item)));
          setPaymentDrafts((current) => {
            const next = { ...current };
            delete next[request.id];
            return next;
          });
          setPaymentOpenIds((current) => current.filter((id) => id !== request.id));
          setMessage(payload?.message ?? "Pago ya registrado. Solicitud marcada como completada.");
          notifyDomainChange("manual-payment");
          await refresh();
          router.refresh();
          return;
        }

        setMessage(payload?.message ?? "No se pudo confirmar el pago.");
        return;
      }

      setItems((current) => current.map((item): AccessRequestRow => (item.id === request.id ? { ...item, status: "fulfilled", updated_at: new Date().toISOString() } : item)));
      setPaymentDrafts((current) => {
        const next = { ...current };
        delete next[request.id];
        return next;
      });
      setPaymentOpenIds((current) => current.filter((id) => id !== request.id));
      setMessage(payload.message ?? "Pago confirmado, acceso liberado y licencia registrada.");
      notifyDomainChange("manual-payment");
      await refresh();
      router.refresh();
    } catch {
      setMessage("No se pudo confirmar el pago.");
    } finally {
      setProcessingPaymentId("");
    }
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

    setItems((current) =>
      current.map((item): AccessRequestRow =>
        item.id === request.id
          ? {
              ...item,
              status: "contacted",
              message: `${item.message || ""}\n[contactado]`.trim(),
              updated_at: new Date().toISOString(),
              contacted_at: new Date().toISOString(),
            }
          : item
      )
    );
    const text = encodeURIComponent("Hola, te contacto de B.R por tu solicitud de acceso a este beat.");
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank", "noopener,noreferrer");
    setMessage(result.message ?? "Cliente contactado. La solicitud sigue pendiente de aprobación.");
    notifyDomainChange("requests");
    await refresh();
    router.refresh();
  }

  useEffect(() => {
    const loadId = window.setTimeout(() => {
      setStatusNotes(loadStoredStatusNotes());
      void refresh();
    }, 0);

    const handleAccessStateChanged = () => {
      void refresh();
      router.refresh();
    };

    window.addEventListener("br-access-state-changed", handleAccessStateChanged);
    window.addEventListener("br-access-requests-refresh", handleAccessStateChanged);
    window.addEventListener("br-commercial-activity-refresh", handleAccessStateChanged);

    return () => {
      window.clearTimeout(loadId);
      window.removeEventListener("br-access-state-changed", handleAccessStateChanged);
      window.removeEventListener("br-access-requests-refresh", handleAccessStateChanged);
      window.removeEventListener("br-commercial-activity-refresh", handleAccessStateChanged);
    };
  }, [pathname, router]);

  const paidPairKeys = new Set(
    payments
      .filter((payment) => payment.user_id && payment.beat_id)
      .map((payment) => `${payment.user_id}:${payment.beat_id}`),
  );
  const requestSummary = summarizeAccessRequests(items, paidPairKeys);
  const activeItems = requestSummary.active
    .filter((request) => request.status !== "review_pending")
    .sort((a, b) => new Date(a.created_at ?? a.updated_at ?? 0).getTime() - new Date(b.created_at ?? b.updated_at ?? 0).getTime());

  const historyItems = requestSummary.history
    .filter((request) => !["review_approved", "review_rejected"].includes(request.status))
    .sort((a, b) => new Date(b.updated_at ?? b.created_at ?? 0).getTime() - new Date(a.updated_at ?? a.created_at ?? 0).getTime());
  const reviewItems = items
    .filter((request) => ["review_pending", "review_approved", "review_rejected"].includes(request.status))
    .sort((a, b) => new Date(b.updated_at ?? b.created_at ?? 0).getTime() - new Date(a.updated_at ?? a.created_at ?? 0).getTime());


  function toggleExpanded(id: string) {
    setExpandedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function togglePaymentOpen(id: string) {
    setPaymentOpenIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function renderCards(requests: AccessRequestRow[]) {
    if (requests.length === 0) {
      return <p className="rounded-md border border-white/10 bg-white/5 p-2.5 text-xs text-zinc-400">Sin solicitudes en esta sección.</p>;
    }

    return (
      <div className="grid gap-1.5">
        {requests.map((request) => {
          const profile = getRequestProfile(request);
          const payment = payments.find((candidate) => candidate.user_id === request.user_id && candidate.beat_id === request.beat_id);
          const paymentState = getAccessRequestPaymentState(request, paidPairKeys);
          const expanded = expandedIds.includes(request.id);
          const draft = getPaymentDraft(request.id);
          const historicalRevocations = revocations.filter((revocation) => revocationMatchesRequest(revocation, request));
          const historicalRevocation = historicalRevocations[0] ?? null;
          const accessState = resolveAccessDomainState({
            hasActiveAccess: activeAccessKeys.has(`${request.user_id}:${request.beat_id}`),
            revocationCount: historicalRevocations.length,
          });
          const isRejectedRequest = request.status === "rejected";
          const isReviewPending = request.status === "review_pending";
          const isReviewApproved = request.status === "review_approved";
          const isNormalRequest = request.status === "pending" || request.status === "contacted" || request.status === "payment_pending" || request.status === "paid";
          const canContact = request.status === "pending" || request.status === "contacted";
          const canApprove = request.status === "pending" || request.status === "contacted" || request.status === "paid";
          const canOpenPayment = request.status === "payment_pending" || request.status === "paid";
          const showPaymentForm = canOpenPayment && paymentOpenIds.includes(request.id);
          const showReject = !isRejectedRequest && isNormalRequest;
          const rejectionReasonLength = rejectionReasons[request.id]?.trim().length ?? 0;
          const reviewRejectionReasonLength = reviewRejectionReasons[request.id]?.trim().length ?? 0;

          return (
            <article key={request.id} className={`rounded-lg border p-2 ${isRejectedRequest ? "border-red-300/20 bg-red-300/10" : "border-white/10 bg-[#15181c]"}`}>
              <div className="grid gap-3 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1.4fr)_auto] md:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="break-words text-sm font-bold text-white">{getRequestUser(request)}</p>
                    {isContacted(request) && !isRejectedRequest ? <span className="rounded-full border border-emerald-300/30 px-2 py-0.5 text-[11px] font-bold text-emerald-200">Contactado</span> : null}
                  </div>
                  <p className="mt-1 break-words text-xs text-zinc-500">{profile?.email || "Sin email"}</p>
                </div>

                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold text-zinc-200">{getRequestBeat(request)}</p>
                  <p className="mt-1 break-words text-xs leading-5 text-zinc-500">
                    {isClosedRequest(request) ? getRequestUpdatedDate(request) : getRequestDate(request)} · {getRequestPhone(request)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                  <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-bold ${statusStyles[request.status]}`}>
                    {isRejectedRequest ? "Solicitud rechazada" : statusLabels[request.status]}
                  </span>
                  <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-bold ${accessState.hasCurrentAccess ? "border-emerald-300/30 text-emerald-100" : accessState.status === "revoked" ? revokedStatusStyle : "border-zinc-400/30 text-zinc-300"}`}>
                    {getCurrentAccessLabel(accessState)}
                  </span>
                  {!isReviewPending && !isReviewApproved ? (
                    <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-bold ${paymentState === "paid" ? "border-emerald-300/30 text-emerald-100" : paymentState === "pending" ? "border-amber-300/30 text-amber-100" : "border-zinc-400/30 text-zinc-300"}`}>
                      {paymentState === "paid" ? "Pago confirmado" : paymentState === "pending" ? "Pago pendiente" : "Sin pago confirmado"}
                    </span>
                  ) : null}
                  <button type="button" onClick={() => toggleExpanded(request.id)} className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1.5 text-xs font-bold text-zinc-200 hover:border-cyan-300/40 hover:text-cyan-200">
                    Detalle
                    <ChevronDown className={`h-3.5 w-3.5 transition ${expanded ? "rotate-180" : ""}`} aria-hidden="true" />
                  </button>
                </div>
              </div>

              {isRejectedRequest || historicalRevocations.length > 0 ? (
                <div className={`mt-2 grid gap-1 rounded-md border p-2.5 text-xs ${historicalRevocations.length > 0 ? "border-amber-300/20 bg-amber-300/5" : "border-red-300/20 bg-red-300/5"}`}>
                  <p className="whitespace-pre-wrap break-words leading-5 text-zinc-300">
                    <span className="font-bold text-zinc-200">Motivo:</span>{" "}
                    {historicalRevocation?.reason || request.rejection_reason || request.review_rejection_reason || "Sin motivo registrado"}
                  </p>
                  <p className="break-words text-zinc-500">
                    Revocaciones: {historicalRevocations.length} · Fecha relevante: {historicalRevocation ? getRevocationDate(historicalRevocation) : getRequestUpdatedDate(request)}
                  </p>
                </div>
              ) : null}

              {expanded ? (
                <div className="mt-3 grid gap-3 rounded-md border border-white/10 bg-black/20 p-3 text-xs text-zinc-400 md:grid-cols-2">
                  <div>
                    <p><span className="font-bold text-zinc-300">Username:</span> @{profile?.username || "sin-username"}</p>
                    <p className="mt-1"><span className="font-bold text-zinc-300">Teléfono:</span> {getRequestPhone(request)}</p>
                    <p className="mt-1 break-all"><span className="font-bold text-zinc-300">User ID:</span> {request.user_id}</p>
                  </div>
                  <div>
                    <p className="font-bold text-zinc-300">Mensaje</p>
                    <p className="mt-1 whitespace-pre-wrap leading-5">{getRequestMessage(request)}</p>
                    <p className="mt-3 font-bold text-zinc-300">Pago</p>
                    {payment ? (
                      <p className="mt-1 break-words leading-5">
                        {payment.amount} {payment.currency} · {payment.payment_method || "Método no especificado"} · {formatLocalDateTime(payment.created_at)}
                      </p>
                    ) : (
                      <p className="mt-1">{paymentState === "pending" ? "Pendiente de confirmación manual" : "Sin pago confirmado"}</p>
                    )}
                  </div>
                  {historicalRevocation ? (
                    <div className="rounded-md border border-amber-300/20 bg-amber-300/10 p-3 md:col-span-2">
                      <p className="font-bold text-amber-100">Historial de revocación · {getCurrentAccessLabel(accessState)}</p>
                      <p className="mt-1 whitespace-pre-wrap leading-5 text-zinc-300">Motivo: {historicalRevocation.reason}</p>
                      <p className="mt-1 text-zinc-500">Fecha: {getRevocationDate(historicalRevocation)}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-full border border-amber-300/30 px-2 py-1 text-[11px] font-bold text-amber-100">{historicalRevocations.length} evento(s) histórico(s)</span>
                      </div>
                    </div>
                  ) : isRejectedRequest ? (
                    <div className="rounded-md border border-red-300/20 bg-red-300/10 p-3 md:col-span-2">
                      <p className="font-bold text-red-100">Solicitud rechazada</p>
                      <p className="mt-1 whitespace-pre-wrap leading-5 text-zinc-300">Motivo: {request.rejection_reason || "Sin motivo registrado"}</p>
                    </div>
                  ) : null}
                  {isClosedRequest(request) ? (
                    <div className="rounded-md border border-cyan-300/20 bg-cyan-300/10 p-3 md:col-span-2">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-bold text-cyan-100">Nota de estado</p>
                          <p className="text-[11px] text-cyan-100/70">Seguimiento interno para solicitudes cerradas / historial.</p>
                        </div>
                        {savedStatusNoteId === request.id ? <span className="rounded-full border border-emerald-300/30 px-2 py-1 text-[11px] font-bold text-emerald-200">Guardada</span> : null}
                      </div>
                      <textarea
                        value={statusNotes[request.id] ?? ""}
                        onChange={(event) => updateStatusNote(request.id, event.target.value)}
                        placeholder="Ejemplo: Pago confirmado por transferencia. Acceso liberado manualmente. Cliente notificado."
                        className="min-h-20 w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-xs text-white outline-none placeholder:text-zinc-600 focus:border-cyan-300"
                      />
                      <div className="mt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => saveStatusNote(request)}
                          className="inline-flex h-8 items-center gap-2 rounded-md bg-cyan-300 px-3 text-xs font-bold text-black hover:bg-cyan-200"
                        >
                          <Save className="h-3.5 w-3.5" aria-hidden="true" />
                          Guardar nota
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {isReviewApproved ? (
                <p className="mt-2 rounded-md border border-cyan-300/20 bg-cyan-300/10 p-2.5 text-xs font-semibold text-cyan-100">
                  El acceso aún no ha sido restaurado.
                </p>
              ) : null}

              <div className="mt-2 flex flex-wrap justify-end gap-2">
                {canContact ? (
                  <button type="button" onClick={() => void contactRequest(request)} className="inline-flex items-center gap-1 rounded-full border border-emerald-300/40 px-3 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-300/10">
                    <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    Contactar
                  </button>
                ) : null}
                {canOpenPayment ? (
                  <button type="button" onClick={() => togglePaymentOpen(request.id)} className={showPaymentForm ? "inline-flex items-center gap-1 rounded-full bg-cyan-300 px-3 py-2 text-xs font-bold text-black hover:bg-cyan-200" : "inline-flex items-center gap-1 rounded-full border border-cyan-300/40 px-3 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-300/10"}>
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    {showPaymentForm ? "Cerrar pago" : "Pago"}
                  </button>
                ) : null}
                {canApprove ? (
                  <button
                    type="button"
                    onClick={() => void approveRequest(request.id, "Solicitud aprobada. Pago pendiente.")}
                    disabled={Boolean(pendingActionId)}
                    className="inline-flex items-center gap-1 rounded-full border border-emerald-300/40 px-3 py-2 text-xs font-bold text-emerald-100 hover:bg-emerald-300/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    {pendingActionId === `approve-${request.id}` ? "Aprobando..." : "Aprobar · pago pendiente"}
                  </button>
                ) : null}
                {showReject ? (
                  <button
                    type="button"
                    onClick={() => setRejectionOpenIds((current) => current.includes(request.id) ? current : [...current, request.id])}
                    disabled={Boolean(pendingActionId)}
                    className="inline-flex items-center gap-1 rounded-full border border-red-300/30 px-3 py-2 text-xs font-bold text-red-100 hover:bg-red-300/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                    Rechazar solicitud
                  </button>
                ) : null}
                {isReviewPending ? (
                  <>
                    <button
                      type="button"
                      onClick={() => void acceptReview(request.id)}
                      disabled={Boolean(pendingActionId)}
                      className="inline-flex items-center gap-1 rounded-full border border-cyan-300/40 px-3 py-2 text-xs font-bold text-cyan-100 hover:bg-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      {pendingActionId === `accept-review-${request.id}` ? "Aceptando..." : "Aceptar revisión"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewRejectionOpenIds((current) => current.includes(request.id) ? current : [...current, request.id])}
                      disabled={Boolean(pendingActionId)}
                      className="inline-flex items-center gap-1 rounded-full border border-red-300/30 px-3 py-2 text-xs font-bold text-red-100 hover:bg-red-300/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                      Rechazar revisión
                    </button>
                  </>
                ) : null}
                {isReviewApproved ? (
                  <button
                    type="button"
                    onClick={() => void approveRequest(request.id, "Acceso restaurado correctamente.")}
                    disabled={Boolean(pendingActionId)}
                    className="inline-flex items-center gap-1 rounded-full border border-emerald-300/40 px-3 py-2 text-xs font-bold text-emerald-100 hover:bg-emerald-300/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    {pendingActionId === `approve-${request.id}` ? "Restaurando..." : "Dar acceso de nuevo"}
                  </button>
                ) : null}
              </div>

              {isNormalRequest && rejectionOpenIds.includes(request.id) ? (
                <div className="mt-2 grid gap-2 rounded-md border border-red-300/20 bg-red-300/10 p-2.5">
                  <label className="grid gap-1">
                    <span className="text-xs font-bold uppercase text-red-100">Motivo del rechazo</span>
                    <textarea
                      value={rejectionReasons[request.id] ?? ""}
                      onChange={(event) => setRejectionReasons((current) => ({ ...current, [request.id]: event.target.value }))}
                      minLength={5}
                      maxLength={500}
                      required
                      placeholder="Motivo del rechazo"
                      className="min-h-20 rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-red-300"
                    />
                  </label>
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRejectionOpenIds((current) => current.filter((id) => id !== request.id));
                        setRejectionReasons((current) => {
                          const next = { ...current };
                          delete next[request.id];
                          return next;
                        });
                      }}
                      disabled={Boolean(pendingActionId)}
                      className="inline-flex h-9 items-center justify-center rounded-md border border-white/10 px-4 text-xs font-bold text-zinc-200 hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => void rejectRequest(request.id)}
                      disabled={Boolean(pendingActionId) || rejectionReasonLength < 5 || rejectionReasonLength > 500}
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-red-300/30 px-4 text-xs font-bold text-red-100 hover:bg-red-300/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                      {pendingActionId === `reject-${request.id}` ? "Rechazando..." : "Confirmar rechazo"}
                    </button>
                  </div>
                </div>
              ) : null}

              {isReviewPending && reviewRejectionOpenIds.includes(request.id) ? (
                <div className="mt-2 grid gap-2 rounded-md border border-violet-300/20 bg-violet-300/10 p-2.5 sm:grid-cols-[1fr_auto] sm:items-end">
                  <label className="grid gap-1">
                    <span className="text-xs font-bold uppercase text-violet-200">Motivo del rechazo de revisión</span>
                    <textarea
                      value={reviewRejectionReasons[request.id] ?? ""}
                      onChange={(event) => setReviewRejectionReasons((current) => ({ ...current, [request.id]: event.target.value }))}
                      minLength={5}
                      maxLength={500}
                      required
                      placeholder="Explica el motivo (5 a 500 caracteres)"
                      className="min-h-20 rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-violet-300"
                    />
                  </label>
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setReviewRejectionOpenIds((current) => current.filter((id) => id !== request.id));
                        setReviewRejectionReasons((current) => {
                          const next = { ...current };
                          delete next[request.id];
                          return next;
                        });
                      }}
                      disabled={Boolean(pendingActionId)}
                      className="inline-flex h-9 items-center justify-center rounded-md border border-white/10 px-4 text-xs font-bold text-zinc-200 hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => void rejectReview(request.id)}
                      disabled={Boolean(pendingActionId) || reviewRejectionReasonLength < 5 || reviewRejectionReasonLength > 500}
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-red-300/30 px-4 text-xs font-bold text-red-100 hover:bg-red-300/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                      {pendingActionId === `reject-review-${request.id}` ? "Rechazando..." : "Confirmar rechazo"}
                    </button>
                  </div>
                </div>
              ) : null}

              {showPaymentForm ? (
                <div className="mt-2 grid gap-2 rounded-md border border-white/10 bg-white/5 p-2.5 lg:grid-cols-[1fr_90px_120px_130px_1.1fr_auto] lg:items-end">
                  <label className="grid gap-1">
                    <span className="text-xs font-bold uppercase text-zinc-500">Monto</span>
                    <input value={draft.amount} onChange={(event) => updatePaymentDraft(request.id, { amount: event.target.value })} type="number" min="0" step="0.01" placeholder="1500.00" className="h-9 rounded-md border border-white/10 bg-black/20 px-3 text-sm outline-none focus:border-cyan-300" />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-xs font-bold uppercase text-zinc-500">Moneda</span>
                    <input value={draft.currency} onChange={(event) => updatePaymentDraft(request.id, { currency: event.target.value.toUpperCase() })} placeholder="MXN" className="h-9 rounded-md border border-white/10 bg-black/20 px-3 text-sm outline-none focus:border-cyan-300" />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-xs font-bold uppercase text-zinc-500">Licencia</span>
                    <select value={draft.license_type} onChange={(event) => updatePaymentDraft(request.id, { license_type: event.target.value as PaymentDraft["license_type"] })} className="h-9 rounded-md border border-white/10 bg-black/20 px-3 text-sm outline-none focus:border-cyan-300">
                      <option value="basic" className="bg-[#101317] text-white">Basic</option>
                      <option value="premium" className="bg-[#101317] text-white">Premium</option>
                      <option value="exclusive" className="bg-[#101317] text-white">Exclusive</option>
                    </select>
                  </label>
                  <label className="grid gap-1">
                    <span className="text-xs font-bold uppercase text-zinc-500">Método</span>
                    <input value={draft.payment_method} onChange={(event) => updatePaymentDraft(request.id, { payment_method: event.target.value })} placeholder="Transferencia" className="h-9 rounded-md border border-white/10 bg-black/20 px-3 text-sm outline-none focus:border-cyan-300" />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-xs font-bold uppercase text-zinc-500">Nota</span>
                    <input value={draft.note} onChange={(event) => updatePaymentDraft(request.id, { note: event.target.value })} placeholder="Referencia interna" className="h-9 rounded-md border border-white/10 bg-black/20 px-3 text-sm outline-none focus:border-cyan-300" />
                  </label>
                  <button type="button" onClick={() => void confirmPaymentAndGrantAccess(request)} disabled={processingPaymentId === request.id} className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-cyan-300 px-4 text-xs font-bold text-black hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60">
                    <Save className="h-3.5 w-3.5" aria-hidden="true" />
                    {processingPaymentId === request.id ? "Confirmando..." : "Liberar"}
                  </button>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    );
  }

  function renderRevocations() {
    if (revocations.length === 0) {
      return <p className="rounded-md border border-white/10 bg-white/5 p-2.5 text-xs text-zinc-400">Sin revocaciones históricas.</p>;
    }

    return (
      <div className="grid gap-2">
        {revocations.map((revocation) => {
          const profile = getRevocationProfile(revocation);
          const admin = getRevocationAdmin(revocation);
          const accessState = resolveAccessDomainState({
            hasActiveAccess: activeAccessKeys.has(`${revocation.user_id}:${revocation.beat_id}`),
            revocationCount: 1,
          });
          const userName = profile?.display_name || profile?.username || profile?.email || revocation.user_id;
          const adminName = admin?.display_name || admin?.username || admin?.email;

          return (
            <article key={revocation.id} className="rounded-lg border border-amber-300/20 bg-amber-300/5 p-3">
              <div className="grid gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_auto] md:items-start">
                <div className="min-w-0">
                  <p className="break-words text-sm font-bold text-white">{userName}</p>
                  <p className="mt-1 break-all text-xs text-zinc-400">{profile?.email || `Usuario ${revocation.user_id}`}</p>
                </div>
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold text-zinc-200">{getRevocationBeat(revocation)}</p>
                  <p className="mt-1 text-xs text-zinc-500">Revocada: {getRevocationDate(revocation)}</p>
                </div>
                <span className={`inline-flex w-fit rounded-md border px-2 py-1 text-xs font-bold ${accessState.status === "restored" ? "border-emerald-300/30 text-emerald-100" : revokedStatusStyle}`}>
                  {getCurrentAccessLabel(accessState)}
                </span>
              </div>
              <p className="mt-3 whitespace-pre-wrap break-words text-xs leading-5 text-zinc-300">Motivo: {revocation.reason || "Sin motivo registrado"}</p>
              {adminName ? <p className="mt-1 break-words text-xs text-zinc-500">Revocó: {adminName}</p> : null}
            </article>
          );
        })}
      </div>
    );
  }

  return (
    <section className="rounded-lg border border-white/10 bg-[#101317] p-3">
      {message ? <p className="mb-4 rounded-md border border-white/10 bg-white/5 p-3 text-sm font-semibold text-cyan-200">{message}</p> : null}

      <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
        <div className="rounded-md border border-white/10 bg-white/5 p-3">
          <p className="text-xs font-bold uppercase text-zinc-500">Activas</p>
          <p className="mt-1 text-2xl font-black text-white">{activeItems.length}</p>
        </div>
        <div className="rounded-md border border-white/10 bg-white/5 p-3">
          <p className="text-xs font-bold uppercase text-zinc-500">Pendientes</p>
          <p className="mt-1 text-2xl font-black text-cyan-200">{requestSummary.pending.length}</p>
        </div>
        <div className="rounded-md border border-white/10 bg-white/5 p-3">
          <p className="text-xs font-bold uppercase text-zinc-500">Pago pendiente</p>
          <p className="mt-1 text-2xl font-black text-amber-200">{requestSummary.paymentPending.length}</p>
        </div>
        <div className="rounded-md border border-white/10 bg-white/5 p-3">
          <p className="text-xs font-bold uppercase text-zinc-500">Revisiones</p>
          <p className="mt-1 text-2xl font-black text-violet-200">{reviewItems.length}</p>
        </div>
        <div className="rounded-md border border-white/10 bg-white/5 p-3">
          <p className="text-xs font-bold uppercase text-zinc-500">Revocadas</p>
          <p className="mt-1 text-2xl font-black text-amber-200">{revocations.length}</p>
        </div>
        <div className="rounded-md border border-white/10 bg-white/5 p-3">
          <p className="text-xs font-bold uppercase text-zinc-500">Historial</p>
          <p className="mt-1 text-2xl font-black text-zinc-200">{historyItems.length}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Revisiones</h2>
            <span className="text-xs font-semibold text-violet-200">{reviewItems.length}</span>
          </div>
          <div className="max-h-105 overflow-y-auto pr-1">
            {renderCards(reviewItems)}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Activas</h2>
            <span className="text-xs font-semibold text-cyan-200">{activeItems.length}</span>
          </div>
          <div className="max-h-105 overflow-y-auto pr-1">
            {renderCards(activeItems)}
          </div>
        </div>

        <div className="grid gap-3">
          <div className="rounded-lg border border-white/10 bg-white/3 p-2.5">
            <button
              type="button"
              onClick={() => setIsHistoryOpen((current) => !current)}
              className="flex w-full items-center justify-between gap-2 rounded-md border border-white/10 bg-black/20 px-3 py-2 text-left hover:border-cyan-300/40"
            >
              <span>
                <span className="block text-xs font-bold uppercase tracking-[0.16em] text-zinc-300">Historial</span>
                <span className="text-[11px] text-zinc-500">Cerradas sin revocación</span>
              </span>
              <span className="inline-flex items-center gap-2 text-[11px] font-bold text-zinc-400">
                {historyItems.length}
                <ChevronDown className={`h-3.5 w-3.5 transition ${isHistoryOpen ? "rotate-180" : ""}`} aria-hidden="true" />
              </span>
            </button>
            {isHistoryOpen ? (
              <div className="mt-2 max-h-105 overflow-y-auto pr-1">
                {renderCards(historyItems)}
              </div>
            ) : null}
          </div>

          <div className="rounded-lg border border-amber-300/20 bg-amber-300/4 p-2.5">
            <button
              type="button"
              onClick={() => setIsRevokedOpen((current) => !current)}
              className="flex w-full items-center justify-between gap-2 rounded-md border border-amber-300/20 bg-black/20 px-3 py-2 text-left hover:border-amber-300/40"
            >
              <span>
                <span className="block text-xs font-bold uppercase tracking-[0.16em] text-amber-200">Revocadas</span>
                <span className="text-[11px] text-amber-100/60">Historial real de revocaciones</span>
              </span>
              <span className="inline-flex items-center gap-2 text-[11px] font-bold text-amber-100/70">
                {revocations.length}
                <ChevronDown className={`h-3.5 w-3.5 transition ${isRevokedOpen ? "rotate-180" : ""}`} aria-hidden="true" />
              </span>
            </button>
            {isRevokedOpen ? (
              <div className="mt-2 max-h-105 overflow-y-auto pr-1">
                {renderRevocations()}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
