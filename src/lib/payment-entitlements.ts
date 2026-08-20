import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type EntitlementResponse = {
  paidBeatIds?: unknown;
};

export async function getCurrentUserPaidBeatIds(): Promise<Set<string> | null> {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getSession();
  const token = data?.session?.access_token;

  if (error || !token) {
    return null;
  }

  try {
    const response = await fetch("/api/account/entitlements", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const payload = (await response.json().catch(() => null)) as EntitlementResponse | null;

    if (!response.ok || !Array.isArray(payload?.paidBeatIds)) {
      return null;
    }

    return new Set(payload.paidBeatIds.filter((beatId): beatId is string => typeof beatId === "string"));
  } catch {
    return null;
  }
}
