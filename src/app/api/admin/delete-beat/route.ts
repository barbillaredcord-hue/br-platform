import { createSupabaseServiceClient, getBearerToken } from "@/lib/supabase/admin";

type ProfileRole = {
  role: string | null;
  email: string | null;
};

type BeatLookup = {
  id: string;
  slug: string | null;
  title: string | null;
};

function normalizeEmail(email?: string | null) {
  return (email ?? "").trim().toLowerCase();
}

export async function POST(request: Request) {
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    return Response.json({ ok: false, message: "Falta configurar SUPABASE_SERVICE_ROLE_KEY en servidor." }, { status: 500 });
  }

  const token = getBearerToken(request);

  if (!token) {
    return Response.json({ ok: false, message: "Sesión no válida." }, { status: 401 });
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  const user = userData.user;

  if (userError || !user?.email) {
    return Response.json({ ok: false, message: "Sesión no válida." }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role,email")
    .eq("id", user.id)
    .maybeSingle<ProfileRole>();

  if (profileError) {
    console.error("B.R delete beat profile lookup error", profileError);
    return Response.json({ ok: false, message: "No se pudo validar el rol admin." }, { status: 500 });
  }

  const brceoEmail = normalizeEmail(process.env.NEXT_PUBLIC_BRCEO_EMAIL);
  const authEmail = normalizeEmail(user.email);
  const profileEmail = normalizeEmail(profile?.email);
  const isBrceoEmail = Boolean(brceoEmail) && (authEmail === brceoEmail || profileEmail === brceoEmail);
  const isAdmin = profile?.role === "admin" || isBrceoEmail;

  if (!isAdmin) {
    return Response.json({ ok: false, message: "Solo admin puede eliminar beats." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const beatId = typeof body?.beatId === "string" ? body.beatId.trim() : "";

  if (!beatId) {
    return Response.json({ ok: false, message: "Beat no válido." }, { status: 400 });
  }

  let { data: beat, error: beatError } = await supabase
    .from("beats")
    .select("id,slug,title")
    .eq("id", beatId)
    .maybeSingle<BeatLookup>();

  if (!beat && !beatError) {
    const slugResult = await supabase
      .from("beats")
      .select("id,slug,title")
      .eq("slug", beatId)
      .maybeSingle<BeatLookup>();

    beat = slugResult.data;
    beatError = slugResult.error;
  }

  if (beatError) {
    console.error("B.R delete beat lookup error", beatError);
    return Response.json({ ok: false, message: "No se pudo validar el beat." }, { status: 500 });
  }

  if (!beat) {
    return Response.json({ ok: false, message: "Beat no encontrado." }, { status: 404 });
  }

  const { error: updateError } = await supabase.from("beats").update({ is_active: false }).eq("id", beat.id);

  if (updateError) {
    console.error("B.R delete beat update error", updateError);
    return Response.json({ ok: false, message: "No se pudo eliminar el beat." }, { status: 500 });
  }

  return Response.json({ ok: true, message: "Beat eliminado del catálogo.", beatId: beat.id });
}