import { validateAdminRequest } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const admin = await validateAdminRequest(request);

  if (!admin.ok) {
    return admin.response;
  }

  const { data, error } = await admin.supabase
    .from("commercial_activity")
    .select("id,event_type,user_id,user_email,beat_id,beat_title,beat_slug,metadata,created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("B.R commercial activity admin list error", error);
    return Response.json({ ok: false, message: "No se pudo cargar la actividad comercial." }, { status: 500 });
  }

  return Response.json({ ok: true, activity: data ?? [] });
}
