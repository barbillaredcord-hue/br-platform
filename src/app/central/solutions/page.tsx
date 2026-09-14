import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Boxes } from "lucide-react";
import { BRCompanion } from "@/components/central/BRCompanion";
import { SolutionCards } from "@/components/central/SolutionCards";

export const metadata: Metadata = { title: "BR Solutions | BR STUDIOS Central", description: "Sistemas de BR que alcanzaron suficiente claridad y utilidad para resolver problemas de forma repetible." };

export default function SolutionsPage() {
  return <main className="min-h-screen bg-[#09090b] text-[#f3eee6]">
    <div className="pointer-events-none fixed inset-x-0 top-0 h-[760px] bg-[radial-gradient(circle_at_18%_10%,rgba(59,130,246,0.12),transparent_30%),radial-gradient(circle_at_82%_10%,rgba(168,85,247,0.12),transparent_30%)]" />
    <section className="relative z-10 mx-auto grid max-w-7xl gap-10 px-5 pb-16 pt-16 sm:px-8 sm:pt-24 lg:grid-cols-[1.2fr_.72fr] lg:items-start"><div><p className="text-[11px] font-black uppercase tracking-[0.32em] text-violet-300">Cuando construir deja de ser suficiente //</p><h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.94] tracking-[-0.06em] sm:text-7xl">Una Solution debe poder resolver algo <span className="text-zinc-500">otra vez.</span></h1><p className="mt-7 max-w-3xl text-base leading-8 text-zinc-400 sm:text-lg">No todo Project llega aquí. Solutions registra sistemas cuya utilidad empieza a ser repetible fuera del caso que los originó, y también deja visible lo que todavía falta antes de llamarlos solución madura.</p></div><BRCompanion /></section>
    <section className="relative z-10 mx-auto max-w-7xl px-5 pb-20 sm:px-8"><div className="mb-6 border-t border-white/[0.07] pt-7"><p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Evaluación de madurez //</p><p className="mt-2 text-sm text-zinc-500">Problema claro → utilidad repetible → límites conocidos → solución.</p></div><SolutionCards /></section>
    <section className="relative z-10 mx-auto max-w-7xl px-5 pb-24 sm:px-8"><div className="rounded-[32px] border border-violet-300/15 bg-gradient-to-br from-blue-500/[0.05] to-violet-500/[0.09] p-8 sm:p-10"><div className="flex items-center gap-3 text-violet-200"><Boxes className="h-5 w-5" /><span className="text-[10px] font-black uppercase tracking-[0.3em]">Regla de Solutions</span></div><h2 className="mt-5 max-w-4xl text-4xl font-black tracking-[-0.05em] sm:text-5xl">No promovemos una función. Promovemos una capacidad comprobable.</h2><p className="mt-5 max-w-3xl leading-7 text-zinc-400">Llegar a Solutions no significa que el trabajo terminó. Significa que ya podemos explicar qué problema resuelve, qué parte es repetible y cuáles son sus límites.</p><Link href="/catalogo" className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#f3eee6] px-5 py-3 text-sm font-black text-[#09090b]">Ver catálogo público <ArrowRight className="h-4 w-4" /></Link></div></section>
  </main>;
}
