"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { Beat } from "@/data/beats";
import type { User } from "@/data/users";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getAccessRequests, getBeats, getProfilesResult, type AccessRequestRow } from "@/lib/supabase/queries";
import { AdminStatCard } from "./AdminStatCard";

type AdminDashboardStatsProps = {
  initialBeats: Beat[];
  initialUsers: User[];
  initialRequests: AccessRequestRow[];
};

function userHasBeatAccess(user: User, beat: Beat) {
  return user.accessibleBeatIds.includes(beat.id) || Boolean(beat.dbId && user.accessibleBeatIds.includes(beat.dbId));
}

export function AdminDashboardStats({ initialBeats, initialUsers, initialRequests }: AdminDashboardStatsProps) {
  const pathname = usePathname();
  const [beats, setBeats] = useState(initialBeats);
  const [users, setUsers] = useState(initialUsers);
  const [requests, setRequests] = useState(initialRequests);

  useEffect(() => {
    const loadId = window.setTimeout(() => {
      const supabase = createSupabaseBrowserClient();
      void Promise.all([getBeats(), getProfilesResult(supabase), getAccessRequests()]).then(([beatsResult, profilesResult, requestsResult]) => {
        setBeats(beatsResult.beats);
        if (profilesResult.users.length || !profilesResult.error) {
          setUsers(profilesResult.users);
        }
        setRequests(requestsResult);
      });
    }, 0);

    return () => window.clearTimeout(loadId);
  }, [pathname]);

  const stats = useMemo(() => {
    const pendingRequests = requests.filter((request) => request.status === "pending");
    const paymentPendingRequests = requests.filter((request) => request.status === "payment_pending");
    const completedRequests = requests.filter((request) => request.status === "paid" || request.status === "fulfilled" || request.status === "approved");
    const rejectedRequests = requests.filter((request) => request.status === "rejected" || request.status === "cancelled");
    const contactedRequests = requests.filter((request) => request.status === "contacted" || request.message?.includes("[contactado]"));
    const accessCount = users.reduce((total, user) => total + beats.filter((beat) => userHasBeatAccess(user, beat)).length, 0);
    const usersWithAccess = users.filter((user) => beats.some((beat) => userHasBeatAccess(user, beat)));
    const mostPlayedBeat = beats[0];

    return { pendingRequests, paymentPendingRequests, completedRequests, rejectedRequests, contactedRequests, accessCount, usersWithAccess, mostPlayedBeat };
  }, [beats, requests, users]);

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
      <AdminStatCard label="Total de beats" value={String(beats.length)} detail="Catálogo activo" href="/admin/beats" />
      <AdminStatCard label="Accesos activos" value={String(stats.accessCount)} detail={`${stats.usersWithAccess.length} usuarios con acceso`} href="/admin/access" />
      <AdminStatCard label="Usuarios" value={String(users.length)} detail="Profiles reales" href="/admin/users" />
      <AdminStatCard label="Solicitudes pendientes" value={String(stats.pendingRequests.length)} detail={`${stats.contactedRequests.length} contactadas`} href="/admin/access-requests" />
      <AdminStatCard label="Pago pendiente" value={String(stats.paymentPendingRequests.length)} detail="Órdenes por cobrar" href="/admin/access-requests" />
      <AdminStatCard label="Órdenes completadas" value={String(stats.completedRequests.length)} detail="Pagadas o liberadas" href="/admin/access-requests" />
      <AdminStatCard label="Rechazadas/canceladas" value={String(stats.rejectedRequests.length)} detail="Historial comercial" href="/admin/access-requests" />
      <AdminStatCard label="Beat destacado" value={stats.mostPlayedBeat?.name ?? "Sin beats"} detail={stats.mostPlayedBeat ? `${stats.mostPlayedBeat.genre} · ${stats.mostPlayedBeat.bpm} BPM` : "Pendiente"} href={stats.mostPlayedBeat ? `/beats/${stats.mostPlayedBeat.id}` : undefined} />
    </section>
  );
}
