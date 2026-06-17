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

  const issuedAt = new Date();
  const licenseNumber = `BR-${beat.id.slice(0, 8).toUpperCase()}-${user.id.slice(0, 8).toUpperCase()}`;
  const buyerEmail = user.email ?? "Usuario B.R";
  const beatTitle = beat.title || beat.slug || beat.id;
  const licenseType = await getLicenseTypeForUserBeat(supabase, { userId: user.id, beatId: beat.id });

  const licenseText = [
    "B.R - LICENCIA DIGITAL",
    "",
    `Número de licencia: ${licenseNumber}`,
    `Fecha de emisión: ${formatDate(issuedAt)}`,
    `Tipo de licencia: ${licenseTypeLabels[licenseType]}`,
    "",
    "LICENCIANTE",
    "B.R / BarbillaRED",
    "",
    "USUARIO AUTORIZADO",
    `Email: ${buyerEmail}`,
    `User ID: ${user.id}`,
    "",
    "BEAT",
    `Título: ${beatTitle}`,
    `Slug: ${beat.slug ?? "N/A"}`,
    `Género: ${beat.genre ?? "N/A"}`,
    `BPM: ${beat.bpm ?? "N/A"}`,
    `Tonalidad: ${beat.musical_key ?? "N/A"}`,
    `Beat ID: ${beat.id}`,
    "",
    "TIPO DE LICENCIA",
    ...licenseScopes[licenseType],
    "",
    "ALCANCE",
    "- El usuario autorizado puede descargar y usar este beat para fines creativos propios.",
    "- Esta licencia no transfiere propiedad del beat ni derechos maestros de B.R.",
    "- No se permite revender, relicenciar, redistribuir el beat como loop, sample pack o beat independiente.",
    "- Cualquier uso comercial ampliado, exclusivo o con condiciones especiales debe confirmarse directamente con B.R.",
    "- Este documento refleja el tipo de licencia disponible en el registro interno al momento de la descarga.",
    "",
    "NOTA",
    "Este documento es una licencia inicial generada por la plataforma B.R. y debe conservarse junto con la descarga del beat.",
    "",
  ].join("\n");

  const filename = `${safeFileName(beat.slug || beat.title)}-${licenseType}-license.txt`;

  await logLicenseActivity(supabase, {
    userId: user.id,
    userEmail: user.email,
    beat,
    licenseType,
  });

  return new Response(licenseText, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
