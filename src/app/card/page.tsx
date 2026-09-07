import Link from "next/link";

export default function BRCardPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#09090b] px-6 text-white">
      <section className="w-full max-w-md text-center">
        <p className="text-xs font-black uppercase tracking-[0.32em] text-blue-300">
          BR STUDIOS
        </p>

        <h1 className="mt-4 text-5xl font-black tracking-[-0.06em]">
          BR Card
        </h1>

        <p className="mt-5 text-zinc-400">
          Consulta segura de tarjeta.
        </p>

        <div className="mt-10 rounded-[28px] border border-white/[0.08] bg-white/[0.035] p-7">
          <p className="text-sm leading-6 text-zinc-400">
            El acceso con numero de tarjeta y NIP se habilitara en la siguiente etapa.
          </p>
        </div>

        <Link
          href="/"
          className="mt-8 inline-block text-sm font-bold text-zinc-500 transition hover:text-white"
        >
          Volver a BR STUDIOS
        </Link>
      </section>
    </main>
  );
}
