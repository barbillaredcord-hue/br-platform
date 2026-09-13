import Link from "next/link";
import { ArrowUpRight, FlaskConical, Layers3, RadioTower, Sparkles } from "lucide-react";
import { centralProjects } from "@/lib/central/projects";

const icons = { layers: Layers3, sparkles: Sparkles, radio: RadioTower, flask: FlaskConical };

export function ProjectCards() {
  return <div className="grid gap-5">{centralProjects.map((project, index) => {
    const Icon = icons[project.icon];
    return <article id={project.id} key={project.name} className="scroll-mt-32 relative overflow-hidden rounded-[30px] border border-white/[0.075] bg-white/[0.026] p-6 sm:p-8">
      <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-blue-500/[0.07] blur-3xl" />
      <div className="relative grid gap-8 lg:grid-cols-[0.7fr_1.3fr]">
        <div>
          <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.035] text-blue-200"><Icon className="h-5 w-5" /></span><span className="text-[10px] font-black uppercase tracking-[0.26em] text-zinc-500">0{index + 1} · {project.accent}</span></div>
          <h2 className="mt-6 text-3xl font-black tracking-[-0.04em] sm:text-4xl">{project.name}</h2>
          <p className="mt-3 inline-flex rounded-full border border-blue-300/15 bg-blue-400/[0.05] px-3 py-1.5 text-xs font-black text-blue-200">{project.stage}</p>
          {project.labRelation && <Link href="/central/lab" className="mt-4 flex items-center gap-2 text-xs font-black text-cyan-300 transition hover:text-white"><FlaskConical className="h-3.5 w-3.5" /> {project.labRelation.label}: {project.labRelation.experiment}</Link>}
          {project.solutionHref && project.solutionLabel && <Link href={project.solutionHref} className="mt-3 flex items-center gap-2 text-xs font-black text-violet-300 transition hover:text-white">{project.solutionLabel} <ArrowUpRight className="h-3.5 w-3.5" /></Link>}
          <p className="mt-7 text-lg font-bold leading-8 text-zinc-200">{project.why}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3"><Cell label="Problema" text={project.problem} /><Cell label="Solución" text={project.solution} /><Cell label="Evolución" text={project.evolution} /></div>
      </div>
    </article>;
  })}</div>;
}

function Cell({ label, text }: { label: string; text: string }) {
  return <div className="rounded-[22px] border border-white/[0.07] bg-black/15 p-5"><p className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-600">{label}</p><p className="mt-3 text-sm leading-6 text-zinc-400">{text}</p></div>;
}
