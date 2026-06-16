"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Beat } from "@/data/beats";
import type { User } from "@/data/users";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getProfilesResult } from "@/lib/supabase/queries";
import { AdminBeatStatus } from "./AdminBeatStatus";

function getUsersWithBeatAccess(beat: Beat, users: User[] = []) {
  return users.filter((user) => user.accessibleBeatIds.includes(beat.id) || Boolean(beat.dbId && user.accessibleBeatIds.includes(beat.dbId)));
}

export function AdminBeatList({ beats, users = [] }: { beats: Beat[]; users?: User[] }) {
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const [localUsers, setLocalUsers] = useState(users);
  const filteredBeats = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return beats;
    }

    return beats.filter((beat) => [beat.name, beat.id, beat.genre, String(beat.bpm)].some((value) => value.toLowerCase().includes(term)));
  }, [beats, search]);

  useEffect(() => {
    const loadId = window.setTimeout(() => {
      void getProfilesResult(createSupabaseBrowserClient()).then((result) => {
        if (result.users.length) {
          setLocalUsers(result.users);
        }
      });
    }, 0);

    return () => window.clearTimeout(loadId);
  }, [pathname]);

  return (
    <section className="rounded-lg border border-white/10 bg-[#101317] p-4">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar nombre, slug, género o BPM"
          className="h-11 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-cyan-300 md:max-w-lg"
        />
        <span className="text-sm font-semibold text-cyan-200">{filteredBeats.length} / {beats.length} beats</span>
      </div>
      <div className="hidden overflow-hidden rounded-lg border border-white/10 md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Portada</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Género</th>
              <th className="px-4 py-3">BPM</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Usuarios con acceso</th>
              <th className="px-4 py-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody>
            {filteredBeats.map((beat) => {
              const usersWithAccess = getUsersWithBeatAccess(beat, localUsers);

              return (
                <tr key={beat.id} className="border-t border-white/10">
                  <td className="px-4 py-3">
                    <div className="grid h-12 w-12 place-items-center rounded-md bg-[linear-gradient(135deg,#67e8f9,#0f172a)] text-xs font-black">B.R</div>
                  </td>
                  <td className="px-4 py-3 font-semibold">{beat.name}</td>
                  <td className="px-4 py-3 text-zinc-400">{beat.genre}</td>
                  <td className="px-4 py-3 text-zinc-400">{beat.bpm}</td>
                  <td className="px-4 py-3">
                    <AdminBeatStatus status={beat.status} />
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {usersWithAccess.length > 0 ? usersWithAccess.map((user) => user.name).join(", ") : "Sin usuarios"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/beats/${beat.id}/preview-editor`}
                      className="inline-flex items-center gap-2 rounded-md bg-cyan-300 px-3 py-2 text-xs font-bold text-black hover:bg-cyan-200"
                    >
                      <SlidersHorizontal className="h-3 w-3" aria-hidden="true" />
                      Editar Preview
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 md:hidden">
        {filteredBeats.map((beat) => (
          <article key={beat.id} className="rounded-lg border border-white/10 bg-[#15181c] p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-md bg-[linear-gradient(135deg,#67e8f9,#0f172a)] text-xs font-black">B.R</div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{beat.name}</p>
                <p className="mt-1 text-sm text-zinc-400">
                  {beat.genre} · {beat.bpm} BPM
                </p>
                <div className="mt-3">
                  <AdminBeatStatus status={beat.status} />
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  Usuarios con acceso:{" "}
                  {getUsersWithBeatAccess(beat, localUsers).map((user) => user.name).join(", ") || "Sin usuarios"}
                </p>
              </div>
            </div>
            <Link
              href={`/admin/beats/${beat.id}/preview-editor`}
              className="mt-4 flex h-10 items-center justify-center gap-2 rounded-md bg-cyan-300 text-sm font-bold text-black hover:bg-cyan-200"
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              Editar Preview
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
