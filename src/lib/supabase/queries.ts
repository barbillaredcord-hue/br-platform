import { createClient, type User as SupabaseAuthUser } from "@supabase/supabase-js";
import type { AccessRequestStatus } from "@/data/accessRequests";
import { allBeats, beatRows, type Beat, type BeatRow } from "@/data/beats";
import type { User } from "@/data/users";
import { createSupabaseBrowserClient } from "./client";
import { getSupabasePublicConfigStatus } from "./config";

type SupabaseClient = NonNullable<ReturnType<typeof createSupabaseBrowserClient>>;

export type ProfileRow = {
  id: string;
  email: string;
  username: string | null;
  display_name: string | null;
  phone: string | null;
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
  preview_duration_seconds?: number | null;
  preview_updated_at?: string | null;
  playback_visibility?: string | null;
  is_active: boolean | null;
};

type PlaybackVisibilityInput = "private" | "public";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
  profiles?: Pick<ProfileRow, "email" | "username" | "display_name" | "phone"> | Pick<ProfileRow, "email" | "username" | "display_name" | "phone">[] | null;
  beats?: Pick<BeatRowDb, "slug" | "title"> | Pick<BeatRowDb, "slug" | "title">[] | null;
};

const answeredRequestVisibleMs = 3 * 24 * 60 * 60 * 1000;

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

function getSupabaseBrowserSessionClient() {
  if (typeof window === "undefined") {
    return null;
  }

  return createSupabaseBrowserClient() as SupabaseClient | null;
}

async function getAuthenticatedBrowserClient() {
  const supabase = getSupabaseBrowserSessionClient();
  const sessionInfo = {
    hasSession: false,
    hasAccessToken: false,
    userId: null as string | null,
    userEmail: null as string | null,
  };

  if (!supabase) {
    return { supabase: null as SupabaseClient | null, sessionInfo, message: "Supabase no está configurado." };
  }

  const { data: sessionData, error } = await supabase.auth.getSession();
  const session = sessionData.session;
  sessionInfo.hasSession = Boolean(session);
  sessionInfo.hasAccessToken = Boolean(session?.access_token);
  sessionInfo.userId = session?.user.id ?? null;
  sessionInfo.userEmail = session?.user.email ?? null;

  if (error || !session?.access_token) {
    return {
      supabase: null as SupabaseClient | null,
      sessionInfo,
      message: "No hay sesión autenticada real. Vuelve a iniciar sesión.",
    };
  }

  return { supabase, sessionInfo, message: "" };
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

export function isRecentAnsweredRequest(request: Pick<AccessRequestRow, "status" | "updated_at" | "created_at" | "message">) {
  if (request.status === "pending") {
    return true;
  }

  const answeredAt = request.updated_at || request.created_at;

  if (!answeredAt) {
    return false;
  }

  return Date.now() - new Date(answeredAt).getTime() <= answeredRequestVisibleMs;
}

export function mapSupabaseBeat(row: BeatRowDb): Beat {
  const beat: Beat = {
    id: row.slug,
    dbId: row.id,
    name: row.title,
    genre: row.genre ?? "Sin género",
    bpm: row.bpm ?? 0,
    locked: true,
    key: row.musical_key ?? undefined,
    status: "Privado",
    playbackVisibility: row.playback_visibility === "public" ? "public" : "private",
    previewUrl: row.preview_url,
    fullAudioUrl: row.full_audio_url,
    isDemoAudio: false,
  };

  return Object.assign(beat, {
    previewDurationSeconds: row.preview_duration_seconds ?? 15,
    previewUpdatedAt: row.preview_updated_at ?? null,
  });
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
    phone: profile.phone,
    role: profile.role,
    accessibleBeatIds,
  };
}

export async function getCurrentProfile() {
  const supabase = getSupabaseBrowserSessionClient() ?? getSupabaseClient();

  if (!supabase) {
    return null;
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return null;
  }

  return ensureProfile(authData.user);
}

export async function ensureProfile(authUser: SupabaseAuthUser, input?: { name?: string; username?: string; phone?: string }) {
  const supabase = getSupabaseBrowserSessionClient() ?? getSupabaseClient();

  if (!supabase || !authUser.email) {
    return null;
  }

  const authEmail = authUser.email.trim().toLowerCase();
  const brceoEmail = (process.env.NEXT_PUBLIC_BRCEO_EMAIL ?? "").trim().toLowerCase();
  const isBrceoEmail = Boolean(brceoEmail) && authEmail === brceoEmail;
  const metadata = authUser.user_metadata as Record<string, unknown>;
  const metadataUsername = typeof metadata.username === "string" ? metadata.username : "";
  const metadataName = typeof metadata.display_name === "string" ? metadata.display_name : typeof metadata.name === "string" ? metadata.name : "";
  const metadataPhone = typeof metadata.phone === "string" ? metadata.phone : "";
  const inputUsername = input?.username || metadataUsername;
  const inputName = input?.name || metadataName;
  const inputPhone = input?.phone || metadataPhone;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id,email,username,display_name,phone,role,created_at,updated_at")
    .eq("id", authUser.id)
    .maybeSingle<ProfileRow>();

  if (profile) {
    const patch = {
      username: profile.username || inputUsername || null,
      display_name: profile.display_name || inputName || null,
      phone: profile.phone || inputPhone || null,
    };
    const shouldSyncProfile = patch.username !== profile.username || patch.display_name !== profile.display_name || patch.phone !== profile.phone;

    if (!shouldSyncProfile) {
      return profile;
    }

    const { error } = await supabase.from("profiles").update(patch).eq("id", authUser.id);

    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("B.R sync profile metadata error", error);
      }

      return profile;
    }

    return { ...profile, ...patch };
  }

  const emailName = authEmail.split("@")[0] || "usuario";

  if (isBrceoEmail) {
    console.warn("B.RCEO debe existir en Supabase public.profiles con role='admin'. Usando profile temporal sin permisos admin.");

    return {
      id: authUser.id,
      email: authEmail,
      username: inputUsername || "brceo",
      display_name: inputName || "B.RCEO",
      phone: inputPhone || null,
      role: "user",
    } satisfies ProfileRow;
  }

  if (!input) {
    return null;
  }

  console.warn("Profile aún no existe. Usando datos temporales tras registro mientras Supabase sincroniza el trigger.");

  return {
    id: authUser.id,
    email: authEmail,
    username: inputUsername || emailName,
    display_name: inputName || emailName,
    phone: inputPhone || null,
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
    .select("id,slug,title,genre,bpm,musical_key,preview_url,full_audio_url,preview_duration_seconds,preview_updated_at,playback_visibility,is_active")
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
    .select("id,slug,title,genre,bpm,musical_key,preview_url,full_audio_url,preview_duration_seconds,preview_updated_at,playback_visibility,is_active")
    .eq("slug", slug)
    .maybeSingle<BeatRowDb>();

  if (error || !data) {
    return allBeats.find((beat) => beat.id === slug) ?? null;
  }

  return mapSupabaseBeat(data);
}

export async function beatSlugExists(slug: string, supabaseOverride?: SupabaseClient | null) {
  const supabase = supabaseOverride ?? getSupabaseBrowserSessionClient() ?? getSupabaseClient();

  if (!supabase || !slug) {
    return false;
  }

  const { data, error } = await supabase.from("beats").select("id").eq("slug", slug).maybeSingle<{ id: string }>();

  return !error && Boolean(data?.id);
}

async function resolveBeatId(beatId: string) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return beatId;
  }

  if (uuidPattern.test(beatId)) {
    return beatId;
  }

  const { data, error } = await supabase.from("beats").select("id").eq("slug", beatId).maybeSingle<{ id: string }>();

  if (error || !data?.id) {
    return "";
  }

  return data.id;
}

export async function getUserBeatAccess(userId: string, supabaseOverride?: SupabaseClient | null) {
  const supabase = supabaseOverride ?? getSupabaseBrowserSessionClient() ?? getSupabaseClient();

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

export async function getUsersWithAccessToBeat(beatId: string): Promise<User[]> {
  const supabase = getSupabaseClient();
  const resolvedBeatId = await resolveBeatId(beatId);

  if (!supabase || !resolvedBeatId) {
    return [];
  }

  const { data, error } = await supabase
    .from("beat_access")
    .select("profiles(id,email,username,display_name,phone,role)")
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
  const authClient = await getAuthenticatedBrowserClient();
  const supabase = authClient.supabase;
  const resolvedBeatId = await resolveBeatId(beatId);

  if (!supabase) {
    return { ok: false, message: authClient.message };
  }

  if (!resolvedBeatId) {
    return { ok: false, message: "No se encontró el UUID real del beat en Supabase." };
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

  return { ok: false, message: "No se pudo actualizar la información. Intenta de nuevo." };
}

function normalizePhone(phone: string) {
  return phone.trim().replace(/\s+/g, " ");
}

function isValidPhone(phone: string) {
  return /^[0-9+\-()\s]+$/.test(phone) && phone.replace(/\D/g, "").length >= 8;
}

export async function createAccessRequestWithPhone(userId: string, beatId: string, input: { phone: string; message?: string; currentPhone?: string | null }) {
  const phone = normalizePhone(input.currentPhone || input.phone);

  if (!phone || !isValidPhone(phone)) {
    return { ok: false, message: "Agrega tu teléfono para solicitar acceso." };
  }

  if (!input.currentPhone) {
    const phoneResult = await updateProfilePhone(userId, phone);

    if (!phoneResult.ok) {
      return { ok: false, message: "No se pudo guardar el teléfono." };
    }
  }

  return createAccessRequest(userId, beatId, `Teléfono: ${phone}\nMensaje: ${input.message?.trim() || "Sin mensaje"}`);
}

export async function getAccessRequests() {
  const supabase = getSupabaseBrowserSessionClient() ?? getSupabaseClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("access_requests")
    .select("id,user_id,beat_id,status,message,created_at,updated_at,profiles(email,username,display_name,phone),beats(slug,title)")
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return (data as AccessRequestRow[]).filter(isRecentAnsweredRequest);
}

export async function getAccessRequestsForUser(userId: string) {
  const supabase = getSupabaseBrowserSessionClient() ?? getSupabaseClient();

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

  return (data as AccessRequestRow[]).filter(isRecentAnsweredRequest);
}

export async function approveAccessRequest(requestId: string) {
  const authClient = await getAuthenticatedBrowserClient();
  const supabase = authClient.supabase;

  if (!supabase) {
    return { ok: false, message: authClient.message };
  }

  const { data: request, error: requestError } = await supabase
    .from("access_requests")
    .select("id,user_id,beat_id")
    .eq("id", requestId)
    .single<{ id: string; user_id: string; beat_id: string }>();

  if (requestError || !request) {
    return { ok: false, message: requestError?.message ?? "Solicitud no encontrada." };
  }

  const { error: accessError } = await supabase.from("beat_access").upsert(
    {
      user_id: request.user_id,
      beat_id: request.beat_id,
      granted_by: authClient.sessionInfo.userId,
    },
    { onConflict: "user_id,beat_id" },
  );

  if (accessError) {
    return { ok: false, message: "No se pudo actualizar la información. Intenta de nuevo." };
  }

  const { error: updateError } = await supabase.from("access_requests").update({ status: "approved" }).eq("id", requestId);

  return updateError ? { ok: false, message: "No se pudo actualizar la información. Intenta de nuevo." } : { ok: true };
}

export async function rejectAccessRequest(requestId: string) {
  const authClient = await getAuthenticatedBrowserClient();
  const supabase = authClient.supabase;

  if (!supabase) {
    return { ok: false, message: authClient.message };
  }

  const { error } = await supabase.from("access_requests").update({ status: "rejected" }).eq("id", requestId);

  return error ? { ok: false, message: "No se pudo actualizar la información. Intenta de nuevo." } : { ok: true };
}

export async function markAccessRequestContacted(requestId: string, currentMessage?: string | null) {
  const authClient = await getAuthenticatedBrowserClient();
  const supabase = authClient.supabase;

  if (!supabase) {
    return { ok: false, message: authClient.message };
  }

  const marker = "[contactado]";
  const message = currentMessage?.includes(marker) ? currentMessage : `${currentMessage || ""}\n${marker}`.trim();
  const { error } = await supabase.from("access_requests").update({ message }).eq("id", requestId);

  return error ? { ok: false, message: "No se pudo actualizar la información. Intenta de nuevo." } : { ok: true, message: "Solicitud marcada como contactada." };
}

export async function grantBeatAccess(userId: string, beatId: string) {
  const authClient = await getAuthenticatedBrowserClient();
  const supabase = authClient.supabase;
  const resolvedBeatId = await resolveBeatId(beatId);

  if (!supabase) {
    return { ok: false, message: authClient.message };
  }

  if (!resolvedBeatId) {
    return { ok: false, message: "No se encontró el UUID real del beat en Supabase." };
  }

  const { error } = await supabase.from("beat_access").upsert(
    {
      user_id: userId,
      beat_id: resolvedBeatId,
      granted_by: authClient.sessionInfo.userId,
    },
    { onConflict: "user_id,beat_id" },
  );

  if (error) {
    return { ok: false, message: "No se pudo actualizar la información. Intenta de nuevo." };
  }

  await supabase.from("access_requests").update({ status: "approved" }).eq("user_id", userId).eq("beat_id", resolvedBeatId).eq("status", "pending");

  return { ok: true };
}

export async function revokeBeatAccess(userId: string, beatId: string) {
  const authClient = await getAuthenticatedBrowserClient();
  const supabase = authClient.supabase;
  const resolvedBeatId = await resolveBeatId(beatId);

  if (!supabase) {
    return { ok: false, message: authClient.message };
  }

  if (!resolvedBeatId) {
    return { ok: false, message: "No se encontró el UUID real del beat en Supabase." };
  }

  const { error } = await supabase.from("beat_access").delete().eq("user_id", userId).eq("beat_id", resolvedBeatId);

  return error ? { ok: false, message: "No se pudo actualizar la información. Intenta de nuevo." } : { ok: true };
}

export async function getProfiles() {
  const result = await getProfilesResult();

  return result.users;
}

export async function getProfilesResult(supabaseOverride?: SupabaseClient | null) {
  const supabase = supabaseOverride ?? getSupabaseBrowserSessionClient() ?? getSupabaseClient();

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
    .select("id,email,username,display_name,phone,role,created_at,updated_at")
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

export async function updateProfile(userId: string, input: { username: string; displayName: string; phone?: string }) {
  const authClient = await getAuthenticatedBrowserClient();
  const supabase = authClient.supabase;
  const username = input.username.trim().replace(/^@+/, "").toLowerCase();
  const phone = normalizePhone(input.phone ?? "");
  const diagnostics = {
    profileId: userId,
    authUserId: undefined as string | undefined,
    payload: null as Record<string, unknown> | null,
    error: null as { message?: string; code?: string; details?: string; hint?: string } | null,
  };

  if (!supabase) {
    return { ok: false, message: authClient.message, diagnostics };
  }

  if (username.length < 3 || username.includes(" ")) {
    return { ok: false, message: "Username inválido: mínimo 3 caracteres y sin espacios.", diagnostics };
  }

  if (phone && !isValidPhone(phone)) {
    return { ok: false, message: "Teléfono inválido. Usa mínimo 8 dígitos.", diagnostics };
  }

  diagnostics.authUserId = authClient.sessionInfo.userId ?? undefined;

  if (authClient.sessionInfo.userId !== userId) {
    return { ok: false, message: "No hay profile real autenticado para esta acción.", diagnostics };
  }

  const payload = {
    username,
    display_name: input.displayName.trim() || username,
    phone: phone || null,
  };
  diagnostics.payload = payload;

  const { error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", userId);

  if (error) {
    diagnostics.error = {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    };
    if (process.env.NODE_ENV === "development") {
      console.error("B.R update profile error", diagnostics);
    }
    return { ok: false, message: "No se pudieron guardar los cambios", diagnostics };
  }

  return { ok: true, message: "Cambios guardados", diagnostics };
}

export async function updateProfilePhone(userId: string, phoneInput: string) {
  const authClient = await getAuthenticatedBrowserClient();
  const supabase = authClient.supabase;
  const phone = normalizePhone(phoneInput);

  if (!supabase) {
    return { ok: false, message: authClient.message };
  }

  if (!phone || !isValidPhone(phone)) {
    return { ok: false, message: "Agrega tu teléfono para solicitar acceso." };
  }

  if (authClient.sessionInfo.userId !== userId) {
    return { ok: false, message: "No hay profile real autenticado para esta acción." };
  }

  const { error } = await supabase.from("profiles").update({ phone }).eq("id", userId);

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("B.R update phone error", error);
    }
    return { ok: false, message: "No se pudo guardar el teléfono." };
  }

  return { ok: true, message: "Teléfono guardado." };
}

export async function deleteOwnAccount() {
  const authClient = await getAuthenticatedBrowserClient();

  if (!authClient.supabase) {
    return { ok: false, message: authClient.message };
  }

  const { data: sessionData } = await authClient.supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  if (!token) {
    return { ok: false, message: "Sesión no válida." };
  }

  const response = await fetch("/api/account/delete", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const result = await response.json().catch(() => ({ ok: false, message: "No se pudo eliminar la cuenta." }));

  if (!response.ok || !result.ok) {
    return { ok: false, message: result.message ?? "No se pudo eliminar la cuenta." };
  }

  await authClient.supabase.auth.signOut();
  return { ok: true, message: "Cuenta eliminada." };
}

export async function recoverDeletedAccountAccess() {
  const authClient = await getAuthenticatedBrowserClient();

  if (!authClient.supabase) {
    return { ok: false, restored: 0, message: authClient.message };
  }

  const { data: sessionData } = await authClient.supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  if (!token) {
    return { ok: false, restored: 0, message: "Sesión no válida." };
  }

  const response = await fetch("/api/account/recover-access", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const result = await response.json().catch(() => ({ ok: false, restored: 0, message: "No se pudo recuperar el acceso." }));

  return {
    ok: Boolean(response.ok && result.ok),
    restored: typeof result.restored === "number" ? result.restored : 0,
    message: typeof result.message === "string" ? result.message : "",
  };
}

export async function deleteUserAsAdmin(userId: string) {
  const authClient = await getAuthenticatedBrowserClient();

  if (!authClient.supabase) {
    return { ok: false, message: authClient.message };
  }

  const { data: sessionData } = await authClient.supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  if (!token) {
    return { ok: false, message: "Sesión no válida." };
  }

  const response = await fetch("/api/admin/delete-user", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId }),
  });
  const result = await response.json().catch(() => ({ ok: false, message: "No se pudo eliminar el usuario." }));

  if (!response.ok || !result.ok) {
    return { ok: false, message: result.message ?? "No se pudo eliminar el usuario." };
  }

  return { ok: true, message: "Usuario eliminado." };
}

export async function deleteBeatAsAdmin(beatId: string) {
  const authClient = await getAuthenticatedBrowserClient();

  if (!authClient.supabase) {
    return { ok: false, message: authClient.message };
  }

  const { data: sessionData } = await authClient.supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  if (!token) {
    return { ok: false, message: "Sesión no válida." };
  }

  const response = await fetch("/api/admin/delete-beat", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ beatId }),
  });
  const result = await response.json().catch(() => ({ ok: false, message: "No se pudo eliminar el beat." }));

  if (!response.ok || !result.ok) {
    return { ok: false, message: result.message ?? "No se pudo eliminar el beat." };
  }

  return { ok: true, message: result.message ?? "Beat eliminado del catálogo." };
}

export async function updateBeatPlaybackVisibilityAsAdmin(beatId: string, playbackVisibility: PlaybackVisibilityInput) {
  const authClient = await getAuthenticatedBrowserClient();
  const supabase = authClient.supabase;

  if (!supabase) {
    return { ok: false, message: authClient.message };
  }

  const safePlaybackVisibility: PlaybackVisibilityInput = playbackVisibility === "public" ? "public" : "private";
  const matchColumn = uuidPattern.test(beatId) ? "id" : "slug";
  const { error } = await supabase
    .from("beats")
    .update({ playback_visibility: safePlaybackVisibility })
    .eq(matchColumn, beatId);

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("B.R update beat playback visibility error", error);
    }

    return { ok: false, message: "No se pudo actualizar la visibilidad." };
  }

  return { ok: true, message: "Visibilidad de reproducción actualizada." };
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createBeatWithUpload(input: { file: File; title: string; slug: string; genre: string; bpm: string; musicalKey: string; playbackVisibility?: PlaybackVisibilityInput }) {
  const authClient = await getAuthenticatedBrowserClient();
  const supabase = authClient.supabase;
  const slug = slugify(input.title);
  const diagnostics = {
    authUser: null as { id?: string; email?: string } | null,
    payload: null as Record<string, unknown> | null,
    error: null as { message?: string; code?: string; details?: string; hint?: string } | null,
  };

  if (!supabase) {
    return { ok: false, message: authClient.message, diagnostics };
  }

  if (!input.file || !input.title.trim() || !slug) {
    return { ok: false, message: "MP3, título y slug son obligatorios.", diagnostics };
  }

  diagnostics.authUser = {
    id: authClient.sessionInfo.userId ?? undefined,
    email: authClient.sessionInfo.userEmail ?? undefined,
  };

  if (await beatSlugExists(slug, supabase)) {
    return { ok: false, message: "Ese nombre ya está en uso. Usa otro nombre para el beat.", diagnostics };
  }

  const safeFilename = input.file.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
  const path = `full/${slug}/${Date.now()}-${safeFilename}`;
  const { error: uploadError } = await supabase.storage.from("beats").upload(path, input.file, {
    cacheControl: "3600",
    upsert: false,
    contentType: input.file.type || "audio/mpeg",
  });

  if (uploadError) {
    diagnostics.error = {
      message: uploadError.message,
      code: "code" in uploadError ? String(uploadError.code) : undefined,
    };
    if (process.env.NODE_ENV === "development") {
      console.error("B.R upload beat storage error", diagnostics);
    }
    return { ok: false, message: uploadError.message.includes("Bucket") ? "Bucket beats no existe o no está accesible." : "No se pudo subir el MP3.", diagnostics };
  }

  const { data: publicData } = supabase.storage.from("beats").getPublicUrl(path);
  const publicUrl = publicData.publicUrl;
  const payload = {
    slug,
    title: input.title.trim(),
    genre: input.genre.trim() || null,
    bpm: input.bpm ? Number(input.bpm) : null,
    musical_key: input.musicalKey.trim() || null,
    full_audio_url: publicUrl,
    preview_url: publicUrl,
    preview_duration_seconds: 15,
    preview_updated_at: null,
    playback_visibility: input.playbackVisibility === "public" ? "public" : "private",
    is_active: true,
  };
  diagnostics.payload = payload;
  const { error: insertError } = await supabase.from("beats").insert(payload);

  if (insertError) {
    await supabase.storage.from("beats").remove([path]);
    diagnostics.error = {
      message: insertError.message,
      code: insertError.code,
      details: insertError.details,
      hint: insertError.hint,
    };
    if (process.env.NODE_ENV === "development") {
      console.error("B.R create beat insert error", diagnostics);
    }

    if (insertError.code === "23505" || (insertError as { status?: number }).status === 409 || insertError.message.includes("409") || insertError.message.toLowerCase().includes("duplicate")) {
      return { ok: false, message: "Ese nombre ya está en uso. Usa otro nombre para el beat.", diagnostics };
    }

    return { ok: false, message: "No se pudo crear el beat.", diagnostics };
  }

  return { ok: true, message: "Beat guardado correctamente", slug, diagnostics };
}

export async function updateBeatPreviewWithUpload(input: { beatId: string; slug: string; file: File; durationSeconds: number }) {
  const authClient = await getAuthenticatedBrowserClient();
  const supabase = authClient.supabase;
  const durationSeconds = Math.min(30, Math.max(15, Math.round(input.durationSeconds || 15)));
  const diagnostics = {
    authUser: null as { id?: string; email?: string } | null,
    payload: null as Record<string, unknown> | null,
    error: null as { message?: string; code?: string; details?: string; hint?: string } | null,
  };

  if (!supabase) {
    return { ok: false, message: authClient.message, diagnostics };
  }

  diagnostics.authUser = {
    id: authClient.sessionInfo.userId ?? undefined,
    email: authClient.sessionInfo.userEmail ?? undefined,
  };

  if (!input.beatId || !input.slug || !input.file) {
    return { ok: false, message: "Beat y archivo preview son obligatorios.", diagnostics };
  }

  if (!input.file.name.toLowerCase().endsWith(".mp3") && input.file.type !== "audio/mpeg") {
    return { ok: false, message: "El preview debe ser un archivo MP3.", diagnostics };
  }

  const safeFilename = input.file.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
  const path = `previews/${input.slug}/${Date.now()}-${safeFilename}`;

  const { error: uploadError } = await supabase.storage.from("beats").upload(path, input.file, {
    cacheControl: "3600",
    upsert: false,
    contentType: input.file.type || "audio/mpeg",
  });

  if (uploadError) {
    diagnostics.error = {
      message: uploadError.message,
      code: "code" in uploadError ? String(uploadError.code) : undefined,
    };

    if (process.env.NODE_ENV === "development") {
      console.error("B.R upload preview storage error", diagnostics);
    }

    return { ok: false, message: "No se pudo subir el preview.", diagnostics };
  }

  const { data: publicData } = supabase.storage.from("beats").getPublicUrl(path);
  const publicUrl = publicData.publicUrl;

  const payload = {
    preview_url: publicUrl,
    preview_duration_seconds: durationSeconds,
    preview_updated_at: new Date().toISOString(),
  };

  diagnostics.payload = payload;

  const matchColumn = uuidPattern.test(input.beatId) ? "id" : "slug";
  let { data: updatedBeat, error: updateError } = await supabase
    .from("beats")
    .update(payload)
    .eq(matchColumn, input.beatId)
    .select("id,slug,preview_url,preview_duration_seconds,preview_updated_at")
    .maybeSingle<{ id: string; slug: string; preview_url: string; preview_duration_seconds: number | null; preview_updated_at: string | null }>();

  if (!updateError && !updatedBeat && input.slug && input.slug !== input.beatId) {
    const fallbackResult = await supabase
      .from("beats")
      .update(payload)
      .eq("slug", input.slug)
      .select("id,slug,preview_url,preview_duration_seconds,preview_updated_at")
      .maybeSingle<{ id: string; slug: string; preview_url: string; preview_duration_seconds: number | null; preview_updated_at: string | null }>();

    updatedBeat = fallbackResult.data;
    updateError = fallbackResult.error;
  }

  if (updateError || !updatedBeat) {
    await supabase.storage.from("beats").remove([path]);

    diagnostics.error = {
      message: updateError?.message ?? "No rows updated",
      code: updateError?.code,
      details: updateError?.details,
      hint: updateError?.hint,
    };

    if (process.env.NODE_ENV === "development") {
      console.error("B.R update beat preview error", diagnostics);
    }

    return { ok: false, message: "No se pudo actualizar el preview del beat.", diagnostics };
  }

  return { ok: true, message: "Preview actualizado correctamente.", previewUrl: updatedBeat.preview_url, durationSeconds: updatedBeat.preview_duration_seconds ?? durationSeconds, previewUpdatedAt: updatedBeat.preview_updated_at, diagnostics };
}
