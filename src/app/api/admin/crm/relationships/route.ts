import { validateAdminRequest } from "@/lib/supabase/admin";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const relationshipTypes = new Set([
  "lead",
  "client",
  "artist",
  "producer",
  "collaborator",
]);

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export async function POST(request: Request) {
  const admin = await validateAdminRequest(request);

  if (!admin.ok) {
    return admin.response;
  }

  const payload = (await request.json().catch(() => null)) as {
    profile_id?: unknown;
    relationship_type?: unknown;
    is_active?: unknown;
  } | null;
  const profileId = cleanText(payload?.profile_id);
  const relationshipType = cleanText(payload?.relationship_type);
  const isActive = payload?.is_active !== false;

  if (!uuidPattern.test(profileId)) {
    return Response.json({ ok: false, message: "Perfil inválido." }, { status: 400 });
  }

  if (!relationshipTypes.has(relationshipType)) {
    return Response.json({ ok: false, message: "Relación inválida." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const baseRow = {
    profile_id: profileId,
    relationship_type: relationshipType,
    is_active: isActive,
    created_by: admin.requester.id,
    updated_by: admin.requester.id,
  };
  const { error: insertError } = await admin.userSupabase
    .from("crm_relationships")
    .upsert(baseRow, {
      onConflict: "profile_id,relationship_type",
      ignoreDuplicates: true,
    });

  if (insertError) {
    console.error("B.R CRM relationship insert error", insertError);
    return Response.json({ ok: false, message: "No se pudo guardar la relación." }, { status: 500 });
  }

  const { data, error: updateError } = await admin.userSupabase
    .from("crm_relationships")
    .update({ is_active: isActive, updated_at: now, updated_by: admin.requester.id })
    .eq("profile_id", profileId)
    .eq("relationship_type", relationshipType)
    .select("id,profile_id,relationship_type,is_active,created_at,updated_at")
    .maybeSingle();

  if (updateError || !data) {
    console.error("B.R CRM relationship update error", updateError);
    return Response.json({ ok: false, message: "No se pudo actualizar la relación." }, { status: 500 });
  }

  return Response.json({ ok: true, relationship: data });
}
