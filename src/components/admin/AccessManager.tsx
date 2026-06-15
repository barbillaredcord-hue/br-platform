"use client";

import { useMemo, useState } from "react";
import type { Beat } from "@/data/beats";
import type { User } from "@/data/users";
import { grantBeatAccess, revokeBeatAccess } from "@/lib/access";

export function AccessManager({ beats, users }: { beats: Beat[]; users: User[] }) {
  const [localUsers, setLocalUsers] = useState(users);
  const [selectedBeatId, setSelectedBeatId] = useState(beats[0]?.id ?? "");
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id ?? "");

  const accessRows = useMemo(
    () =>
      beats.map((beat) => ({
        beat,
        users: localUsers.filter((user) => user.accessibleBeatIds.includes(beat.id)),
      })),
    [beats, localUsers],
  );

  return (
    <div className="space-y-6">
      <section className="grid gap-4 rounded-lg border border-white/10 bg-[#101317] p-5 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-zinc-300">Beat</span>
          <select value={selectedBeatId} onChange={(event) => setSelectedBeatId(event.target.value)} className="h-11 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-cyan-300">
            {beats.map((beat) => (
              <option key={beat.id} value={beat.id} className="bg-[#101317]">
                {beat.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-zinc-300">Usuario</span>
          <select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)} className="h-11 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-cyan-300">
            {localUsers.map((user) => (
              <option key={user.id} value={user.id} className="bg-[#101317]">
                {user.name}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={() => setLocalUsers((current) => grantBeatAccess(current, selectedUserId, selectedBeatId))} className="h-11 rounded-md bg-cyan-300 px-4 text-sm font-bold text-black hover:bg-cyan-200">
          Dar acceso
        </button>
        <button type="button" onClick={() => setLocalUsers((current) => revokeBeatAccess(current, selectedUserId, selectedBeatId))} className="h-11 rounded-md border border-white/10 px-4 text-sm font-bold text-zinc-200 hover:border-cyan-300 hover:text-cyan-200">
          Quitar acceso
        </button>
      </section>

      <section className="rounded-lg border border-white/10 bg-[#101317] p-5">
        <h2 className="text-xl font-bold">Accesos actuales por beat</h2>
        <div className="mt-4 grid gap-3">
          {accessRows.map((row) => (
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
