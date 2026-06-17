import { createSupabaseServiceClient, getBearerToken } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function safeFileName(input?: string | null) {
  return (input || "br-beat")
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "br-beat";
}

async function logDownloadActivity(
  supabase: NonNullable<ReturnType<typeof createSupabaseServiceClient>>,
  input: { userId: string; userEmail?: string | null; beat: { id: string; title?: string | null; slug?: string | null } },
) {
  const { error } = await supabase.from("commercial_activity").insert({
    event_type: "mp3_download",
    user_id: input.userId,
    user_email: input.userEmail ?? null,
    beat_id: input.beat.id,
    beat_title: input.beat.title ?? null,
    beat_slug: input.beat.slug ?? null,
    metadata: { source: "download_api" },
  });

  if (error) {
    console.error("B.R commercial activity mp3_download log error", error);
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

  const beatSelect = "id,title,slug,full_audio_url,is_active";

  let { data: beat, error: beatError } = await supabase
    .from("beats")
    .select(beatSelect)
    .eq("id", beatIdentifier)
    .maybeSingle();

  if (!beat && !beatError) {
    const slugResult = await supabase
      .from("beats")
      .select(beatSelect)
      .eq("slug", beatIdentifier)
      .maybeSingle();

    beat = slugResult.data;
    beatError = slugResult.error;
  }

  if (beatError) {
    console.error("B.R download beat lookup error", beatError);
    return Response.json({ ok: false, message: "No se pudo validar el beat." }, { status: 500 });
  }

  if (!beat || !beat.is_active || !beat.full_audio_url) {
    return Response.json({ ok: false, message: "Beat no disponible." }, { status: 404 });
  }

  const { data: accessRow, error: accessError } = await supabase
    .from("beat_access")
    .select("beat_id")
    .eq("user_id", user.id)
    .eq("beat_id", beat.id)
    .maybeSingle();

  if (accessError) {
    console.error("B.R download access lookup error", accessError);
    return Response.json({ ok: false, message: "No se pudo validar el acceso." }, { status: 500 });
  }

  if (!accessRow) {
    return Response.json({ ok: false, message: "No tienes acceso para descargar este beat." }, { status: 403 });
  }

  const audioResponse = await fetch(beat.full_audio_url);

  if (!audioResponse.ok || !audioResponse.body) {
    return Response.json({ ok: false, message: "No se pudo preparar la descarga." }, { status: 502 });
  }

  await logDownloadActivity(supabase, {
    userId: user.id,
    userEmail: user.email,
    beat,
  });

  const filename = `${safeFileName(beat.slug || beat.title)}.mp3`;

  return new Response(audioResponse.body, {
    headers: {
      "Content-Type": audioResponse.headers.get("content-type") || "audio/mpeg",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
