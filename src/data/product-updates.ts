export type ProductUpdateStatus = "released" | "in_progress" | "planned";
export type ProductUpdateAudience = "user" | "admin" | "both";

export type ProductUpdate = {
  title: string;
  status: ProductUpdateStatus;
  audience: ProductUpdateAudience;
  version?: string;
  date?: string;
};

export const currentProductPhase = {
  title: "Fase 13 cerrada",
  version: "13F.4",
  status: "released" as ProductUpdateStatus,
};

export const latestProductUpdates: ProductUpdate[] = [
  { title: "Fase 13 cerrada: preview real, player premium, dominio y auth SMTP listos.", status: "released", audience: "both", version: "13F" },
  { title: "Actualizaciones compactas con modal para no ocupar espacio en cuenta/admin.", status: "released", audience: "both", version: "13F.3" },
  { title: "Beats públicos o privados para reproducción: público escucha full, privado usa preview/acceso.", status: "released", audience: "both", version: "13F.4" },
  { title: "Admin B.RCEO con reproducción full global sin solicitar acceso como usuario.", status: "released", audience: "admin", version: "13F.4" },
  { title: "Preview real generado desde beat completo con duraciones 15, 20, 25 o 30 segundos.", status: "released", audience: "both", version: "13C" },
  { title: "PlayerBar premium con modo Preview / Acceso completo y layout móvil compacto.", status: "released", audience: "both", version: "13D/13F.2" },
  { title: "Correos de confirmación funcionando con brstudios.org, Resend y Supabase SMTP.", status: "released", audience: "both", version: "13F.Auth" },
  { title: "Descargas protegidas por sesión y beat_access.", status: "released", audience: "both", version: "12E" },
];

export const futureProductUpdates: ProductUpdate[] = [
  { title: "Fase 14: órdenes y pagos controlados desde admin.", status: "planned", audience: "both", version: "14A" },
  { title: "Confirmación manual de pago para liberar acceso, descarga y licencia.", status: "planned", audience: "admin", version: "14B/14C" },
  { title: "Vista de estado de compra para usuario: pendiente, aprobado o rechazado.", status: "planned", audience: "user", version: "14D" },
  { title: "Historial de descargas y licencias por usuario.", status: "planned", audience: "both" },
  { title: "Bucket privado / signed URLs para endurecer entrega de archivos.", status: "planned", audience: "admin" },
  { title: "Marketplace multiusuario en fase futura.", status: "planned", audience: "admin" },
];
