import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export async function getAuthorizedFullAudioUrl(beatId: string) {
  const supabase = createSupabaseBrowserClient();
  const sessionResult = await supabase?.auth.getSession();
  const token = sessionResult?.data.session?.access_token;

  const response = await fetch(`/api/beats/${encodeURIComponent(beatId)}/playback`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null) as { url?: string; message?: string } | null;

  if (!response.ok || !payload?.url) {
    throw new Error(payload?.message || "No se pudo autorizar el audio completo.");
  }

  return payload.url;
}
