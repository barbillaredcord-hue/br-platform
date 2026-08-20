import type { Beat } from "@/data/beats";
import { notifyDomainChange } from "@/lib/domain-events";
import { resolveBeatId } from "./beat-identifiers";
import {
  getAuthenticatedAdminBrowserClient,
  getSupabaseBrowserSessionClient,
  getSupabaseClient,
  type SupabaseClient,
} from "./session-client";

type BeatAccessRow = {
  user_id: string;
  beat_id: string;
  beats?: { slug: string | null } | { slug: string | null }[] | null;
};

type AccessBeatRelation = {
  slug: string | null;
  title: string;
};

type AccessProfileRelation = {
  email: string;
  username: string | null;
  display_name: string | null;
  phone: string | null;
};

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
  beats?: AccessBeatRelation | AccessBeatRelation[] | null;
  profiles?: AccessProfileRelation | AccessProfileRelation[] | null;
  revoked_by_profile?:
    | Omit<AccessProfileRelation, "phone">
    | Omit<AccessProfileRelation, "phone">[]
    | null;
};

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

export function getBeatAccessKey(beat: Pick<Beat, "id" | "dbId"> | string) {
  return typeof beat === "string" ? beat : (beat.dbId ?? beat.id);
}

export async function getUserBeatAccess(
  userId: string,
  supabaseOverride?: SupabaseClient | null,
) {
  const supabase =
    supabaseOverride ??
    getSupabaseBrowserSessionClient() ??
    getSupabaseClient();

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
    const beat = Array.isArray(row.beats) ? row.beats[0] : row.beats;
    return [row.beat_id, beat?.slug].filter(Boolean) as string[];
  });
}

export async function getUserAccessRevocations(
  userId: string,
  supabaseOverride?: SupabaseClient | null,
) {
  const supabase =
    supabaseOverride ??
    getSupabaseBrowserSessionClient() ??
    getSupabaseClient();

  if (!supabase || !userId) {
    return [];
  }

  const { data, error } = await supabase
    .from("access_revocations")
    .select(
      "id,user_id,beat_id,reason,revoked_by,revoked_at,created_at,acknowledged_by_user,acknowledged_at,beats(slug,title)",
    )
    .eq("user_id", userId)
    .order("revoked_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as AccessRevocationRow[];
}

export async function getAccessRevocations(
  supabaseOverride?: SupabaseClient | null,
) {
  const supabase =
    supabaseOverride ??
    getSupabaseBrowserSessionClient() ??
    getSupabaseClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("access_revocations")
    .select(
      "id,user_id,beat_id,reason,revoked_by,revoked_at,created_at,acknowledged_by_user,acknowledged_at,profiles!access_revocations_user_id_fkey(email,username,display_name,phone),revoked_by_profile:profiles!access_revocations_revoked_by_fkey(email,username,display_name),beats(slug,title)",
    )
    .order("revoked_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as AccessRevocationRow[];
}

export async function acknowledgeAccessRevocation(
  userId: string,
  revocationId: string,
) {
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
    return {
      ok: false,
      message: "No se pudo ocultar el aviso. Intenta de nuevo.",
    };
  }

  notifyDomainChange("access");
  return { ok: true };
}

export async function getAccessRevocationsForBeat(
  beatId: string,
  supabaseOverride?: SupabaseClient | null,
) {
  const supabase =
    supabaseOverride ??
    getSupabaseBrowserSessionClient() ??
    getSupabaseClient();
  const resolvedBeatId = await resolveBeatId(beatId, supabase);

  if (!supabase || !resolvedBeatId) {
    return [];
  }

  const { data, error } = await supabase
    .from("access_revocations")
    .select(
      "id,user_id,beat_id,reason,revoked_by,revoked_at,created_at,acknowledged_by_user,acknowledged_at,beats(slug,title)",
    )
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

export async function approveAccessRequest(requestId: string) {
  const authClient = await getAuthenticatedAdminBrowserClient();
  const supabase = authClient.supabase;

  if (!supabase || !authClient.isAdmin || !authClient.sessionInfo.userId) {
    return { ok: false, message: authClient.message };
  }

  const { error } = await supabase.rpc("approve_access_request_atomic", {
    p_request_id: requestId,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  notifyDomainChange("requests");
  return { ok: true, message: "Solicitud aprobada. Pago pendiente." };
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

  const { error } = await supabase.rpc("reject_access_request_atomic", {
    p_request_id: requestId,
    p_reason: reasonResult.reason,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  notifyDomainChange("requests");
  return { ok: true, message: "Solicitud rechazada." };
}

export async function grantBeatAccess(userId: string, beatId: string) {
  const authClient = await getAuthenticatedAdminBrowserClient();
  const supabase = authClient.supabase;
  const resolvedBeatId = await resolveBeatId(beatId, supabase);

  if (!supabase || !authClient.isAdmin) {
    return { ok: false, message: authClient.message };
  }

  if (!resolvedBeatId) {
    return {
      ok: false,
      message: "No se encontró el UUID real del beat en Supabase.",
    };
  }

  const { error } = await supabase.rpc("grant_beat_access_atomic", {
    p_user_id: userId,
    p_beat_id: resolvedBeatId,
  });

  if (error) {
    return {
      ok: false,
      message: "No se pudo actualizar la información. Intenta de nuevo.",
    };
  }

  notifyDomainChange("grant");
  return { ok: true };
}

export async function revokeBeatAccess(
  userId: string,
  beatId: string,
  reason: string,
) {
  const authClient = await getAuthenticatedAdminBrowserClient();
  const supabase = authClient.supabase;
  const resolvedBeatId = await resolveBeatId(beatId, supabase);
  const cleanReason = reason.trim();

  if (!supabase || !authClient.isAdmin) {
    return { ok: false, message: authClient.message };
  }

  if (!resolvedBeatId) {
    return {
      ok: false,
      message: "No se encontró el UUID real del beat en Supabase.",
    };
  }

  if (cleanReason.length < 5) {
    return {
      ok: false,
      message: "El motivo debe tener al menos 5 caracteres.",
    };
  }

  if (cleanReason.length > 500) {
    return { ok: false, message: "El motivo no puede superar 500 caracteres." };
  }

  const { data, error } = await supabase.rpc("revoke_beat_access_atomic", {
    p_user_id: userId,
    p_beat_id: resolvedBeatId,
    p_reason: cleanReason,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  notifyDomainChange("access");
  const result = data as { already_revoked?: boolean } | null;
  return {
    ok: true,
    message: result?.already_revoked
      ? "El acceso ya estaba revocado."
      : "Acceso revocado correctamente.",
  };
}
