"use client";

import { useEffect, useMemo, useState } from "react";
import type { Beat } from "@/data/beats";
import type { User } from "@/data/users";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getBeats, getProfilesResult, grantBeatAccess, revokeBeatAccess } from "@/lib/supabase/queries";

export function AccessManager() {
  const [beats, setBeats] = useState<Beat[]>([]);
  const [localUsers, setLocalUsers] = useState<User[]>([]);
  const [selectedBeatId, setSelectedBeatId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [message, setMessage] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [beatSearch, setBeatSearch] = useState("");
  const [accessFilter, setAccessFilter] = useState<"all" | "with" | "without">("all");

  async function refresh() {
    const supabase = createSupabaseBrowserClient();
    const [beatsResult, profilesResult] = await Promise.all([getBeats(), getProfilesResult(supabase)]);
    const realUsers = profilesResult.users;
    setBeats(beatsResult.beats);
    setLocalUsers(realUsers);
    if (profilesResult.error) {
      setMessage(profilesResult.error);
    }
    setSelectedBeatId((current) => current || beatsResult.beats[0]?.id || "");
    setSelectedUserId((current) => current || realUsers[0]?.id || "");
  }

  useEffect(() => {
    const loadId = window.setTimeout(() => {
      void refresh();
    }, 0);

    return () => {
      window.clearTimeout(loadId);
    };
  }, []);

  const accessRows = useMemo(
    () =>
      beats.map((beat) => ({
        beat,
        users: localUsers.filter((user) => user.accessibleBeatIds.includes(beat.id) || Boolean(beat.dbId && user.accessibleBeatIds.includes(beat.dbId))),
      })),
    [beats, localUsers],
  );
  const filteredUsers = useMemo(() => {
    const term = userSearch.trim().toLowerCase();
    return localUsers.filter((user) => {
      if (!term) {
        return true;
      }

      return [user.name, user.username, user.email].some((value) => value.toLowerCase().includes(term));
    });
  }, [localUsers, userSearch]);
  const filteredBeats = useMemo(() => {
    const term = beatSearch.trim().toLowerCase();
    return beats.filter((beat) => {
      if (!term) {
        return true;
      }

      return [beat.name, beat.id, beat.genre, String(beat.bpm)].some((value) => value.toLowerCase().includes(term));
    });
  }, [beatSearch, beats]);
  const filteredAccessRows = useMemo(() => {
    return accessRows.filter((row) => {
      const term = beatSearch.trim().toLowerCase();
      const matchesBeat = !term || [row.beat.name, row.beat.id, row.beat.genre, String(row.beat.bpm)].some((value) => value.toLowerCase().includes(term));
      const matchesAccess = accessFilter === "all" || (accessFilter === "with" ? row.users.length > 0 : row.users.length === 0);
      return matchesBeat && matchesAccess;
    });
  }, [accessFilter, accessRows, beatSearch]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 rounded-lg border border-white/10 bg-[#101317] p-5 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-zinc-300">Beat</span>
          <select value={selectedBeatId} onChange={(event) => setSelectedBeatId(event.target.value)} className="h-11 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-cyan-300">
            {filteredBeats.map((beat) => (
              <option key={beat.id} value={beat.id} className="bg-[#101317]">
                {beat.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-zinc-300">Usuario</span>
          <select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)} className="h-11 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-cyan-300">
            {filteredUsers.map((user) => (
              <option key={user.id} value={user.id} className="bg-[#101317]">
                {user.name} (@{user.username})
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={async () => {
            const result = await grantBeatAccess(selectedUserId, selectedBeatId);
            setMessage(result.ok ? "Acceso otorgado." : result.message ?? "No se pudo otorgar acceso.");
            await refresh();
          }}
          className="h-11 rounded-md bg-cyan-300 px-4 text-sm font-bold text-black hover:bg-cyan-200"
        >
          Dar acceso
        </button>
        <button
          type="button"
          onClick={async () => {
            const result = await revokeBeatAccess(selectedUserId, selectedBeatId);
            setMessage(result.ok ? "Acceso retirado." : result.message ?? "No se pudo retirar acceso.");
            await refresh();
          }}
          className="h-11 rounded-md border border-white/10 px-4 text-sm font-bold text-zinc-200 hover:border-cyan-300 hover:text-cyan-200"
        >
          Quitar acceso
        </button>
      </section>
      <section className="grid gap-3 rounded-lg border border-white/10 bg-[#101317] p-4 md:grid-cols-3">
        <input value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="Buscar usuario, username o email" className="h-11 rounded-md border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-cyan-300" />
        <input value={beatSearch} onChange={(event) => setBeatSearch(event.target.value)} placeholder="Buscar beat, slug, género o BPM" className="h-11 rounded-md border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-cyan-300" />
        <select value={accessFilter} onChange={(event) => setAccessFilter(event.target.value as "all" | "with" | "without")} className="h-11 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-cyan-300">
          <option value="all" className="bg-[#101317]">Todos</option>
          <option value="with" className="bg-[#101317]">Con acceso</option>
          <option value="without" className="bg-[#101317]">Sin acceso</option>
        </select>
      </section>
      {message ? <p className="rounded-md border border-white/10 bg-white/5 p-3 text-sm font-semibold text-cyan-200">{message}</p> : null}

      <section className="rounded-lg border border-white/10 bg-[#101317] p-5">
        <h2 className="text-xl font-bold">Accesos actuales por beat</h2>
        <div className="mt-4 grid gap-3">
          {filteredAccessRows.map((row) => (
            <article key={row.beat.id} className="rounded-lg border border-white/10 bg-[#15181c] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">{row.beat.name}</p>
                  <p className="text-sm text-zinc-400">{row.beat.genre} · {row.beat.bpm} BPM</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {row.users.length > 0 ? (
                    row.users.map((user) => (
                      <span key={user.id} className="rounded-md border border-cyan-300/30 px-3 py-2 text-sm font-semibold text-cyan-200">
                        @{user.username}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-md border border-white/10 px-3 py-2 text-sm text-zinc-400">Disponible</span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
