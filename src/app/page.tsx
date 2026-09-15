import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Disc3, Headphones, Music2, Radio } from "lucide-react";
import { BR_ROUTES } from "@/lib/routes";
import { CentralEntryLink } from "@/components/central/CentralEntryLink";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#09090b] text-[#f3eee6]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[760px] bg-[radial-gradient(circle_at_18%_10%,rgba(217,170,77,0.12),transparent_30%),radial-gradient(circle_at_82%_8%,rgba(53,201,255,0.13),transparent_28%)]" />
      <div className="pointer-events-none fixed inset-3 rounded-[28px] border border-white/[0.055] sm:inset-5" />

      <header className="relative z-20 border-b border-white/[0.055] bg-[#09090b]/78 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-8 sm:py-3">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <Image src="/brand/br-central-logo.svg" alt="BR Central" width={58} height={58} priority className="h-11 w-11 shrink-0 rounded-xl object-cover sm:h-14 sm:w-14" />
            <span className="min-w-0"><strong className="block text-xs tracking-[0.16em] sm:text-sm sm:tracking-[0.18em]">BR CENTRAL</strong><span className="block truncate text-[8px] uppercase tracking-[0.18em] text-amber-200/55 sm:text-[9px] sm:tracking-[0.28em]">Ideas · proyectos · soluciones</span></span>
          </div>
          <span className="hidden text-[10px] font-black uppercase tracking-[0.28em] text-zinc-600 sm:inline">Dos espacios. Una misma historia.</span>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-9 pt-10 sm:px-8 sm:pb-16 sm:pt-24">
        <div className="max-w-5xl">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-200 sm:text-[11px] sm:tracking-[0.3em]">BR CENTRAL //</p>
          <h1 className="mt-4 text-[3.35rem] font-black leading-[0.92] tracking-[-0.06em] sm:mt-5 sm:text-7xl lg:text-[6.3rem]">¿A dónde quieres <span className="bg-gradient-to-r from-amber-100 via-white to-cyan-200 bg-clip-text text-transparent">entrar?</span></h1>
          <p className="mt-5 max-w-3xl text-sm leading-6 text-zinc-400 sm:mt-7 sm:text-lg sm:leading-8">Central es la puerta principal. Desde aquí puedes entrar al ecosistema de proyectos BR o cambiar de ambiente y entrar a Beat Room.</p>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-5 pb-16 sm:px-8 sm:pb-24">
        <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
          <CentralEntryLink />

          <Link href={BR_ROUTES.musicHome} className="group relative min-h-[330px] overflow-hidden rounded-[28px] border border-cyan-200/15 bg-[linear-gradient(145deg,rgba(8,25,34,.96),rgba(10,12,18,.98)_48%,rgba(18,28,46,.98))] p-5 transition hover:-translate-y-1 hover:border-cyan-200/35 sm:min-h-[390px] sm:rounded-[32px] sm:p-9">
            <div className="absolute -right-20 -top-16 h-64 w-64 rounded-full bg-cyan-400/15 blur-3xl" />
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-[linear-gradient(to_top,rgba(0,194,255,.07),transparent)]" />
            <div className="absolute right-5 top-5 flex items-end gap-1 opacity-25 sm:right-7 sm:top-7 sm:opacity-30"><span className="h-4 w-1 rounded-full bg-cyan-200"/><span className="h-8 w-1 rounded-full bg-cyan-200"/><span className="h-5 w-1 rounded-full bg-cyan-200"/><span className="h-10 w-1 rounded-full bg-cyan-200"/><span className="h-6 w-1 rounded-full bg-cyan-200"/></div>
            <div className="relative flex h-full flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 sm:gap-4">
                  <Image src="/brand/br-platform-icon-192.png" alt="Beat Room" width={68} height={68} className="h-14 w-14 rounded-2xl object-cover ring-1 ring-cyan-100/15 sm:h-16 sm:w-16" />
                  <div><p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200 sm:tracking-[0.3em]">Beat Room</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-600 sm:text-xs sm:tracking-[0.16em]">Music platform</p></div>
                </div>
                <h2 className="mt-6 text-3xl font-black tracking-[-0.05em] sm:mt-8 sm:text-5xl">La música vive aquí.</h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400 sm:mt-5 sm:text-base sm:leading-7">Beats, artistas, accesos y licencias dentro de una experiencia diseñada alrededor de escuchar, crear y compartir música.</p>
                <div className="mt-5 flex gap-2 text-zinc-600 sm:mt-6"><Headphones className="h-4 w-4"/><Music2 className="h-4 w-4"/><Disc3 className="h-4 w-4"/><Radio className="h-4 w-4"/></div>
              </div>
              <span className="mt-7 inline-flex items-center gap-2 text-sm font-black text-cyan-100 sm:mt-10">Entrar a Beat Room <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span>
            </div>
          </Link>
        </div>
        <div className="mt-6 border-t border-white/[0.07] pt-5 text-[9px] font-black uppercase tracking-[0.17em] text-zinc-600 sm:mt-8 sm:pt-6 sm:text-[11px] sm:tracking-[0.24em]">Ideas → experimentos → productos → sistemas reales</div>
      </section>
    </main>
  );
}
