"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { Beat } from "@/data/beats";
import type { User } from "@/data/users";
import { summarizeAccessRequests } from "@/lib/access-request-admin";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getAccessRequests, getBeats, getManualPayments, getProfilesResult, type AccessRequestRow, type ManualPaymentRow } from "@/lib/supabase/queries";
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
  const [payments, setPayments] = useState<ManualPaymentRow[]>([]);

  const refreshStats = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const [beatsResult, profilesResult, requestsResult, paymentsResult] = await Promise.all([
      getBeats(),
      getProfilesResult(supabase),
      getAccessRequests(),
      getManualPayments(),
    ]);

    setBeats(beatsResult.beats);

    if (profilesResult.users.length || !profilesResult.error) {
      setUsers(profilesResult.users);
    }

    setRequests(requestsResult);
    setPayments(paymentsResult);
  }, []);

  useEffect(() => {
    const loadId = window.setTimeout(() => {
      void refreshStats();
    }, 0);

    const handleAccessStateChanged = () => {
      void refreshStats();
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
  }, [pathname, refreshStats]);

  const stats = useMemo(() => {
    const paidPairKeys = new Set(payments.filter((payment) => payment.user_id && payment.beat_id).map((payment) => `${payment.user_id}:${payment.beat_id}`));
    const requestSummary = summarizeAccessRequests(requests, paidPairKeys);
    const activeRequests = requestSummary.active;
    const pendingRequests = activeRequests;
    const paymentPendingRequests = requestSummary.paymentPending;
    const confirmedPaymentCount = paidPairKeys.size;
    const rejectedRequests = requestSummary.rejected;
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

    return { pendingRequests, paymentPendingRequests, confirmedPaymentCount, rejectedRequests, contactedRequests, accessCount, usersWithAccess, newestBeat, mostAccessedBeat };
  }, [beats, payments, requests, users]);

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
      <AdminStatCard label="Total de beats" value={String(beats.length)} detail="Catálogo activo" href="/admin/beats" />
      <AdminStatCard label="Accesos activos" value={String(stats.accessCount)} detail={`${stats.usersWithAccess.length} usuarios con acceso`} href="/admin/access" />
      <AdminStatCard label="Usuarios" value={String(users.length)} detail="Profiles reales" href="/admin/users" />
      <AdminStatCard label="Solicitudes activas" value={String(stats.pendingRequests.length)} detail={`${stats.contactedRequests.length} contactadas · sincronizado`} href="/admin/access-requests" />
      <AdminStatCard label="Pago pendiente" value={String(stats.paymentPendingRequests.length)} detail="Solicitudes por cobrar" href="/admin/access-requests" />
      <AdminStatCard label="Pagos confirmados" value={String(stats.confirmedPaymentCount)} detail="Registros manuales confirmados" href="/admin/access-requests" />
      <AdminStatCard label="Rechazadas/canceladas" value={String(stats.rejectedRequests.length)} detail="Historial comercial" href="/admin/access-requests" />
      <AdminStatCard label="Beat más nuevo" value={stats.newestBeat?.name ?? "Sin beats"} detail={stats.newestBeat ? `${stats.newestBeat.genre} · ${stats.newestBeat.bpm} BPM` : "Pendiente"} href={stats.newestBeat ? `/beats/${stats.newestBeat.id}` : undefined} />
      <AdminStatCard label="Beat con más acceso" value={stats.mostAccessedBeat?.beat.name ?? "Sin accesos"} detail={stats.mostAccessedBeat ? `${stats.mostAccessedBeat.accessCount} usuarios · ${stats.mostAccessedBeat.beat.genre}` : "Pendiente de datos reales"} href={stats.mostAccessedBeat ? `/beats/${stats.mostAccessedBeat.beat.id}` : undefined} />
    </section>
  );
}
