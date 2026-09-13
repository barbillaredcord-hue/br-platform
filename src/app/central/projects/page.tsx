import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { BRCompanion } from "@/components/central/BRCompanion";
import { ProjectCards } from "@/components/central/ProjectCards";

export const metadata: Metadata = { title: "BR Projects | BR STUDIOS Central", description: "Proyectos reales de BR STUDIOS explicados desde el problema que los originó hasta su evolución actual." };

export default function ProjectsPage() {
  return <main className="min-h-screen bg-[#09090b] text-[#f3eee6]">
    <div className="pointer-events-none fixed inset-x-0 top-0 h-[760px] bg-[radial-gradient(circle_at_15%_12%,rgba(80,108,255,0.13),transparent_30%),radial-gradient(circle_at_82%_10%,rgba(161,86,255,0.12),transparent_30%)]" />
    <header className="relative z-10 border-b border-white/[0.06] bg-[#09090b]/80 backdrop-blur-xl"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8"><Link href="/central" className="inline-flex items-center gap-2 text-sm font-black text-zinc-300 transition hover:text-white"><ArrowLeft className="h-4 w-4" /> BR Central</Link><span className="text-[10px] font-black uppercase tracking-[0.34em] text-blue-300">BR Projects</span></div></header>
    <section className="relative z-10 mx-auto grid max-w-6xl gap-10 px-5 pb-16 pt-16 sm:px-8 sm:pt-24 lg:grid-cols-[1.25fr_.75fr] lg:items-start"><div><p className="text-[11px] font-black uppercase tracking-[0.32em] text-blue-300">No solo qué hicimos. Por qué tuvo sentido hacerlo.</p><h1 className="mt-5 text-5xl font-black leading-[0.95] tracking-[-0.055em] sm:text-7xl">Cada proyecto empieza con un problema que vale la pena recordar.</h1><p className="mt-7 max-w-3xl text-base leading-8 text-zinc-400 sm:text-lg">BR Projects documenta el motivo detrás de cada sistema, su relación real con Lab y, cuando existe, el camino de madurez hacia Solutions.</p></div><BRCompanion /></section>
    <section className="relative z-10 mx-auto max-w-6xl px-5 pb-24 sm:px-8"><ProjectCards /></section>
    <section className="relative z-10 mx-auto max-w-6xl px-5 pb-24 sm:px-8"><div className="rounded-[32px] border border-violet-300/15 bg-gradient-to-br from-blue-500/[0.06] to-violet-500/[0.08] p-8 sm:p-10"><p className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-300">La cadena ya es visible</p><h2 className="mt-4 max-w-4xl text-4xl font-black tracking-[-0.045em] sm:text-5xl">Lab ↔ Project → Solution.</h2><p className="mt-5 max-w-3xl leading-7 text-zinc-400">No todas las relaciones significan lo mismo. Un Project puede haber avanzado desde un experimento, estar todavía relacionado con una validación de Lab o haber alcanzado madurez suficiente para aparecer en Solutions.</p><div className="mt-7 flex flex-wrap gap-3"><Link href="/central/lab" className="inline-flex items-center gap-2 rounded-full bg-[#f3eee6] px-5 py-3 text-sm font-black text-[#09090b]">Ver evidencia en Lab <ArrowUpRight className="h-4 w-4" /></Link><Link href="/central/solutions" className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm font-black text-zinc-300">Ver madurez en Solutions <ArrowUpRight className="h-4 w-4" /></Link></div></div></section>
  </main>;
}
