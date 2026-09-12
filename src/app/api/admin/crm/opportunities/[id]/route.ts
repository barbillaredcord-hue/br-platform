import {
  OpportunityDomainError,
  archiveOpportunity,
  changeOpportunityStatus,
  closeOpportunityLost,
  closeOpportunityWon,
  getOpportunity,
  isOpportunityStatus,
  reopenOpportunity,
  updateOpportunity,
  type UpdateOpportunityInput,
} from "@/lib/crm/opportunities";
import { createSupabaseOpportunityRepository } from "@/lib/crm/opportunities-supabase";
import { validateAdminRequest } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

  console.error("B.R CRM Opportunity detail route error", error);
  return Response.json(
    { ok: false, message: "No se pudo completar la operación." },
    { status: 500 },
  );
}

function optionalString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function updateInput(payload: Record<string, unknown>): UpdateOpportunityInput {
  const input: UpdateOpportunityInput = {};

  if (Object.prototype.hasOwnProperty.call(payload, "title")) {
    input.title = optionalString(payload.title) ?? "";
  }

  if (Object.prototype.hasOwnProperty.call(payload, "summary")) {
    input.summary = optionalString(payload.summary);
  }

  if (Object.prototype.hasOwnProperty.call(payload, "beat_id")) {
    input.beatId = optionalString(payload.beat_id);
  }

  if (Object.prototype.hasOwnProperty.call(payload, "estimated_value")) {
    input.estimatedValue = payload.estimated_value === null
      ? null
      : typeof payload.estimated_value === "number"
        ? payload.estimated_value
        : Number.NaN;
  }

  if (Object.prototype.hasOwnProperty.call(payload, "currency")) {
    input.currency = optionalString(payload.currency);
  }

  return input;
}

export async function GET(request: Request, context: RouteContext) {
  const admin = await validateAdminRequest(request);

  if (!admin.ok) {
    return admin.response;
  }

  const { id } = await context.params;
  const repository = createSupabaseOpportunityRepository(admin.userSupabase);

  try {
    const opportunity = await getOpportunity(
      repository,
      { id: admin.requester.id, isAdmin: true },
      id,
    );
    return Response.json({ ok: true, opportunity });
  } catch (error) {
    return opportunityErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await validateAdminRequest(request);

  if (!admin.ok) {
    return admin.response;
  }

  const { id } = await context.params;
  const payload = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;

  if (!payload || typeof payload.action !== "string") {
    return Response.json(
      { ok: false, message: "Acción inválida." },
      { status: 400 },
    );
  }

  const repository = createSupabaseOpportunityRepository(admin.userSupabase);
  const actor = { id: admin.requester.id, isAdmin: true };

  try {
    let opportunity;

    switch (payload.action) {
      case "update":
        opportunity = await updateOpportunity(
          repository,
          actor,
          id,
          updateInput(payload),
        );
        break;
      case "change_status":
        if (!isOpportunityStatus(payload.status)) {
          throw new OpportunityDomainError("validation", "Estado inválido.");
        }
        opportunity = await changeOpportunityStatus(
          repository,
          actor,
          id,
          payload.status,
        );
        break;
      case "close_won":
        opportunity = await closeOpportunityWon(repository, actor, id);
        break;
      case "close_lost":
        opportunity = await closeOpportunityLost(repository, actor, id);
        break;
      case "reopen":
        opportunity = await reopenOpportunity(repository, actor, id);
        break;
      case "archive":
        opportunity = await archiveOpportunity(repository, actor, id);
        break;
      default:
        throw new OpportunityDomainError("validation", "Acción inválida.");
    }

    return Response.json({ ok: true, opportunity });
  } catch (error) {
    return opportunityErrorResponse(error);
  }
}
