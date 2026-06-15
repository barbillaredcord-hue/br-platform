"use client";

import { useEffect, useState } from "react";
import type { Beat } from "@/data/beats";
import type { User } from "@/data/users";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getBeats, getProfilesResult } from "@/lib/supabase/queries";

function getAuthorizedBeats(user: User, beats: Beat[]) {
  return beats.filter((beat) => user.accessibleBeatIds.includes(beat.id) || Boolean(beat.dbId && user.accessibleBeatIds.includes(beat.dbId)));
}

export function AdminUsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [beats, setBeats] = useState<Beat[]>([]);
  const [error, setError] = useState("");
  const [emptyReason, setEmptyReason] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const supabase = createSupabaseBrowserClient();

      if (!supabase) {
        setError("Supabase no está configurado.");
        setEmptyReason("Revisa NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.");
        setIsLoading(false);
        return;
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        setError("Sesión no cargada. Vuelve a iniciar sesión.");
        setEmptyReason(sessionError?.message ?? "No hay sesión Supabase activa en el navegador.");
        setIsLoading(false);
        return;
      }

      const [profilesResult, beatsResult] = await Promise.all([getProfilesResult(supabase), getBeats()]);
      setUsers(profilesResult.users);
      setBeats(beatsResult.beats);
      setError(profilesResult.error);
      setEmptyReason(profilesResult.emptyReason);
      setIsLoading(false);
    }

    const loadId = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => {
      window.clearTimeout(loadId);
    };
  }, []);

  return (
    <section className="overflow-hidden rounded-lg border border-white/10 bg-[#101317]">
      {isLoading ? <p className="p-4 text-sm font-semibold text-cyan-200">Cargando profiles...</p> : null}
      {error ? (
        <div className="m-4 rounded-md border border-red-300/20 bg-red-300/10 p-4 text-sm text-red-100">
          <p className="font-bold">Error real de Supabase</p>
          <p className="mt-2 text-zinc-200">{error}</p>
          {emptyReason ? <p className="mt-2 text-zinc-300">{emptyReason}</p> : null}
        </div>
      ) : null}
      {!isLoading && !error && users.length === 0 ? (
        <div className="m-4 rounded-md border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">
          <p className="font-bold">No hay profiles visibles</p>
          <p className="mt-2 text-zinc-300">{emptyReason || "Causa probable: public.profiles está vacío o RLS no permite leer filas con esta sesión."}</p>
        </div>
      ) : null}
      <div className="hidden md:block">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-white/5 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Cantidad</th>
              <th className="px-4 py-3">Beats autorizados</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const authorizedBeats = getAuthorizedBeats(user, beats);
              return (
                <tr key={user.id} className="border-t border-white/10">
                  <td className="px-4 py-3 font-semibold">{user.name}</td>
                  <td className="px-4 py-3 text-cyan-200">@{user.username}</td>
                  <td className="px-4 py-3 text-zinc-400">{user.email}</td>
                  <td className="px-4 py-3 text-zinc-400">{user.role === "admin" ? "Admin" : "Usuario"}</td>
                  <td className="px-4 py-3 text-zinc-400">{authorizedBeats.length}</td>
                  <td className="px-4 py-3 text-zinc-400">
                    {authorizedBeats.map((beat) => beat.name).join(", ") || "Sin accesos"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 p-4 md:hidden">
        {users.map((user) => {
          const authorizedBeats = getAuthorizedBeats(user, beats);
          return (
            <article key={user.id} className="rounded-lg border border-white/10 bg-[#15181c] p-4">
              <p className="font-semibold">{user.name}</p>
              <p className="mt-1 text-sm text-cyan-200">@{user.username}</p>
              <p className="mt-1 text-sm text-zinc-400">{user.email}</p>
              <p className="mt-1 text-sm text-zinc-400">Rol: {user.role === "admin" ? "Admin" : "Usuario"}</p>
              <p className="mt-3 text-sm text-zinc-300">Beats: {authorizedBeats.map((beat) => beat.name).join(", ") || "Sin accesos"}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
