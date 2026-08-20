import { validateAdminRequest } from "@/lib/supabase/admin";

type ManualPaymentPayload = {
  user_id?: string;
  beat_id?: string;
  amount?: number | string;
  currency?: string;
  payment_method?: string;
  note?: string;
  license_type?: string;
};

type BeatPaymentRow = {
  id: string;
  title: string | null;
  slug: string | null;
};

type ManualPaymentRpcResult = {
  access_created?: boolean;
  payment_created?: boolean;
  revocation_preserved?: boolean;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeCurrency(value: unknown) {
  const currency = cleanText(value).toUpperCase();
  return currency || "MXN";
}

function normalizeLicenseType(value: unknown) {
  const licenseType = cleanText(value).toLowerCase();
  return licenseType === "premium" || licenseType === "exclusive" ? licenseType : "basic";
}

export async function POST(request: Request) {
  const admin = await validateAdminRequest(request);

  if (!admin.ok) {
    return admin.response;
  }

  const payload = (await request.json().catch(() => null)) as ManualPaymentPayload | null;
  const userId = cleanText(payload?.user_id);
  const beatIdentifier = cleanText(payload?.beat_id);
  const amount = Number(payload?.amount);
  const currency = normalizeCurrency(payload?.currency);
  const paymentMethod = cleanText(payload?.payment_method);
  const note = cleanText(payload?.note);
  const licenseType = normalizeLicenseType(payload?.license_type);

  if (!uuidPattern.test(userId)) {
    return Response.json({ ok: false, message: "Usuario inválido." }, { status: 400 });
  }

  if (!beatIdentifier) {
    return Response.json({ ok: false, message: "Beat inválido." }, { status: 400 });
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return Response.json({ ok: false, message: "Monto inválido." }, { status: 400 });
  }

  if (!/^[A-Z]{3}$/.test(currency)) {
    return Response.json({ ok: false, message: "Moneda inválida. Usa un código de 3 letras, por ejemplo MXN o USD." }, { status: 400 });
  }

  const { data: profile, error: profileError } = await admin.supabase
    .from("profiles")
    .select("id,email")
    .eq("id", userId)
    .maybeSingle<{ id: string; email: string | null }>();

  if (profileError) {
    console.error("B.R manual payment profile lookup error", profileError);
    return Response.json({ ok: false, message: "No se pudo validar el usuario." }, { status: 500 });
  }

  if (!profile) {
    return Response.json({ ok: false, message: "Usuario no encontrado." }, { status: 404 });
  }

  let beat: BeatPaymentRow | null = null;
  let beatError: unknown = null;

  if (uuidPattern.test(beatIdentifier)) {
    const result = await admin.supabase.from("beats").select("id,title,slug").eq("id", beatIdentifier).maybeSingle<BeatPaymentRow>();
    beat = result.data;
    beatError = result.error;
  }

  if (!beat && !beatError) {
    const result = await admin.supabase.from("beats").select("id,title,slug").eq("slug", beatIdentifier).maybeSingle<BeatPaymentRow>();
    beat = result.data;
    beatError = result.error;
  }

  if (beatError) {
    console.error("B.R manual payment beat lookup error", beatError);
    return Response.json({ ok: false, message: "No se pudo validar el beat." }, { status: 500 });
  }

  if (!beat) {
    return Response.json({ ok: false, message: "Beat no encontrado." }, { status: 404 });
  }

  const { data, error } = await admin.userSupabase.rpc(
    "record_manual_payment_atomic",
    {
      p_user_id: profile.id,
      p_beat_id: beat.id,
      p_amount: amount,
      p_currency: currency,
      p_payment_method: paymentMethod || null,
      p_note: note || null,
      p_license_type: licenseType,
    },
  );

  if (error) {
    console.error("B.R atomic manual payment error", error);
    return Response.json(
      { ok: false, message: error.message || "No se pudo confirmar el pago manual." },
      { status: 500 },
    );
  }

  const result = data as ManualPaymentRpcResult | null;

  return Response.json({
    ok: true,
    access_created: Boolean(result?.access_created),
    payment_created: Boolean(result?.payment_created),
    revocation_preserved: result?.revocation_preserved !== false,
    previous_revocation_preserved: true,
    message: result?.payment_created
      ? "Pago confirmado, acceso liberado, historial de revocación preservado y licencia registrada."
      : "Pago ya registrado. Acceso sincronizado, historial de revocación preservado y solicitud completada.",
  });
}
