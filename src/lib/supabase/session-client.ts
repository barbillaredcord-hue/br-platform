import { createClient } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "./client";
import { getSupabasePublicConfigStatus } from "./config";

export type SupabaseClient = NonNullable<
  ReturnType<typeof createSupabaseBrowserClient>
>;

let supabaseClient: SupabaseClient | null = null;
let supabaseBrowserSessionClient: SupabaseClient | null = null;

export function getSupabaseClient() {
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
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return supabaseClient;
}

export function getSupabaseBrowserSessionClient() {
  if (typeof window === "undefined") {
    return null;
  }

  if (!supabaseBrowserSessionClient) {
    supabaseBrowserSessionClient =
      createSupabaseBrowserClient() as SupabaseClient | null;
  }

  return supabaseBrowserSessionClient;
}

export async function getAuthenticatedBrowserClient() {
  const supabase = getSupabaseBrowserSessionClient();
  const sessionInfo = {
    hasSession: false,
    hasAccessToken: false,
    userId: null as string | null,
    userEmail: null as string | null,
  };

  if (!supabase) {
    return {
      supabase: null as SupabaseClient | null,
      sessionInfo,
      message: "Supabase no está configurado.",
    };
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

export async function getAuthenticatedAdminBrowserClient() {
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
