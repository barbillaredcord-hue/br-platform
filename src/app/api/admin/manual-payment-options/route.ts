import { validateAdminRequest } from "@/lib/supabase/admin";

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
  beat_id: string | null;
  beats?: BeatRow | BeatRow[] | null;
};

type ManualPaymentRow = {
  beat_id: string | null;
};

type RevocationRow = {
  beat_id: string | null;
  reason: string | null;
  revoked_at: string | null;
  created_at: string | null;
  beats?: BeatRow | BeatRow[] | null;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function first<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export async function GET(request: Request) {
  const admin = await validateAdminRequest(request);

  if (!admin.ok) {
    return admin.response;
  }

  const url = new URL(request.url);
  const userId = (url.searchParams.get("userId") ?? "").trim();

  if (!uuidPattern.test(userId)) {
    return Response.json({ ok: false, message: "Usuario inválido." }, { status: 400 });
  }

  const [profileResult, accessResult, paymentsResult, revocationsResult] = await Promise.all([
    admin.supabase.from("profiles").select("id,email,username,display_name").eq("id", userId).maybeSingle<ProfileRow>(),
    admin.supabase
      .from("beat_access")
      .select("beat_id,beats(id,title,slug,genre,bpm)")
      .eq("user_id", userId),
    admin.supabase.from("manual_payments").select("beat_id").eq("user_id", userId),
    admin.supabase
      .from("access_revocations")
      .select("beat_id,reason,revoked_at,created_at,beats(id,title,slug,genre,bpm)")
      .eq("user_id", userId)
      .order("revoked_at", { ascending: false }),
  ]);

  if (profileResult.error) {
    console.error("B.R manual payment options profile error", profileResult.error);
    return Response.json({ ok: false, message: "No se pudo validar el usuario." }, { status: 500 });
  }

  if (!profileResult.data) {
    return Response.json({ ok: false, message: "Usuario no encontrado." }, { status: 404 });
  }

  if (accessResult.error) {
    console.error("B.R manual payment options access error", accessResult.error);
    return Response.json({ ok: false, message: "No se pudieron cargar los beats con acceso." }, { status: 500 });
  }

  if (paymentsResult.error) {
    console.error("B.R manual payment options payments error", paymentsResult.error);
    return Response.json({ ok: false, message: "No se pudieron cargar los pagos existentes." }, { status: 500 });
  }

  if (revocationsResult.error) {
    console.error("B.R manual payment options revocations error", revocationsResult.error);
    return Response.json({ ok: false, message: "No se pudieron validar las revocaciones existentes." }, { status: 500 });
  }

  const accessRows = (accessResult.data ?? []) as BeatAccessRow[];
  const paymentRows = (paymentsResult.data ?? []) as ManualPaymentRow[];
  const revocationRows = (revocationsResult.data ?? []) as RevocationRow[];
  const paidBeatIds = new Set(paymentRows.map((row) => row.beat_id).filter((beatId): beatId is string => Boolean(beatId)));
  const revokedBeatIds = new Set(revocationRows.map((row) => row.beat_id).filter((beatId): beatId is string => Boolean(beatId)));
  const activeBeatIds = new Set(accessRows.map((row) => row.beat_id).filter((beatId): beatId is string => Boolean(beatId)));
  const activeBeatsById = new Map<string, BeatRow>();

  accessRows.forEach((row) => {
    const beat = first(row.beats);

    if (!beat?.id) {
      return;
    }

    activeBeatsById.set(beat.id, beat);
  });

  const activeAccessBeats = Array.from(activeBeatsById.values()).sort((a, b) =>
    (a.title ?? a.slug ?? a.id).localeCompare(b.title ?? b.slug ?? b.id),
  );

  const beats = activeAccessBeats.filter((beat) => !paidBeatIds.has(beat.id));
  const historicalRevocationBeatsById = new Map<
    string,
    BeatRow & { revoked_at: string | null; reason: string | null }
  >();

  for (const row of revocationRows) {
    const beat = first(row.beats);
    const beatId = row.beat_id ?? beat?.id ?? null;

    if (!beatId || activeBeatIds.has(beatId) || historicalRevocationBeatsById.has(beatId)) {
      continue;
    }

    historicalRevocationBeatsById.set(beatId, {
      id: beatId,
      title: beat?.title ?? null,
      slug: beat?.slug ?? null,
      genre: beat?.genre ?? null,
      bpm: beat?.bpm ?? null,
      revoked_at: row.revoked_at ?? row.created_at ?? null,
      reason: row.reason ?? null,
    });
  }

  const historicalRevocationBeats = Array.from(historicalRevocationBeatsById.values()).sort((a, b) => {
    const aDate = a.revoked_at ? new Date(a.revoked_at).getTime() : 0;
    const bDate = b.revoked_at ? new Date(b.revoked_at).getTime() : 0;

    if (bDate !== aDate) {
      return bDate - aDate;
    }

    return (a.title ?? a.slug ?? a.id).localeCompare(b.title ?? b.slug ?? b.id);
  });

  return Response.json({
    ok: true,
    profile: profileResult.data,
    beats,
    active_access_beats: activeAccessBeats,
    historical_revocation_beats: historicalRevocationBeats,
    summary: {
      active_access_count: activeBeatIds.size,
      paid_count: paidBeatIds.size,
      available_for_payment_count: beats.length,
      historical_revocation_count: revokedBeatIds.size,
    },
  });
}