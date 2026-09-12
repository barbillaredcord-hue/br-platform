import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Boxes, FlaskConical, Layers3, Network } from "lucide-react";
import { BRCompanion } from "@/components/central/BRCompanion";
import { PrivateAppsMenu } from "@/components/central/PrivateAppsMenu";
import { BR_ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "BR Central | BR STUDIOS",
  description: "El punto de entrada a los proyectos, experimentos y soluciones que construye BR STUDIOS.",
};

const spaces = [
  { title: "Projects", label: "Lo que ya estamos construyendo", text: "Proyectos reales, su razón de existir y cómo están evolucionando.", href: "/central/projects", icon: Layers3 },
  { title: "Lab", label: "Lo que todavía estamos probando", text: "Experimentos, preguntas técnicas, intentos descartados y cosas que todavía no sabemos.", href: "/central/projects", icon: FlaskConical },
  { title: "Solutions", label: "Lo que ya puede resolver algo", text: "Tecnología y trabajo que alcanzaron suficiente claridad para convertirse en una solución.", href: "/catalogo", icon: Boxes },
  { title: "Ecosystem", label: "Cómo se conecta todo", text: "Una vista de cómo los proyectos de BR comparten herramientas, aprendizajes y propósito.", href: "/central/projects", icon: Network },
];

export default function CentralPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#09090b] text-[#f3eee6]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[820px] bg-[radial-gradient(circle_at_15%_12%,rgba(65,105,255,0.15),transparent_30%),radial-gradient(circle_at_82%_10%,rgba(151,80,255,0.13),transparent_29%)]" />
      <div className="pointer-events-none fixed inset-3 rounded-[28px] border border-white/[0.05] sm:inset-5" />

      <header className="relative z-20 border-b border-white/[0.055] bg-[#09090b]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link href={BR_ROUTES.entrySelector} className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.035] text-sm font-black tracking-wider">BR</span>
            <span><strong className="block text-sm tracking-[0.18em]">BR STUDIOS</strong><span className="block text-[10px] uppercase tracking-[0.36em] text-zinc-500">Central</span></span>
          </Link>
          <nav className="hidden items-center gap-5 text-xs font-bold text-zinc-500 lg:flex"><Link href="/central/projects" className="transition hover:text-white">Projects</Link><span className="cursor-default">Lab</span><Link href="/catalogo" className="transition hover:text-white">Solutions</Link><span className="cursor-default">Ecosystem</span></nav>
          <PrivateAppsMenu />
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-16 pt-14 sm:px-8 sm:pt-24">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_.72fr] lg:items-start">
          <div className="pt-2">
            <p className="text-[11px] font-black uppercase tracking-[0.34em] text-blue-300">Bienvenido a //</p>
            <h1 className="mt-4 text-6xl font-black leading-[0.88] tracking-[-0.065em] sm:text-8xl lg:text-[7rem]">BR<br /><span className="bg-gradient-to-r from-blue-100 via-indigo-100 to-violet-200 bg-clip-text text-transparent">CENTRAL.</span></h1>
            <p className="mt-8 max-w-2xl text-xl font-bold leading-8 text-zinc-200 sm:text-2xl">El lugar donde BR recuerda qué está intentando resolver.</p>
            <p className="mt-4 max-w-2xl text-base leading-8 text-zinc-500">No es un catálogo disfrazado de laboratorio. Aquí puedes recorrer lo que estamos construyendo, lo que todavía estamos probando y las decisiones que hicieron que cada proyecto cambiara.</p>
            <div className="mt-10 flex flex-wrap gap-3"><Link href="/central/projects" className="inline-flex items-center gap-2 rounded-full bg-[#f3eee6] px-5 py-3 text-sm font-black text-[#09090b]">Ver qué estamos construyendo <ArrowUpRight className="h-4 w-4" /></Link><Link href="/catalogo" className="rounded-full border border-white/10 px-5 py-3 text-sm font-bold text-zinc-300">Ver soluciones</Link></div>
          </div>
          <BRCompanion />
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-20 sm:px-8">
        <div className="mb-5 flex items-end justify-between border-t border-white/[0.07] pt-7"><div><p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Dentro de Central //</p><p className="mt-2 text-sm text-zinc-500">No son departamentos. Son momentos distintos de una idea.</p></div></div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {spaces.map(({ title, label, text, href, icon: Icon }) => (
            <Link key={title} href={href} className="group min-h-[245px] rounded-[25px] border border-white/[0.07] bg-white/[0.022] p-6 transition hover:-translate-y-1 hover:border-blue-300/20 hover:bg-white/[0.035]">
              <Icon className="h-5 w-5 text-blue-300" /><p className="mt-8 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-600">{label}</p><h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">{title}</h2><p className="mt-3 text-sm leading-6 text-zinc-500">{text}</p><span className="mt-6 inline-flex items-center gap-2 text-xs font-black text-zinc-400 group-hover:text-blue-200">Explorar <ArrowUpRight className="h-3.5 w-3.5" /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <div className="grid gap-5 border-t border-white/[0.07] pt-8 md:grid-cols-[1fr_.7fr]">
          <div><p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-300">Una regla que queremos conservar //</p><p className="mt-4 max-w-3xl text-3xl font-black leading-tight tracking-[-0.04em] sm:text-4xl">Un proyecto no solo debe recordar cómo empezó. Debe conservar por qué valía la pena empezarlo.</p></div>
          <div className="flex items-end"><p className="max-w-md text-sm leading-7 text-zinc-500">Por eso Central registra problemas, experimentos, decisiones, resultados y evolución. Si una solución deja de tener sentido, también queremos poder verlo.</p></div>
        </div>
      </section>
    </main>
  );
}
