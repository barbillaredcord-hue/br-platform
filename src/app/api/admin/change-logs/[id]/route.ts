import { validateAdminRequest } from "@/lib/supabase/admin";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await validateAdminRequest(request);

  if (!admin.ok) {
    return admin.response;
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);

  if (!id || body?.isDeleted !== true) {
    return Response.json({ ok: false, message: "Bloque inválido." }, { status: 400 });
  }

  const { error } = await admin.supabase
    .from("admin_change_logs")
    .update({ is_deleted: true })
    .eq("id", id);

  if (error) {
    console.error("B.R admin change logs delete error", error);
    return Response.json({ ok: false, message: "No se pudo borrar el bloque." }, { status: 500 });
  }

  return Response.json({ ok: true });
}
