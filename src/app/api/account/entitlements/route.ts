import { createSupabaseServiceClient, getBearerToken } from "@/lib/supabase/admin";

type BeatAccessRow = { beat_id: string | null };
type ManualPaymentRow = { beat_id: string | null };

export async function GET(request: Request) {
  const supabase = createSupabaseServiceClient();
  const token = getBearerToken(request);

  if (!supabase) {
    return Response.json({ ok: false, message: "Servicio no disponible." }, { status: 500 });
  }

  if (!token) {
    return Response.json({ ok: false, message: "Sesión no válida." }, { status: 401 });
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  const user = userData.user;

  if (userError || !user) {
    return Response.json({ ok: false, message: "Sesión no válida." }, { status: 401 });
  }

  const [accessResult, paymentsResult] = await Promise.all([
    supabase.from("beat_access").select("beat_id").eq("user_id", user.id),
    supabase.from("manual_payments").select("beat_id").eq("user_id", user.id),
  ]);

  if (accessResult.error || paymentsResult.error) {
    console.error("B.R entitlement lookup error", {
      access: accessResult.error,
      payment: paymentsResult.error,
    });
    return Response.json({ ok: false, message: "No se pudo validar el pago." }, { status: 500 });
  }

  const paidBeatIds = new Set(
    ((paymentsResult.data ?? []) as ManualPaymentRow[])
      .map((payment) => payment.beat_id)
      .filter((beatId): beatId is string => Boolean(beatId)),
  );
  const activeBeatIds = ((accessResult.data ?? []) as BeatAccessRow[])
    .map((access) => access.beat_id)
    .filter((beatId): beatId is string => Boolean(beatId));

  return Response.json({
    ok: true,
    paidBeatIds: activeBeatIds.filter((beatId) => paidBeatIds.has(beatId)),
  }, { headers: { "Cache-Control": "private, no-store" } });
}
