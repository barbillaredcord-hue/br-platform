type PageProps = {
  params: Promise<{
    month: string;
  }>;
  searchParams?: Promise<{
    amount?: string;
  }>;
};

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);

  if (Number.isNaN(date.getTime())) {
    return monthKey;
  }

  return date.toLocaleDateString("es-MX", {
    month: "long",
    year: "numeric",
  });
}

function money(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value);
}

export default async function EarningsReportPage({ params, searchParams }: PageProps) {
  const { month } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const amount = Number(resolvedSearchParams.amount ?? 0);
  const label = formatMonthLabel(month);
  const generatedAt = new Date().toLocaleString("es-MX");

  return (
    <main className="min-h-screen bg-[#05070a] p-6 text-white print:bg-white print:p-0 print:text-black">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between gap-3 print:hidden">
          <a href="/admin" className="inline-flex h-10 items-center gap-2 rounded-md border border-white/10 px-4 text-sm font-bold text-zinc-200 hover:border-cyan-300 hover:text-cyan-200">
            ← Volver al admin
          </a>

          <button id="print-report-button" type="button" className="inline-flex h-10 items-center gap-2 rounded-md bg-cyan-300 px-4 text-sm font-bold text-black hover:bg-cyan-200">
            Descargar PDF
          </button>
        </div>

        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#101317] p-10 shadow-2xl print:rounded-none print:border print:border-zinc-300 print:bg-white print:shadow-none">
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-[190px] font-black tracking-[-0.12em] text-cyan-200/5 print:text-cyan-700/5">
            BR
          </div>

          <div className="relative z-10 flex items-start justify-between gap-6 border-b border-white/10 pb-8 print:border-zinc-200">
            <div className="flex items-center gap-4">
              <div className="grid h-20 w-20 place-items-center rounded-2xl border border-cyan-300/30 bg-cyan-300/10 text-2xl font-black tracking-[-0.08em] text-cyan-100 print:bg-cyan-50 print:text-cyan-700">
                BR
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200 print:text-cyan-700">B.R Finanzas</p>
                <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] text-white print:text-zinc-950">Estado de cuenta mensual</h1>
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-200 print:text-cyan-700">BeatRoom</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.1em] text-zinc-500">Estado financiero</p>
            </div>
          </div>

          <div className="relative z-10 mt-10 grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 print:border-zinc-200 print:bg-zinc-50">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-zinc-500">Periodo</p>
              <p className="mt-3 text-3xl font-black capitalize text-white print:text-zinc-950">{label}</p>
            </div>

            <div className="rounded-2xl border border-cyan-300/30 bg-cyan-300/10 p-6 print:border-cyan-200 print:bg-cyan-50">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-cyan-200 print:text-cyan-700">Total registrado</p>
              <p className="mt-3 text-4xl font-black text-cyan-100 print:text-cyan-700">{money(Number.isFinite(amount) ? amount : 0)}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 print:border-zinc-200 print:bg-zinc-50">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-zinc-500">Generado</p>
              <p className="mt-3 text-lg font-bold text-zinc-200 print:text-zinc-800">{generatedAt}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 print:border-zinc-200 print:bg-zinc-50">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-zinc-500">Origen</p>
              <p className="mt-3 text-lg font-bold text-zinc-200 print:text-zinc-800">Pagos manuales B.R</p>
            </div>
          </div>

          <div className="relative z-10 mt-10 rounded-2xl border-l-4 border-cyan-300 bg-cyan-300/10 p-5 text-sm leading-7 text-zinc-300 print:bg-cyan-50 print:text-zinc-700">
            Este estado de cuenta resume pagos manuales registrados en BeatRoom para el mes seleccionado. No sustituye comprobantes fiscales ni facturación oficial.
          </div>

          <div className="relative z-10 mt-12 flex justify-between gap-6 border-t border-white/10 pt-6 text-xs font-semibold text-zinc-500 print:border-zinc-200">
            <span>Documento generado desde B.R Admin.</span>
            <span>BeatRoom / B.R</span>
          </div>
        </section>
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `document.getElementById("print-report-button")?.addEventListener("click", function () { window.print(); });`,
        }}
      />
    </main>
  );
}