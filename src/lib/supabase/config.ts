export const SUPABASE_NOT_CONFIGURED_MESSAGE = "Supabase no está configurado. Revisa .env.local.";

export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
