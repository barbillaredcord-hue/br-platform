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
};

type ActivityRow = {
  user_id: string | null;
  event_type: string | null;
};

type DownloadCounts = {
  mp3: number;
  licenses: number;
};

function getDownloadCounts(current?: DownloadCounts): DownloadCounts {
  return current ?? { mp3: 0, licenses: 0 };
}

export async function GET(request: Request) {
  const admin = await validateAdminRequest(request);

  if (!admin.ok) {
    return admin.response;
  }

  const [profilesResult, accessResult, paymentsResult, activityResult] = await Promise.all([
    admin.supabase.from("profiles").select("id,email,username,display_name").order("created_at", { ascending: false }),
    admin.supabase.from("beat_access").select("user_id,beat_id"),
    admin.supabase.from("manual_payments").select("user_id,beat_id,amount"),
    admin.supabase.from("commercial_activity").select("user_id,event_type").in("event_type", ["mp3_download", "license_download"]),
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
  const relevantUserIds = new Set<string>();

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
    }
  });

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

  return Response.json({ ok: true, users });
}
