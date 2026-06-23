import { validateAdminRequest } from "@/lib/supabase/admin";

type ChangeLogInput = {
  year?: number;
  blockTitle?: string;
  eventType?: string;
  targetType?: string | null;
  targetName?: string | null;
  description?: string;
  commandText?: string | null;
  metadata?: Record<string, unknown>;
  temporary?: boolean;
};

export async function GET(request: Request) {
  const admin = await validateAdminRequest(request);

  if (!admin.ok) {
    return admin.response;
  }

  const url = new URL(request.url);
  const year = Number(url.searchParams.get("year") ?? "");
  const temporary = url.searchParams.get("temporary") === "true";
  let query = admin.supabase
    .from("admin_change_logs")
    .select("id,year,block_title,event_type,target_type,target_name,description,command_text,metadata,created_by,created_at,expires_at,is_deleted")
    .or("is_deleted.eq.false,is_deleted.is.null")
    .order("created_at", { ascending: false });

  if (Number.isInteger(year)) {
    query = query.eq("year", year);
  }

  if (temporary) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    query = query
      .in("event_type", [
        "active_toggle",
        "metadata_update",
        "playback_visibility_update",
        "beat_hidden",
        "preview_update",
        "ai_bpm_apply",
        "ai_key_apply",
        "ai_genre_apply",
        "ai_preview_apply",
        "ai_full_apply",
      ])
      .gte("created_at", sevenDaysAgo);
  }

  const { data, error } = await query;

  if (error) {
    console.error("B.R admin change logs list error", error);
    return Response.json({ ok: false, message: "No se pudo cargar el historial." }, { status: 500 });
  }

  const logs = data ?? [];
  const years = Array.from(new Set(logs.map((log) => log.year))).sort((a, b) => b - a);

  return Response.json({ ok: true, logs, years });
}

export async function POST(request: Request) {
  const admin = await validateAdminRequest(request);

  if (!admin.ok) {
    return admin.response;
  }

  const body = (await request.json().catch(() => null)) as ChangeLogInput | null;
  const blockTitle = body?.blockTitle?.trim() ?? "";
  const eventType = body?.eventType?.trim() ?? "";
  const description = body?.description?.trim() ?? "";

  if (!blockTitle || !eventType || !description) {
    return Response.json({ ok: false, message: "Título, tipo y descripción son obligatorios." }, { status: 400 });
  }

  const now = new Date();
  const expiresAt = body?.temporary ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() : null;

  const basePayload = {
    year: Number.isInteger(body?.year) ? body?.year : now.getFullYear(),
    block_title: blockTitle,
    event_type: eventType,
    target_type: body?.targetType?.trim() || null,
    target_name: body?.targetName?.trim() || null,
    description,
    command_text: body?.commandText?.trim() || null,
    metadata: body?.metadata ?? {},
    created_by: admin.requester.id,
    is_deleted: false,
  };

  const payloads = body?.temporary
    ? [
        { ...basePayload, expires_at: expiresAt },
        {
          ...basePayload,
          block_title: `Gestión de Beats · ${blockTitle}`,
          metadata: {
            ...basePayload.metadata,
            mirrored_from_temporary_history: true,
          },
          expires_at: null,
        },
      ]
    : [{ ...basePayload, expires_at: expiresAt }];

  const { data, error } = await admin.supabase
    .from("admin_change_logs")
    .insert(payloads)
    .select("id,year,block_title,event_type,target_type,target_name,description,command_text,metadata,created_by,created_at,expires_at,is_deleted")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("B.R admin change logs insert error", error);
    return Response.json({ ok: false, message: "No se pudo guardar el historial." }, { status: 500 });
  }

  const log = data?.find((item) => item.expires_at) ?? data?.[0] ?? null;

  return Response.json({ ok: true, log, logs: data ?? [] });
}
