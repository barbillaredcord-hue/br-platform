import Link from "next/link";
import { ArrowUpRight, Headphones, Layers3 } from "lucide-react";
import { BR_ROUTES } from "@/lib/routes";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#09090b] text-[#f3eee6]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[760px] bg-[radial-gradient(circle_at_18%_10%,rgba(73,94,255,0.18),transparent_30%),radial-gradient(circle_at_82%_8%,rgba(160,84,255,0.16),transparent_28%)]" />
      <div className="pointer-events-none fixed inset-3 rounded-[28px] border border-white/[0.055] sm:inset-5" />

      <header className="relative z-20 border-b border-white/[0.055] bg-[#09090b]/78 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.035] text-sm font-black tracking-wider shadow-[0_0_30px_rgba(108,92,255,0.10)]">BR</span>
            <span>
              <strong className="block text-sm tracking-[0.18em]">BR STUDIOS</strong>
              <span className="block text-[10px] uppercase tracking-[0.36em] text-zinc-500">Central</span>
            </span>
          </div>
          <Link href={BR_ROUTES.centralHome} className="hidden text-sm font-bold text-zinc-400 transition hover:text-white sm:inline-flex">
            Conocer BR STUDIOS Central
          </Link>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-20 pt-16 sm:px-8 sm:pt-28">
        <div className="max-w-5xl">
          <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/[0.07] bg-white/[0.025] px-4 py-2 text-[11px] font-black uppercase tracking-[0.26em] text-zinc-400">
            <span className="h-2 w-2 rounded-full bg-gradient-to-br from-blue-300 to-violet-300 shadow-[0_0_18px_rgba(120,100,255,0.8)]" />
            Un estudio, dos experiencias
          </div>
          <h1 className="text-5xl font-black leading-[0.95] tracking-[-0.06em] sm:text-7xl lg:text-[6.3rem]">
            Bienvenido a <span className="bg-gradient-to-r from-blue-200 via-indigo-200 to-violet-200 bg-clip-text text-transparent">BR STUDIOS.</span>
          </h1>
          <p className="mt-8 max-w-3xl text-base leading-8 text-zinc-400 sm:text-lg">
            Elige a dónde quieres entrar: nuestra plataforma musical privada o BR STUDIOS Central, donde puedes conocer soluciones digitales, servicios y acompañamiento para proyectos y negocios.
          </p>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <div className="grid gap-5 lg:grid-cols-2">
          <Link href={BR_ROUTES.musicHome} className="group relative min-h-[360px] overflow-hidden rounded-[32px] border border-white/[0.075] bg-gradient-to-br from-cyan-400/[0.06] via-white/[0.025] to-blue-500/[0.08] p-7 shadow-[0_30px_100px_rgba(0,0,0,.34)] transition hover:-translate-y-1 hover:border-cyan-200/25 sm:p-9">
            <div className="absolute -right-16 -top-12 h-52 w-52 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="relative flex h-full flex-col justify-between">
              <div>
                <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.035] text-cyan-200">
                  <Headphones className="h-5 w-5" />
                </div>
                <p className="mt-8 text-[10px] font-black uppercase tracking-[0.3em] text-cyan-200">B.R Platform</p>
                <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] sm:text-5xl">Entrar a la plataforma musical</h2>
                <p className="mt-5 max-w-xl leading-7 text-zinc-400">Explora beats, accesos, favoritos, licencias y tu experiencia privada dentro de B.R.</p>
              </div>
              <span className="mt-10 inline-flex items-center gap-2 text-sm font-black text-cyan-100">Abrir plataforma <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span>
            </div>
          </Link>

          <Link href="/catalogo" className="group relative min-h-[360px] overflow-hidden rounded-[32px] border border-violet-300/15 bg-gradient-to-br from-blue-500/[0.07] via-white/[0.025] to-violet-500/[0.10] p-7 shadow-[0_30px_100px_rgba(0,0,0,.34)] transition hover:-translate-y-1 hover:border-violet-200/30 sm:p-9">
            <div className="absolute -right-16 -top-12 h-52 w-52 rounded-full bg-violet-500/12 blur-3xl" />
            <div className="relative flex h-full flex-col justify-between">
              <div>
                <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.035] text-violet-200">
                  <Layers3 className="h-5 w-5" />
                </div>
                <p className="mt-8 text-[10px] font-black uppercase tracking-[0.3em] text-violet-300">BR STUDIOS Central</p>
                <h2 className="mt-3 text-4xl font-black tracking-[-0.05em] sm:text-5xl">Explorar catálogo y servicios</h2>
                <p className="mt-5 max-w-xl leading-7 text-zinc-400">Conoce páginas web, aplicaciones, e-commerce, sistemas a la medida, UI/UX y automatización.</p>
              </div>
              <span className="mt-10 inline-flex items-center gap-2 text-sm font-black text-violet-100">Ver catálogo <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span>
            </div>
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.07] pt-6 text-sm text-zinc-500">
          <span>BR STUDIOS · Tecnología · Diseño · Resultados</span>
          <Link href={BR_ROUTES.centralHome} className="font-bold text-zinc-300 transition hover:text-violet-200">Conocer Central →</Link>
        </div>
      </section>
    </main>
  );
}
