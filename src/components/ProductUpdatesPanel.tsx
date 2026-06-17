import { currentProductPhase, futureProductUpdates, latestProductUpdates, type ProductUpdate, type ProductUpdateAudience, type ProductUpdateStatus } from "@/data/product-updates";

type ProductUpdatesPanelProps = {
  audience: Exclude<ProductUpdateAudience, "both">;
};

const statusLabels: Record<ProductUpdateStatus, string> = {
  released: "Implementado",
  in_progress: "En progreso",
  planned: "Planeado",
};

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

  return (
    <section className="rounded-lg border border-cyan-300/20 bg-[#101317] p-5">
      <div className="flex flex-col gap-2 border-b border-white/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-cyan-200">Actualizaciones</p>
          <h2 className="mt-2 text-xl font-bold text-white">{currentProductPhase.title}</h2>
        </div>
        <p className="text-sm font-semibold text-zinc-400">
          {currentProductPhase.version} · {statusLabels[currentProductPhase.status]}
        </p>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-bold uppercase text-zinc-400">Últimas actualizaciones</h3>
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
    </section>
  );
}
