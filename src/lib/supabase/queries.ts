import { createClient, type User as SupabaseAuthUser } from "@supabase/supabase-js";
import type { AccessRequestStatus } from "@/data/accessRequests";
import { allBeats, beatRows, type Beat, type BeatRow } from "@/data/beats";
import type { User } from "@/data/users";
import { getSupabasePublicConfigStatus } from "./config";

type SupabaseClient = ReturnType<typeof createClient>;

export type ProfileRow = {
  id: string;
  email: string;
  username: string | null;
  display_name: string | null;
  role: "admin" | "user";
  created_at?: string;
  updated_at?: string;
};

type BeatRowDb = {
  id: string;
  slug: string;
  title: string;
  genre: string | null;
  bpm: number | null;
  musical_key: string | null;
  preview_url: string;
  full_audio_url: string;
  is_active: boolean | null;
};

type BeatAccessRow = {
  user_id: string;
  beat_id: string;
  beats?: { slug: string | null } | { slug: string | null }[] | null;
};

export type AccessRequestRow = {
  id: string;
  user_id: string;
  beat_id: string;
  status: AccessRequestStatus;
  message: string | null;
  created_at: string | null;
  updated_at: string | null;
  profiles?: Pick<ProfileRow, "email" | "username" | "display_name"> | Pick<ProfileRow, "email" | "username" | "display_name">[] | null;
  beats?: Pick<BeatRowDb, "slug" | "title"> | Pick<BeatRowDb, "slug" | "title">[] | null;
};

let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  const config = getSupabasePublicConfigStatus();

  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    return null;
  }

  supabaseClient = createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      persistSession: typeof window !== "undefined",
      autoRefreshToken: typeof window !== "undefined",
    },
  });

  return supabaseClient;
}

function first<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function getFallbackRows(): BeatRow[] {
  return beatRows;
}

export function mapSupabaseBeat(row: BeatRowDb): Beat {
  return {
    id: row.slug,
    dbId: row.id,
    name: row.title,
    genre: row.genre ?? "Sin género",
    bpm: row.bpm ?? 0,
    locked: true,
    key: row.musical_key ?? undefined,
    status: "Privado",
    previewUrl: row.preview_url,
    fullAudioUrl: row.full_audio_url,
    isDemoAudio: false,
  };
}

export function buildBeatRows(beats: Beat[]): BeatRow[] {
  const groups = new Map<string, Beat[]>();

  beats.forEach((beat) => {
    const title = beat.genre || "Beats";
    groups.set(title, [...(groups.get(title) ?? []), beat]);
  });

  return Array.from(groups.entries()).map(([title, rowBeats]) => ({ title, beats: rowBeats }));
}

export function getBeatAccessKey(beat: Pick<Beat, "id" | "dbId"> | string) {
  return typeof beat === "string" ? beat : beat.dbId ?? beat.id;
}

export function mapProfileToUser(profile: ProfileRow, accessibleBeatIds: string[] = []): User {
  const username = profile.username || profile.email.split("@")[0] || "usuario";

  return {
    id: profile.id,
    name: profile.display_name || username,
    username,
    email: profile.email,
    role: profile.role,
    accessibleBeatIds,
  };
}

export async function getCurrentProfile() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return null;
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return null;
  }

  return ensureProfile(authData.user);
}

export async function ensureProfile(authUser: SupabaseAuthUser, input?: { name?: string; username?: string }) {
  const supabase = getSupabaseClient();

  if (!supabase || !authUser.email) {
    return null;
  }

  const authEmail = authUser.email.trim().toLowerCase();
  const brceoEmail = (process.env.NEXT_PUBLIC_BRCEO_EMAIL ?? "").trim().toLowerCase();
  const isBrceoEmail = Boolean(brceoEmail) && authEmail === brceoEmail;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id,email,username,display_name,role,created_at,updated_at")
    .eq("id", authUser.id)
    .maybeSingle<ProfileRow>();

  if (profile) {
    return profile;
  }

  const emailName = authEmail.split("@")[0] || "usuario";

  if (isBrceoEmail) {
    console.warn("B.RCEO debe existir en Supabase public.profiles con role='admin'. Usando profile admin fallback en memoria.");

    return {
      id: authUser.id,
      email: authEmail,
      username: input?.username || "brceo",
      display_name: input?.name || "B.RCEO",
      role: "admin",
    } satisfies ProfileRow;
  }

  console.warn("Profile aún no existe. Intenta cerrar sesión e iniciar de nuevo.");

  return {
    id: authUser.id,
    email: authEmail,
    username: input?.username || emailName,
    display_name: input?.name || emailName,
    role: "user",
  } satisfies ProfileRow;
}

export async function getBeats() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return { beats: allBeats, rows: getFallbackRows(), usingFallback: true };
  }

  const { data, error } = await supabase
    .from("beats")
    .select("id,slug,title,genre,bpm,musical_key,preview_url,full_audio_url,is_active")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error || !data?.length) {
    return { beats: allBeats, rows: getFallbackRows(), usingFallback: true };
  }

  const beats = (data as BeatRowDb[]).map(mapSupabaseBeat);

  return { beats, rows: buildBeatRows(beats), usingFallback: false };
}

export async function getBeatBySlug(slug: string) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return allBeats.find((beat) => beat.id === slug) ?? null;
  }

  const { data, error } = await supabase
    .from("beats")
    .select("id,slug,title,genre,bpm,musical_key,preview_url,full_audio_url,is_active")
    .eq("slug", slug)
    .maybeSingle<BeatRowDb>();

  if (error || !data) {
    return allBeats.find((beat) => beat.id === slug) ?? null;
  }

  return mapSupabaseBeat(data);
}

async function resolveBeatId(beatId: string) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return beatId;
  }

  const { data } = await supabase.from("beats").select("id").eq("slug", beatId).maybeSingle<{ id: string }>();

  return data?.id ?? beatId;
}

export async function getUserBeatAccess(userId: string, supabaseOverride?: SupabaseClient | null) {
  const supabase = supabaseOverride ?? getSupabaseClient();

  if (!supabase || !userId) {
    return [];
  }

  const { data, error } = await supabase
    .from("beat_access")
    .select("user_id,beat_id,beats(slug)")
    .eq("user_id", userId);

  if (error || !data) {
    return [];
  }

  return (data as BeatAccessRow[]).flatMap((row) => {
    const beat = first(row.beats);
    return [row.beat_id, beat?.slug].filter(Boolean) as string[];
  });
}

export async function canAccessBeatSupabase(userId: string, beatId: string) {
  const accessIds = await getUserBeatAccess(userId);
  return accessIds.includes(beatId);
}

export async function getUsersWithAccessToBeat(beatId: string) {
  const supabase = getSupabaseClient();
  const resolvedBeatId = await resolveBeatId(beatId);

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("beat_access")
    .select("profiles(id,email,username,display_name,role)")
    .eq("beat_id", resolvedBeatId);

  if (error || !data) {
    return [];
  }

  return data
    .map((row) => first((row as { profiles?: ProfileRow | ProfileRow[] | null }).profiles))
    .filter((profile): profile is ProfileRow => Boolean(profile))
    .map((profile) => mapProfileToUser(profile));
}

export async function createAccessRequest(userId: string, beatId: string, message?: string) {
  const supabase = getSupabaseClient();
  const resolvedBeatId = await resolveBeatId(beatId);

  if (!supabase) {
    return { ok: false, message: "Supabase no está configurado." };
  }

  const { error } = await supabase.from("access_requests").insert({
    user_id: userId,
    beat_id: resolvedBeatId,
    message: message || null,
  });

  if (!error) {
    return { ok: true, message: "Solicitud enviada al admin." };
  }

  if (error.code === "23505") {
    return { ok: false, message: "Ya existe una solicitud para este beat." };
  }

  return { ok: false, message: error.message };
}

export async function getAccessRequests() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("access_requests")
    .select("id,user_id,beat_id,status,message,created_at,updated_at,profiles(email,username,display_name),beats(slug,title)")
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as AccessRequestRow[];
}

export async function getAccessRequestsForUser(userId: string) {
  const supabase = getSupabaseClient();

  if (!supabase || !userId) {
    return [];
  }

  const { data, error } = await supabase
    .from("access_requests")
    .select("id,user_id,beat_id,status,message,created_at,updated_at,beats(slug,title)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as AccessRequestRow[];
}

export async function approveAccessRequest(requestId: string) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return { ok: false, message: "Supabase no está configurado." };
  }

  const { data: request, error: requestError } = await supabase
    .from("access_requests")
    .select("id,user_id,beat_id")
    .eq("id", requestId)
    .single<{ id: string; user_id: string; beat_id: string }>();

  if (requestError || !request) {
    return { ok: false, message: requestError?.message ?? "Solicitud no encontrada." };
  }

  const { data: authData } = await supabase.auth.getUser();
  const { error: accessError } = await supabase.from("beat_access").upsert(
    {
      user_id: request.user_id,
      beat_id: request.beat_id,
      granted_by: authData.user?.id ?? null,
    },
    { onConflict: "user_id,beat_id" },
  );

  if (accessError) {
    return { ok: false, message: accessError.message };
  }

  const { error: updateError } = await supabase.from("access_requests").update({ status: "approved" }).eq("id", requestId);

  return updateError ? { ok: false, message: updateError.message } : { ok: true };
}

export async function rejectAccessRequest(requestId: string) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return { ok: false, message: "Supabase no está configurado." };
  }

  const { error } = await supabase.from("access_requests").update({ status: "rejected" }).eq("id", requestId);

  return error ? { ok: false, message: error.message } : { ok: true };
}

export async function grantBeatAccess(userId: string, beatId: string) {
  const supabase = getSupabaseClient();
  const resolvedBeatId = await resolveBeatId(beatId);

  if (!supabase) {
    return { ok: false, message: "Supabase no está configurado." };
  }

  const { data: authData } = await supabase.auth.getUser();
  const { error } = await supabase.from("beat_access").upsert(
    {
      user_id: userId,
      beat_id: resolvedBeatId,
      granted_by: authData.user?.id ?? null,
    },
    { onConflict: "user_id,beat_id" },
  );

  return error ? { ok: false, message: error.message } : { ok: true };
}

export async function revokeBeatAccess(userId: string, beatId: string) {
  const supabase = getSupabaseClient();
  const resolvedBeatId = await resolveBeatId(beatId);

  if (!supabase) {
    return { ok: false, message: "Supabase no está configurado." };
  }

  const { error } = await supabase.from("beat_access").delete().eq("user_id", userId).eq("beat_id", resolvedBeatId);

  return error ? { ok: false, message: error.message } : { ok: true };
}

export async function getProfiles() {
  const result = await getProfilesResult();

  return result.users;
}

export async function getProfilesResult(supabaseOverride?: SupabaseClient | null) {
  const supabase = supabaseOverride ?? getSupabaseClient();

  if (!supabase) {
    return {
      users: [],
      error: "Supabase no está configurado.",
      emptyReason: "Revisa NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const session = sessionData.session;

  if (sessionError || !session) {
    return {
      users: [],
      error: "Sesión no cargada. Vuelve a iniciar sesión.",
      emptyReason: sessionError?.message ?? "No hay sesión Supabase activa en el navegador.",
    };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,username,display_name,role,created_at,updated_at")
    .order("created_at", { ascending: false });

  const brceoEmail = (process.env.NEXT_PUBLIC_BRCEO_EMAIL ?? "").trim().toLowerCase();
  const authEmail = (session.user.email ?? "").trim().toLowerCase();
  const isBrceoEmail = Boolean(brceoEmail) && authEmail === brceoEmail;

  if (error || !data) {
    return {
      users: [],
      error: error?.message ?? "Supabase no devolvió datos.",
      emptyReason: isBrceoEmail
        ? "Causa probable: el profile B.RCEO existe pero role no es admin, la política RLS no fue aplicada o faltan GRANTs sobre public.profiles."
        : "Causa probable: esta sesión no tiene permisos para leer profiles.",
    };
  }

  const profiles = data as ProfileRow[];

  if (profiles.length === 0) {
    return {
      users: [],
      error: "",
      emptyReason: isBrceoEmail
        ? "La consulta fue exitosa pero no devolvió filas. Causa probable: public.profiles está vacío o RLS no reconoce a B.RCEO como admin."
        : "La consulta fue exitosa pero no devolvió filas visibles para este usuario.",
    };
  }

  const users = await Promise.all(profiles.map(async (profile) => mapProfileToUser(profile, await getUserBeatAccess(profile.id, supabase))));

  return { users, error: "", emptyReason: "" };
}

export async function updateProfile(userId: string, input: { username: string; displayName: string }) {
  const supabase = getSupabaseClient();
  const username = input.username.trim().replace(/^@+/, "").toLowerCase();

  if (!supabase) {
    return { ok: false, message: "Supabase no está configurado." };
  }

  if (!username || username.includes(" ")) {
    return { ok: false, message: "Username inválido: no debe estar vacío ni contener espacios." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      username,
      display_name: input.displayName.trim() || username,
    })
    .eq("id", userId);

  return error ? { ok: false, message: error.message } : { ok: true, message: "Perfil actualizado." };
}
