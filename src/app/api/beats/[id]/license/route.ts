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

  const licenseText = [
    "B.R — LICENCIA DIGITAL INICIAL",
    "",
    `Número de licencia: ${licenseNumber}`,
    `Fecha de emisión: ${formatDate(issuedAt)}`,
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
    "Licencia inicial de uso no exclusiva.",
    "",
    "ALCANCE",
    "- El usuario autorizado puede descargar y usar este beat para fines creativos propios.",
    "- Esta licencia no transfiere propiedad del beat ni derechos maestros de B.R.",
    "- No se permite revender, relicenciar, redistribuir el beat como loop, sample pack o beat independiente.",
    "- Cualquier uso comercial ampliado, exclusivo o con condiciones especiales debe confirmarse directamente con B.R.",
    "",
    "NOTA",
    "Este documento es una licencia inicial generada por la plataforma B.R. y debe conservarse junto con la descarga del beat.",
    "",
  ].join("\n");

  const filename = `${safeFileName(beat.slug || beat.title)}-license.txt`;

  return new Response(licenseText, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}