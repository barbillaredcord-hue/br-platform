import { createSupabaseServiceClient, getBearerToken } from "@/lib/supabase/admin";

const recoveryWindowMs = 183 * 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    return Response.json({ ok: false, message: "Falta configurar SUPABASE_SERVICE_ROLE_KEY en servidor." }, { status: 500 });
  }

  const token = getBearerToken(request);

  if (!token) {
    return Response.json({ ok: false, message: "Sesión no válida." }, { status: 401 });
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  const user = userData.user;

  if (userError || !user) {
    return Response.json({ ok: false, message: "Sesión no válida." }, { status: 401 });
  }

  const email = user.email?.trim().toLowerCase();
  const { data: accessRows } = await supabase.from("beat_access").select("beat_id").eq("user_id", user.id);

  if (email && accessRows?.length) {
    const closedAt = new Date();
    const expiresAt = new Date(closedAt.getTime() + recoveryWindowMs);
    const recoveryRows = accessRows.map((row) => ({
      email,
      beat_id: row.beat_id,
      source_user_id: user.id,
      closed_at: closedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
    }));
    const { error: recoveryError } = await supabase.from("account_access_recovery").upsert(recoveryRows, { onConflict: "email,beat_id" });

    if (recoveryError) {
      console.error("B.R account access recovery archive error", recoveryError);
    }
  }

  await supabase.from("beat_access").delete().eq("user_id", user.id);
  await supabase.from("beat_access").delete().eq("granted_by", user.id);
  await supabase.from("access_requests").delete().eq("user_id", user.id);
  await supabase.from("profiles").delete().eq("id", user.id);

  const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

  if (deleteError) {
    return Response.json({ ok: false, message: "No se pudo eliminar la cuenta." }, { status: 500 });
  }

  return Response.json({ ok: true, message: "Cuenta eliminada." });
}
