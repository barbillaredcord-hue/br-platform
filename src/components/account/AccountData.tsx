"use client";

import Link from "next/link";
import { ArrowLeft, Download, Heart, Settings } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Beat } from "@/data/beats";
import { useUser } from "@/context/UserContext";
import { PlayButton } from "@/components/PlayButton";
import { getBeats, getAccessRequestsForUser, updateProfile, type AccessRequestRow } from "@/lib/supabase/queries";
import { userCanAccessBeat } from "@/lib/access";

function requestBeatName(request: AccessRequestRow) {
  const beat = Array.isArray(request.beats) ? request.beats[0] : request.beats;
  return beat?.title || beat?.slug || request.beat_id;
}

function statusLabel(status: string) {
  return status === "approved" ? "Aprobada" : status === "rejected" ? "Rechazada" : "Pendiente";
}

function useAccountData() {
  const pathname = usePathname();
  const { currentUser, refreshCurrentUser } = useUser();
  const [beats, setBeats] = useState<Beat[]>([]);
  const [requests, setRequests] = useState<AccessRequestRow[]>([]);

  useEffect(() => {
    if (!currentUser?.id) {
      const clearId = window.setTimeout(() => {
        setBeats([]);
        setRequests([]);
      }, 0);

      return () => window.clearTimeout(clearId);
    }

    let cancelled = false;
    const loadId = window.setTimeout(() => {
      void Promise.all([refreshCurrentUser(), getBeats(), getAccessRequestsForUser(currentUser.id)]).then(([, beatsResult, userRequests]) => {
        if (cancelled) {
          return;
        }

        setBeats(beatsResult.beats);
        setRequests(userRequests);
      });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(loadId);
    };
  }, [currentUser?.id, pathname, refreshCurrentUser]);

  const accessibleBeats = useMemo(() => beats.filter((beat) => userCanAccessBeat(currentUser, beat)), [beats, currentUser]);

  return { accessibleBeats, beats, currentUser, requests };
}

export function AccountOverview() {
  const { accessibleBeats, currentUser, requests } = useAccountData();

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
  const { accessibleBeats } = useAccountData();

  return (
    <section className="grid gap-3">
      <Link href="/account" className="inline-flex w-fit items-center gap-2 text-sm font-bold text-cyan-200"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Volver a mi cuenta</Link>
      {accessibleBeats.length === 0 ? <p className="rounded-lg border border-white/10 bg-[#101317] p-5 text-sm text-zinc-400">Aún no tienes beats con acceso completo.</p> : null}
      {accessibleBeats.map((beat) => (
        <article key={beat.id} className="rounded-lg border border-white/10 bg-[#101317] p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-bold">{beat.name}</p>
              <p className="text-sm text-zinc-400">{beat.genre} · {beat.bpm} BPM</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <PlayButton beat={beat} mode="full" queue={accessibleBeats} showPauseState>Full</PlayButton>
              <a href={beat.fullAudioUrl} download className="inline-flex h-11 items-center gap-2 rounded-md border border-cyan-300/30 px-4 text-sm font-bold text-cyan-200 hover:bg-cyan-300/10">
                <Download className="h-4 w-4" aria-hidden="true" />
                Descargar MP3
              </a>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}

export function AccountRequests() {
  const { requests } = useAccountData();

  return (
    <section className="grid gap-3">
      <Link href="/account" className="inline-flex w-fit items-center gap-2 text-sm font-bold text-cyan-200"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Volver a mi cuenta</Link>
      {requests.length === 0 ? <p className="rounded-lg border border-white/10 bg-[#101317] p-5 text-sm text-zinc-400">No hay solicitudes todavía.</p> : null}
      {requests.map((request) => (
        <article key={request.id} className="rounded-lg border border-white/10 bg-[#101317] p-4">
          <p className="font-bold">{requestBeatName(request)}</p>
          <p className="mt-1 text-sm text-cyan-200">{statusLabel(request.status)}</p>
          <p className="mt-1 text-xs text-zinc-500">{request.created_at ? new Date(request.created_at).toLocaleDateString("es-MX") : "Sin fecha"}</p>
        </article>
      ))}
    </section>
  );
}

export function AccountSaved() {
  return (
    <div className="grid gap-3">
      <Link href="/account" className="inline-flex w-fit items-center gap-2 text-sm font-bold text-cyan-200"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Volver a mi cuenta</Link>
      <section className="rounded-lg border border-white/10 bg-[#101317] p-5">
        <Heart className="h-5 w-5 text-cyan-200" aria-hidden="true" />
        <h2 className="mt-3 text-xl font-bold">Guardados</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-400">UI demo para favoritos. La persistencia se conectará después de Storage/upload real.</p>
      </section>
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
      setMessage("Cambios guardados");
      return;
    }

    setMessage(result.message || "No se pudieron guardar los cambios");
  }

  return (
    <div className="grid gap-3">
      <Link href="/account" className="inline-flex w-fit items-center gap-2 text-sm font-bold text-cyan-200"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Volver a mi cuenta</Link>
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
    </div>
  );
}
