export type ProductUpdateStatus = "released" | "in_progress" | "planned";
export type ProductUpdateAudience = "user" | "admin" | "both";

export type ProductUpdate = {
  title: string;
  status: ProductUpdateStatus;
  audience: ProductUpdateAudience;
  version?: string;
  date?: string;
};

// TODO: generar este resumen desde APP_STATE.json mediante br-sync-docs sin cargar el documento completo en el cliente.
export const currentProductPhase = {
  title: "Fase 15 · CRM y flujo comercial",
  version: "15.1",
  status: "in_progress" as ProductUpdateStatus,
};

export const latestProductUpdates: ProductUpdate[] = [
  {
    title: "Contact Intelligence 15.1 incorpora Contact 360 y relaciones explícitas; la validación física Admin continúa pendiente.",
    status: "in_progress",
    audience: "admin",
    version: "15.1",
    date: "2026-08-20",
  },
  {
    title: "El flujo seguro de revisiones usa review_pending → review_approved → fulfilled: aceptar una revisión no restaura acceso; «Dar acceso de nuevo» sí crea beat_access.",
    status: "released",
    audience: "both",
    version: "14.5 / 15.1",
    date: "2026-08-20",
  },
  {
    title: "Acceso Full y pago confirmado son autoridades separadas: Full puede existir sin pago; MP3 y licencia requieren beat_access activo y manual_payments confirmado.",
    status: "released",
    audience: "both",
    version: "14.5",
    date: "2026-08-20",
  },
  {
    title: "beat_access continúa como autoridad de acceso activo; access_revocations conserva exclusivamente el historial de revocaciones.",
    status: "released",
    audience: "both",
    version: "14.5",
    date: "2026-08-20",
  },
  {
    title: "Fase 15 iniciada con CRM Foundation 15.0 completada: identidad, autoridades y métricas comerciales quedaron definidas sin duplicar fuentes.",
    status: "released",
    audience: "admin",
    version: "15.0",
    date: "2026-08-18",
  },
  {
    title: "Fase 14.5 consolidada: Full Audio seguro, Access Domain, Realtime privado, operaciones atómicas y separación progresiva por dominio.",
    status: "released",
    audience: "both",
    version: "14.5",
    date: "2026-08-18",
  },
];

export const futureProductUpdates: ProductUpdate[] = [
  {
    title: "Cerrar la validación física Admin de Contact 360 y relaciones explícitas.",
    status: "in_progress",
    audience: "admin",
    version: "15.1",
  },
  {
    title: "Persistir oportunidades comerciales separadas de access_requests.",
    status: "planned",
    audience: "admin",
    version: "15.2",
  },
  {
    title: "Agregar seguimiento comercial con autoría y visibilidad definidas.",
    status: "planned",
    audience: "admin",
    version: "15.3",
  },
  {
    title: "Derivar señales, prioridades y scoring comercial explicable sin duplicar autoridades.",
    status: "planned",
    audience: "admin",
    version: "15.4",
  },
];
