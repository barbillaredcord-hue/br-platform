"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Beat } from "@/data/beats";
import type { User } from "@/data/users";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getBeats, getProfilesResult, grantBeatAccess, revokeBeatAccess } from "@/lib/supabase/queries";

const revocationReasons = [
  "Incumplimiento de licencia.",
  "Uso comercial no autorizado.",
  "Reventa o redistribución no autorizada.",
  "Contracargo o disputa de pago.",
  "Pago cancelado o no verificado.",
  "Solicitud del propietario.",
  "Violación de términos de servicio.",
  "Actividad sospechosa.",
  "Cuenta comprometida.",
  "Licencia expirada.",
  "Proyecto cancelado.",
  "Otro motivo.",
];

function getBeatKey(beat: Beat) {
  return beat.dbId ?? beat.id;
}

function userHasAccess(user: User, beat: Beat) {
  return user.accessibleBeatIds.includes(beat.id) || Boolean(beat.dbId && user.accessibleBeatIds.includes(beat.dbId));
}

export function AccessManager() {
  const pathname = usePathname();
  const router = useRouter();
  const [beats, setBeats] = useState<Beat[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedBeatId, setSelectedBeatId] = useState("");
  const [beatSearch, setBeatSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [message, setMessage] = useState("");
  const [processingKey, setProcessingKey] = useState("");
  const [revokingUserId, setRevokingUserId] = useState("");
  const [selectedReason, setSelectedReason] = useState(revocationReasons[0]);
  const [customReason, setCustomReason] = useState("");

  async function refresh() {
    const supabase = createSupabaseBrowserClient();
    const [beatsResult, profilesResult] = await Promise.all([getBeats(), getProfilesResult(supabase)]);
    setBeats(beatsResult.beats);
    setUsers(profilesResult.users);
    if (profilesResult.error) {
      setMessage(profilesResult.error);
    }
    setSelectedBeatId((current) => current || getBeatKey(beatsResult.beats[0]) || "");
  }

  useEffect(() => {
    const loadId = window.setTimeout(() => {
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

  const selectedBeat = useMemo(() => beats.find((beat) => getBeatKey(beat) === selectedBeatId || beat.id === selectedBeatId) ?? beats[0], [beats, selectedBeatId]);
  const selectedBeatKey = selectedBeat ? getBeatKey(selectedBeat) : "";
  const filteredBeats = useMemo(() => {
    const term = beatSearch.trim().toLowerCase();
    return beats.filter((beat) => !term || [beat.name, beat.id, beat.genre, String(beat.bpm)].some((value) => value.toLowerCase().includes(term)));
  }, [beatSearch, beats]);
  const filteredUsers = useMemo(() => {
    const term = userSearch.trim().toLowerCase();
    return users.filter((user) => !term || [user.name, user.username, user.email, user.phone ?? ""].some((value) => value.toLowerCase().includes(term)));
  }, [userSearch, users]);
  const accessCount = selectedBeat ? users.filter((user) => userHasAccess(user, selectedBeat)).length : 0;

  function addLocalAccess(userId: string, beat: Beat) {
    const ids = [beat.dbId, beat.id].filter(Boolean) as string[];
    setUsers((current) =>
      current.map((user) => (user.id === userId ? { ...user, accessibleBeatIds: Array.from(new Set([...user.accessibleBeatIds, ...ids])) } : user)),
    );
  }

  function removeLocalAccess(userId: string, beat: Beat) {
    const ids = new Set([beat.dbId, beat.id].filter(Boolean));
    setUsers((current) =>
      current.map((user) => (user.id === userId ? { ...user, accessibleBeatIds: user.accessibleBeatIds.filter((id) => !ids.has(id)) } : user)),
    );
  }

  function openRevocation(userId: string) {
    setRevokingUserId(userId);
    setSelectedReason(revocationReasons[0]);
    setCustomReason("");
    setMessage("");
  }

  function closeRevocation() {
    setRevokingUserId("");
    setCustomReason("");
  }

  async function toggleAccess(user: User, revocationReason = "") {
    if (!selectedBeat || !selectedBeatKey) {
      return;
    }

    const hasAccess = userHasAccess(user, selectedBeat);

    if (hasAccess && !revocationReason) {
      setMessage("Agrega un motivo para revocar el acceso.");
      return;
    }

    const actionKey = `${user.id}:${selectedBeatKey}`;
    setProcessingKey(actionKey);
    setMessage("Procesando...");
    closeRevocation();
    const result = hasAccess ? await revokeBeatAccess(user.id, selectedBeatKey, revocationReason) : await grantBeatAccess(user.id, selectedBeatKey);

    if (result.ok) {
      if (hasAccess) {
        removeLocalAccess(user.id, selectedBeat);
      } else {
        addLocalAccess(user.id, selectedBeat);
      }
    }

    setMessage(
      result.ok
        ? (result.message ?? (hasAccess ? "Acceso revocado y motivo registrado." : "Acceso concedido."))
        : result.message ?? "No se pudo actualizar la información. Intenta de nuevo."
    );

    if (result.ok) {
      await refresh();
      router.refresh();
    }

    setProcessingKey("");
    closeRevocation();
  }

  async function confirmRevocation(user: User) {
    const reason = selectedReason === "Otro motivo." ? customReason.trim() : selectedReason;

    if (!reason) {
      setMessage("Escribe una explicación para usar Otro motivo.");
      return;
    }

    const confirmed = window.confirm("Se revocará el acceso y licencia asociados a este beat. ¿Deseas continuar?");

    if (!confirmed) {
      return;
    }

    await toggleAccess(user, reason);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(260px,340px)_1fr]">
      <section className="flex min-h-0 flex-col rounded-lg border border-white/10 bg-[#101317] p-4 lg:h-[calc(100vh-14rem)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Beats</h2>
          <span className="text-xs font-semibold text-cyan-200">{beats.length} activos</span>
        </div>
        <input value={beatSearch} onChange={(event) => setBeatSearch(event.target.value)} placeholder="Buscar beat" className="mb-3 h-10 w-full shrink-0 rounded-md border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-cyan-300" />
        <div className="grid min-h-0 flex-1 content-start gap-2 overflow-y-auto pr-1">
          {filteredBeats.map((beat) => {
            const active = getBeatKey(beat) === selectedBeatKey;
            const count = users.filter((user) => userHasAccess(user, beat)).length;
            return (
              <button
                key={getBeatKey(beat)}
                type="button"
                onClick={() => {
                  setSelectedBeatId(getBeatKey(beat));
                  setMessage("");
                }}
                className={`rounded-md border p-3 text-left transition ${active ? "border-cyan-300 bg-cyan-300/10" : "border-white/10 bg-[#15181c] hover:border-cyan-300/50"}`}
              >
                <p className="font-semibold">{beat.name}</p>
                <p className="mt-1 text-xs text-zinc-400">{beat.genre} · {beat.bpm} BPM</p>
                <p className="mt-2 text-xs font-semibold text-cyan-200">{count} usuarios con acceso</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-white/10 bg-[#101317] p-4">
        {selectedBeat ? (
          <>
            <div className="flex flex-col gap-3 border-b border-white/10 pb-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-cyan-200">Accesos para</p>
                <h2 className="text-2xl font-black">{selectedBeat.name}</h2>
                <p className="mt-1 text-sm text-zinc-400">{accessCount} usuarios con acceso</p>
              </div>
              <input value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="Buscar usuario" className="h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-cyan-300 md:w-72" />
            </div>
            {message ? <p className="mt-4 rounded-md border border-white/10 bg-white/5 p-3 text-sm font-semibold text-cyan-200">{message}</p> : null}
            <div className="mt-4 grid gap-2">
              {filteredUsers.map((user) => {
                const hasAccess = userHasAccess(user, selectedBeat);
                const actionKey = `${user.id}:${selectedBeatKey}`;
                return (
                  <article key={user.id} className="rounded-md border border-white/10 bg-[#15181c] p-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{user.name}</p>
                        <p className="mt-1 text-sm text-cyan-200">@{user.username}</p>
                        <p className="mt-1 truncate text-xs text-zinc-500">{user.email}</p>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${hasAccess ? "border-emerald-300/40 text-emerald-200" : "border-white/10 text-zinc-400"}`}>
                          {hasAccess ? "Con acceso" : "Sin acceso"}
                        </span>
                        <button
                          type="button"
                          onClick={() => (hasAccess ? openRevocation(user.id) : void toggleAccess(user))}
                          disabled={processingKey === actionKey}
                          className={hasAccess ? "rounded-full border border-red-300/30 px-3 py-1.5 text-xs font-bold text-red-100 hover:bg-red-300/10" : "rounded-full bg-cyan-300 px-3 py-1.5 text-xs font-bold text-black hover:bg-cyan-200"}
                        >
                          {processingKey === actionKey ? "..." : hasAccess ? "Quitar acceso" : "Dar acceso"}
                        </button>
                      </div>
                    </div>
                    {hasAccess && revokingUserId === user.id ? (
                      <div className="mt-4 rounded-md border border-red-300/20 bg-red-300/5 p-3">
                        <label className="grid gap-2">
                          <span className="text-xs font-bold uppercase text-red-100">Motivo de revocación</span>
                          <select
                            value={selectedReason}
                            onChange={(event) => setSelectedReason(event.target.value)}
                            className="h-10 rounded-md border border-white/10 bg-[#101317] px-3 text-sm text-white outline-none focus:border-red-300"
                          >
                            {revocationReasons.map((reason) => (
                              <option key={reason} value={reason}>
                                {reason}
                              </option>
                            ))}
                          </select>
                        </label>
                        {selectedReason === "Otro motivo." ? (
                          <label className="mt-3 grid gap-2">
                            <span className="text-xs font-bold uppercase text-zinc-400">Explicación obligatoria</span>
                            <textarea
                              value={customReason}
                              onChange={(event) => setCustomReason(event.target.value)}
                              rows={3}
                              className="resize-none rounded-md border border-white/10 bg-[#101317] px-3 py-2 text-sm text-white outline-none focus:border-red-300"
                              placeholder="Describe el motivo específico de la revocación."
                            />
                          </label>
                        ) : null}
                        <div className="mt-3 rounded-md border border-white/10 bg-white/5 p-3 text-xs leading-5 text-zinc-300">
                          <p className="font-bold text-zinc-100">Motivos recomendados</p>
                          <p className="mt-1">La revocación debe estar justificada, queda registrada en historial y el usuario podrá visualizar el motivo registrado.</p>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => void confirmRevocation(user)}
                            disabled={processingKey === actionKey}
                            className="rounded-md bg-red-300 px-3 py-2 text-xs font-bold text-black hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Confirmar revocación
                          </button>
                          <button type="button" onClick={closeRevocation} className="rounded-md border border-white/10 px-3 py-2 text-xs font-bold text-zinc-200 hover:border-cyan-300">
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </>
        ) : (
          <p className="text-sm text-zinc-400">No hay beats activos para gestionar.</p>
        )}
      </section>
    </div>
  );
}
