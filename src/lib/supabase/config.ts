export const SUPABASE_NOT_CONFIGURED_MESSAGE = "Supabase no está configurado. Revisa .env.local.";
export const SUPABASE_CONNECTION_STATUS_KEY = "br-supabase-connection-status";
export const SUPABASE_CONNECTION_STATUS_EVENT = "br-supabase-connection-status-change";

export type SupabaseConnectionStatus = "pending" | "connected" | "error";

export function getSupabasePublicConfigStatus() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const brceoEmail = process.env.NEXT_PUBLIC_BRCEO_EMAIL;

  return {
    supabaseUrl,
    supabaseAnonKey,
    brceoEmail,
    hasSupabaseUrl: Boolean(supabaseUrl),
    hasSupabaseAnonKey: Boolean(supabaseAnonKey),
    hasBrceoEmail: Boolean(brceoEmail),
  };
}

export function isSupabaseConfigured() {
  const status = getSupabasePublicConfigStatus();

  return status.hasSupabaseUrl && status.hasSupabaseAnonKey;
}

export function isSupabaseReadyForAdmin() {
  const status = getSupabasePublicConfigStatus();

  return status.hasSupabaseUrl && status.hasSupabaseAnonKey && status.hasBrceoEmail;
}
