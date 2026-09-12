"use client";

import Link from "next/link";
import { ArrowUpRight, BookOpen, FlaskConical, Lightbulb, Search, Sparkles, Wrench } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const paths = [
  { key: "idea", label: "Tengo una idea", icon: Lightbulb, title: "Empecemos por lo que quieres que exista.", text: "No necesitas definir tecnología todavía. Mira proyectos parecidos, entiende el problema y observa cómo BR convierte una idea en algo que se puede probar.", href: "/central/projects", action: "Ver cómo nacen los proyectos" },
  { key: "problem", label: "Tengo un problema que resolver", icon: Wrench, title: "Entonces no empecemos por una app.", text: "Primero hay que entender qué está pasando, qué proceso se rompe y qué información falta. Después decidimos si hace falta software, automatización o una mejor estructura.", href: "/catalogo", action: "Explorar soluciones" },
  { key: "building", label: "Quiero ver qué están construyendo", icon: Search, title: "Aquí puedes ver BR en movimiento.", text: "Projects conserva el porqué de cada sistema, qué problema intentó resolver y cómo fue cambiando con el uso real.", href: "/central/projects", action: "Entrar a BR Projects" },
  { key: "learn", label: "Enséñame algo", icon: BookOpen, title: "Central también debe dejar algo útil.", text: "Queremos documentar decisiones, errores, pruebas y aprendizajes técnicos que aparecen mientras construimos.", href: "/central/projects", action: "Ver aprendizajes de proyectos" },
  { key: "explore", label: "Solo estoy explorando", icon: FlaskConical, title: "Mira sin tener que decidir nada.", text: "Puedes recorrer proyectos, experimentos y soluciones. Companion está aquí para darte contexto, no para obligarte a seguir un embudo.", href: "/central/projects", action: "Empezar por Projects" },
] as const;

type CompanionPath = (typeof paths)[number];
const MEMORY_KEY = "br-companion-path-v1";

export function BRCompanion() {
  const pathname = usePathname();
  const [selected, setSelected] = useState<CompanionPath | null>(null);

  useEffect(() => {
    try {
      const remembered = window.sessionStorage.getItem(MEMORY_KEY);
      const match = paths.find((path) => path.key === remembered);
      if (match) setSelected(match);
    } catch {}
  }, []);

  const context = useMemo(() => {
    if (pathname.startsWith("/central/projects")) return { label: "Estás en Projects", title: "Aquí importa el porqué, no solo lo construido.", text: "Lee cada proyecto como una secuencia: problema → decisión → solución → evolución. Eso permite comparar ideas sin perder el contexto que las originó." };
    if (pathname.startsWith("/central/lab")) return { label: "Estás en Lab", title: "Aquí todavía está permitido no saber.", text: "Lab existe para preguntas, pruebas y señales tempranas. No todo experimento tiene que convertirse en producto." };
    if (pathname.startsWith("/central/solutions")) return { label: "Estás en Solutions", title: "Aquí una idea ya demostró utilidad.", text: "Solutions reúne lo suficientemente claro y repetible como para resolver un problema fuera del laboratorio." };
    if (pathname.startsWith("/central/ecosystem")) return { label: "Estás en Ecosystem", title: "Aquí se ve cómo las piezas se conectan.", text: "Un proyecto puede producir herramientas, aprendizajes o infraestructura que después alimentan otros proyectos." };
    return { label: "Estás en Central", title: "No necesitas conocer el mapa antes de entrar.", text: "Dime qué traes en mente y te doy un punto de partida. Tu elección se conserva mientras recorres Central." };
  }, [pathname]);

  function choose(path: CompanionPath) {
    setSelected(path);
    try { window.sessionStorage.setItem(MEMORY_KEY, path.key); } catch {}
  }

  function reset() {
    setSelected(null);
    try { window.sessionStorage.removeItem(MEMORY_KEY); } catch {}
  }

  return (
    <aside className="relative overflow-hidden rounded-[30px] border border-blue-300/15 bg-[#0d0f14]/90 p-5 shadow-[0_30px_100px_rgba(0,0,0,.42)] sm:p-6">
      <div className="pointer-events-none absolute -right-14 -top-16 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="relative">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full border border-blue-200/25 bg-blue-400/[0.08] shadow-[0_0_35px_rgba(96,165,250,.18)]"><Sparkles className="h-5 w-5 text-blue-200" /></span>
          <div><p className="text-sm font-black text-white">BR Companion</p><p className="text-[10px] font-black uppercase tracking-[0.26em] text-blue-300">{context.label}</p></div>
        </div>

        <div className="mt-6 rounded-[22px] border border-white/[0.07] bg-white/[0.025] p-5">
          <p className="text-lg font-bold leading-7 text-zinc-100">{context.title}</p>
          <p className="mt-2 text-sm leading-6 text-zinc-500">{context.text}</p>
        </div>

        {!selected ? (
          <div className="mt-4 grid gap-2">
            {paths.map((path) => { const Icon = path.icon; return (
              <button key={path.key} type="button" onClick={() => choose(path)} className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-3.5 text-left transition hover:border-blue-300/20 hover:bg-blue-400/[0.04]">
                <span className="flex items-center gap-3 text-sm font-bold text-zinc-300 group-hover:text-white"><Icon className="h-4 w-4 text-blue-300" /> {path.label}</span><ArrowUpRight className="h-4 w-4 text-zinc-700 transition group-hover:text-blue-300" />
              </button>
            ); })}
          </div>
        ) : (
          <div className="mt-4 rounded-[24px] border border-blue-300/15 bg-blue-400/[0.035] p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-blue-300">Tu camino · {selected.label}</p>
            <p className="mt-4 text-2xl font-black tracking-[-0.035em] text-white">{selected.title}</p>
            <p className="mt-3 text-sm leading-7 text-zinc-400">{selected.text}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href={selected.href} className="inline-flex items-center gap-2 rounded-full bg-[#f3eee6] px-4 py-2.5 text-sm font-black text-[#09090b]">{selected.action} <ArrowUpRight className="h-4 w-4" /></Link>
              <button type="button" onClick={reset} className="px-2 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 transition hover:text-zinc-300">Cambiar camino</button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
