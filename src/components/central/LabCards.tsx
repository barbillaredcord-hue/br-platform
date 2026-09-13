import Link from "next/link";
import { ArrowRight, CheckCircle2, RadioTower, ShieldCheck, Sparkles } from "lucide-react";
import { centralExperiments } from "@/lib/central/lab";

const icons = { radio: RadioTower, shield: ShieldCheck, sparkles: Sparkles };

export function LabCards() {
  return <div className="grid gap-4">{centralExperiments.map((item, index) => {
    const Icon = icons[item.icon];
    return <article id={item.id} key={item.name} className="scroll-mt-32 rounded-[30px] border border-white/[0.075] bg-white/[0.025] p-6 sm:p-8">
      <div className="grid gap-8 lg:grid-cols-[.68fr_1.32fr]">
        <div><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-300/15 bg-cyan-400/[0.05] text-cyan-200"><Icon className="h-5 w-5" /></span><span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-600">EXP 0{index + 1}</span></div><h2 className="mt-6 text-3xl font-black tracking-[-0.04em]">{item.name}</h2><span className="mt-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/15 px-3 py-1.5 text-xs font-black text-cyan-200">{item.result && <CheckCircle2 className="h-3.5 w-3.5" />}{item.status}</span><p className="mt-6 text-lg font-bold leading-8 text-zinc-200">{item.hypothesis}</p>{item.result && item.projectHref && <Link href={item.projectHref} className="mt-6 inline-flex items-center gap-2 text-sm font-black text-cyan-200 transition hover:text-white">Resultado: {item.result} <ArrowRight className="h-4 w-4" /></Link>}</div>
        <div className="grid gap-3 sm:grid-cols-3"><LabCell label="Evidencia" text={item.evidence} /><LabCell label="Decisión" text={item.decision} /><LabCell label="Resultado" text={item.result ? `La prueba justificó avanzar a ${item.result}. El aprendizaje queda enlazado con lo que se construyó después.` : "Todavía no avanza. Falta evidencia suficiente para justificar convertir esta prueba en un sistema estable."} /></div>
      </div>
    </article>;
  })}</div>;
}

function LabCell({ label, text }: { label: string; text: string }) {
  return <div className="rounded-[22px] border border-white/[0.07] bg-black/15 p-5"><p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-600">{label}</p><p className="mt-3 text-sm leading-6 text-zinc-400">{text}</p></div>;
}
