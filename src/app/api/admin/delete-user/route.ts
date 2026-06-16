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

  const { userId } = await request.json().catch(() => ({ userId: "" }));

  if (!userId || typeof userId !== "string") {
    return Response.json({ ok: false, message: "Usuario inválido." }, { status: 400 });
  }

  const { data: requesterData, error: requesterError } = await supabase.auth.getUser(token);
  const requester = requesterData.user;

  if (requesterError || !requester) {
    return Response.json({ ok: false, message: "Sesión no válida." }, { status: 401 });
  }

  if (requester.id === userId) {
    return Response.json({ ok: false, message: "No puedes eliminar tu propia cuenta desde admin." }, { status: 400 });
  }

  const { data: requesterProfile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", requester.id)
    .maybeSingle<{ role: "admin" | "user" }>();

  if (profileError || requesterProfile?.role !== "admin") {
    return Response.json({ ok: false, message: "Acceso restringido." }, { status: 403 });
  }

  const { data: deletedProfile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle<{ email: string }>();
  const { data: accessRows } = await supabase.from("beat_access").select("beat_id").eq("user_id", userId);
  const email = deletedProfile?.email?.trim().toLowerCase();

  if (email && accessRows?.length) {
    const closedAt = new Date();
    const expiresAt = new Date(closedAt.getTime() + recoveryWindowMs);
    const recoveryRows = accessRows.map((row) => ({
      email,
      beat_id: row.beat_id,
      source_user_id: userId,
      closed_at: closedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
    }));
    const { error: recoveryError } = await supabase.from("account_access_recovery").upsert(recoveryRows, { onConflict: "email,beat_id" });

    if (recoveryError) {
      console.error("B.R account access recovery archive error", recoveryError);
    }
  }

  await supabase.from("beat_access").delete().eq("user_id", userId);
  await supabase.from("beat_access").delete().eq("granted_by", userId);
  await supabase.from("access_requests").delete().eq("user_id", userId);
  await supabase.from("profiles").delete().eq("id", userId);

  const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

  if (deleteError) {
    return Response.json({ ok: false, message: "No se pudo eliminar el usuario." }, { status: 500 });
  }

  return Response.json({ ok: true, message: "Usuario eliminado." });
}
