import { validateAdminRequest } from "@/lib/supabase/admin";
import {
  buildCommercialRankings,
  buildCommercialTrends,
  buildConversionSummary,
  buildRevenueSummary,
} from "@/lib/commercial";

type ProfileRow = {
  id: string;
  email: string | null;
  username: string | null;
  display_name: string | null;
};

type BeatRow = {
  id: string;
  title: string | null;
  slug: string | null;
  genre: string | null;
  bpm: number | null;
};

type BeatAccessRow = {
  user_id: string | null;
  beat_id: string | null;
  granted_at: string | null;
};

type CommercialAccessBeat = {
  beat_id: string;
  beat_title: string | null;
  beat_slug: string | null;
  genre: string | null;
  bpm: number | null;
  granted_at: string | null;
};

type RevocationRow = {
  id: string;
  user_id: string | null;
  beat_id: string | null;
  reason: string | null;
  revoked_at: string | null;
  created_at: string | null;
};

type ManualPaymentRow = {
  id: string;
  user_id: string | null;
  beat_id: string | null;
  beat_title: string | null;
  amount: number | string | null;
  currency: string | null;
  payment_method: string | null;
  note: string | null;
  created_at: string | null;
};

type CommercialPayment = {
  id: string;
  beat_id: string;
  beat_title: string;
  beat_slug: string | null;
  amount: number;
  currency: string;
  payment_method: string | null;
  note: string | null;
  created_at: string | null;
};

type ActivityRow = {
  user_id: string | null;
  event_type: string | null;
  beat_id: string | null;
  beat_title: string | null;
  beat_slug: string | null;
  created_at: string | null;
};

type BeatActivityUser = {
  user_id: string;
  email: string;
  username: string | null;
  display_name: string | null;
  last_activity_at: string | null;
  count: number;
};

type BeatAccessUser = {
  user_id: string;
  email: string;
  username: string | null;
  display_name: string | null;
};

type BeatRevokedUser = BeatAccessUser & {
  revocation_id: string;
  reason: string | null;
  revoked_at: string | null;
};

type DownloadCounts = {
  mp3: number;
  licenses: number;
};

function getDownloadCounts(current?: DownloadCounts): DownloadCounts {
  return current ?? { mp3: 0, licenses: 0 };
}

function getMonthKey(value: string | null) {
  if (!value) {
    return "unknown";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "unknown";
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function profileUser(input: { userId: string; profilesById: Map<string, ProfileRow> }): BeatAccessUser {
  const profile = input.profilesById.get(input.userId);

  return {
    user_id: input.userId,
    email: profile?.email ?? "Sin email",
    username: profile?.username ?? null,
    display_name: profile?.display_name ?? null,
  };
}

export async function GET(request: Request) {
  const admin = await validateAdminRequest(request);

  if (!admin.ok) {
    return admin.response;
  }

  const [profilesResult, beatsResult, accessResult, revocationsResult, paymentsResult, activityResult] = await Promise.all([
    admin.supabase.from("profiles").select("id,email,username,display_name").order("created_at", { ascending: false }),
    admin.supabase.from("beats").select("id,title,slug,genre,bpm"),
    admin.supabase.from("beat_access").select("user_id,beat_id,granted_at"),
    admin.supabase.from("access_revocations").select("id,user_id,beat_id,reason,revoked_at,created_at"),
    admin.supabase.from("manual_payments").select("id,user_id,beat_id,beat_title,amount,currency,payment_method,note,created_at"),
    admin.supabase.from("commercial_activity").select("user_id,event_type,beat_id,beat_title,beat_slug,created_at").in("event_type", ["mp3_download", "license_download"]),
  ]);

  if (profilesResult.error) {
    console.error("B.R commercial users profiles error", profilesResult.error);
    return Response.json({ ok: false, message: "No se pudieron cargar los usuarios." }, { status: 500 });
  }

  if (beatsResult.error) {
    console.error("B.R commercial users beats error", beatsResult.error);
    return Response.json({ ok: false, message: "No se pudieron cargar los beats." }, { status: 500 });
  }

  if (accessResult.error) {
    console.error("B.R commercial users access error", accessResult.error);
    return Response.json({ ok: false, message: "No se pudieron cargar los accesos." }, { status: 500 });
  }

  if (revocationsResult.error) {
    console.error("B.R commercial users revocations error", revocationsResult.error);
    return Response.json({ ok: false, message: "No se pudieron cargar las revocaciones." }, { status: 500 });
  }

  if (paymentsResult.error) {
    console.error("B.R commercial users payments error", paymentsResult.error);
    return Response.json({ ok: false, message: "No se pudieron cargar los pagos." }, { status: 500 });
  }

  if (activityResult.error) {
    console.error("B.R commercial users activity error", activityResult.error);
    return Response.json({ ok: false, message: "No se pudo cargar la actividad." }, { status: 500 });
  }

  const profiles = (profilesResult.data ?? []) as ProfileRow[];
  const beats = (beatsResult.data ?? []) as BeatRow[];
  const accessRows = (accessResult.data ?? []) as BeatAccessRow[];
  const revocationRows = (revocationsResult.data ?? []) as RevocationRow[];
  const paymentRows = (paymentsResult.data ?? []) as ManualPaymentRow[];
  const activityRows = (activityResult.data ?? []) as ActivityRow[];

  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));
  const beatsById = new Map(beats.map((beat) => [beat.id, beat]));
  const activeAccessesByUser = new Map<string, CommercialAccessBeat[]>();
  const activeAccessUsersByBeat = new Map<string, Map<string, BeatAccessUser>>();
  const revokedUsersByBeat = new Map<string, Map<string, BeatRevokedUser>>();
  const paidByUser = new Map<string, Set<string>>();
  const totalsByUser = new Map<string, number>();
  const paymentsByUser = new Map<string, CommercialPayment[]>();
  const downloadCountsByUser = new Map<string, DownloadCounts>();
  const downloadCountsByBeat = new Map<string, { beat_id: string; beat_title: string | null; beat_slug: string | null; mp3: number; licenses: number }>();
  const downloadUsersByBeat = new Map<string, { mp3_users: Map<string, BeatActivityUser>; license_users: Map<string, BeatActivityUser> }>();
  const relevantUserIds = new Set<string>();
  const currentMonthKey = getCurrentMonthKey();
  let earningsTotal = 0;
  let earningsCurrentMonth = 0;
  const earningsByMonth = new Map<string, number>();

  revocationRows.forEach((row) => {
    if (!row.user_id || !row.beat_id) {
      return;
    }

    relevantUserIds.add(row.user_id);

    const beatUsers = revokedUsersByBeat.get(row.beat_id) ?? new Map<string, BeatRevokedUser>();
    const baseUser = profileUser({ userId: row.user_id, profilesById });

    beatUsers.set(row.user_id, {
      ...baseUser,
      revocation_id: row.id,
      reason: row.reason,
      revoked_at: row.revoked_at ?? row.created_at,
    });

    revokedUsersByBeat.set(row.beat_id, beatUsers);
  });

  accessRows.forEach((row) => {
    if (!row.user_id || !row.beat_id) {
      return;
    }

    relevantUserIds.add(row.user_id);

    const beat = beatsById.get(row.beat_id);
    const activeAccesses = activeAccessesByUser.get(row.user_id) ?? [];
    activeAccesses.push({
      beat_id: row.beat_id,
      beat_title: beat?.title ?? null,
      beat_slug: beat?.slug ?? null,
      genre: beat?.genre ?? null,
      bpm: beat?.bpm ?? null,
      granted_at: row.granted_at,
    });
    activeAccessesByUser.set(row.user_id, activeAccesses);

    const beatUsers = activeAccessUsersByBeat.get(row.beat_id) ?? new Map<string, BeatAccessUser>();
    beatUsers.set(row.user_id, profileUser({ userId: row.user_id, profilesById }));
    activeAccessUsersByBeat.set(row.beat_id, beatUsers);
  });

  paymentRows.forEach((row) => {
    if (!row.user_id || !row.beat_id) {
      return;
    }

    relevantUserIds.add(row.user_id);

    const beat = beatsById.get(row.beat_id);
    const normalizedAmount = Number(row.amount);
    const userPayments = paymentsByUser.get(row.user_id) ?? [];

    userPayments.push({
      id: row.id,
      beat_id: row.beat_id,
      beat_title: row.beat_title || beat?.title || beat?.slug || row.beat_id,
      beat_slug: beat?.slug ?? null,
      amount: Number.isFinite(normalizedAmount) ? normalizedAmount : 0,
      currency: row.currency || "MXN",
      payment_method: row.payment_method,
      note: row.note,
      created_at: row.created_at,
    });

    paymentsByUser.set(row.user_id, userPayments);

    const beatIds = paidByUser.get(row.user_id) ?? new Set<string>();
    beatIds.add(row.beat_id);
    paidByUser.set(row.user_id, beatIds);

    const amount = normalizedAmount;

    if (Number.isFinite(amount)) {
      totalsByUser.set(row.user_id, (totalsByUser.get(row.user_id) ?? 0) + amount);
      earningsTotal += amount;

      const monthKey = getMonthKey(row.created_at);
      earningsByMonth.set(monthKey, (earningsByMonth.get(monthKey) ?? 0) + amount);

      if (monthKey === currentMonthKey) {
        earningsCurrentMonth += amount;
      }
    }
  });

  function addBeatActivityUser(input: { beatId: string; userId: string; eventType: "mp3_download" | "license_download"; createdAt: string | null }) {
    const beatUsers = downloadUsersByBeat.get(input.beatId) ?? {
      mp3_users: new Map<string, BeatActivityUser>(),
      license_users: new Map<string, BeatActivityUser>(),
    };
    const targetMap = input.eventType === "mp3_download" ? beatUsers.mp3_users : beatUsers.license_users;
    const profile = profilesById.get(input.userId);
    const existingUser = targetMap.get(input.userId);
    const existingDate = existingUser?.last_activity_at ? new Date(existingUser.last_activity_at).getTime() : 0;
    const nextDate = input.createdAt ? new Date(input.createdAt).getTime() : 0;

    targetMap.set(input.userId, {
      user_id: input.userId,
      email: profile?.email ?? "Sin email",
      username: profile?.username ?? null,
      display_name: profile?.display_name ?? null,
      last_activity_at: nextDate > existingDate ? input.createdAt : existingUser?.last_activity_at ?? input.createdAt,
      count: (existingUser?.count ?? 0) + 1,
    });

    downloadUsersByBeat.set(input.beatId, beatUsers);
  }

  activityRows.forEach((row) => {
    if (!row.user_id) {
      return;
    }

    relevantUserIds.add(row.user_id);

    const counts = getDownloadCounts(downloadCountsByUser.get(row.user_id));

    if (row.event_type === "mp3_download") {
      counts.mp3 += 1;
    }

    if (row.event_type === "license_download") {
      counts.licenses += 1;
    }

    downloadCountsByUser.set(row.user_id, counts);

    if (row.beat_id) {
      const beatCounts = downloadCountsByBeat.get(row.beat_id) ?? {
        beat_id: row.beat_id,
        beat_title: row.beat_title,
        beat_slug: row.beat_slug,
        mp3: 0,
        licenses: 0,
      };

      if (row.event_type === "mp3_download") {
        beatCounts.mp3 += 1;
      }

      if (row.event_type === "license_download") {
        beatCounts.licenses += 1;
      }

      if ((row.event_type === "mp3_download" || row.event_type === "license_download") && row.user_id) {
        addBeatActivityUser({ beatId: row.beat_id, userId: row.user_id, eventType: row.event_type, createdAt: row.created_at });
      }

      downloadCountsByBeat.set(row.beat_id, beatCounts);
    }
  });

  const users = Array.from(relevantUserIds)
    .map((userId) => {
      const profile = profilesById.get(userId);
      const activeAccesses = (activeAccessesByUser.get(userId) ?? []).sort(
        (firstAccess, secondAccess) => {
          const firstDate = firstAccess.granted_at
            ? new Date(firstAccess.granted_at).getTime()
            : 0;
          const secondDate = secondAccess.granted_at
            ? new Date(secondAccess.granted_at).getTime()
            : 0;
          return secondDate - firstDate;
        },
      );
      const accessBeatIds = new Set(
        activeAccesses.map((access) => access.beat_id),
      );
      const paidBeatIds = paidByUser.get(userId) ?? new Set<string>();
      const downloads = getDownloadCounts(downloadCountsByUser.get(userId));
      const pendingPaymentBeats = Array.from(accessBeatIds).filter((beatId) => !paidBeatIds.has(beatId)).length;
      const activeAccessesByBeatId = new Map(
        activeAccesses.map((access) => [access.beat_id, access]),
      );
      const revocations = revocationRows
        .filter((revocation) => revocation.user_id === userId && revocation.beat_id)
        .map((revocation) => {
          const beat = beatsById.get(revocation.beat_id as string);
          const restoredAccess = activeAccessesByBeatId.get(
            revocation.beat_id as string,
          );

          return {
            id: revocation.id,
            beat_id: revocation.beat_id as string,
            beat_title: beat?.title ?? null,
            beat_slug: beat?.slug ?? null,
            revoked_at: revocation.revoked_at ?? revocation.created_at,
            reason: revocation.reason,
            restored_at: restoredAccess?.granted_at ?? null,
            status: restoredAccess ? ("restored" as const) : ("revoked" as const),
          };
        })
        .sort((firstRevocation, secondRevocation) => {
          const firstDate = firstRevocation.revoked_at
            ? new Date(firstRevocation.revoked_at).getTime()
            : 0;
          const secondDate = secondRevocation.revoked_at
            ? new Date(secondRevocation.revoked_at).getTime()
            : 0;
          return secondDate - firstDate;
        });

      return {
        id: userId,
        email: profile?.email ?? "Sin email",
        username: profile?.username ?? null,
        display_name: profile?.display_name ?? null,
        total_access_beats: activeAccesses.length,
        total_paid_beats: paidBeatIds.size,
        pending_payment_beats: pendingPaymentBeats,
        mp3_download_count: downloads.mp3,
        license_download_count: downloads.licenses,
        total_paid_amount: totalsByUser.get(userId) ?? 0,
        active_accesses: activeAccesses,
        revocations,
        payments: (paymentsByUser.get(userId) ?? []).sort((firstPayment, secondPayment) => {
          const firstDate = firstPayment.created_at ? new Date(firstPayment.created_at).getTime() : 0;
          const secondDate = secondPayment.created_at ? new Date(secondPayment.created_at).getTime() : 0;
          return secondDate - firstDate;
        }),
      };
    })
    .sort((a, b) => {
      if (b.pending_payment_beats !== a.pending_payment_beats) {
        return b.pending_payment_beats - a.pending_payment_beats;
      }

      if (b.total_access_beats !== a.total_access_beats) {
        return b.total_access_beats - a.total_access_beats;
      }

      return a.email.localeCompare(b.email);
    });

  const topActiveUsers = users
    .map((user) => ({
      id: user.id,
      email: user.email,
      username: user.username,
      display_name: user.display_name,
      activity_count: user.mp3_download_count + user.license_download_count + user.total_paid_beats,
      mp3_download_count: user.mp3_download_count,
      license_download_count: user.license_download_count,
      total_paid_beats: user.total_paid_beats,
      total_paid_amount: user.total_paid_amount,
    }))
    .filter((user) => user.activity_count > 0)
    .sort((a, b) => b.activity_count - a.activity_count || b.total_paid_amount - a.total_paid_amount || a.email.localeCompare(b.email))
    .slice(0, 5);

  const commercialBeatIds = new Set<string>([
    ...downloadCountsByBeat.keys(),
    ...activeAccessUsersByBeat.keys(),
    ...revokedUsersByBeat.keys(),
  ]);

  const topDownloadedBeats = Array.from(commercialBeatIds)
    .map((beatId) => {
      const beat = beatsById.get(beatId);
      const downloads = downloadCountsByBeat.get(beatId) ?? {
        beat_id: beatId,
        beat_title: beat?.title ?? null,
        beat_slug: beat?.slug ?? null,
        mp3: 0,
        licenses: 0,
      };
      const beatUsers = downloadUsersByBeat.get(beatId);
      const activeUsers = activeAccessUsersByBeat.get(beatId) ?? new Map<string, BeatAccessUser>();
      const revokedUsers = Array.from(revokedUsersByBeat.get(beatId)?.values() ?? [])
        .filter((user) => !activeUsers.has(user.user_id))
        .sort((a, b) => a.email.localeCompare(b.email));

      return {
        ...downloads,
        beat_title: downloads.beat_title ?? beat?.title ?? null,
        beat_slug: downloads.beat_slug ?? beat?.slug ?? null,
        total_downloads: downloads.mp3 + downloads.licenses,
        active_access_users: Array.from(activeUsers.values()).sort((a, b) => a.email.localeCompare(b.email)),
        revoked_users: revokedUsers,
        mp3_users: Array.from(beatUsers?.mp3_users.values() ?? []).sort((a, b) => b.count - a.count || a.email.localeCompare(b.email)),
        license_users: Array.from(beatUsers?.license_users.values() ?? []).sort((a, b) => b.count - a.count || a.email.localeCompare(b.email)),
      };
    })
    .filter((beat) => beat.total_downloads > 0 || beat.active_access_users.length > 0 || beat.revoked_users.length > 0)
    .sort((a, b) => {
      if (b.total_downloads !== a.total_downloads) {
        return b.total_downloads - a.total_downloads;
      }

      if (b.active_access_users.length !== a.active_access_users.length) {
        return b.active_access_users.length - a.active_access_users.length;
      }

      return (a.beat_title || a.beat_slug || a.beat_id).localeCompare(b.beat_title || b.beat_slug || b.beat_id);
    })
    .slice(0, 5);

  const earningsHistory = Array.from(earningsByMonth.entries())
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => b.month.localeCompare(a.month));

  const analytics = {
    revenue: buildRevenueSummary(
      paymentRows.map((payment) => ({
        amount: Number(payment.amount ?? 0),
        created_at: payment.created_at,
      })),
    ),
    conversion: buildConversionSummary(users),
    rankings: buildCommercialRankings(profiles, paymentRows, beats),
    trends: buildCommercialTrends(paymentRows),
  };

  return Response.json({
    ok: true,
    users,
    analytics,
    earnings: {
      total: earningsTotal,
      current_month: earningsCurrentMonth,
      current_month_key: currentMonthKey,
      history: earningsHistory,
    },
    summary: {
      top_active_users: topActiveUsers,
      top_downloaded_beats: topDownloadedBeats,
      total_mp3_downloads: activityRows.filter((row) => row.event_type === "mp3_download").length,
      total_license_downloads: activityRows.filter((row) => row.event_type === "license_download").length,
      total_manual_payments: paymentRows.length,
    },
  });
}
