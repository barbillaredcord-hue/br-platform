import {
  getSupabaseBrowserSessionClient,
  getSupabaseClient,
  type SupabaseClient,
} from "./session-client";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string) {
  return uuidPattern.test(value);
}

export async function resolveBeatId(
  beatId: string,
  supabaseOverride?: SupabaseClient | null,
) {
  const supabase =
    supabaseOverride ??
    getSupabaseBrowserSessionClient() ??
    getSupabaseClient();

  if (!supabase) {
    return beatId;
  }

  if (isUuid(beatId)) {
    return beatId;
  }

  const { data, error } = await supabase
    .from("beats")
    .select("id")
    .eq("slug", beatId)
    .maybeSingle<{ id: string }>();

  if (error || !data?.id) {
    return "";
  }

  return data.id;
}
