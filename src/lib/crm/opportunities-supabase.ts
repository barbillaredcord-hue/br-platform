import type { SupabaseClient } from "@supabase/supabase-js";
import {
  OpportunityDomainError,
  type CrmOpportunityRow,
  type OpportunityInsert,
  type OpportunityRepository,
  type OpportunityStatus,
  type OpportunityUpdate,
} from "./opportunities";

const OPPORTUNITY_COLUMNS = [
  "id",
  "profile_id",
  "title",
  "status",
  "source",
  "beat_id",
  "access_request_id",
  "estimated_value",
  "currency",
  "summary",
  "created_by",
  "updated_by",
  "created_at",
  "updated_at",
  "closed_at",
  "archived_at",
].join(",");

function databaseError(operation: string, error: unknown) {
  console.error(`B.R CRM Opportunities ${operation} error`, error);

  const code = typeof error === "object" && error && "code" in error
    ? String(error.code)
    : "";

  if (code === "23505") {
    return new OpportunityDomainError(
      "conflict",
      "Ya existe una Opportunity para la solicitud relacionada.",
    );
  }

  if (code === "23514") {
    return new OpportunityDomainError(
      "conflict",
      "La operación no cumple el contrato de Opportunity.",
    );
  }

  return new Error(`No se pudo ${operation} la Opportunity.`);
}

export function createSupabaseOpportunityRepository(
  supabase: SupabaseClient,
): OpportunityRepository {
  return {
    async profileExists(profileId) {
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", profileId)
        .maybeSingle();

      if (error) {
        throw databaseError("validar el perfil de", error);
      }

      return Boolean(data);
    },

    async beatExists(beatId) {
      const { data, error } = await supabase
        .from("beats")
        .select("id")
        .eq("id", beatId)
        .maybeSingle();

      if (error) {
        throw databaseError("validar el beat de", error);
      }

      return Boolean(data);
    },

    async getAccessRequest(requestId) {
      const { data, error } = await supabase
        .from("access_requests")
        .select("id,user_id,beat_id")
        .eq("id", requestId)
        .maybeSingle<{
          id: string;
          user_id: string;
          beat_id: string;
        }>();

      if (error) {
        throw databaseError("validar la solicitud de", error);
      }

      return data
        ? {
            id: data.id,
            profileId: data.user_id,
            beatId: data.beat_id,
          }
        : null;
    },

    async getOpportunity(opportunityId) {
      const { data, error } = await supabase
        .from("crm_opportunities")
        .select(OPPORTUNITY_COLUMNS)
        .eq("id", opportunityId)
        .maybeSingle();

      if (error) {
        throw databaseError("consultar", error);
      }

      return (data as CrmOpportunityRow | null) ?? null;
    },

    async hasManualPayment(profileId, beatId) {
      const { data, error } = await supabase
        .from("manual_payments")
        .select("id")
        .eq("user_id", profileId)
        .eq("beat_id", beatId)
        .limit(1)
        .maybeSingle();

      if (error) {
        throw databaseError("validar el pago de", error);
      }

      return Boolean(data);
    },

    async insertOpportunity(input: OpportunityInsert) {
      const { data, error } = await supabase
        .from("crm_opportunities")
        .insert(input)
        .select(OPPORTUNITY_COLUMNS)
        .single();

      if (error || !data) {
        throw databaseError("crear", error);
      }

      return data as unknown as CrmOpportunityRow;
    },

    async updateOpportunity(
      opportunityId: string,
      patch: OpportunityUpdate,
      expectedStatus?: OpportunityStatus,
    ) {
      let query = supabase
        .from("crm_opportunities")
        .update(patch)
        .eq("id", opportunityId);

      if (expectedStatus) {
        query = query.eq("status", expectedStatus);
      }

      const { data, error } = await query
        .select(OPPORTUNITY_COLUMNS)
        .maybeSingle();

      if (error) {
        throw databaseError("actualizar", error);
      }

      return (data as CrmOpportunityRow | null) ?? null;
    },

    async listOpportunitiesForProfile(profileId, includeArchived) {
      let query = supabase
        .from("crm_opportunities")
        .select(OPPORTUNITY_COLUMNS)
        .order("created_at", { ascending: false });

      query = profileId === null
        ? query.is("profile_id", null)
        : query.eq("profile_id", profileId);

      if (!includeArchived) {
        query = query.is("archived_at", null);
      }

      const { data, error } = await query;

      if (error) {
        throw databaseError("listar", error);
      }

      return (data ?? []) as unknown as CrmOpportunityRow[];
    },

    async archiveOpportunitiesForProfile(profileId, patch) {
      const { data, error } = await supabase
        .from("crm_opportunities")
        .update(patch)
        .eq("profile_id", profileId)
        .is("archived_at", null)
        .select("id");

      if (error) {
        throw databaseError("archivar", error);
      }

      return data?.length ?? 0;
    },
  };
}
