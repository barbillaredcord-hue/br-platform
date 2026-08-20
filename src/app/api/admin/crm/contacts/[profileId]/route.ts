import { buildCrmContact360 } from "@/lib/crm/contact-360";
import { validateAdminRequest } from "@/lib/supabase/admin";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RouteContext = {
  params: Promise<{ profileId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const admin = await validateAdminRequest(request);

  if (!admin.ok) {
    return admin.response;
  }

  const { profileId } = await context.params;

  if (!uuidPattern.test(profileId)) {
    return Response.json({ ok: false, message: "Perfil inválido." }, { status: 400 });
  }

  const [profileResult, relationshipsResult, requestsResult, paymentsResult, accessResult, activityResult, revocationsResult] = await Promise.all([
    admin.userSupabase.from("profiles").select("id,email,username,display_name,phone,created_at").eq("id", profileId).maybeSingle(),
    admin.userSupabase.from("crm_relationships").select("id,relationship_type,is_active,created_at,updated_at").eq("profile_id", profileId),
    admin.userSupabase.from("access_requests").select("beat_id,status,created_at,updated_at").eq("user_id", profileId),
    admin.userSupabase.from("manual_payments").select("beat_id,amount,currency,license_type,created_at").eq("user_id", profileId),
    admin.userSupabase.from("beat_access").select("beat_id,granted_at").eq("user_id", profileId),
    admin.userSupabase.from("commercial_activity").select("beat_id,event_type,created_at").eq("user_id", profileId),
    admin.userSupabase.from("access_revocations").select("beat_id,revoked_at").eq("user_id", profileId),
  ]);

  const results = [
    profileResult,
    relationshipsResult,
    requestsResult,
    paymentsResult,
    accessResult,
    activityResult,
    revocationsResult,
  ];

  if (results.some((result) => result.error)) {
    console.error("B.R CRM Contact 360 query error", results.find((result) => result.error)?.error);
    return Response.json({ ok: false, message: "No se pudo cargar Contact 360." }, { status: 500 });
  }

  if (!profileResult.data) {
    return Response.json({ ok: false, message: "Perfil no encontrado." }, { status: 404 });
  }

  const rows = [
    ...(requestsResult.data ?? []),
    ...(paymentsResult.data ?? []),
    ...(accessResult.data ?? []),
    ...(activityResult.data ?? []),
    ...(revocationsResult.data ?? []),
  ];
  const beatIds = [...new Set(rows.flatMap((row) => row.beat_id ? [row.beat_id] : []))];
  const beatsResult = beatIds.length
    ? await admin.userSupabase.from("beats").select("id,title,slug").in("id", beatIds)
    : { data: [], error: null };

  if (beatsResult.error) {
    console.error("B.R CRM Contact 360 beats error", beatsResult.error);
    return Response.json({ ok: false, message: "No se pudieron cargar los beats relacionados." }, { status: 500 });
  }

  const profile = profileResult.data as {
    id: string;
    email: string | null;
    username: string | null;
    display_name: string | null;
    phone: string | null;
    created_at: string | null;
  };

  return Response.json({
    ok: true,
    contact: buildCrmContact360({
      profile: {
        id: profile.id,
        email: profile.email,
        username: profile.username,
        displayName: profile.display_name,
        phone: profile.phone,
        createdAt: profile.created_at,
      },
      relationships: (relationshipsResult.data ?? []).map((row) => ({
        id: row.id as string,
        relationshipType: row.relationship_type as "lead" | "client" | "artist" | "producer" | "collaborator",
        isActive: Boolean(row.is_active),
        createdAt: row.created_at as string | null,
        updatedAt: row.updated_at as string | null,
      })),
      requests: (requestsResult.data ?? []).map((row) => ({
        beatId: row.beat_id as string | null,
        status: row.status as string | null,
        createdAt: row.created_at as string | null,
        updatedAt: row.updated_at as string | null,
      })),
      payments: (paymentsResult.data ?? []).map((row) => ({
        beatId: row.beat_id as string | null,
        amount: row.amount as number | string | null,
        currency: row.currency as string | null,
        licenseType: row.license_type as string | null,
        createdAt: row.created_at as string | null,
      })),
      activeAccesses: (accessResult.data ?? []).map((row) => ({
        beatId: row.beat_id as string | null,
        grantedAt: row.granted_at as string | null,
      })),
      activities: (activityResult.data ?? []).map((row) => ({
        beatId: row.beat_id as string | null,
        eventType: row.event_type as string | null,
        createdAt: row.created_at as string | null,
      })),
      revocations: (revocationsResult.data ?? []).map((row) => ({
        beatId: row.beat_id as string | null,
        revokedAt: row.revoked_at as string | null,
      })),
      beats: (beatsResult.data ?? []).map((beat) => ({
        id: beat.id as string,
        title: beat.title as string | null,
        slug: beat.slug as string | null,
      })),
    }),
  });
}
