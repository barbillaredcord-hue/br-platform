"use client";

import Link from "next/link";
import { Fragment, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Beat } from "@/data/beats";
import type { User } from "@/data/users";
import { useUser } from "@/context/UserContext";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { deleteUserAsAdmin, getAccessRequests, getBeats, getProfilesResult, isRecentAnsweredRequest, type AccessRequestRow } from "@/lib/supabase/queries";

function getAuthorizedBeats(user: User, beats: Beat[]) {
  return beats.filter((beat) => user.accessibleBeatIds.includes(beat.id) || Boolean(beat.dbId && user.accessibleBeatIds.includes(beat.dbId)));
}

export function AdminUsersTable() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [beats, setBeats] = useState<Beat[]>([]);
  const [requests, setRequests] = useState<AccessRequestRow[]>([]);
  const [expandedUserId, setExpandedUserId] = useState("");
  const [error, setError] = useState("");
  const [emptyReason, setEmptyReason] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

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

      const [profilesResult, beatsResult, requestsResult] = await Promise.all([getProfilesResult(supabase), getBeats(), getAccessRequests()]);
      setUsers(profilesResult.users);
      setBeats(beatsResult.beats);
      setRequests(requestsResult);
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
  }, [pathname]);

  async function deleteUser(user: User) {
    const confirmed = window.confirm(`Eliminar usuario ${user.email}? Esta acción eliminará su cuenta y accesos.`);

    if (!confirmed) {
      return;
    }

    setMessage("Eliminando usuario...");
    const result = await deleteUserAsAdmin(user.id);
    setMessage(result.ok ? "Usuario eliminado." : result.message ?? "No se pudo eliminar el usuario.");

    if (result.ok) {
      setUsers((current) => current.filter((item) => item.id !== user.id));
      router.refresh();
    }
  }

  function getUserRequests(userId: string) {
    return requests.filter((request) => request.user_id === userId && isRecentAnsweredRequest(request));
  }

  return (
    <section className="overflow-hidden rounded-lg border border-white/10 bg-[#101317]">
      <div className="border-b border-white/10 p-4">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por email, username, display name o teléfono"
          className="h-11 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-cyan-300"
        />
      </div>
      {isLoading ? <p className="p-4 text-sm font-semibold text-cyan-200">Cargando profiles...</p> : null}
      {message ? <p className="m-4 rounded-md border border-white/10 bg-white/5 p-3 text-sm font-semibold text-cyan-200">{message}</p> : null}
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
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Cantidad</th>
              <th className="px-4 py-3">Beats autorizados</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.filter((user) => [user.email, user.username, user.name, user.phone ?? ""].some((value) => value.toLowerCase().includes(search.trim().toLowerCase()))).map((user) => {
              const authorizedBeats = getAuthorizedBeats(user, beats);
              return (
                <Fragment key={user.id}>
                  <tr className="border-t border-white/10">
                    <td className="px-4 py-3 font-semibold">
                      <button type="button" onClick={() => setExpandedUserId((current) => (current === user.id ? "" : user.id))} className="text-left hover:text-cyan-200">
                        {user.name}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-cyan-200">@{user.username}</td>
                    <td className="px-4 py-3 text-zinc-400">{user.email}</td>
                    <td className="px-4 py-3 text-zinc-400">{user.phone || "Sin teléfono"}</td>
                    <td className="px-4 py-3 text-zinc-400">{user.role === "admin" ? "Admin" : "Usuario"}</td>
                    <td className="px-4 py-3 text-zinc-400">{authorizedBeats.length}</td>
                    <td className="px-4 py-3 text-zinc-400">
                      <button type="button" onClick={() => setExpandedUserId((current) => (current === user.id ? "" : user.id))} className="text-left hover:text-cyan-200">
                        {authorizedBeats.map((beat) => beat.name).join(", ") || "Sin accesos"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" disabled={user.id === currentUser?.id} onClick={() => void deleteUser(user)} className="rounded-md border border-red-300/30 px-3 py-2 text-xs font-bold text-red-100 hover:bg-red-300/10 disabled:cursor-not-allowed disabled:opacity-40">
                        Eliminar usuario
                      </button>
                    </td>
                  </tr>
                  {expandedUserId === user.id ? (
                    <tr className="border-t border-cyan-300/20 bg-white/[0.03]">
                      <td colSpan={8} className="px-4 py-4">
                        <div className="grid gap-4 md:grid-cols-3">
                          <div>
                            <p className="text-xs uppercase text-zinc-500">Usuario</p>
                            <p className="mt-1 font-semibold">{user.name}</p>
                            <p className="text-sm text-cyan-200">@{user.username}</p>
                            <p className="mt-1 text-sm text-zinc-400">{user.email}</p>
                            <p className="mt-1 text-sm text-zinc-400">{user.phone || "Sin teléfono"}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase text-zinc-500">Beats con acceso</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {authorizedBeats.length ? authorizedBeats.map((beat) => <span key={beat.id} className="rounded-md border border-cyan-300/30 px-2 py-1 text-xs font-semibold text-cyan-200">{beat.name}</span>) : <span className="text-sm text-zinc-400">Sin accesos</span>}
                            </div>
                            <Link href="/admin/access" className="mt-3 inline-flex text-xs font-bold text-cyan-200 hover:text-cyan-100">Gestionar acceso</Link>
                          </div>
                          <div>
                            <p className="text-xs uppercase text-zinc-500">Solicitudes recientes</p>
                            <div className="mt-2 grid gap-2">
                              {getUserRequests(user.id).length ? getUserRequests(user.id).map((request) => <span key={request.id} className="text-sm text-zinc-300">{request.status} · {request.created_at ? new Date(request.created_at).toLocaleDateString("es-MX") : "Sin fecha"}</span>) : <span className="text-sm text-zinc-400">Sin solicitudes recientes</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 p-4 md:hidden">
        {users.filter((user) => [user.email, user.username, user.name, user.phone ?? ""].some((value) => value.toLowerCase().includes(search.trim().toLowerCase()))).map((user) => {
          const authorizedBeats = getAuthorizedBeats(user, beats);
          return (
            <article key={user.id} className="rounded-lg border border-white/10 bg-[#15181c] p-4">
              <button type="button" onClick={() => setExpandedUserId((current) => (current === user.id ? "" : user.id))} className="text-left font-semibold hover:text-cyan-200">{user.name}</button>
              <p className="mt-1 text-sm text-cyan-200">@{user.username}</p>
              <p className="mt-1 text-sm text-zinc-400">{user.email}</p>
              <p className="mt-1 text-sm text-zinc-400">{user.phone || "Sin teléfono"}</p>
              <p className="mt-1 text-sm text-zinc-400">Rol: {user.role === "admin" ? "Admin" : "Usuario"}</p>
              <p className="mt-3 text-sm text-zinc-300">Beats: {authorizedBeats.map((beat) => beat.name).join(", ") || "Sin accesos"}</p>
              <div className="mt-3 flex flex-wrap gap-3">
                <Link href="/admin/access" className="inline-flex text-sm font-bold text-cyan-200">Gestionar acceso</Link>
                <button type="button" disabled={user.id === currentUser?.id} onClick={() => void deleteUser(user)} className="text-sm font-bold text-red-100 disabled:cursor-not-allowed disabled:opacity-40">Eliminar usuario</button>
              </div>
              {expandedUserId === user.id ? (
                <div className="mt-4 grid gap-3 rounded-md border border-white/10 bg-white/5 p-3">
                  <div>
                    <p className="text-xs uppercase text-zinc-500">Beats con acceso</p>
                    <p className="mt-1 text-sm text-zinc-300">{authorizedBeats.map((beat) => beat.name).join(", ") || "Sin accesos"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-zinc-500">Solicitudes recientes</p>
                    <p className="mt-1 text-sm text-zinc-300">{getUserRequests(user.id).map((request) => request.status).join(", ") || "Sin solicitudes recientes"}</p>
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
