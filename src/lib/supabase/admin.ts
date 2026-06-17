import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

type AdminRequestResult =
  | {
      ok: true;
      supabase: NonNullable<ReturnType<typeof createSupabaseServiceClient>>;
      requester: User;
    }
  | {
      ok: false;
      response: Response;
    };

export function createSupabaseServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  return authorization.startsWith("Bearer ") ? authorization.slice("Bearer ".length).trim() : "";
}

export async function validateAdminRequest(request: Request): Promise<AdminRequestResult> {
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    return { ok: false, response: Response.json({ ok: false, message: "Falta configurar SUPABASE_SERVICE_ROLE_KEY en servidor." }, { status: 500 }) };
  }

  const token = getBearerToken(request);

  if (!token) {
    return { ok: false, response: Response.json({ ok: false, message: "Sesión no válida." }, { status: 401 }) };
  }

  const { data: requesterData, error: requesterError } = await supabase.auth.getUser(token);
  const requester = requesterData.user;

  if (requesterError || !requester) {
    return { ok: false, response: Response.json({ ok: false, message: "Sesión no válida." }, { status: 401 }) };
  }

  const { data: requesterProfile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", requester.id)
    .maybeSingle<{ role: "admin" | "user" }>();

  if (profileError || requesterProfile?.role !== "admin") {
    return { ok: false, response: Response.json({ ok: false, message: "Acceso restringido." }, { status: 403 }) };
  }

  return { ok: true, supabase, requester };
}
