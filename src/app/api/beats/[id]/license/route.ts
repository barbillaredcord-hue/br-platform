import { createSupabaseServiceClient, getBearerToken } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type BeatLicenseRow = {
  id: string;
  title: string | null;
  slug: string | null;
  genre: string | null;
  bpm: number | null;
  musical_key: string | null;
  is_active: boolean | null;
};

type LicenseType = "basic" | "premium" | "exclusive";

const licenseTypeLabels: Record<LicenseType, string> = {
  basic: "Basic",
  premium: "Premium",
  exclusive: "Exclusive",
};

const licenseScopes: Record<LicenseType, string[]> = {
  basic: [
    "Licencia inicial de uso no exclusiva.",
    "Pensada para uso creativo propio y lanzamientos independientes basicos.",
  ],
  premium: [
    "Licencia premium no exclusiva.",
    "Pensada para uso comercial ampliado bajo confirmacion directa con B.R.",
  ],
  exclusive: [
    "Licencia exclusiva registrada internamente.",
    "El alcance exclusivo requiere confirmacion y comprobante directo de B.R.",
  ],
};

function safeFileName(input?: string | null) {
  return (
    (input || "br-license")
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "br-license"
  );
}

function formatDate(date = new Date()) {
  return date.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? "N/A")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeLicenseType(value?: string | null): LicenseType {
  return value === "premium" || value === "exclusive" ? value : "basic";
}

async function getLicenseTypeForUserBeat(
  supabase: NonNullable<ReturnType<typeof createSupabaseServiceClient>>,
  input: { userId: string; beatId: string },
): Promise<LicenseType> {
  const { data, error } = await supabase
    .from("manual_payments")
    .select("license_type")
    .eq("user_id", input.userId)
    .eq("beat_id", input.beatId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ license_type: string | null }>();

  if (error) {
    if (!error.message.toLowerCase().includes("license_type")) {
      console.error("B.R license type lookup error", error);
    }

    return "basic";
  }

  return normalizeLicenseType(data?.license_type);
}

async function logLicenseActivity(
  supabase: NonNullable<ReturnType<typeof createSupabaseServiceClient>>,
  input: { userId: string; userEmail?: string | null; beat: BeatLicenseRow; licenseType: LicenseType },
) {
  const { error } = await supabase.from("commercial_activity").insert({
    event_type: "license_download",
    user_id: input.userId,
    user_email: input.userEmail ?? null,
    beat_id: input.beat.id,
    beat_title: input.beat.title ?? null,
    beat_slug: input.beat.slug ?? null,
    metadata: { source: "license_api", license_type: input.licenseType },
  });

  if (error) {
    console.error("B.R commercial activity license_download log error", error);
  }
}

export async function GET(request: Request, context: RouteContext) {
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

  const { id } = await context.params;
  const beatIdentifier = decodeURIComponent(id).trim();

  if (!beatIdentifier) {
    return Response.json({ ok: false, message: "Beat no válido." }, { status: 400 });
  }

  const beatSelect = "id,title,slug,genre,bpm,musical_key,is_active";

  let { data: beat, error: beatError } = await supabase
    .from("beats")
    .select(beatSelect)
    .eq("id", beatIdentifier)
    .maybeSingle<BeatLicenseRow>();

  if (!beat && !beatError) {
    const slugResult = await supabase
      .from("beats")
      .select(beatSelect)
      .eq("slug", beatIdentifier)
      .maybeSingle<BeatLicenseRow>();

    beat = slugResult.data;
    beatError = slugResult.error;
  }

  if (beatError) {
    console.error("B.R license beat lookup error", beatError);
    return Response.json({ ok: false, message: "No se pudo validar el beat." }, { status: 500 });
  }

  if (!beat || !beat.is_active) {
    return Response.json({ ok: false, message: "Beat no disponible." }, { status: 404 });
  }

  const { data: accessRow, error: accessError } = await supabase
    .from("beat_access")
    .select("beat_id")
    .eq("user_id", user.id)
    .eq("beat_id", beat.id)
    .maybeSingle();

  if (accessError) {
    console.error("B.R license access lookup error", accessError);
    return Response.json({ ok: false, message: "No se pudo validar el acceso." }, { status: 500 });
  }

  if (!accessRow) {
    return Response.json({ ok: false, message: "No tienes acceso para descargar esta licencia." }, { status: 403 });
  }

  const { data: revocationRow, error: revocationError } = await supabase
    .from("access_revocations")
    .select("id")
    .eq("user_id", user.id)
    .eq("beat_id", beat.id)
    .maybeSingle();

  if (revocationError) {
    console.error("B.R license revocation lookup error", revocationError);
    return Response.json({ ok: false, message: "No se pudo validar si el acceso fue revocado." }, { status: 500 });
  }

  if (revocationRow) {
    return Response.json({ ok: false, message: "Tu acceso a este beat fue revocado. No puedes descargar la licencia." }, { status: 403 });
  }

  const { data: paymentRow, error: paymentError } = await supabase
    .from("manual_payments")
    .select("id")
    .eq("user_id", user.id)
    .eq("beat_id", beat.id)
    .limit(1)
    .maybeSingle();

  if (paymentError) {
    console.error("B.R license payment lookup error", paymentError);
    return Response.json({ ok: false, message: "No se pudo validar el pago." }, { status: 500 });
  }

  if (!paymentRow) {
    return Response.json(
      {
        ok: false,
        message: "El pago de este beat aún no ha sido liberado."
      },
      { status: 403 }
    );
  }

  const issuedAt = new Date();
  const licenseNumber = `BR-${beat.id.slice(0, 8).toUpperCase()}-${user.id.slice(0, 8).toUpperCase()}`;
  const buyerEmail = user.email ?? "Usuario B.R";
  const beatTitle = beat.title || beat.slug || beat.id;
  const licenseType = await getLicenseTypeForUserBeat(supabase, { userId: user.id, beatId: beat.id });

  const permissions = licenseScopes[licenseType]
    .map((scope) => `<li>${escapeHtml(scope)}</li>`)
    .join("");

  const licenseHtml = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>Licencia B.R ${escapeHtml(licenseNumber)}</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        font-family: Arial, Helvetica, sans-serif;
        color: #141414;
        background: #f5f1e8;
      }
      .page {
        max-width: 980px;
        margin: 0 auto;
        padding: 34px;
      }
      .license {
        position: relative;
        overflow: hidden;
        min-height: 1180px;
        border: 1px solid #ded3bf;
        border-radius: 28px;
        background: linear-gradient(135deg, #fffaf0 0%, #ffffff 54%, #f4efe4 100%);
        box-shadow: 0 26px 80px rgba(20, 20, 20, .12);
        padding: 44px;
      }
      .watermark {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        pointer-events: none;
        color: rgba(180, 133, 64, .08);
        font-size: 180px;
        font-weight: 900;
        letter-spacing: -.12em;
        transform: rotate(-18deg);
      }
      .content { position: relative; z-index: 1; }
      .topbar {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 24px;
        border-bottom: 2px solid #191919;
        padding-bottom: 24px;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .logo {
        display: grid;
        place-items: center;
        width: 78px;
        height: 78px;
        border-radius: 22px;
        background: #191919;
        color: #f6d899;
        font-size: 26px;
        font-weight: 900;
        letter-spacing: -.08em;
      }
      .eyebrow {
        color: #a66f25;
        font-size: 12px;
        font-weight: 900;
        letter-spacing: .18em;
        text-transform: uppercase;
      }
      h1 {
        margin: 8px 0 0;
        font-size: 40px;
        line-height: 1;
        letter-spacing: -.045em;
      }
      .corner {
        text-align: right;
        font-size: 12px;
        color: #6f6253;
        line-height: 1.6;
      }
      .corner strong {
        display: block;
        color: #191919;
        font-size: 16px;
        letter-spacing: .14em;
        text-transform: uppercase;
      }
      .seal-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        margin-top: 28px;
      }
      .seal {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        border: 1px solid #c6954a;
        border-radius: 999px;
        background: #fff5d9;
        color: #865914;
        padding: 10px 16px;
        font-size: 12px;
        font-weight: 900;
        letter-spacing: .12em;
        text-transform: uppercase;
      }
      .license-id {
        color: #4b4036;
        font-size: 13px;
        font-weight: 800;
      }
      .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 18px;
        margin-top: 26px;
      }
      .card {
        border: 1px solid #e5d9c8;
        border-radius: 18px;
        background: rgba(255, 255, 255, .7);
        padding: 20px;
      }
      .card.dark {
        background: #191919;
        color: #fff8e7;
        border-color: #191919;
      }
      .label {
        color: #8a7966;
        font-size: 11px;
        font-weight: 900;
        letter-spacing: .13em;
        text-transform: uppercase;
      }
      .card.dark .label { color: #d9b56f; }
      .value {
        margin-top: 8px;
        font-size: 20px;
        font-weight: 900;
        line-height: 1.25;
      }
      .small {
        margin-top: 6px;
        color: #6f6253;
        font-size: 12px;
        line-height: 1.5;
      }
      .card.dark .small { color: #d7c5a9; }
      .section {
        margin-top: 28px;
        border-top: 1px solid #e6dac7;
        padding-top: 24px;
      }
      .section h2 {
        margin: 0 0 14px;
        font-size: 18px;
        letter-spacing: -.02em;
      }
      .columns {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 18px;
      }
      ul {
        margin: 0;
        padding-left: 18px;
        color: #3f372f;
        font-size: 13px;
        line-height: 1.75;
      }
      .box {
        border-radius: 16px;
        background: #f6efe1;
        padding: 18px;
      }
      .restrictions li { margin-bottom: 4px; }
      .note {
        margin-top: 24px;
        border-left: 4px solid #c6954a;
        background: #fff5d9;
        border-radius: 14px;
        padding: 16px 18px;
        color: #4b4036;
        font-size: 13px;
        line-height: 1.65;
      }
      .footer {
        display: flex;
        justify-content: space-between;
        gap: 18px;
        margin-top: 34px;
        border-top: 1px solid #e6dac7;
        padding-top: 18px;
        color: #71675c;
        font-size: 12px;
      }
      .actions {
        margin-top: 20px;
        display: flex;
        justify-content: flex-end;
      }
      button {
        border: 0;
        border-radius: 12px;
        background: #191919;
        color: white;
        cursor: pointer;
        font-size: 14px;
        font-weight: 800;
        padding: 12px 18px;
      }
      @media print {
        body { background: #ffffff; }
        .page { max-width: none; padding: 0; }
        .license { border: 0; border-radius: 0; box-shadow: none; min-height: auto; }
        .actions { display: none; }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <section class="license">
        <div class="watermark">BR</div>
        <div class="content">
          <div class="topbar">
            <div class="brand">
              <div class="logo">BR</div>
              <div>
                <div class="eyebrow">Licencia oficial B.R</div>
                <h1>Certificado de uso</h1>
              </div>
            </div>
            <div class="corner">
              <strong>BeatRoom</strong>
              brstudios.org<br />Documento digital verificable
            </div>
          </div>

          <div class="seal-row">
            <div class="seal">Verificada · ${escapeHtml(licenseTypeLabels[licenseType])}</div>
            <div class="license-id">Licencia No. ${escapeHtml(licenseNumber)}</div>
          </div>

          <div class="grid">
            <div class="card dark">
              <div class="label">Beat autorizado</div>
              <div class="value">${escapeHtml(beatTitle)}</div>
              <div class="small">${escapeHtml(beat.genre)} · ${escapeHtml(beat.bpm)} BPM · ${escapeHtml(beat.musical_key)}</div>
            </div>
            <div class="card">
              <div class="label">Fecha de emisión</div>
              <div class="value">${escapeHtml(formatDate(issuedAt))}</div>
              <div class="small">Emitida automáticamente por BeatRoom Admin</div>
            </div>
            <div class="card">
              <div class="label">Usuario autorizado</div>
              <div class="value">${escapeHtml(buyerEmail)}</div>
              <div class="small">User ID: ${escapeHtml(user.id)}</div>
            </div>
            <div class="card">
              <div class="label">Licenciante</div>
              <div class="value">B.R / BarbillaRED</div>
              <div class="small">Beat ID: ${escapeHtml(beat.id)}</div>
            </div>
          </div>

          <div class="section">
            <h2>Permisos y alcance</h2>
            <div class="columns">
              <div class="box">
                <ul>${permissions}</ul>
              </div>
              <div class="box">
                <ul>
                  <li>Puede descargar y usar el beat para fines creativos propios.</li>
                  <li>Puede conservar este documento como comprobante de licencia.</li>
                  <li>El alcance comercial depende del tipo de licencia registrado.</li>
                </ul>
              </div>
            </div>
          </div>

          <div class="section">
            <h2>Restricciones principales</h2>
            <div class="box">
              <ul class="restrictions">
                <li>No se transfiere la propiedad del beat ni los derechos maestros de B.R.</li>
                <li>No se permite revender, relicenciar o redistribuir el beat como beat independiente.</li>
                <li>No se permite venderlo como loop, sample pack, plantilla o recurso aislado.</li>
                <li>Condiciones exclusivas o ampliadas requieren confirmación directa de B.R.</li>
              </ul>
            </div>
          </div>

          <div class="note">
            Este documento refleja el tipo de licencia disponible en el registro interno al momento de la descarga. Conserva esta licencia junto con el archivo MP3 descargado.
          </div>

          <div class="footer">
            <span>BeatRoom / B.R · Licencia digital</span>
            <span>${escapeHtml(licenseNumber)}</span>
          </div>
        </div>
      </section>
      <div class="actions">
        <button type="button" onclick="window.print()">Guardar como PDF</button>
      </div>
    </main>
  </body>
</html>`;

  const filename = `${safeFileName(beat.slug || beat.title)}-${licenseType}-license.html`;

  await logLicenseActivity(supabase, {
    userId: user.id,
    userEmail: user.email,
    beat,
    licenseType,
  });

  return new Response(licenseHtml, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
