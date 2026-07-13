import { createClient, type User as SupabaseAuthUser } from "@supabase/supabase-js";
import type { AccessRequestStatus } from "@/data/accessRequests";
import { allBeats, type Beat, type BeatRow } from "@/data/beats";
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
type BeatMetadataInput = {
  genre?: string | null;
  bpm?: number | string | null;
  musicalKey?: string | null;
  isActive?: boolean;
};

export type AdminChangeLog = {
  id: string;
  year: number;
  block_title: string;
  event_type: string;
  target_type: string | null;
  target_name: string | null;
  description: string;
  command_text: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  expires_at: string | null;
  is_deleted: boolean;
};

type AdminChangeLogInput = {
  year?: number;
  blockTitle: string;
  eventType: string;
  targetType?: string | null;
  targetName?: string | null;
  description: string;
  commandText?: string | null;
  metadata?: Record<string, unknown>;
  temporary?: boolean;
};

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
  contacted_at?: string | null;
  responded_at?: string | null;
  rejection_reason?: string | null;
  rejected_at?: string | null;
  rejected_by?: string | null;
  review_context?: AccessRequestReviewContext | null;
  review_revocation_id?: string | null;
  review_requested_at?: string | null;
  review_rejection_reason?: string | null;
  review_rejected_at?: string | null;
  review_rejected_by?: string | null;
  review_rejection_acknowledged_at?: string | null;
  profiles?: Pick<ProfileRow, "email" | "username" | "display_name" | "phone"> | Pick<ProfileRow, "email" | "username" | "display_name" | "phone">[] | null;
  beats?: Pick<BeatRowDb, "slug" | "title"> | Pick<BeatRowDb, "slug" | "title">[] | null;
};

export type AccessRequestReviewContext =
  | "initial_rejection"
  | "access_revocation";

export type AccessRevocationRow = {
  id: string;
  user_id: string;
  beat_id: string;
  reason: string;
  revoked_by: string | null;
  revoked_at: string | null;
  created_at: string | null;
  acknowledged_by_user: boolean;
  acknowledged_at: string | null;
  beats?: Pick<BeatRowDb, "slug" | "title"> | Pick<BeatRowDb, "slug" | "title">[] | null;
};

export const ACCESS_REVIEW_MARKER = "[revisión]";

export function isAccessReviewRequest(
  request: Pick<AccessRequestRow, "message" | "status"> | null | undefined,
) {
  return Boolean(
    request?.status === "review_pending" ||
      request?.status === "review_rejected" ||
      request?.message?.includes(ACCESS_REVIEW_MARKER),
  );
}

export function isOpenAccessRequest(
  request: Pick<AccessRequestRow, "status"> | null | undefined,
) {
  return Boolean(
    request &&
      [
        "pending",
        "contacted",
        "payment_pending",
        "paid",
        "review_pending",
      ].includes(request.status),
  );
}

export function isReviewPendingRequest(
  request: Pick<AccessRequestRow, "status"> | null | undefined,
) {
  return request?.status === "review_pending";
}

export function isReviewRejectedRequest(
  request: Pick<AccessRequestRow, "status"> | null | undefined,
) {
  return request?.status === "review_rejected";
}

export function canRequestReview(
  request: Pick<AccessRequestRow, "status"> | null | undefined,
  hasActiveRevocation = false,
) {
  if (isOpenAccessRequest(request) || isReviewRejectedRequest(request)) {
    return false;
  }

  return request?.status === "rejected" || hasActiveRevocation;
}

export function canAcknowledgeReviewRejection(
  request:
    | Pick<
        AccessRequestRow,
        "status" | "review_rejection_acknowledged_at"
      >
    | null
    | undefined,
) {
  return Boolean(
    request?.status === "review_rejected" &&
      !request.review_rejection_acknowledged_at,
  );
}

export function canCreateNewAccessRequest(
  request:
    | Pick<
        AccessRequestRow,
        "status" | "review_rejection_acknowledged_at"
      >
    | null
    | undefined,
) {
  return Boolean(
    !request ||
      (request.status === "review_rejected" &&
        request.review_rejection_acknowledged_at),
  );
}

const answeredRequestVisibleMs = 3 * 24 * 60 * 60 * 1000;

let supabaseClient: SupabaseClient | null = null;
let supabaseBrowserSessionClient: SupabaseClient | null = null;

function getSupabaseClient() {
  if (typeof window !== "undefined") {
    return getSupabaseBrowserSessionClient();
  }
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

  if (supabaseBrowserSessionClient) {
    return supabaseBrowserSessionClient;
  }

  supabaseBrowserSessionClient = createSupabaseBrowserClient() as SupabaseClient | null;

  return supabaseBrowserSessionClient;
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

function notifyAccessStateChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event("br-access-state-changed"));
  window.dispatchEvent(new Event("br-access-requests-refresh"));
  window.dispatchEvent(new Event("br-commercial-activity-refresh"));
}

const accessRequestColumns =
  "id,user_id,beat_id,status,message,created_at,updated_at,contacted_at,responded_at,rejection_reason,rejected_at,rejected_by,review_context,review_revocation_id,review_requested_at,review_rejection_reason,review_rejected_at,review_rejected_by,review_rejection_acknowledged_at";

function normalizeRequiredReason(reason: string | null | undefined) {
  const cleanReason = reason?.trim() ?? "";

  if (cleanReason.length < 5) {
    return {
      ok: false as const,
      message: "El motivo debe tener al menos 5 caracteres.",
    };
  }

  if (cleanReason.length > 500) {
    return {
      ok: false as const,
      message: "El motivo no puede superar 500 caracteres.",
    };
  }

  return { ok: true as const, reason: cleanReason };
}

async function getAuthenticatedAdminBrowserClient() {
  const authClient = await getAuthenticatedBrowserClient();

  if (!authClient.supabase || !authClient.sessionInfo.userId) {
    return { ...authClient, isAdmin: false as const };
  }

  const { data: profile, error } = await authClient.supabase
    .from("profiles")
    .select("role")
    .eq("id", authClient.sessionInfo.userId)
    .maybeSingle<{ role: "admin" | "user" }>();

  if (error || profile?.role !== "admin") {
    return {
      ...authClient,
      isAdmin: false as const,
      message: "Esta acción requiere permisos de administrador.",
    };
  }

  return { ...authClient, isAdmin: true as const };
}

function getFallbackRows(): BeatRow[] {
  return buildBeatRows(allBeats);
}

export function isRecentAnsweredRequest(request: Pick<AccessRequestRow, "status" | "updated_at" | "created_at" | "message" | "review_rejection_acknowledged_at">) {
  if (isOpenAccessRequest(request) || canAcknowledgeReviewRejection(request)) {
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
    isActive: row.is_active ?? true,
  });
}

export function buildBeatRows(beats: Beat[]): BeatRow[] {
  const groups = new Map<string, Beat[]>();
  const priority = ["Full Beats", "Trap", "Dark Trap", "Drill", "Boom Bap", "R&B", "Reggaeton", "Afrobeat", "Cinematic"];
  const priorityMap = new Map(priority.map((title, index) => [title.toLowerCase(), index]));

  const normalizeGenreTitle = (genre: string) => {
    const normalized = genre.trim().replace(/\s+/g, " ");
    const priorityTitle = priority.find((title) => title.toLowerCase() === normalized.toLowerCase());

    if (priorityTitle) {
      return priorityTitle;
    }

    return normalized || "Sin género";
  };

  const getGenreTitles = (genre: string) => {
    const seen = new Set<string>();
    const titles = genre
      .split(/[,/;|]+/)
      .map(normalizeGenreTitle)
      .filter((title) => {
        const key = title.toLowerCase();

        if (!title || seen.has(key)) {
          return false;
        }

        seen.add(key);
        return true;
      });

    return titles.length > 0 ? titles : ["Sin género"];
  };

  const addBeatToGroup = (title: string, beat: Beat) => {
    const rowBeats = groups.get(title) ?? [];

    if (rowBeats.some((item) => item.id === beat.id)) {
      return;
    }

    groups.set(title, [...rowBeats, beat]);
  };

  beats.forEach((beat) => {
    if (beat.playbackVisibility === "public") {
      addBeatToGroup("Full Beats", beat);
    }

    getGenreTitles(beat.genre || "Sin género").forEach((title) => {
      addBeatToGroup(title, beat);
    });
  });

  return Array.from(groups.entries())
    .sort(([titleA], [titleB]) => {
      const priorityA = priorityMap.get(titleA.toLowerCase());
      const priorityB = priorityMap.get(titleB.toLowerCase());

      if (priorityA !== undefined || priorityB !== undefined) {
        return (priorityA ?? Number.MAX_SAFE_INTEGER) - (priorityB ?? Number.MAX_SAFE_INTEGER);
      }

      return titleA.localeCompare(titleB, "es");
    })
    .map(([title, rowBeats]) => ({ title, beats: rowBeats }));
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

export async function getAdminBeats() {
  const supabase = getSupabaseBrowserSessionClient() ?? getSupabaseClient();

  if (!supabase) {
    return { beats: allBeats, rows: getFallbackRows(), usingFallback: true };
  }

  const { data, error } = await supabase
    .from("beats")
    .select("id,slug,title,genre,bpm,musical_key,preview_url,full_audio_url,preview_duration_seconds,preview_updated_at,playback_visibility,is_active")
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

async function resolveBeatId(beatId: string, supabaseOverride?: SupabaseClient | null) {
  const supabase = supabaseOverride ?? getSupabaseBrowserSessionClient() ?? getSupabaseClient();

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

export async function getUserAccessibleBeats(userId: string) {
  const supabase = getSupabaseBrowserSessionClient() ?? getSupabaseClient();

  if (!supabase || !userId) {
    return [] as Beat[];
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  if (sessionError || !token) {
    return [] as Beat[];
  }

  const response = await fetch("/api/account/recover-access", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const payload = await response.json().catch(() => ({
    ok: false,
    beats: [],
  }));

  if (!response.ok || !payload.ok || !Array.isArray(payload.beats)) {
    return [] as Beat[];
  }

  return (payload.beats as BeatRowDb[]).map(mapSupabaseBeat);
}

export async function getUserAccessRevocations(userId: string, supabaseOverride?: SupabaseClient | null) {
  const supabase = supabaseOverride ?? getSupabaseBrowserSessionClient() ?? getSupabaseClient();

  if (!supabase || !userId) {
    return [];
  }

  const { data, error } = await supabase
    .from("access_revocations")
    .select("id,user_id,beat_id,reason,revoked_by,revoked_at,created_at,acknowledged_by_user,acknowledged_at,beats(slug,title)")
    .eq("user_id", userId)
    .order("revoked_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as AccessRevocationRow[];
}

export async function acknowledgeAccessRevocation(userId: string, revocationId: string) {
  const supabase = getSupabaseBrowserSessionClient() ?? getSupabaseClient();

  if (!supabase || !userId || !revocationId) {
    return { ok: false, message: "No se pudo reconocer la revocación." };
  }

  const { error } = await supabase
    .from("access_revocations")
    .update({
      acknowledged_by_user: true,
      acknowledged_at: new Date().toISOString(),
    })
    .eq("id", revocationId)
    .eq("user_id", userId);

  if (error) {
    return { ok: false, message: "No se pudo ocultar el aviso. Intenta de nuevo." };
  }

  notifyAccessStateChanged();
  return { ok: true };
}

export async function getAccessRevocationsForBeat(beatId: string, supabaseOverride?: SupabaseClient | null) {
  const supabase = supabaseOverride ?? getSupabaseBrowserSessionClient() ?? getSupabaseClient();
  const resolvedBeatId = await resolveBeatId(beatId, supabase);

  if (!supabase || !resolvedBeatId) {
    return [];
  }

  const { data, error } = await supabase
    .from("access_revocations")
    .select("id,user_id,beat_id,reason,revoked_by,revoked_at,created_at,acknowledged_by_user,acknowledged_at,beats(slug,title)")
    .eq("beat_id", resolvedBeatId)
    .order("revoked_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as AccessRevocationRow[];
}

export async function canAccessBeatSupabase(userId: string, beatId: string) {
  const supabase = getSupabaseBrowserSessionClient() ?? getSupabaseClient();
  const resolvedBeatId = await resolveBeatId(beatId, supabase);

  if (!supabase || !userId || !resolvedBeatId) {
    return false;
  }

  const { data, error } = await supabase
    .from("beat_access")
    .select("user_id,beat_id")
    .eq("user_id", userId)
    .eq("beat_id", resolvedBeatId)
    .maybeSingle<{ user_id: string; beat_id: string }>();

  return !error && Boolean(data);
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
  const resolvedBeatId = await resolveBeatId(beatId, supabase);

  if (!supabase) {
    return { ok: false, message: authClient.message };
  }

  if (!resolvedBeatId) {
    return { ok: false, message: "No se encontró el UUID real del beat en Supabase." };
  }

  const { data: existingRequest, error: existingError } = await supabase
    .from("access_requests")
    .select(accessRequestColumns)
    .eq("user_id", userId)
    .eq("beat_id", resolvedBeatId)
    .maybeSingle<AccessRequestRow>();

  if (existingError) {
    return { ok: false, message: "No se pudo revisar tu solicitud anterior. Intenta de nuevo." };
  }

  if (existingRequest) {
    if (canCreateNewAccessRequest(existingRequest)) {
      return reopenAccessRequest(existingRequest.id);
    }

    return {
      ok: false,
      message: isOpenAccessRequest(existingRequest)
        ? "Tu solicitud ya está en proceso. B.R te responderá pronto."
        : "La solicitud actual no puede reabrirse desde su estado actual.",
    };
  }

  const { error } = await supabase.from("access_requests").insert({
    user_id: userId,
    beat_id: resolvedBeatId,
    message: message || null,
  });

  if (!error) {
    notifyAccessStateChanged();
    return { ok: true, message: "Solicitud enviada al admin." };
  }

  return { ok: false, message: "No se pudo actualizar la información. Intenta de nuevo." };
}

export async function createAccessReviewRequest(
  userId: string,
  beatId: string,
) {
  const existingRequest = await getAccessRequestForBeat(userId, beatId);

  if (existingRequest?.status === "rejected") {
    return requestAccessReview(userId, beatId, {
      reviewContext: "initial_rejection",
    });
  }

  const authClient = await getAuthenticatedBrowserClient();
  const supabase = authClient.supabase;
  const resolvedBeatId = await resolveBeatId(beatId, supabase);

  if (!supabase || !resolvedBeatId) {
    return {
      ok: false,
      message: !supabase
        ? authClient.message
        : "No se encontró el UUID real del beat en Supabase.",
    };
  }

  const { data: revocation, error } = await supabase
    .from("access_revocations")
    .select("id")
    .eq("user_id", userId)
    .eq("beat_id", resolvedBeatId)
    .order("revoked_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (error || !revocation) {
    return {
      ok: false,
      message: "No existe un rechazo o una revocación que pueda revisarse.",
    };
  }

  return requestAccessReview(userId, resolvedBeatId, {
    reviewContext: "access_revocation",
    reviewRevocationId: revocation.id,
  });
}

export async function requestAccessReview(
  userId: string,
  beatId: string,
  input: {
    reviewContext: AccessRequestReviewContext;
    reviewRevocationId?: string | null;
  },
) {
  const authClient = await getAuthenticatedBrowserClient();
  const supabase = authClient.supabase;
  const requesterId = authClient.sessionInfo.userId;
  const resolvedBeatId = await resolveBeatId(beatId, supabase);

  if (!supabase || !requesterId) {
    return { ok: false, message: authClient.message };
  }

  if (requesterId !== userId) {
    return {
      ok: false,
      message: "Solo el propietario puede pedir revisión de su solicitud.",
    };
  }

  if (!resolvedBeatId) {
    return {
      ok: false,
      message: "No se encontró el UUID real del beat en Supabase.",
    };
  }

  const { data: existingRequest, error: requestError } = await supabase
    .from("access_requests")
    .select(accessRequestColumns)
    .eq("user_id", userId)
    .eq("beat_id", resolvedBeatId)
    .maybeSingle<AccessRequestRow>();

  if (requestError) {
    return { ok: false, message: "No se pudo validar la solicitud actual." };
  }

  if (!existingRequest) {
    return {
      ok: false,
      message: "No existe una solicitud previa que pueda revisarse.",
    };
  }

  if (isReviewPendingRequest(existingRequest)) {
    return { ok: false, message: "Ya existe una revisión pendiente." };
  }

  let reviewRevocationId: string | null = null;

  if (input.reviewContext === "initial_rejection") {
    if (existingRequest?.status !== "rejected") {
      return {
        ok: false,
        message: "Solo una solicitud rechazada puede pedir esta revisión.",
      };
    }
  } else {
    if (!input.reviewRevocationId) {
      return {
        ok: false,
        message: "La revisión debe vincularse a una revocación.",
      };
    }

    const [{ data: revocation }, { data: activeAccess }] = await Promise.all([
      supabase
        .from("access_revocations")
        .select("id")
        .eq("id", input.reviewRevocationId)
        .eq("user_id", userId)
        .eq("beat_id", resolvedBeatId)
        .maybeSingle<{ id: string }>(),
      supabase
        .from("beat_access")
        .select("user_id,beat_id")
        .eq("user_id", userId)
        .eq("beat_id", resolvedBeatId)
        .maybeSingle<{ user_id: string; beat_id: string }>(),
    ]);

    if (!revocation || activeAccess) {
      return {
        ok: false,
        message: activeAccess
          ? "El usuario ya tiene acceso activo a este beat."
          : "No se encontró una revocación válida para revisar.",
      };
    }

    reviewRevocationId = revocation.id;
  }

  if (!canRequestReview(existingRequest, Boolean(reviewRevocationId))) {
    return {
      ok: false,
      message: "La solicitud actual no permite pedir una revisión.",
    };
  }

  const { error } = await supabase.rpc("request_access_review", {
    p_request_id: existingRequest.id,
    p_review_context: input.reviewContext,
    p_review_revocation_id: reviewRevocationId,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  notifyAccessStateChanged();
  return { ok: true, message: "Solicitud de revisión enviada" };
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
    .select(`${accessRequestColumns},profiles(email,username,display_name,phone),beats(slug,title)`)
    .order("created_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as AccessRequestRow[];
}

export async function getAccessRequestsForUser(userId: string) {
  const supabase = getSupabaseBrowserSessionClient() ?? getSupabaseClient();

  if (!supabase || !userId) {
    return [];
  }

  const { data, error } = await supabase
    .from("access_requests")
    .select(`${accessRequestColumns},beats(slug,title)`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return (data as AccessRequestRow[]).filter(isRecentAnsweredRequest);
}

export async function getAccessRequestForBeat(userId: string, beatId: string) {
  const supabase = getSupabaseBrowserSessionClient() ?? getSupabaseClient();
  const resolvedBeatId = await resolveBeatId(beatId, supabase);

  if (!supabase || !userId || !resolvedBeatId) {
    return null;
  }

  const { data, error } = await supabase
    .from("access_requests")
    .select(`${accessRequestColumns},beats(slug,title)`)
    .eq("user_id", userId)
    .eq("beat_id", resolvedBeatId)
    .maybeSingle<AccessRequestRow>();

  if (error || !data) {
    return null;
  }

  return data;
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


  const { error: updateError } = await supabase.from("access_requests").update({ status: "fulfilled", responded_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", requestId);

  if (updateError) {
    return { ok: false, message: "El acceso se concedió, pero no se pudo cerrar la solicitud." };
  }

  notifyAccessStateChanged();
  return { ok: true };
}

export async function rejectAccessRequest(requestId: string, reason?: string) {
  const reasonResult = normalizeRequiredReason(reason);

  if (!reasonResult.ok) {
    return reasonResult;
  }

  const authClient = await getAuthenticatedAdminBrowserClient();
  const supabase = authClient.supabase;

  if (!supabase || !authClient.isAdmin || !authClient.sessionInfo.userId) {
    return { ok: false, message: authClient.message };
  }

  const { data: request, error: requestError } = await supabase
    .from("access_requests")
    .select(accessRequestColumns)
    .eq("id", requestId)
    .maybeSingle<AccessRequestRow>();

  if (requestError || !request) {
    return { ok: false, message: requestError?.message ?? "Solicitud no encontrada." };
  }

  if (
    !["pending", "contacted", "payment_pending", "paid"].includes(
      request.status,
    )
  ) {
    return {
      ok: false,
      message: `No se puede rechazar una solicitud con estado ${request.status}.`,
    };
  }

  const { data: activeAccess, error: accessError } = await supabase
    .from("beat_access")
    .select("user_id,beat_id")
    .eq("user_id", request.user_id)
    .eq("beat_id", request.beat_id)
    .maybeSingle<{ user_id: string; beat_id: string }>();

  if (accessError || activeAccess) {
    return {
      ok: false,
      message: activeAccess
        ? "La solicitud no puede rechazarse porque el acceso ya está activo."
        : "No se pudo comprobar el acceso actual.",
    };
  }

  const now = new Date().toISOString();
  const { data: rejectedRequest, error } = await supabase
    .from("access_requests")
    .update({
      status: "rejected",
      rejection_reason: reasonResult.reason,
      rejected_at: now,
      rejected_by: authClient.sessionInfo.userId,
      responded_at: now,
      updated_at: now,
    })
    .eq("id", requestId)
    .eq("status", request.status)
    .select("id,status")
    .maybeSingle<{ id: string; status: AccessRequestStatus }>();

  if (error || rejectedRequest?.status !== "rejected") {
    return {
      ok: false,
      message: "No se pudo rechazar la solicitud desde su estado actual.",
    };
  }

  notifyAccessStateChanged();
  return { ok: true, message: "Solicitud rechazada." };
}

export async function rejectAccessReview(
  requestId: string,
  reason: string,
) {
  const reasonResult = normalizeRequiredReason(reason);

  if (!reasonResult.ok) {
    return reasonResult;
  }

  const authClient = await getAuthenticatedAdminBrowserClient();
  const supabase = authClient.supabase;

  if (!supabase || !authClient.isAdmin || !authClient.sessionInfo.userId) {
    return { ok: false, message: authClient.message };
  }

  const { data: request, error: requestError } = await supabase
    .from("access_requests")
    .select(accessRequestColumns)
    .eq("id", requestId)
    .maybeSingle<AccessRequestRow>();

  if (requestError || !request) {
    return { ok: false, message: "Solicitud de revisión no encontrada." };
  }

  if (!isReviewPendingRequest(request)) {
    return {
      ok: false,
      message: "Solo una revisión pendiente puede rechazarse.",
    };
  }

  const now = new Date().toISOString();
  const { data: rejectedReview, error } = await supabase
    .from("access_requests")
    .update({
      status: "review_rejected",
      review_rejection_reason: reasonResult.reason,
      review_rejected_at: now,
      review_rejected_by: authClient.sessionInfo.userId,
      review_rejection_acknowledged_at: null,
      responded_at: now,
      updated_at: now,
    })
    .eq("id", requestId)
    .eq("status", "review_pending")
    .select("id,status")
    .maybeSingle<{ id: string; status: AccessRequestStatus }>();

  if (error || rejectedReview?.status !== "review_rejected") {
    return {
      ok: false,
      message: "No se pudo rechazar la revisión desde su estado actual.",
    };
  }

  notifyAccessStateChanged();
  return { ok: true, message: "Revisión rechazada." };
}

export async function acknowledgeAccessReviewRejection(requestId: string) {
  const authClient = await getAuthenticatedBrowserClient();
  const supabase = authClient.supabase;
  const requesterId = authClient.sessionInfo.userId;

  if (!supabase || !requesterId) {
    return { ok: false, message: authClient.message };
  }

  const { data: request, error: requestError } = await supabase
    .from("access_requests")
    .select(accessRequestColumns)
    .eq("id", requestId)
    .eq("user_id", requesterId)
    .maybeSingle<AccessRequestRow>();

  if (requestError || !request) {
    return { ok: false, message: "Revisión no encontrada." };
  }

  if (!canAcknowledgeReviewRejection(request)) {
    return {
      ok: false,
      message: "Este rechazo de revisión no puede aceptarse nuevamente.",
    };
  }

  const { error } = await supabase.rpc(
    "acknowledge_access_review_rejection",
    {
      p_request_id: requestId,
    },
  );

  if (error) {
    return { ok: false, message: error.message };
  }

  notifyAccessStateChanged();
  return { ok: true, message: "Motivo del rechazo aceptado." };
}

export async function reopenAccessRequest(requestId: string) {
  const authClient = await getAuthenticatedBrowserClient();
  const supabase = authClient.supabase;
  const requesterId = authClient.sessionInfo.userId;

  if (!supabase || !requesterId) {
    return { ok: false, message: authClient.message };
  }

  const { data: request, error: requestError } = await supabase
    .from("access_requests")
    .select(accessRequestColumns)
    .eq("id", requestId)
    .eq("user_id", requesterId)
    .maybeSingle<AccessRequestRow>();

  if (requestError || !request) {
    return { ok: false, message: "Solicitud no encontrada." };
  }

  if (!canCreateNewAccessRequest(request)) {
    return {
      ok: false,
      message:
        "La solicitud no puede reabrirse hasta aceptar el rechazo de la revisión.",
    };
  }

  const { error } = await supabase.rpc("reopen_access_request", {
    p_request_id: requestId,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  notifyAccessStateChanged();
  return { ok: true, message: "Solicitud reenviada al admin." };
}

export async function markAccessRequestContacted(requestId: string, currentMessage?: string | null) {
  const authClient = await getAuthenticatedBrowserClient();
  const supabase = authClient.supabase;

  if (!supabase) {
    return { ok: false, message: authClient.message };
  }

  const marker = "[contactado]";
  const message = currentMessage?.includes(marker) ? currentMessage : `${currentMessage || ""}\n${marker}`.trim();
  const { error } = await supabase.from("access_requests").update({ status: "payment_pending", message, contacted_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", requestId);

  if (error) {
    return { ok: false, message: "No se pudo actualizar la información. Intenta de nuevo." };
  }

  notifyAccessStateChanged();
  return { ok: true, message: "Cliente contactado. Solicitud marcada como pago pendiente." };
}

export async function grantBeatAccess(userId: string, beatId: string) {
  const authClient = await getAuthenticatedBrowserClient();
  const supabase = authClient.supabase;
  const resolvedBeatId = await resolveBeatId(beatId, supabase);

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


  await supabase
    .from("access_requests")
    .update({ status: "fulfilled", responded_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("beat_id", resolvedBeatId)
    .in("status", ["pending", "contacted", "payment_pending", "paid", "approved"]);

  notifyAccessStateChanged();
  return { ok: true };
}

export async function revokeBeatAccess(userId: string, beatId: string, reason: string) {
  const authClient = await getAuthenticatedBrowserClient();
  const supabase = authClient.supabase;
  const resolvedBeatId = await resolveBeatId(beatId, supabase);
  const cleanReason = reason.trim();

  if (!supabase) {
    return { ok: false, message: authClient.message };
  }

  if (!resolvedBeatId) {
    return { ok: false, message: "No se encontró el UUID real del beat en Supabase." };
  }

  if (cleanReason.length < 5) {
    return { ok: false, message: "El motivo debe tener al menos 5 caracteres." };
  }

  if (cleanReason.length > 500) {
    return { ok: false, message: "El motivo no puede superar 500 caracteres." };
  }

  const { data: activeAccess, error: activeAccessError } = await supabase
    .from("beat_access")
    .select("user_id,beat_id")
    .eq("user_id", userId)
    .eq("beat_id", resolvedBeatId)
    .maybeSingle<{ user_id: string; beat_id: string }>();

  if (activeAccessError) {
    return { ok: false, message: "No se pudo comprobar el acceso actual." };
  }

  if (!activeAccess) {
    notifyAccessStateChanged();
    return { ok: true, message: "El acceso ya estaba revocado." };
  }

  const { error: deleteError } = await supabase
    .from("beat_access")
    .delete()
    .eq("user_id", userId)
    .eq("beat_id", resolvedBeatId);

  if (deleteError) {
    return { ok: false, message: "No se pudo eliminar el acceso activo." };
  }

  const { error: revocationError } = await supabase.from("access_revocations").insert({
    user_id: userId,
    beat_id: resolvedBeatId,
    reason: cleanReason,
    revoked_by: authClient.sessionInfo.userId,
    revoked_at: new Date().toISOString(),
  });

  if (revocationError) {
    await supabase.from("beat_access").upsert(
      {
        user_id: userId,
        beat_id: resolvedBeatId,
        granted_by: authClient.sessionInfo.userId,
      },
      { onConflict: "user_id,beat_id" },
    );

    if (process.env.NODE_ENV === "development") {
      console.error("B.R access revocation insert error", revocationError);
    }

    return {
      ok: false,
      message: `No se pudo registrar el motivo de revocación: ${revocationError.message}`,
    };
  }

  notifyAccessStateChanged();
  return { ok: true, message: "Acceso revocado correctamente." };
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

  const { data: accessData, error: accessError } = await supabase
    .from("beat_access")
    .select("user_id,beat_id,beats(slug)");

  if (accessError) {
    return {
      users: [],
      error: accessError.message,
      emptyReason: "No se pudieron cargar los accesos activos desde beat_access.",
    };
  }

  const accessByUser = new Map<string, string[]>();

  for (const row of (accessData ?? []) as BeatAccessRow[]) {
    const beat = first(row.beats);
    const currentIds = accessByUser.get(row.user_id) ?? [];
    const nextIds = [row.beat_id, beat?.slug].filter(Boolean) as string[];
    accessByUser.set(row.user_id, Array.from(new Set([...currentIds, ...nextIds])));
  }

  const users = profiles.map((profile) => mapProfileToUser(profile, accessByUser.get(profile.id) ?? []));

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

export async function updateBeatMetadataAsAdmin(beatId: string, input: BeatMetadataInput) {
  const authClient = await getAuthenticatedBrowserClient();
  const supabase = authClient.supabase;

  if (!supabase) {
    return { ok: false, message: authClient.message };
  }

  if (!beatId) {
    return { ok: false, message: "Beat inválido." };
  }

  const resolvedBeatId = await resolveBeatId(beatId, supabase);

  if (!resolvedBeatId) {
    return { ok: false, message: "No se encontró el UUID real del beat en Supabase." };
  }

  const payload: {
    genre?: string | null;
    bpm?: number | null;
    musical_key?: string | null;
    is_active?: boolean;
  } = {};

  if ("genre" in input) {
    payload.genre = input.genre?.trim() || null;
  }

  if ("musicalKey" in input) {
    payload.musical_key = input.musicalKey?.trim() || null;
  }

  if ("isActive" in input) {
    payload.is_active = Boolean(input.isActive);
  }

  if ("bpm" in input) {
    if (input.bpm === null || input.bpm === "") {
      payload.bpm = null;
    } else {
      const bpm = Number(input.bpm);

      if (!Number.isFinite(bpm) || bpm < 40 || bpm > 240) {
        return { ok: false, message: "BPM inválido. Usa un número entre 40 y 240." };
      }

      payload.bpm = Math.round(bpm);
    }
  }

  if (Object.keys(payload).length === 0) {
    return { ok: false, message: "No hay cambios para guardar." };
  }

  const { data: updatedBeat, error } = await supabase
    .from("beats")
    .update(payload)
    .eq("id", resolvedBeatId)
    .select("id,slug,genre,bpm,musical_key,is_active")
    .maybeSingle<Pick<BeatRowDb, "id" | "slug" | "genre" | "bpm" | "musical_key" | "is_active">>();

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("B.R update beat metadata error", error);
    }

    return { ok: false, message: "No se pudo actualizar la metadata." };
  }

  if (!updatedBeat) {
    return { ok: false, message: "Supabase no confirmó la actualización del beat. Revisa RLS/permisos o el ID del beat." };
  }

  return { ok: true, message: "Metadata actualizada.", beat: updatedBeat };
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

async function getAdminApiToken() {
  const authClient = await getAuthenticatedBrowserClient();
  const supabase = authClient.supabase;

  if (!supabase) {
    return { ok: false as const, message: authClient.message, token: "" };
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  if (!token) {
    return { ok: false as const, message: "Sesión no válida.", token: "" };
  }

  return { ok: true as const, message: "", token };
}

export async function getAdminChangeLogs(input: { year?: number; temporary?: boolean } = {}) {
  const tokenResult = await getAdminApiToken();

  if (!tokenResult.ok) {
    return { ok: false, message: tokenResult.message, logs: [] as AdminChangeLog[], years: [] as number[] };
  }

  const params = new URLSearchParams();

  if (input.year) {
    params.set("year", String(input.year));
  }

  if (input.temporary) {
    params.set("temporary", "true");
  }

  const response = await fetch(`/api/admin/change-logs${params.size ? `?${params.toString()}` : ""}`, {
    headers: { Authorization: `Bearer ${tokenResult.token}` },
  });
  const result = await response.json().catch(() => ({ ok: false, message: "No se pudo cargar el historial." }));

  if (!response.ok || !result.ok) {
    return { ok: false, message: result.message ?? "No se pudo cargar el historial.", logs: [] as AdminChangeLog[], years: [] as number[] };
  }

  return {
    ok: true,
    message: "",
    logs: (result.logs ?? []) as AdminChangeLog[],
    years: (result.years ?? []) as number[],
  };
}

export async function createAdminChangeLog(input: AdminChangeLogInput) {
  const tokenResult = await getAdminApiToken();

  if (!tokenResult.ok) {
    return { ok: false, message: tokenResult.message, log: null as AdminChangeLog | null };
  }

  const response = await fetch("/api/admin/change-logs", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokenResult.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  const result = await response.json().catch(() => ({ ok: false, message: "No se pudo guardar el historial." }));

  if (!response.ok || !result.ok) {
    return { ok: false, message: result.message ?? "No se pudo guardar el historial.", log: null as AdminChangeLog | null };
  }

  return { ok: true, message: "", log: result.log as AdminChangeLog };
}

export async function deleteAdminChangeLog(logId: string) {
  const tokenResult = await getAdminApiToken();

  if (!tokenResult.ok) {
    return { ok: false, message: tokenResult.message };
  }

  const response = await fetch(`/api/admin/change-logs/${logId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${tokenResult.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ isDeleted: true }),
  });
  const result = await response.json().catch(() => ({ ok: false, message: "No se pudo borrar el bloque." }));

  if (!response.ok || !result.ok) {
    return { ok: false, message: result.message ?? "No se pudo borrar el bloque." };
  }

  return { ok: true, message: "Bloque borrado." };
}
