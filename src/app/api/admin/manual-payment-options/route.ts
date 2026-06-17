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

  const [profileResult, accessResult, paymentsResult] = await Promise.all([
    admin.supabase.from("profiles").select("id,email,username,display_name").eq("id", userId).maybeSingle<ProfileRow>(),
    admin.supabase
      .from("beat_access")
      .select("beat_id,beats(id,title,slug,genre,bpm)")
      .eq("user_id", userId),
    admin.supabase.from("manual_payments").select("beat_id").eq("user_id", userId),
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

  const paidBeatIds = new Set(((paymentsResult.data ?? []) as ManualPaymentRow[]).map((row) => row.beat_id).filter(Boolean));
  const beats = ((accessResult.data ?? []) as BeatAccessRow[])
    .map((row) => first(row.beats))
    .filter((beat): beat is BeatRow => Boolean(beat?.id))
    .filter((beat) => !paidBeatIds.has(beat.id))
    .sort((a, b) => (a.title ?? a.slug ?? a.id).localeCompare(b.title ?? b.slug ?? b.id));

  return Response.json({
    ok: true,
    profile: profileResult.data,
    beats,
  });
}