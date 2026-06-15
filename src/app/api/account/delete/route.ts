import { createSupabaseServiceClient, getBearerToken } from "@/lib/supabase/admin";

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
