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
            <span><strong className="block text-sm tracking-[0.18em]">BR STUDIOS</strong><span className="block text-[10px] uppercase tracking-[0.36em] text-zinc-500">Entry</span></span>
          </div>
          <span className="hidden text-[10px] font-black uppercase tracking-[0.28em] text-zinc-600 sm:inline">Dos espacios. Una misma historia.</span>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-16 pt-16 sm:px-8 sm:pt-28">
        <div className="max-w-5xl">
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-300">BR STUDIOS //</p>
          <h1 className="mt-5 text-5xl font-black leading-[0.95] tracking-[-0.06em] sm:text-7xl lg:text-[6.3rem]">¿A dónde quieres <span className="bg-gradient-to-r from-blue-200 via-indigo-200 to-violet-200 bg-clip-text text-transparent">entrar?</span></h1>
          <p className="mt-7 max-w-3xl text-base leading-8 text-zinc-400 sm:text-lg">BR no es una sola aplicación. La plataforma musical y Central son dos puertas distintas hacia lo que construimos.</p>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <div className="grid gap-5 lg:grid-cols-2">
          <Link href={BR_ROUTES.musicHome} className="group relative min-h-[360px] overflow-hidden rounded-[32px] border border-white/[0.075] bg-gradient-to-br from-cyan-400/[0.06] via-white/[0.025] to-blue-500/[0.08] p-7 transition hover:-translate-y-1 hover:border-cyan-200/25 sm:p-9">
            <div className="absolute -right-16 -top-12 h-52 w-52 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="relative flex h-full flex-col justify-between"><div><div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.035] text-cyan-200"><Headphones className="h-5 w-5" /></div><p className="mt-8 text-[10px] font-black uppercase tracking-[0.3em] text-cyan-200">B.R Platform</p><h2 className="mt-3 text-4xl font-black tracking-[-0.05em] sm:text-5xl">La música vive aquí.</h2><p className="mt-5 max-w-xl leading-7 text-zinc-400">Beats, artistas, accesos, licencias y herramientas construidas alrededor de la música.</p></div><span className="mt-10 inline-flex items-center gap-2 text-sm font-black text-cyan-100">Entrar a Platform <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span></div>
          </Link>

          <Link href={BR_ROUTES.centralHome} className="group relative min-h-[360px] overflow-hidden rounded-[32px] border border-violet-300/15 bg-gradient-to-br from-blue-500/[0.07] via-white/[0.025] to-violet-500/[0.10] p-7 transition hover:-translate-y-1 hover:border-violet-200/30 sm:p-9">
            <div className="absolute -right-16 -top-12 h-52 w-52 rounded-full bg-violet-500/12 blur-3xl" />
            <div className="relative flex h-full flex-col justify-between"><div><div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.035] text-violet-200"><Layers3 className="h-5 w-5" /></div><p className="mt-8 text-[10px] font-black uppercase tracking-[0.3em] text-violet-300">BR Central</p><h2 className="mt-3 text-4xl font-black tracking-[-0.05em] sm:text-5xl">Entra donde las ideas se conectan.</h2><p className="mt-5 max-w-xl leading-7 text-zinc-400">Proyectos, experimentos, soluciones y el contexto detrás de por qué decidimos construirlos.</p></div><span className="mt-10 inline-flex items-center gap-2 text-sm font-black text-violet-100">Entrar a Central <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span></div>
          </Link>
        </div>
        <div className="mt-8 border-t border-white/[0.07] pt-6 text-[11px] font-black uppercase tracking-[0.24em] text-zinc-600">Ideas → experimentos → productos → sistemas reales</div>
      </section>
    </main>
  );
}
