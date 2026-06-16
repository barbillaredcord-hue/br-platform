import { createSupabaseServiceClient, getBearerToken } from "@/lib/supabase/admin";

type RecoveryRow = {
  id: string;
  beat_id: string;
};

export async function POST(request: Request) {
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    return Response.json({ ok: false, restored: 0, message: "Falta configurar SUPABASE_SERVICE_ROLE_KEY en servidor." }, { status: 500 });
  }

  const token = getBearerToken(request);

  if (!token) {
    return Response.json({ ok: false, restored: 0, message: "Sesión no válida." }, { status: 401 });
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  const user = userData.user;
  const email = user?.email?.trim().toLowerCase();

  if (userError || !user || !email) {
    return Response.json({ ok: false, restored: 0, message: "Sesión no válida." }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle<{ id: string }>();

  if (profileError || !profile) {
    return Response.json({ ok: false, restored: 0, message: "Tu cuenta ya no está activa." }, { status: 403 });
  }

  const now = new Date().toISOString();
  const { data: recoveryRows, error: recoveryError } = await supabase
    .from("account_access_recovery")
    .select("id,beat_id")
    .eq("email", email)
    .gt("expires_at", now)
    .returns<RecoveryRow[]>();

  if (recoveryError) {
    console.error("B.R account access recovery read error", recoveryError);
    return Response.json({ ok: true, restored: 0, message: "Sin recuperación disponible." });
  }

  if (!recoveryRows?.length) {
    return Response.json({ ok: true, restored: 0 });
  }

  const accessRows = recoveryRows.map((row) => ({
    user_id: user.id,
    beat_id: row.beat_id,
    granted_by: null,
  }));
  const { error: accessError } = await supabase.from("beat_access").upsert(accessRows, { onConflict: "user_id,beat_id" });

  if (accessError) {
    console.error("B.R account access recovery write error", accessError);
    return Response.json({ ok: false, restored: 0, message: "No se pudo recuperar el acceso." }, { status: 500 });
  }

  await supabase
    .from("account_access_recovery")
    .update({ restored_user_id: user.id, restored_at: now })
    .in("id", recoveryRows.map((row) => row.id));

  return Response.json({ ok: true, restored: recoveryRows.length });
}
