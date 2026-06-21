import { validateAdminRequest } from "@/lib/supabase/admin";
import { mapSupabaseBeat } from "@/lib/supabase/queries";

type AdminBeatRow = {
  id: string;
  slug: string;
  title: string;
  genre: string | null;
  bpm: number | null;
  musical_key: string | null;
  preview_url: string;
  full_audio_url: string;
  preview_duration_seconds: number | null;
  preview_updated_at: string | null;
  playback_visibility: string | null;
  is_active: boolean | null;
};

export async function GET(request: Request) {
  const admin = await validateAdminRequest(request);

  if (!admin.ok) {
    return admin.response;
  }

  const { data, error } = await admin.supabase
    .from("beats")
    .select("id,slug,title,genre,bpm,musical_key,preview_url,full_audio_url,preview_duration_seconds,preview_updated_at,playback_visibility,is_active")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("B.R admin beats list error", error);
    return Response.json({ ok: false, message: "No se pudo cargar el catálogo admin." }, { status: 500 });
  }

  return Response.json({ ok: true, beats: ((data ?? []) as AdminBeatRow[]).map(mapSupabaseBeat) });
}
