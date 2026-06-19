"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { futureProductUpdates, latestProductUpdates, type ProductUpdate, type ProductUpdateAudience, type ProductUpdateStatus } from "@/data/product-updates";

type ProductUpdatesPanelProps = {
  audience: Exclude<ProductUpdateAudience, "both">;
};

const statusLabels: Record<ProductUpdateStatus, string> = {
  released: "Implementado",
  in_progress: "En progreso",
  planned: "Planeado",
};

const phase13Updates = [
  "Preview real generado desde el beat completo.",
  "Duraciones dinámicas de 15, 20, 25 o 30 segundos.",
  "PlayerBar premium con modo Preview / Acceso completo.",
  "Validación full/preview en Home, Explore, Detail, Saved y Mis Beats.",
  "Layout móvil más compacto.",
  "Dominio brstudios.org funcionando.",
  "Correos de confirmación funcionando con Resend + Supabase SMTP.",
];

function isVisible(update: ProductUpdate, audience: ProductUpdatesPanelProps["audience"]) {
  return update.audience === "both" || update.audience === audience;
}

function UpdateList({ items }: { items: ProductUpdate[] }) {
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <article key={`${item.title}-${item.version ?? item.status}`} className="rounded-md border border-white/10 bg-white/5 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-cyan-300/30 px-2 py-1 text-xs font-bold uppercase text-cyan-200">{statusLabels[item.status]}</span>
            {item.version ? <span className="text-xs font-semibold text-zinc-500">{item.version}</span> : null}
          </div>
          <p className="mt-2 text-sm font-semibold leading-6 text-zinc-100">{item.title}</p>
        </article>
      ))}
    </div>
  );
}

export function ProductUpdatesPanel({ audience }: ProductUpdatesPanelProps) {
  const latest = latestProductUpdates.filter((item) => isVisible(item, audience));
  const future = futureProductUpdates.filter((item) => isVisible(item, audience));
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <section className="rounded-lg border border-cyan-300/20 bg-[#101317] p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase text-cyan-200">Actualizaciones</p>
          <h2 className="mt-1 text-lg font-bold text-white">Últimos cambios de B.R</h2>
          <span className="mt-3 inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-100">
            Fase 13 cerrada
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex h-10 w-fit items-center rounded-md bg-cyan-300 px-4 text-sm font-bold text-black transition hover:bg-cyan-200"
        >
          Ver actualizaciones
        </button>
      </div>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-3 py-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-updates-title"
          onMouseDown={() => setIsOpen(false)}
        >
          <div
            className="max-h-[86vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-cyan-300/20 bg-[#101317] p-5 shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <p className="text-xs font-bold uppercase text-cyan-200">Fase 13 cerrada</p>
                <h2 id="product-updates-title" className="mt-2 text-xl font-black text-white">
                  Fase 13 cerrada — Preview real, player premium y auth lista
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 text-zinc-400 transition hover:border-cyan-300 hover:text-cyan-100"
                aria-label="Cerrar actualizaciones"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <ul className="mt-5 grid gap-2 text-sm leading-6 text-zinc-300">
              {phase13Updates.map((item) => (
                <li key={item} className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <div>
                <h3 className="mb-3 text-sm font-bold uppercase text-zinc-400">Actualizaciones anteriores</h3>
                <UpdateList items={latest} />
              </div>
              <div>
                <h3 className="mb-3 text-sm font-bold uppercase text-zinc-400">Futuras actualizaciones</h3>
                <UpdateList items={future} />
              </div>
            </div>

            {audience === "admin" ? (
              <p className="mt-5 rounded-md border border-white/10 bg-black/20 p-3 text-sm leading-6 text-zinc-300">
                Nota interna: beat_access no filtra catálogo; solo controla full playback, descarga, badges y acciones protegidas.
              </p>
            ) : null}

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="mt-5 h-10 rounded-md border border-white/10 px-4 text-sm font-bold text-zinc-200 transition hover:border-cyan-300 hover:text-cyan-200"
            >
              Cerrar
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
