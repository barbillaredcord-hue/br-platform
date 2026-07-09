"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { Beat } from "@/data/beats";
import type { User } from "@/data/users";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getAccessRequests, getBeats, getProfilesResult, getUserAccessRevocations, type AccessRequestRow, type AccessRevocationRow } from "@/lib/supabase/queries";
import { AdminStatCard } from "./AdminStatCard";

type AdminDashboardStatsProps = {
  initialBeats: Beat[];
  initialUsers: User[];
  initialRequests: AccessRequestRow[];
};

function userHasBeatAccess(user: User, beat: Beat) {
  return user.accessibleBeatIds.includes(beat.id) || Boolean(beat.dbId && user.accessibleBeatIds.includes(beat.dbId));
}

function isOpenAccessRequest(request: AccessRequestRow) {
  return request.status === "pending" || request.status === "contacted" || request.status === "payment_pending" || request.status === "paid";
}

function revocationMatchesRequest(revocation: AccessRevocationRow, request: AccessRequestRow) {
  const beat = Array.isArray(revocation.beats) ? revocation.beats[0] : revocation.beats;

  return revocation.user_id === request.user_id && (revocation.beat_id === request.beat_id || beat?.slug === request.beat_id);
}

function requestHasRevocation(request: AccessRequestRow, revocations: AccessRevocationRow[]) {
  return revocations.some((revocation) => revocationMatchesRequest(revocation, request));
}

export function AdminDashboardStats({ initialBeats, initialUsers, initialRequests }: AdminDashboardStatsProps) {
  const pathname = usePathname();
  const [beats, setBeats] = useState(initialBeats);
  const [users, setUsers] = useState(initialUsers);
  const [requests, setRequests] = useState(initialRequests);
  const [revocations, setRevocations] = useState<AccessRevocationRow[]>([]);

  useEffect(() => {
    const loadId = window.setTimeout(() => {
      const supabase = createSupabaseBrowserClient();
      void Promise.all([getBeats(), getProfilesResult(supabase), getAccessRequests()]).then(async ([beatsResult, profilesResult, requestsResult]) => {
        setBeats(beatsResult.beats);
        if (profilesResult.users.length || !profilesResult.error) {
          setUsers(profilesResult.users);
        }
        setRequests(requestsResult);

        const userIds = Array.from(new Set(requestsResult.map((request) => request.user_id).filter(Boolean)));
        const revocationGroups = await Promise.all(userIds.map((userId) => getUserAccessRevocations(userId)));
        setRevocations(revocationGroups.flat());
      });
    }, 0);

    return () => window.clearTimeout(loadId);
  }, [pathname]);

  const stats = useMemo(() => {
    const activeRequests = requests.filter((request) => isOpenAccessRequest(request) && !requestHasRevocation(request, revocations));
    const pendingRequests = activeRequests;
    const paymentPendingRequests = activeRequests.filter((request) => request.status === "payment_pending");
    const completedRequests = requests.filter((request) => !requestHasRevocation(request, revocations) && (request.status === "fulfilled" || request.status === "approved"));
    const rejectedRequests = requests.filter((request) => requestHasRevocation(request, revocations) || request.status === "rejected" || request.status === "cancelled");
    const contactedRequests = activeRequests.filter((request) => request.status === "contacted" || request.message?.includes("[contactado]"));
    const accessCount = users.reduce((total, user) => total + beats.filter((beat) => userHasBeatAccess(user, beat)).length, 0);
    const usersWithAccess = users.filter((user) => beats.some((beat) => userHasBeatAccess(user, beat)));
    const newestBeat = beats[0];
    const beatsByAccess = beats
      .map((beat) => ({
        beat,
        accessCount: users.filter((user) => userHasBeatAccess(user, beat)).length,
      }))
      .sort((a, b) => b.accessCount - a.accessCount);
    const mostAccessedBeat = beatsByAccess[0]?.accessCount > 0 ? beatsByAccess[0] : null;

    return { pendingRequests, paymentPendingRequests, completedRequests, rejectedRequests, contactedRequests, accessCount, usersWithAccess, newestBeat, mostAccessedBeat };
  }, [beats, requests, revocations, users]);

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
      <AdminStatCard label="Total de beats" value={String(beats.length)} detail="Catálogo activo" href="/admin/beats" />
      <AdminStatCard label="Accesos activos" value={String(stats.accessCount)} detail={`${stats.usersWithAccess.length} usuarios con acceso`} href="/admin/access" />
      <AdminStatCard label="Usuarios" value={String(users.length)} detail="Profiles reales" href="/admin/users" />
      <AdminStatCard label="Solicitudes activas" value={String(stats.pendingRequests.length)} detail={`${stats.contactedRequests.length} contactadas`} href="/admin/access-requests" />
      <AdminStatCard label="Pago pendiente" value={String(stats.paymentPendingRequests.length)} detail="Órdenes por cobrar" href="/admin/access-requests" />
      <AdminStatCard label="Órdenes completadas" value={String(stats.completedRequests.length)} detail="Pagadas o liberadas" href="/admin/access-requests" />
      <AdminStatCard label="Rechazadas/canceladas" value={String(stats.rejectedRequests.length)} detail="Historial comercial" href="/admin/access-requests" />
      <AdminStatCard label="Beat más nuevo" value={stats.newestBeat?.name ?? "Sin beats"} detail={stats.newestBeat ? `${stats.newestBeat.genre} · ${stats.newestBeat.bpm} BPM` : "Pendiente"} href={stats.newestBeat ? `/beats/${stats.newestBeat.id}` : undefined} />
      <AdminStatCard label="Beat con más acceso" value={stats.mostAccessedBeat?.beat.name ?? "Sin accesos"} detail={stats.mostAccessedBeat ? `${stats.mostAccessedBeat.accessCount} usuarios · ${stats.mostAccessedBeat.beat.genre}` : "Pendiente de datos reales"} href={stats.mostAccessedBeat ? `/beats/${stats.mostAccessedBeat.beat.id}` : undefined} />
    </section>
  );
}
