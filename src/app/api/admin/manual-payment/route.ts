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

  const { data: existingPayment, error: existingPaymentError } = await admin.supabase
    .from("manual_payments")
    .select("id")
    .eq("user_id", profile.id)
    .eq("beat_id", beat.id)
    .maybeSingle<{ id: string }>();

  if (existingPaymentError) {
    console.error("B.R manual payment duplicate lookup error", existingPaymentError);
    return Response.json({ ok: false, message: "No se pudo validar si el pago ya existe." }, { status: 500 });
  }

  const shouldInsertPayment = !existingPayment;

  const { error: accessUpsertError } = await admin.supabase.from("beat_access").upsert(
    {
      user_id: profile.id,
      beat_id: beat.id,
      granted_by: admin.requester.id,
    },
    { onConflict: "user_id,beat_id" },
  );

  if (accessUpsertError) {
    console.error("B.R manual payment access upsert error", accessUpsertError);
    return Response.json({ ok: false, message: "No se pudo liberar el acceso del usuario al beat." }, { status: 500 });
  }

  const paymentRow = {
    user_id: profile.id,
    user_email: profile.email,
    beat_id: beat.id,
    beat_title: beat.title,
    amount,
    currency,
    payment_method: paymentMethod || null,
    note: note || null,
    created_by_admin: admin.requester.id,
    license_type: licenseType,
  };

  let paymentError = null;

  if (shouldInsertPayment) {
    const paymentResult = await admin.supabase.from("manual_payments").insert(paymentRow);
    paymentError = paymentResult.error;

    if (paymentError?.message.toLowerCase().includes("license_type")) {
      const legacyPaymentRow: Omit<typeof paymentRow, "license_type"> = {
        user_id: paymentRow.user_id,
        user_email: paymentRow.user_email,
        beat_id: paymentRow.beat_id,
        beat_title: paymentRow.beat_title,
        amount: paymentRow.amount,
        currency: paymentRow.currency,
        payment_method: paymentRow.payment_method,
        note: paymentRow.note,
        created_by_admin: paymentRow.created_by_admin,
      };
      const retryResult = await admin.supabase.from("manual_payments").insert(legacyPaymentRow);
      paymentError = retryResult.error;
    }

    if (paymentError) {
      console.error("B.R manual payment insert error", paymentError);
      return Response.json({ ok: false, message: "No se pudo registrar el pago." }, { status: 500 });
    }
  }

  const { error: requestUpdateError } = await admin.supabase
    .from("access_requests")
    .update({ status: "fulfilled", responded_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("user_id", profile.id)
    .eq("beat_id", beat.id)
    .in("status", ["pending", "contacted", "payment_pending", "paid", "approved"]);

  if (requestUpdateError) {
    console.error("B.R manual payment access request update error", requestUpdateError);
  }

  const { error: activityError } = await admin.supabase.from("commercial_activity").insert({
    event_type: "manual_payment",
    user_id: profile.id,
    user_email: profile.email,
    beat_id: beat.id,
    beat_title: beat.title,
    beat_slug: beat.slug,
    metadata: {
      amount,
      currency,
      payment_method: paymentMethod || null,
      note: note || null,
      created_by_admin: admin.requester.id,
      license_type: licenseType,
      access_granted: true,
    },
  });

  if (activityError) {
    console.error("B.R commercial activity manual_payment log error", activityError);
  }

  return Response.json({
    ok: true,
    message: existingPayment ? "Pago ya registrado. Acceso liberado y solicitud completada." : "Pago confirmado, acceso liberado y licencia registrada.",
  });
}
