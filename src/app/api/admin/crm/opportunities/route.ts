import {
  OpportunityDomainError,
  createOpportunity,
  getOpportunityProfileLabel,
  isOpportunitySource,
  listOpportunitiesForProfile,
  selectOpportunitySummary,
  type CreateOpportunityInput,
} from "@/lib/crm/opportunities";
import { createSupabaseOpportunityRepository } from "@/lib/crm/opportunities-supabase";
import { validateAdminRequest } from "@/lib/supabase/admin";

function opportunityErrorResponse(error: unknown) {
  if (error instanceof OpportunityDomainError) {
    const status = error.code === "forbidden"
      ? 403
      : error.code === "not_found"
        ? 404
        : error.code === "conflict"
          ? 409
          : 400;
    return Response.json({ ok: false, message: error.message }, { status });
  }

  console.error("B.R CRM Opportunities route error", error);
  return Response.json(
    { ok: false, message: "No se pudo completar la operación." },
    { status: 500 },
  );
}

function optionalString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function optionalNumber(value: unknown) {
  return value === null || value === undefined
    ? null
    : typeof value === "number"
      ? value
      : Number.NaN;
}

export async function GET(request: Request) {
  const admin = await validateAdminRequest(request);

  if (!admin.ok) {
    return admin.response;
  }

  const url = new URL(request.url);
  const rawProfileId = url.searchParams.get("profile_id");

  if (!rawProfileId) {
    return Response.json(
      { ok: false, message: "profile_id es obligatorio." },
      { status: 400 },
    );
  }

  const profileId = rawProfileId === "deleted" ? null : rawProfileId;
  const includeArchived = url.searchParams.get("include_archived") === "true";
  const repository = createSupabaseOpportunityRepository(admin.userSupabase);

  try {
    const opportunitiesPromise = listOpportunitiesForProfile(
      repository,
      { id: admin.requester.id, isAdmin: true },
      profileId,
      includeArchived,
    );
    const optionsPromise = profileId === null
      ? Promise.resolve([{ data: [], error: null }, { data: [], error: null }])
      : Promise.all([
          admin.userSupabase
            .from("beats")
            .select("id,title,slug")
            .order("title", { ascending: true }),
          admin.userSupabase
            .from("access_requests")
            .select("id,beat_id,status,created_at")
            .eq("user_id", profileId)
            .order("created_at", { ascending: false }),
        ]);
    const [opportunities, [beatsResult, requestsResult]] = await Promise.all([
      opportunitiesPromise,
      optionsPromise,
    ]);

    if (beatsResult.error || requestsResult.error) {
      console.error(
        "B.R CRM Opportunities options error",
        beatsResult.error ?? requestsResult.error,
      );
      return Response.json(
        { ok: false, message: "No se pudieron cargar las opciones de Opportunity." },
        { status: 500 },
      );
    }

    const summary = selectOpportunitySummary(opportunities);

    return Response.json({
      ok: true,
      opportunities: opportunities.map((opportunity) => ({
        ...opportunity,
        profile_label: getOpportunityProfileLabel(opportunity.profile_id),
      })),
      summary: summary.metrics,
      options: {
        beats: beatsResult.data ?? [],
        access_requests: requestsResult.data ?? [],
      },
    });
  } catch (error) {
    return opportunityErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const admin = await validateAdminRequest(request);

  if (!admin.ok) {
    return admin.response;
  }

  const payload = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;

  if (!payload) {
    return Response.json(
      { ok: false, message: "Datos inválidos." },
      { status: 400 },
    );
  }

  const source = payload.source;

  if (!isOpportunitySource(source)) {
    return Response.json(
      { ok: false, message: "Origen inválido." },
      { status: 400 },
    );
  }

  const input: CreateOpportunityInput = {
    profileId: optionalString(payload.profile_id) ?? "",
    title: optionalString(payload.title) ?? "",
    source,
    beatId: optionalString(payload.beat_id),
    accessRequestId: optionalString(payload.access_request_id),
    estimatedValue: optionalNumber(payload.estimated_value),
    currency: optionalString(payload.currency),
    summary: optionalString(payload.summary),
  };
  const repository = createSupabaseOpportunityRepository(admin.userSupabase);

  try {
    const opportunity = await createOpportunity(
      repository,
      { id: admin.requester.id, isAdmin: true },
      input,
    );

    return Response.json(
      { ok: true, opportunity, message: "Opportunity creada." },
      { status: 201 },
    );
  } catch (error) {
    return opportunityErrorResponse(error);
  }
}
