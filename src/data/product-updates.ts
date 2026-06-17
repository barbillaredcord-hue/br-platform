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
  title: "Fase 12",
  version: "12F/12G",
  status: "in_progress" as ProductUpdateStatus,
};

export const latestProductUpdates: ProductUpdate[] = [
  { title: "Player con preview/full según acceso.", status: "released", audience: "both", version: "12B" },
  { title: "Guardados locales y sección de beats guardados.", status: "released", audience: "user", version: "11F" },
  { title: "Controles de player con seek y Space.", status: "released", audience: "both", version: "12C" },
  { title: "Descargas protegidas por sesión y beat_access.", status: "released", audience: "both", version: "12E" },
  { title: "Catálogo visible para todos los usuarios.", status: "released", audience: "both", version: "12A" },
];

export const futureProductUpdates: ProductUpdate[] = [
  { title: "Detección automática/sugerida de género, BPM y tonalidad al subir beats.", status: "in_progress", audience: "admin", version: "12G" },
  { title: "Preview real separado de 15 segundos.", status: "planned", audience: "both" },
  { title: "Licencias descargables.", status: "planned", audience: "user" },
  { title: "Pagos iniciales.", status: "planned", audience: "both" },
  { title: "Historial de descargas.", status: "planned", audience: "both" },
  { title: "Diseño premium del player.", status: "planned", audience: "both" },
  { title: "Bucket privado / signed URLs.", status: "planned", audience: "admin" },
  { title: "Marketplace multiusuario en fase futura.", status: "planned", audience: "admin" },
];
