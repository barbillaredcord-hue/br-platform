import { FULL_AUDIO_URL_TTL_SECONDS, getStorageObjectLocation } from "@/lib/full-audio";
import { createSupabaseServiceClient, getBearerToken } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  const supabase = createSupabaseServiceClient();
  const token = getBearerToken(request);
  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId).trim();

  if (!supabase) {
    return Response.json({ ok: false, message: "Servicio de audio no disponible." }, { status: 500 });
  }

  if (!id) {
    return Response.json({ ok: false, message: "Beat no válido." }, { status: 400 });
  }

  const beatSelect = "id,full_audio_url,playback_visibility,is_active";
  const beatIdentifierColumn = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
    ? "id"
    : "slug";
  const { data: beat, error: beatError } = await supabase
    .from("beats")
    .select(beatSelect)
    .eq(beatIdentifierColumn, id)
    .maybeSingle<{ id: string; full_audio_url: string | null; playback_visibility: string | null; is_active: boolean | null }>();

  if (beatError || !beat || beat.is_active === false || !beat.full_audio_url) {
    return Response.json({ ok: false, message: "Beat no disponible." }, { status: 404 });
  }

  if (beat.playback_visibility !== "public") {
    if (!token) {
      return Response.json({ ok: false, message: "Sesión requerida." }, { status: 401 });
    }

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    const user = userData.user;

    if (userError || !user) {
      return Response.json({ ok: false, message: "Sesión no válida." }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle<{ role: "admin" | "user" }>();
    const isAdmin = profile?.role === "admin";

    if (!isAdmin) {
      const { data: access, error: accessError } = await supabase
        .from("beat_access")
        .select("beat_id")
        .eq("user_id", user.id)
        .eq("beat_id", beat.id)
        .maybeSingle();

      if (accessError || !access) {
        return Response.json({ ok: false, message: "No tienes acceso al audio completo." }, { status: 403 });
      }
    }
  }

  const location = getStorageObjectLocation(beat.full_audio_url);
  if (!location) {
    return Response.json({ ok: false, message: "Audio completo no disponible." }, { status: 404 });
  }

  const { data: signed, error: signedError } = await supabase.storage
    .from(location.bucket)
    .createSignedUrl(location.path, FULL_AUDIO_URL_TTL_SECONDS);

  if (signedError || !signed?.signedUrl) {
    console.error("B.R full audio signing error", { beatId: beat.id, code: signedError?.name });
    return Response.json({ ok: false, message: "No se pudo autorizar el audio completo." }, { status: 500 });
  }

  return Response.json({ ok: true, url: signed.signedUrl, expiresIn: FULL_AUDIO_URL_TTL_SECONDS }, {
    headers: { "Cache-Control": "no-store" },
  });
}
