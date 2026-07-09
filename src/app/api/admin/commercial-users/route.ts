import { validateAdminRequest } from "@/lib/supabase/admin";

type ProfileRow = {
  id: string;
  email: string | null;
  username: string | null;
  display_name: string | null;
};

type BeatAccessRow = {
  user_id: string | null;
  beat_id: string | null;
};

type ManualPaymentRow = {
  user_id: string | null;
  beat_id: string | null;
  amount: number | string | null;
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

export async function GET(request: Request) {
  const admin = await validateAdminRequest(request);

  if (!admin.ok) {
    return admin.response;
  }

  const [profilesResult, accessResult, paymentsResult, activityResult] = await Promise.all([
    admin.supabase.from("profiles").select("id,email,username,display_name").order("created_at", { ascending: false }),
    admin.supabase.from("beat_access").select("user_id,beat_id"),
    admin.supabase.from("manual_payments").select("user_id,beat_id,amount,created_at"),
    admin.supabase.from("commercial_activity").select("user_id,event_type,beat_id,beat_title,beat_slug,created_at").in("event_type", ["mp3_download", "license_download"]),
  ]);

  if (profilesResult.error) {
    console.error("B.R commercial users profiles error", profilesResult.error);
    return Response.json({ ok: false, message: "No se pudieron cargar los usuarios." }, { status: 500 });
  }

  if (accessResult.error) {
    console.error("B.R commercial users access error", accessResult.error);
    return Response.json({ ok: false, message: "No se pudieron cargar los accesos." }, { status: 500 });
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
  const accessRows = (accessResult.data ?? []) as BeatAccessRow[];
  const paymentRows = (paymentsResult.data ?? []) as ManualPaymentRow[];
  const activityRows = (activityResult.data ?? []) as ActivityRow[];

  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));
  const accessByUser = new Map<string, Set<string>>();
  const paidByUser = new Map<string, Set<string>>();
  const totalsByUser = new Map<string, number>();
  const downloadCountsByUser = new Map<string, DownloadCounts>();
  const downloadCountsByBeat = new Map<string, { beat_id: string; beat_title: string | null; beat_slug: string | null; mp3: number; licenses: number }>();
  const downloadUsersByBeat = new Map<string, { mp3_users: Map<string, BeatActivityUser>; license_users: Map<string, BeatActivityUser> }>();
  const relevantUserIds = new Set<string>();
  const currentMonthKey = getCurrentMonthKey();
  let earningsTotal = 0;
  let earningsCurrentMonth = 0;
  const earningsByMonth = new Map<string, number>();

  accessRows.forEach((row) => {
    if (!row.user_id || !row.beat_id) {
      return;
    }

    relevantUserIds.add(row.user_id);

    const beatIds = accessByUser.get(row.user_id) ?? new Set<string>();
    beatIds.add(row.beat_id);
    accessByUser.set(row.user_id, beatIds);
  });

  paymentRows.forEach((row) => {
    if (!row.user_id || !row.beat_id) {
      return;
    }

    relevantUserIds.add(row.user_id);

    const beatIds = paidByUser.get(row.user_id) ?? new Set<string>();
    beatIds.add(row.beat_id);
    paidByUser.set(row.user_id, beatIds);

    const amount = Number(row.amount);

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
      const accessBeatIds = accessByUser.get(userId) ?? new Set<string>();
      const paidBeatIds = paidByUser.get(userId) ?? new Set<string>();
      const downloads = getDownloadCounts(downloadCountsByUser.get(userId));
      const pendingPaymentBeats = Array.from(accessBeatIds).filter((beatId) => !paidBeatIds.has(beatId)).length;

      return {
        id: userId,
        email: profile?.email ?? "Sin email",
        username: profile?.username ?? null,
        display_name: profile?.display_name ?? null,
        total_access_beats: accessBeatIds.size,
        total_paid_beats: paidBeatIds.size,
        pending_payment_beats: pendingPaymentBeats,
        mp3_download_count: downloads.mp3,
        license_download_count: downloads.licenses,
        total_paid_amount: totalsByUser.get(userId) ?? 0,
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

  const topDownloadedBeats = Array.from(downloadCountsByBeat.values())
    .map((beat) => {
      const beatUsers = downloadUsersByBeat.get(beat.beat_id);

      return {
        ...beat,
        total_downloads: beat.mp3 + beat.licenses,
        mp3_users: Array.from(beatUsers?.mp3_users.values() ?? []).sort((a, b) => b.count - a.count || a.email.localeCompare(b.email)),
        license_users: Array.from(beatUsers?.license_users.values() ?? []).sort((a, b) => b.count - a.count || a.email.localeCompare(b.email)),
      };
    })
    .filter((beat) => beat.total_downloads > 0)
    .sort((a, b) => b.total_downloads - a.total_downloads || (a.beat_title || a.beat_slug || a.beat_id).localeCompare(b.beat_title || b.beat_slug || b.beat_id))
    .slice(0, 5);

  const earningsHistory = Array.from(earningsByMonth.entries())
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => b.month.localeCompare(a.month));

  return Response.json({
    ok: true,
    users,
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
