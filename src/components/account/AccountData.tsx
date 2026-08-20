"use client";

import Link from "next/link";
import { ArrowLeft, Heart, Settings } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Beat } from "@/data/beats";
import { useUser } from "@/context/UserContext";
import { PlayButton } from "@/components/PlayButton";
import { BeatCard } from "@/components/BeatCard";
import { ProductUpdatesPanel } from "@/components/ProductUpdatesPanel";
import DownloadBeatButton from "@/components/DownloadBeatButton";
import DownloadLicenseButton from "@/components/DownloadLicenseButton";
import { formatLocalDateTime } from "@/lib/formatLocalDateTime";
import { getCurrentAccessLabel, resolveAccessDomainState } from "@/lib/access-domain";
import { acknowledgeAccessRevocation, deleteOwnAccount, getBeats, getAccessRequestsForUser, getUserAccessibleBeats, getUserAccessRevocations, updateProfile, type AccessRequestRow, type AccessRevocationRow } from "@/lib/supabase/queries";
import { getSavedBeatIds, SAVED_BEATS_EVENT } from "@/lib/saved-beats";
import { getCurrentUserPaidBeatIds } from "@/lib/payment-entitlements";

function requestBeatName(request: AccessRequestRow) {
  const beat = Array.isArray(request.beats) ? request.beats[0] : request.beats;
  return beat?.title || beat?.slug || request.beat_id;
}

function requestBeatHref(request: AccessRequestRow) {
  const beat = Array.isArray(request.beats) ? request.beats[0] : request.beats;
  return `/beats/${encodeURIComponent(beat?.slug || request.beat_id)}`;
}


function revocationMatchesRequest(revocation: AccessRevocationRow, request: AccessRequestRow) {
  return revocation.user_id === request.user_id && revocation.beat_id === request.beat_id;
}


function statusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "Pendiente",
    contacted: "Contactado",
    payment_pending: "Pago pendiente",
    paid: "Pagado",
    fulfilled: "Completada",
    approved: "Aprobada",
    rejected: "Rechazada",
    review_pending: "Revisión pendiente",
    review_rejected: "Revisión rechazada",
    cancelled: "Cancelada",
  };

  return labels[status] ?? "Pendiente";
}

function useAccountData() {
  const pathname = usePathname();
  const { currentUser, refreshCurrentUser } = useUser();
  const [beats, setBeats] = useState<Beat[]>([]);
  const [accessibleBeats, setAccessibleBeats] = useState<Beat[]>([]);
  const [requests, setRequests] = useState<AccessRequestRow[]>([]);
  const [revocations, setRevocations] = useState<AccessRevocationRow[]>([]);
  const [paidBeatIds, setPaidBeatIds] = useState<Set<string> | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    const refresh = () => setRefreshVersion((value) => value + 1);

    window.addEventListener("br-access-state-changed", refresh);
    window.addEventListener("br-access-requests-refresh", refresh);
    window.addEventListener("br-commercial-activity-refresh", refresh);

    return () => {
      window.removeEventListener("br-access-state-changed", refresh);
      window.removeEventListener("br-access-requests-refresh", refresh);
      window.removeEventListener("br-commercial-activity-refresh", refresh);
    };
  }, []);

  useEffect(() => {
    if (!currentUser?.id) {
      const clearId = window.setTimeout(() => {
        setBeats([]);
        setAccessibleBeats([]);
        setRequests([]);
        setRevocations([]);
        setPaidBeatIds(null);
      }, 0);

      return () => window.clearTimeout(clearId);
    }

    let cancelled = false;
    const loadId = window.setTimeout(() => {
      void Promise.all([
        refreshCurrentUser(),
        getBeats(),
        getUserAccessibleBeats(currentUser.id),
        getAccessRequestsForUser(currentUser.id),
        getUserAccessRevocations(currentUser.id),
        getCurrentUserPaidBeatIds(),
      ]).then(([, beatsResult, userAccessibleBeats, userRequests, userRevocations, userPaidBeatIds]) => {
        if (cancelled) {
          return;
        }

        setBeats(beatsResult.beats);
        setAccessibleBeats(userAccessibleBeats);
        setRequests(userRequests);
        setRevocations(userRevocations);
        setPaidBeatIds(userPaidBeatIds);
      });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(loadId);
    };
  }, [currentUser?.id, pathname, refreshCurrentUser, refreshVersion]);


  return { accessibleBeats, beats, currentUser, paidBeatIds, requests, revocations };
}

export function AccountOverview() {
  const { accessibleBeats, currentUser, requests, revocations } = useAccountData();

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-lg border border-white/10 bg-[#101317] p-5">
          <p className="text-sm text-zinc-400">Usuario</p>
          <p className="mt-2 text-2xl font-black">{currentUser?.name}</p>
          <p className="mt-1 text-sm font-semibold text-cyan-200">@{currentUser?.username}</p>
        </article>
        <article className="rounded-lg border border-white/10 bg-[#101317] p-5">
          <p className="text-sm text-zinc-400">Beats con acceso</p>
          <p className="mt-2 text-3xl font-black">{accessibleBeats.length}</p>
        </article>
        <article className="rounded-lg border border-white/10 bg-[#101317] p-5">
          <p className="text-sm text-zinc-400">Solicitudes recientes</p>
          <p className="mt-2 text-3xl font-black">{requests.length}</p>
          {revocations.length ? <p className="mt-2 text-xs font-semibold text-amber-200">{revocations.length} revocación(es) histórica(s)</p> : null}
        </article>
      </section>

      <section>
        <Link href="/" className="mb-4 inline-flex w-fit items-center gap-2 text-sm font-bold text-cyan-200"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Volver al inicio</Link>
        <h2 className="mb-3 text-xl font-bold">Accesos rápidos</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <Link href="/account/beats" className="rounded-lg border border-cyan-300/20 bg-[#101317] p-4 font-bold text-cyan-200">Mis beats</Link>
          <Link href="/account/requests" className="rounded-lg border border-cyan-300/20 bg-[#101317] p-4 font-bold text-cyan-200">Solicitudes</Link>
          <Link href="/account/saved" className="rounded-lg border border-cyan-300/20 bg-[#101317] p-4 font-bold text-cyan-200">Guardados</Link>
          <Link href="/account/settings" className="rounded-lg border border-cyan-300/20 bg-[#101317] p-4 font-bold text-cyan-200">Ajustes</Link>
        </div>
      </section>
    </div>
  );
}

export function AccountBeats() {
  const { accessibleBeats, paidBeatIds } = useAccountData();

  return (
    <section className="grid gap-3">
      <Link href="/account" className="inline-flex w-fit items-center gap-2 text-sm font-bold text-cyan-200"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Volver a mi cuenta</Link>
      {accessibleBeats.length === 0 ? <p className="rounded-lg border border-white/10 bg-[#101317] p-5 text-sm text-zinc-400">Aún no tienes beats con acceso completo.</p> : null}
      {accessibleBeats.map((beat) => {
        const hasConfirmedPayment = paidBeatIds?.has(beat.dbId ?? beat.id) === true;

        return (
          <article key={beat.id} className="rounded-lg border border-white/10 bg-[#101317] p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-bold">{beat.name}</p>
                <p className="text-sm text-zinc-400">{beat.genre} · {beat.bpm} BPM</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <PlayButton beat={beat} mode="full" queue={accessibleBeats} showPauseState>Full</PlayButton>
                {hasConfirmedPayment ? (
                  <>
                    <DownloadBeatButton beatId={beat.dbId ?? beat.id} fileName={beat.name} className="inline-flex h-11 items-center gap-2 rounded-md border border-cyan-300/30 px-4 text-sm font-bold text-cyan-200 hover:bg-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-60">Descargar MP3</DownloadBeatButton>
                    <DownloadLicenseButton beatId={beat.dbId ?? beat.id} fileName={beat.name} className="inline-flex h-11 items-center gap-2 rounded-md border border-white/10 px-4 text-sm font-bold text-zinc-200 hover:border-cyan-300 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-60">Licencia</DownloadLicenseButton>
                  </>
                ) : (
                  <p className="text-sm text-amber-100">{paidBeatIds === null ? "Validando pago..." : "Acceso Full habilitado. Pago pendiente."}</p>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}

export function AccountRequests() {
  const { accessibleBeats, currentUser, requests, revocations } = useAccountData();
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);
  const [actionMessages, setActionMessages] = useState<Record<string, string>>({});

  const activeAccessIds = useMemo(() => {
    return new Set([
      ...(currentUser?.accessibleBeatIds ?? []),
      ...accessibleBeats.flatMap((beat) => [beat.id, beat.dbId].filter(Boolean) as string[]),
    ].map(String));
  }, [accessibleBeats, currentUser?.accessibleBeatIds]);

  function findRevocationsForRequest(request: AccessRequestRow) {
    return revocations.filter((revocation) => revocationMatchesRequest(revocation, request));
  }

  async function dismissRevocationNotice(requestId: string, revocationId: string) {
    if (!currentUser?.id) {
      return;
    }

    setAcknowledgingId(revocationId);
    setActionMessages((current) => ({ ...current, [requestId]: "" }));
    const result = await acknowledgeAccessRevocation(currentUser.id, revocationId);

    if (!result.ok) {
      setActionMessages((current) => ({ ...current, [requestId]: result.message ?? "No se pudo ocultar el aviso. Intenta de nuevo." }));
    }

    setAcknowledgingId(null);
  }

  return (
    <section className="grid gap-3">
      <Link href="/account" className="inline-flex w-fit items-center gap-2 text-sm font-bold text-cyan-200"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Volver a mi cuenta</Link>
      {requests.length === 0 ? <p className="rounded-lg border border-white/10 bg-[#101317] p-5 text-sm text-zinc-400">No hay solicitudes todavía.</p> : null}
      {requests.map((request) => {
        const historicalRevocations = findRevocationsForRequest(request);
        const latestRevocation = historicalRevocations[0] ?? null;
        const accessState = resolveAccessDomainState({
          hasActiveAccess: activeAccessIds.has(request.beat_id),
          revocationCount: historicalRevocations.length,
        });
        const isCurrentlyRevoked = accessState.status === "revoked";
        const reviewWasSent = request.status === "review_pending";

        return (
          <article key={request.id} className={`rounded-lg border p-4 ${isCurrentlyRevoked ? "border-amber-300/20 bg-amber-300/10" : "border-white/10 bg-[#101317]"}`}>
            <p className="font-bold">{requestBeatName(request)}</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <div className="rounded-md border border-white/10 bg-black/20 p-2.5">
                <p className="text-[10px] font-bold uppercase text-zinc-500">Solicitud</p>
                <p className="mt-1 text-sm font-semibold text-cyan-200">{statusLabel(request.status)}</p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 p-2.5">
                <p className="text-[10px] font-bold uppercase text-zinc-500">Acceso actual</p>
                <p className={`mt-1 text-sm font-semibold ${accessState.hasCurrentAccess ? "text-emerald-200" : isCurrentlyRevoked ? "text-amber-100" : "text-zinc-300"}`}>{getCurrentAccessLabel(accessState)}</p>
              </div>
              <div className="rounded-md border border-white/10 bg-black/20 p-2.5">
                <p className="text-[10px] font-bold uppercase text-zinc-500">Historial</p>
                <p className="mt-1 text-sm font-semibold text-zinc-300">{historicalRevocations.length ? `${historicalRevocations.length} revocación(es)` : "Sin revocaciones"}</p>
              </div>
            </div>
            {reviewWasSent ? <p className="mt-2 text-sm font-semibold text-amber-100">Solicitud de revisión enviada</p> : null}
            {request.status === "rejected" ? (
              <div className="mt-3 rounded-md border border-red-300/20 bg-red-300/10 p-3">
                <p className="text-sm font-bold text-red-100">Solicitud rechazada</p>
                <p className="mt-1 text-sm leading-6 text-zinc-300">Motivo: {request.rejection_reason || "Sin motivo registrado"}</p>
              </div>
            ) : null}
            {latestRevocation ? (
              <>
                <div className="mt-3 rounded-md border border-amber-300/20 bg-amber-300/5 p-3">
                  <p className="text-sm font-bold text-amber-100">{accessState.status === "restored" ? "Revocado anteriormente · acceso restaurado" : "Revocación vigente"}</p>
                  <p className="mt-1 text-sm leading-6 text-zinc-300">Motivo: {latestRevocation.reason}</p>
                  <p className="mt-1 text-xs text-zinc-500">Revocada: {formatLocalDateTime(latestRevocation.revoked_at)}</p>
                </div>
                {isCurrentlyRevoked ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {!latestRevocation.acknowledged_by_user ? (
                      <button
                        type="button"
                        onClick={() => void dismissRevocationNotice(request.id, String(latestRevocation.id))}
                        disabled={acknowledgingId === String(latestRevocation.id)}
                        className="inline-flex h-10 w-fit items-center justify-center rounded-md border border-white/10 px-4 text-xs font-bold text-zinc-200 hover:border-amber-300 hover:text-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {acknowledgingId === String(latestRevocation.id) ? "Guardando..." : "Ya lo vi"}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </>
            ) : null}
            {actionMessages[request.id] ? <p className="mt-2 text-xs font-semibold text-red-200">{actionMessages[request.id]}</p> : null}
            <p className="mt-1 text-xs text-zinc-500">Solicitud: {formatLocalDateTime(request.review_requested_at ?? request.created_at)}</p>
            <Link href={requestBeatHref(request)} className="mt-3 inline-flex h-10 w-fit items-center justify-center rounded-md border border-cyan-300/30 px-4 text-xs font-bold text-cyan-100 hover:bg-cyan-300/10">
              Ver beat
            </Link>
          </article>
        );
      })}
    </section>
  );
}

export function AccountSaved() {
  const { beats, currentUser } = useAccountData();
  const [savedBeatIds, setSavedBeatIds] = useState<string[]>([]);

  useEffect(() => {
    const syncSavedBeats = () => {
      setSavedBeatIds(getSavedBeatIds(currentUser?.id));
    };

    syncSavedBeats();

    window.addEventListener(SAVED_BEATS_EVENT, syncSavedBeats);
    window.addEventListener("storage", syncSavedBeats);

    return () => {
      window.removeEventListener(SAVED_BEATS_EVENT, syncSavedBeats);
      window.removeEventListener("storage", syncSavedBeats);
    };
  }, [currentUser?.id]);

  const savedBeats = useMemo(() => {
    const savedIds = new Set(savedBeatIds.map(String));

    return beats.filter((beat) => {
      const beatIds = [beat.dbId, beat.id].filter(Boolean).map(String);
      return beatIds.some((id) => savedIds.has(id));
    });
  }, [beats, savedBeatIds]);

  return (
    <div className="grid gap-3">
      <Link href="/account" className="inline-flex w-fit items-center gap-2 text-sm font-bold text-cyan-200"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Volver a mi cuenta</Link>
      <section className="rounded-lg border border-white/10 bg-[#101317] p-5">
        <Heart className="h-5 w-5 text-cyan-200" aria-hidden="true" />
        <h2 className="mt-3 text-xl font-bold">Guardados</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-400">Tus beats guardados se mantienen en este navegador por ahora.</p>
      </section>

      {savedBeats.length === 0 ? (
        <p className="rounded-lg border border-white/10 bg-[#101317] p-5 text-sm text-zinc-400">Aún no tienes beats guardados. Usa el botón Guardar en cualquier beat para agregarlo aquí.</p>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {savedBeats.map((beat, beatIndex) => (
            <BeatCard key={beat.id} beat={beat} gradientIndex={beatIndex} queue={savedBeats} />
          ))}
        </section>
      )}
    </div>
  );
}

export function AccountSettings() {
  const router = useRouter();
  const { currentUser, refreshCurrentUser } = useUser();
  const [username, setUsername] = useState(currentUser?.username ?? "");
  const [displayName, setDisplayName] = useState(currentUser?.name ?? "");
  const [phone, setPhone] = useState(currentUser?.phone ?? "");
  const [message, setMessage] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  useEffect(() => {
    const syncId = window.setTimeout(() => {
      setUsername(currentUser?.username ?? "");
      setDisplayName(currentUser?.name ?? "");
      setPhone(currentUser?.phone ?? "");
    }, 0);

    return () => window.clearTimeout(syncId);
  }, [currentUser]);

  async function saveSettings() {
    if (!currentUser) {
      return;
    }

    const normalizedUsername = username.trim().replace(/^@+/, "");

    if (normalizedUsername.length < 3 || normalizedUsername.includes(" ")) {
      setMessage("Username inválido: mínimo 3 caracteres, sin espacios ni @ duplicado.");
      return;
    }

    setMessage("Guardando...");
    const result = await updateProfile(currentUser.id, { username: normalizedUsername, displayName, phone });
    if (result.ok) {
      await refreshCurrentUser();
      router.refresh();
      setMessage("Perfil actualizado.");
      return;
    }

    setMessage(result.message || "No se pudo actualizar el perfil.");
  }

  async function deleteAccount() {
    if (deleteConfirmation !== "ELIMINAR") {
      setMessage("Escribe ELIMINAR para confirmar.");
      return;
    }

    setMessage("Eliminando cuenta...");
    const result = await deleteOwnAccount();

    if (!result.ok) {
      setMessage(result.message || "No se pudo eliminar la cuenta.");
      return;
    }

    await refreshCurrentUser();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="grid gap-3">
      <Link href="/account" className="inline-flex w-fit items-center gap-2 text-sm font-bold text-cyan-200"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Volver a mi cuenta</Link>
      <ProductUpdatesPanel audience="user" />
      <section className="rounded-lg border border-white/10 bg-[#101317] p-5">
        <div className="mb-5 flex items-center gap-2">
          <Settings className="h-5 w-5 text-cyan-200" aria-hidden="true" />
          <h2 className="text-xl font-bold">Perfil</h2>
        </div>
        <div className="grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-zinc-300">Username</span>
            <div className="flex h-11 overflow-hidden rounded-md border border-white/10 bg-white/5 focus-within:border-cyan-300">
              <span className="grid w-10 place-items-center text-cyan-200">@</span>
              <input value={username} onChange={(event) => setUsername(event.target.value.replace(/^@+/, ""))} className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none" />
            </div>
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-zinc-300">Display name</span>
            <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="h-11 rounded-md border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-cyan-300" />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-zinc-300">Teléfono</span>
            <input value={phone} onChange={(event) => setPhone(event.target.value)} className="h-11 rounded-md border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-cyan-300" />
          </label>
          <button type="button" onClick={() => void saveSettings()} className="h-11 w-fit rounded-md bg-cyan-300 px-5 text-sm font-bold text-black hover:bg-cyan-200">Guardar cambios</button>
          {message ? <p className="text-sm font-semibold text-cyan-200">{message}</p> : null}
        </div>
      </section>
      <section className="rounded-lg border border-red-300/20 bg-[#101317] p-5">
        <h2 className="text-xl font-bold text-red-100">Eliminar mi cuenta</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-400">Esta acción eliminará tu cuenta y accesos. No se puede deshacer.</p>
        <div className="mt-4 grid gap-3 md:max-w-md">
          <input value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} placeholder="Escribe ELIMINAR" className="h-11 rounded-md border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-red-300" />
          <button type="button" onClick={() => void deleteAccount()} className="h-11 w-fit rounded-md border border-red-300/30 px-5 text-sm font-bold text-red-100 hover:bg-red-300/10">Eliminar mi cuenta</button>
        </div>
      </section>
    </div>
  );
}
