import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, Layers3, Music2 } from "lucide-react";
import { centralSolutions } from "@/lib/central/solutions";

const icons = { layers: Layers3, music: Music2 };

export function SolutionCards() {
  return <div className="grid gap-4">{centralSolutions.map((solution) => {
    const Icon = icons[solution.icon];
    return <article id={solution.id} key={solution.name} className="scroll-mt-32 rounded-[30px] border border-white/[0.075] bg-white/[0.025] p-6 sm:p-8">
      <div className="grid gap-8 lg:grid-cols-[.68fr_1.32fr]">
        <div><span className="grid h-11 w-11 place-items-center rounded-2xl border border-violet-300/15 bg-violet-400/[0.05] text-violet-200"><Icon className="h-5 w-5" /></span><h2 className="mt-6 text-3xl font-black tracking-[-0.04em]">{solution.name}</h2><span className="mt-3 inline-flex items-center gap-2 rounded-full border border-violet-300/15 px-3 py-1.5 text-xs font-black text-violet-200">{solution.ready ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}{solution.maturity}</span><Link href={solution.projectHref} className="mt-5 flex items-center gap-2 text-xs font-black text-blue-300 transition hover:text-white">Viene de Project: {solution.project} <ArrowRight className="h-3.5 w-3.5" /></Link></div>
        <div className="grid gap-3 sm:grid-cols-3"><Cell label="Problema repetible" text={solution.problem} /><Cell label="Qué ya se repite" text={solution.repeatable} /><Cell label={solution.ready ? "Siguiente madurez" : "Qué falta"} text={solution.missing} /></div>
      </div>
    </article>;
  })}</div>;
}

function Cell({ label, text }: { label: string; text: string }) {
  return <div className="rounded-[22px] border border-white/[0.07] bg-black/15 p-5"><p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-600">{label}</p><p className="mt-3 text-sm leading-6 text-zinc-400">{text}</p></div>;
}
