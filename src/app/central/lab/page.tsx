import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, FlaskConical } from "lucide-react";
import { BRCompanion } from "@/components/central/BRCompanion";
import { LabCards } from "@/components/central/LabCards";

export const metadata: Metadata = { title: "BR Lab | BR STUDIOS Central", description: "Experimentos, hipótesis y aprendizajes técnicos de BR STUDIOS antes de convertirse en proyectos." };

export default function LabPage() {
  return <main className="min-h-screen bg-[#09090b] text-[#f3eee6]">
    <div className="pointer-events-none fixed inset-x-0 top-0 h-[780px] bg-[radial-gradient(circle_at_16%_10%,rgba(57,189,248,0.12),transparent_30%),radial-gradient(circle_at_82%_12%,rgba(139,92,246,0.13),transparent_30%)]" />
    <header className="relative z-10 border-b border-white/[0.06] bg-[#09090b]/80 backdrop-blur-xl"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8"><Link href="/central" className="inline-flex items-center gap-2 text-sm font-black text-zinc-300 transition hover:text-white"><ArrowLeft className="h-4 w-4" /> BR Central</Link><span className="text-[10px] font-black uppercase tracking-[0.34em] text-cyan-300">BR Lab</span></div></header>

    <section className="relative z-10 mx-auto max-w-7xl px-5 pb-14 pt-16 sm:px-8 sm:pt-24"><div className="grid gap-10 lg:grid-cols-[1.2fr_.72fr] lg:items-start"><div><p className="text-[11px] font-black uppercase tracking-[0.32em] text-cyan-300">Antes de que algo sea proyecto //</p><h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.94] tracking-[-0.06em] sm:text-7xl">Aquí todavía está permitido <span className="text-zinc-500">no saber.</span></h1><p className="mt-7 max-w-3xl text-base leading-8 text-zinc-400 sm:text-lg">BR Lab conserva la evidencia detrás de una decisión. No basta con que una idea suene bien: queremos saber qué probamos, qué aprendimos y por qué decidimos construir más —o detenernos.</p></div><BRCompanion /></div></section>

    <section className="relative z-10 mx-auto max-w-7xl px-5 pb-20 sm:px-8"><div className="mb-6 border-t border-white/[0.07] pt-7"><p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Registro de experimentos //</p><p className="mt-2 text-sm text-zinc-500">Hipótesis → evidencia → decisión → resultado.</p></div><LabCards /></section>

    <section className="relative z-10 mx-auto max-w-7xl px-5 pb-24 sm:px-8"><div className="rounded-[32px] border border-violet-300/15 bg-gradient-to-br from-cyan-500/[0.05] to-violet-500/[0.08] p-8 sm:p-10"><div className="flex items-center gap-3 text-cyan-200"><FlaskConical className="h-5 w-5" /><span className="text-[10px] font-black uppercase tracking-[0.3em]">Criterio de salida</span></div><h2 className="mt-5 max-w-4xl text-4xl font-black tracking-[-0.05em] sm:text-5xl">Avanzar también es una decisión que debe poder explicarse.</h2><p className="mt-5 max-w-3xl leading-7 text-zinc-400">Una prueba sale de Lab cuando el problema sigue siendo real, la evidencia cambia una decisión y existe una razón concreta para invertir en la siguiente etapa. Si no ocurre, el aprendizaje permanece aquí.</p><Link href="/central/projects" className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#f3eee6] px-5 py-3 text-sm font-black text-[#09090b]">Seguir la evolución en Projects <ArrowRight className="h-4 w-4" /></Link></div></section>
  </main>;
}
