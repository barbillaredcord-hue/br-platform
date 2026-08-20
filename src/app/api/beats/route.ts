import { mapSupabaseBeat } from "@/lib/supabase/queries";
import { createSupabaseServiceClient } from "@/lib/supabase/admin";

type BeatRow = Parameters<typeof mapSupabaseBeat>[0];

export async function GET(request: Request) {
  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return Response.json({ ok: false, message: "Catálogo no disponible." }, { status: 500 });
  }

  const slug = new URL(request.url).searchParams.get("slug")?.trim();
  let query = supabase
    .from("beats")
    .select("id,slug,title,genre,bpm,musical_key,preview_url,full_audio_url,preview_duration_seconds,preview_updated_at,playback_visibility,is_active")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (slug) {
    query = query.eq("slug", slug);
  }

  const { data, error } = await query;
  if (error) {
    console.error("B.R public beat catalog error", { code: error.code });
    return Response.json({ ok: false, message: "No se pudo cargar el catálogo." }, { status: 500 });
  }

  const beats = ((data ?? []) as BeatRow[]).map(mapSupabaseBeat);
  return Response.json({ ok: true, beats, beat: slug ? beats[0] ?? null : undefined }, {
    headers: { "Cache-Control": "no-store" },
  });
}
