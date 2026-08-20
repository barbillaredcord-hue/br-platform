import { validateAdminRequest } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const admin = await validateAdminRequest(request);

  if (!admin.ok) {
    return admin.response;
  }

  const [activityResult, paymentsResult] = await Promise.all([
    admin.supabase
      .from("commercial_activity")
      .select("id,event_type,user_id,user_email,beat_id,beat_title,beat_slug,metadata,created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    admin.supabase
      .from("manual_payments")
      .select("id", { count: "exact", head: true }),
  ]);

  if (activityResult.error) {
    console.error("B.R commercial activity admin list error", activityResult.error);
    return Response.json({ ok: false, message: "No se pudo cargar la actividad comercial." }, { status: 500 });
  }

  if (paymentsResult.error) {
    console.error("B.R commercial payments count error", paymentsResult.error);
    return Response.json({ ok: false, message: "No se pudieron contar los pagos confirmados." }, { status: 500 });
  }

  return Response.json({
    ok: true,
    activity: activityResult.data ?? [],
    summary: { confirmed_payments: paymentsResult.count ?? 0 },
  });
}
